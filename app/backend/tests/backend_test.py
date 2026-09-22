"""ChemShield AI backend regression tests."""
import base64
import os
import time
import uuid
from pathlib import Path

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://chemshield-scan.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

DEMO_EMAIL = "demo@chemshield.ai"
DEMO_PASSWORD = "Demo@1234"

IMAGE_PATH = "/tmp/label.jpg"


@pytest.fixture(scope="session")
def image_b64():
    data = Path(IMAGE_PATH).read_bytes()
    return base64.b64encode(data).decode()


@pytest.fixture(scope="session")
def demo_token():
    r = requests.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"demo login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def demo_headers(demo_token):
    return {"Authorization": f"Bearer {demo_token}"}


# ---------- Health ----------
def test_health():
    r = requests.get(f"{API}/", timeout=15)
    assert r.status_code == 200
    body = r.json()
    assert body.get("ok") is True


# ---------- Auth: JWT ----------
class TestAuth:
    def test_register_new_user(self):
        email = f"test_{uuid.uuid4().hex[:8]}@chemshield.ai"
        r = requests.post(f"{API}/auth/register", json={"name": "Test User", "email": email, "password": "Pass@1234"}, timeout=20)
        assert r.status_code == 200, r.text
        body = r.json()
        assert "token" in body and isinstance(body["token"], str)
        assert body["user"]["email"] == email
        assert body["user"]["provider"] == "jwt"
        assert "password_hash" not in body["user"]

    def test_register_duplicate_returns_400(self):
        r = requests.post(f"{API}/auth/register", json={"name": "Demo", "email": DEMO_EMAIL, "password": "Demo@1234"}, timeout=20)
        assert r.status_code == 400, r.text

    def test_login_demo_success(self, demo_token):
        assert demo_token and len(demo_token) > 20

    def test_login_bad_password_401(self):
        r = requests.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": "wrong-pass"}, timeout=15)
        assert r.status_code == 401

    def test_me_without_token_401(self):
        r = requests.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 401

    def test_localhost_cors_allows_credentials_for_browser_requests(self):
        r = requests.options(
            f"{API}/auth/me",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "authorization",
            },
            timeout=15,
        )
        assert r.status_code == 200, r.text
        assert r.headers.get("access-control-allow-origin") == "http://localhost:3000"
        assert r.headers.get("access-control-allow-credentials", "").lower() == "true"

    def test_me_with_token(self, demo_headers):
        r = requests.get(f"{API}/auth/me", headers=demo_headers, timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert body["email"] == DEMO_EMAIL
        assert "user_id" in body

    def test_google_callback_invalid_session(self):
        r = requests.post(f"{API}/auth/google/callback", json={"session_id": "invalid-session-xyz"}, timeout=20)
        assert r.status_code in (401, 400), r.text


# ---------- Scans + Files + Stats + Delete (grouped for xdist loadscope) ----------
class TestScansFilesStats:
    scan_id = None
    storage_path = None

    def test_01_create_scan(self, demo_headers, image_b64):
        payload = {"image_base64": image_b64, "filename": "label.jpg"}
        r = requests.post(f"{API}/scans", headers=demo_headers, json=payload, timeout=180)
        assert r.status_code == 200, f"{r.status_code} {r.text[:400]}"
        body = r.json()
        assert "scan_id" in body
        assert body["user_id"].startswith("user_")
        assert "storage_path" in body
        TestScansFilesStats.scan_id = body["scan_id"]
        TestScansFilesStats.storage_path = body["storage_path"]
        if "error" in body:
            assert isinstance(body["error"], str)
        else:
            assert isinstance(body.get("productName"), str) and body["productName"]
            assert 0 <= int(body["riskScore"]) <= 100
            assert body["riskLevel"] in ("LOW", "MODERATE", "HIGH", "CRITICAL")
            assert isinstance(body["hazardSymbols"], list)
            assert isinstance(body["exposureRoutes"], list)
            assert isinstance(body["riskFactors"], dict)
            assert isinstance(body["recommendations"], list)
            assert isinstance(body["aiInsight"], str)

    def test_02_list_scans_contains_new(self, demo_headers):
        assert TestScansFilesStats.scan_id
        r = requests.get(f"{API}/scans", headers=demo_headers, timeout=30)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        ids = [x.get("scan_id") for x in items]
        assert TestScansFilesStats.scan_id in ids
        if len(items) >= 2:
            assert items[0]["created_at"] >= items[1]["created_at"]

    def test_03_get_scan_single(self, demo_headers):
        r = requests.get(f"{API}/scans/{TestScansFilesStats.scan_id}", headers=demo_headers, timeout=15)
        assert r.status_code == 200
        assert r.json()["scan_id"] == TestScansFilesStats.scan_id

    def test_04_get_scan_unauth(self):
        r = requests.get(f"{API}/scans/{TestScansFilesStats.scan_id}", timeout=15)
        assert r.status_code == 401

    def test_05_own_file_download(self, demo_headers):
        r = requests.get(f"{API}/files/{TestScansFilesStats.storage_path}", headers=demo_headers, timeout=30)
        assert r.status_code == 200
        assert r.headers.get("content-type", "").startswith("image/")
        assert len(r.content) > 100

    def test_06_file_download_with_query_auth(self, demo_token):
        r = requests.get(f"{API}/files/{TestScansFilesStats.storage_path}?auth={demo_token}", timeout=30)
        assert r.status_code == 200

    def test_07_other_user_forbidden(self):
        email = f"other_{uuid.uuid4().hex[:8]}@chemshield.ai"
        rr = requests.post(f"{API}/auth/register", json={"name": "Other", "email": email, "password": "Pass@1234"}, timeout=20)
        assert rr.status_code == 200
        other_headers = {"Authorization": f"Bearer {rr.json()['token']}"}
        r = requests.get(f"{API}/files/{TestScansFilesStats.storage_path}", headers=other_headers, timeout=15)
        assert r.status_code == 403

    def test_08_stats_summary(self, demo_headers):
        r = requests.get(f"{API}/stats/summary", headers=demo_headers, timeout=15)
        assert r.status_code == 200
        body = r.json()
        for k in ("total", "buckets", "alerts", "low", "high"):
            assert k in body
        assert set(body["buckets"].keys()) >= {"LOW", "MODERATE", "HIGH", "CRITICAL"}

    def test_09_delete_scan(self, demo_headers):
        r = requests.delete(f"{API}/scans/{TestScansFilesStats.scan_id}", headers=demo_headers, timeout=15)
        assert r.status_code == 200
        r2 = requests.get(f"{API}/scans/{TestScansFilesStats.scan_id}", headers=demo_headers, timeout=15)
        assert r2.status_code == 404
