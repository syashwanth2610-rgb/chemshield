"""ChemShield AI - FastAPI backend

Endpoints:
- Auth: /api/auth/register (JWT), /api/auth/login (JWT),
        /api/auth/google/callback (Emergent OAuth), /api/auth/me, /api/auth/logout
- Scans: /api/scans (POST create+analyze, GET list), /api/scans/{id}
- Files: /api/files/{path:path} (auth via Bearer or ?auth= query)
- Stats: /api/stats/summary

Uses Emergent Universal Key for Gemini 3 Flash vision and object storage.
"""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, Header, Query, Response, Request, Cookie
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import json
import uuid
import base64
import logging
import bcrypt
import jwt as pyjwt
import requests
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')


def get_cors_origins() -> list[str]:
    configured = os.environ.get('CORS_ORIGINS', '')
    origins = [origin.strip() for origin in configured.split(',') if origin.strip()]
    if origins:
        return origins
    return [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'https://chemshield-scan.preview.emergentagent.com',
    ]


# --- Config ---
MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
JWT_SECRET = os.environ.get('JWT_SECRET', 'change-me')
JWT_ALGO = "HS256"
APP_NAME = os.environ.get('APP_NAME', 'chemshield')
CORS_ORIGINS = get_cors_origins()

STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_AUTH_SESSION_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

# --- App ---
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="ChemShield AI")
api_router = APIRouter(prefix="/api")
logger = logging.getLogger("chemshield")
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Storage ---
_storage_key = None
def init_storage(force: bool = False):
    global _storage_key
    if _storage_key and not force:
        return _storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_LLM_KEY}, timeout=30)
    resp.raise_for_status()
    _storage_key = resp.json()["storage_key"]
    return _storage_key

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str):
    key = init_storage()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# --- Models ---
