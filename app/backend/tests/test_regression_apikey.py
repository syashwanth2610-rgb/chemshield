"""Regression tests: no raw 'Invalid API key' should surface in scan create/list."""
import base64
import json
import os
from pathlib import Path

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"
DEMO_EMAIL = "demo@chemshield.ai"
DEMO_PASSWORD = "Demo@1234"
IMAGE_PATH = "/tmp/label.jpg"
FORBIDDEN = "invalid api key"
FRIENDLY_OPTS = (
    "AI service is temporarily unavailable",
    "AI service timed out",
    "Analysis could not be completed",
    "Unable to confidently identify",
)


@pytest.fixture(scope="module")
def headers():
    r = requests.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD}, timeout=30)
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


def test_scan_list_has_no_invalid_api_key(headers):
    r = requests.get(f"{API}/scans", headers=headers, timeout=30)
    assert r.status_code == 200
    text = json.dumps(r.json()).lower()
    assert FORBIDDEN not in text, "Stale scan(s) with 'Invalid API key' still present"


def test_scan_create_does_not_leak_api_key_error(headers):
    b64 = base64.b64encode(Path(IMAGE_PATH).read_bytes()).decode()
    r = requests.post(f"{API}/scans", headers=headers,
                      json={"image_base64": b64, "filename": "label.jpg"}, timeout=180)
    assert r.status_code == 200, r.text[:500]
    body = r.json()
    text = json.dumps(body).lower()
    assert FORBIDDEN not in text, f"Raw API key error leaked: {body}"
    # If error field present, it must be one of the friendly buckets
    if "error" in body and body["error"]:
        assert any(opt.lower() in body["error"].lower() for opt in FRIENDLY_OPTS), \
            f"Error not from friendly-bucket list: {body['error']}"
    else:
        # success path — must have required product fields
        assert body.get("productName")
        assert body.get("riskLevel") in ("LOW", "MODERATE", "HIGH", "CRITICAL")


def test_scan_list_after_create_still_clean(headers):
    r = requests.get(f"{API}/scans", headers=headers, timeout=30)
    assert r.status_code == 200
    text = json.dumps(r.json()).lower()
    assert FORBIDDEN not in text