class RegisterInput(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginInput(BaseModel):
    email: EmailStr
    password: str

class GoogleCallbackInput(BaseModel):
    session_id: str

class User(BaseModel):
    user_id: str
    name: str
    email: str
    picture: Optional[str] = None
    provider: str = "jwt"
    created_at: str

class ScanCreate(BaseModel):
    image_base64: str  # data URL or raw base64
    filename: Optional[str] = "scan.png"

# --- Helpers ---
def make_jwt(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "iat": datetime.now(timezone.utc),
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

def verify_jwt(token: str) -> Optional[str]:
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        return payload.get("sub")
    except Exception:
        return None

async def current_user(
    authorization: Optional[str] = Header(None),
    session_token: Optional[str] = Cookie(None),
    auth: Optional[str] = Query(None),
) -> dict:
    # Try Bearer JWT first
    token = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
    elif auth:
        token = auth
    if token:
        uid = verify_jwt(token)
        if uid:
            u = await db.users.find_one({"user_id": uid}, {"_id": 0})
            if u:
                return u
        # try session_token in DB
        sess = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
        if sess:
            exp = sess.get("expires_at")
            if isinstance(exp, str):
                exp = datetime.fromisoformat(exp)
            if exp and exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            if exp and exp >= datetime.now(timezone.utc):
                u = await db.users.find_one({"user_id": sess["user_id"]}, {"_id": 0})
                if u:
                    return u
    # Try session cookie
    if session_token:
        sess = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
        if sess:
            exp = sess.get("expires_at")
            if isinstance(exp, str):
                exp = datetime.fromisoformat(exp)
            if exp and exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            if exp and exp >= datetime.now(timezone.utc):
                u = await db.users.find_one({"user_id": sess["user_id"]}, {"_id": 0})
                if u:
                    return u
    raise HTTPException(status_code=401, detail="Not authenticated")

def strip_data_url(b64: str) -> tuple[bytes, str]:
    """Return (bytes, mime) from a data URL or raw base64."""
    mime = "image/png"
    m = re.match(r"^data:(image/[a-zA-Z0-9.+-]+);base64,(.+)$", b64.strip(), re.DOTALL)
    if m:
        mime = m.group(1)
        raw = m.group(2)
    else:
        raw = b64.strip()
    try:
        data = base64.b64decode(raw)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 image: {e}")
    return data, mime

# --- Startup: seed demo user & init storage ---
@app.on_event("startup")
async def startup():
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.warning(f"Storage init deferred: {e}")

    # Seed demo user
    existing = await db.users.find_one({"email": "demo@chemshield.ai"}, {"_id": 0})
    if not existing:
        pw_hash = bcrypt.hashpw(b"Demo@1234", bcrypt.gensalt()).decode()
        await db.users.insert_one({
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "name": "Demo Analyst",
            "email": "demo@chemshield.ai",
            "password_hash": pw_hash,
            "provider": "jwt",
            "picture": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Seeded demo user demo@chemshield.ai / Demo@1234")

@app.on_event("shutdown")
async def shutdown():
    client.close()

# --- Health ---
@api_router.get("/")
async def root():
    return {"message": "ChemShield AI API", "ok": True}

# --- Auth: JWT ---
@api_router.post("/auth/register")
async def register(inp: RegisterInput):
    inp_email = inp.email.lower().strip()
    if await db.users.find_one({"email": inp_email}, {"_id": 0}):
        raise HTTPException(status_code=400, detail="Email already registered")
    if len(inp.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    pw_hash = bcrypt.hashpw(inp.password.encode(), bcrypt.gensalt()).decode()
    uid = f"user_{uuid.uuid4().hex[:12]}"
    doc = {
        "user_id": uid,
        "name": inp.name.strip(),
        "email": inp_email,
        "password_hash": pw_hash,
        "provider": "jwt",
        "picture": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    token = make_jwt(uid)
    doc.pop("password_hash", None)
    doc.pop("_id", None)
    return {"token": token, "user": doc}

@api_router.post("/auth/login")
async def login(inp: LoginInput):
    email = inp.email.lower().strip()
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not bcrypt.checkpw(inp.password.encode(), user["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = make_jwt(user["user_id"])
    user.pop("password_hash", None)
    return {"token": token, "user": user}

# --- Auth: Emergent Google ---
@api_router.post("/auth/google/callback")
async def google_callback(inp: GoogleCallbackInput, response: Response, request: Request):
    try:
        r = requests.get(EMERGENT_AUTH_SESSION_URL, headers={"X-Session-ID": inp.session_id}, timeout=15)
        if r.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        data = r.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OAuth exchange failed: {e}")

    email = (data.get("email") or "").lower().strip()
    name = data.get("name") or email.split("@")[0]
    picture = data.get("picture")
    session_token = data.get("session_token")
    if not email or not session_token:
        raise HTTPException(status_code=400, detail="Malformed OAuth response")

    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        uid = f"user_{uuid.uuid4().hex[:12]}"
        user = {
            "user_id": uid,
            "name": name,
            "email": email,
            "picture": picture,
            "provider": "google",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(user)
        user.pop("_id", None)
    else:
        await db.users.update_one({"email": email}, {"$set": {"name": name, "picture": picture}})
        user["name"] = name
        user["picture"] = picture

    # store session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user["user_id"],
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    is_localhost = "localhost" in (str(request.base_url) or "") or "127.0.0.1" in (str(request.base_url) or "")
    response.set_cookie(
        key="session_token", value=session_token,
        max_age=7*24*3600, path="/", httponly=True, secure=not is_localhost, samesite="none" if not is_localhost else "lax"
    )
    user.pop("password_hash", None)
    return {"token": session_token, "user": user}

@api_router.get("/auth/me")
async def me(user: dict = Depends(current_user)):
    user.pop("password_hash", None)
    return user

@api_router.post("/auth/logout")
async def logout(response: Response, session_token: Optional[str] = Cookie(None)):
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie("session_token", path="/")
    return {"ok": True}

# --- AI Analysis via Gemini 3 Flash Vision ---
SYSTEM_PROMPT = """You are ChemShield AI, a chemical safety awareness assistant.
Given a photo of a chemical product label, return a JSON object ONLY (no prose, no markdown fencing) with fields:
{
  "productName": string,
  "confidence": integer (0-100, your identification confidence),
  "riskScore": integer (0-100, overall exposure risk),
  "riskLevel": one of ["LOW","MODERATE","HIGH","CRITICAL"],
  "hazardSymbols": array of {"name": string, "icon": one of ["toxic","flammable","irritant","corrosive","environmental","explosive","oxidizer","health"]},
  "exposureRoutes": array of strings (e.g., "Inhalation","Skin contact","Eye contact","Ingestion"),
  "riskFactors": {
    "inhalation": integer (0-100),
    "skinContact": integer (0-100),
    "eyeExposure": integer (0-100),
    "flammability": integer (0-100),
    "toxicity": integer (0-100)
  },
  "reasoning": short paragraph (max 60 words) plain-English explanation of why this risk score,
  "recommendations": array of 5-6 short plain-English safety tips (generic PPE / ventilation / SDS reminders only — NEVER give handling procedures or exposure-limit numbers unless clearly on the label),
  "aiInsight": one-sentence plain-English safety takeaway
}
If the image is unreadable, return {"error":"Unable to confidently identify the product. Please upload a clearer image of the label."}
Never invent exact exposure limits. Never provide instructions that could enable misuse. Always assume a demo/awareness context."""

async def analyze_with_gemini(image_bytes: bytes, mime: str) -> dict:
    """Call Gemini 3 Flash with the image; parse JSON result."""
    from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"scan-{uuid.uuid4().hex[:8]}",
        system_message=SYSTEM_PROMPT,
    ).with_model("gemini", "vertex_ai/gemini-3-flash-preview")

    img = ImageContent(image_base64=base64.b64encode(image_bytes).decode())
    msg = UserMessage(
        text="Analyze this chemical product label and return ONLY the JSON schema described. No prose, no fencing.",
        file_contents=[img],
    )
    raw = await chat.send_message(msg)
    # Strip code fences if any
    text = raw.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    try:
        return json.loads(text)
    except Exception:
        # Try to extract first {...}
        m = re.search(r"\{[\s\S]*\}", text)
        if m:
            try:
                return json.loads(m.group(0))
            except Exception:
                pass
    return {"error": "AI response could not be parsed. Please try again."}

# --- Scans ---
@api_router.post("/scans")
async def create_scan(inp: ScanCreate, user: dict = Depends(current_user)):
    data, mime = strip_data_url(inp.image_base64)
    if len(data) > 8 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image too large (max 8MB)")

    ext = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}.get(mime, "png")
    scan_id = str(uuid.uuid4())
    storage_path = f"{APP_NAME}/scans/{user['user_id']}/{scan_id}.{ext}"
    try:
        result = put_object(storage_path, data, mime)
        storage_path = result.get("path", storage_path)
    except Exception as e:
        logger.error(f"Storage upload failed: {e}")
        raise HTTPException(status_code=500, detail="Storage upload failed")

    # Analyze
    try:
        analysis = await analyze_with_gemini(data, mime)
    except Exception as e:
        logger.exception("Gemini call failed")
        msg = str(e).lower()
        if "invalid api key" in msg or "authenticationerror" in msg or "unauthorized" in msg:
            friendly = "AI service is temporarily unavailable. Please try again in a moment."
        elif "timeout" in msg or "timed out" in msg:
            friendly = "AI service timed out. Please try again with a smaller image."
        else:
            friendly = "Analysis could not be completed. Please try another image."
        analysis = {"error": friendly}

    if analysis.get("error"):
        # Still save the scan record so user sees history
        doc = {
            "scan_id": scan_id,
            "user_id": user["user_id"],
            "storage_path": storage_path,
            "content_type": mime,
            "filename": inp.filename,
            "error": analysis["error"],
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.scans.insert_one(doc)
        doc.pop("_id", None)
        return doc

    doc = {
        "scan_id": scan_id,
        "user_id": user["user_id"],
        "storage_path": storage_path,
        "content_type": mime,
        "filename": inp.filename,
        "productName": analysis.get("productName") or "Unidentified Chemical Product",
        "confidence": int(analysis.get("confidence") or 60),
        "riskScore": int(analysis.get("riskScore") or 0),
        "riskLevel": analysis.get("riskLevel") or "LOW",
        "hazardSymbols": analysis.get("hazardSymbols") or [],
        "exposureRoutes": analysis.get("exposureRoutes") or [],
        "riskFactors": analysis.get("riskFactors") or {},
        "reasoning": analysis.get("reasoning") or "",
        "recommendations": analysis.get("recommendations") or [],
        "aiInsight": analysis.get("aiInsight") or "",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.scans.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/scans")
async def list_scans(user: dict = Depends(current_user), limit: int = 50):
    cur = db.scans.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).limit(limit)
    return await cur.to_list(length=limit)

@api_router.get("/scans/{scan_id}")
async def get_scan(scan_id: str, user: dict = Depends(current_user)):
    doc = await db.scans.find_one({"scan_id": scan_id, "user_id": user["user_id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return doc

@api_router.delete("/scans/{scan_id}")
async def delete_scan(scan_id: str, user: dict = Depends(current_user)):
    await db.scans.delete_one({"scan_id": scan_id, "user_id": user["user_id"]})
    return {"ok": True}

# --- Files (image proxy) ---
@api_router.get("/files/{path:path}")
async def download_file(path: str, user: dict = Depends(current_user)):
    # Only allow own images
    if f"/scans/{user['user_id']}/" not in ("/" + path):
        # allow if the path already begins with app/scans/{uid}
        if not path.startswith(f"{APP_NAME}/scans/{user['user_id']}/"):
            raise HTTPException(status_code=403, detail="Forbidden")
    try:
        data, ct = get_object(path)
    except Exception:
        raise HTTPException(status_code=404, detail="Not found")
    return Response(content=data, media_type=ct)

# --- Stats ---
@api_router.get("/stats/summary")
async def stats(user: dict = Depends(current_user)):
    scans = await db.scans.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(length=1000)
    total = len(scans)
    buckets = {"LOW": 0, "MODERATE": 0, "HIGH": 0, "CRITICAL": 0}
    for s in scans:
        lvl = s.get("riskLevel") or "LOW"
        if lvl in buckets:
            buckets[lvl] += 1
    alerts = buckets["HIGH"] + buckets["CRITICAL"]
    return {"total": total, "buckets": buckets, "alerts": alerts, "low": buckets["LOW"], "high": buckets["HIGH"] + buckets["CRITICAL"]}

# --- Register router ---
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)
