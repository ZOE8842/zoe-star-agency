#!/usr/bin/env python3
"""
ZOE Webapp · E2E Bootstrap + Test-Flow
=======================================
Autonom-Pipeline:
1. Insert Admin-Profile (zoeadmin@zoe-star.de · Role: admin)
2. Insert Test-Invite-Code ZOE-2026-TEST01
3. Create Test-Creator-User via Admin-API (email_confirm pre-set)
4. Login als Test-User → JWT
5. Call RPC redeem_invite_and_create_profile (mit User-JWT)
6. Verify profile + invite-status via SELECT

Setup: pip install requests python-dotenv
"""

import os
import sys
import json
from pathlib import Path

import requests

# ---------- ENV laden ----------
ROOT = Path(__file__).parent.parent
ENV_FILE = ROOT / ".env.local"

env = {}
for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    k, _, v = line.partition("=")
    env[k.strip()] = v.strip()

SUPA_URL = env["NEXT_PUBLIC_SUPABASE_URL"]
ANON_KEY = env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
SERVICE_KEY = env["SUPABASE_SERVICE_ROLE_KEY"]

# ---------- Test-Daten ----------
ADMIN_USER_ID = "b5fabf16-0d69-42c1-99ae-79bdb3b93963"
ADMIN_EMAIL = "zoeadmin@zoe-star.de"
ADMIN_TIKTOK = "zoestar.agency"

INVITE_CODE = "ZOE-2026-TEST01"

TEST_EMAIL = "testcreator@zoe-star.de"
TEST_PASSWORD = "TestCreator2026!"
TEST_TIKTOK = "testcreator"
TEST_DISPLAY = "Test Creator"

H_SERVICE = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}
H_ANON = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
    "Content-Type": "application/json",
}


def step(n, msg):
    print(f"\n{'='*60}\n[{n}] {msg}\n{'='*60}")


def post(url, headers, payload):
    r = requests.post(url, headers=headers, json=payload, timeout=30)
    return r.status_code, r.text


def get(url, headers, params=None):
    r = requests.get(url, headers=headers, params=params, timeout=30)
    return r.status_code, r.text


def patch(url, headers, payload, params=None):
    r = requests.patch(url, headers=headers, json=payload, params=params, timeout=30)
    return r.status_code, r.text


def delete(url, headers, params=None):
    r = requests.delete(url, headers=headers, params=params, timeout=30)
    return r.status_code, r.text


# ---------- Step 1: Admin-Profile ----------
step(1, "Admin-Profile insert (oder update wenn schon da)")

# Erst prüfen ob existiert
sc, body = get(
    f"{SUPA_URL}/rest/v1/profiles",
    H_SERVICE,
    params={"id": f"eq.{ADMIN_USER_ID}", "select": "id,role,email"},
)
exists = sc == 200 and body != "[]" and len(json.loads(body)) > 0
print(f"  Existing check: {sc} · exists={exists}")

if exists:
    print("  Profile schon da → update auf admin/active")
    sc, body = patch(
        f"{SUPA_URL}/rest/v1/profiles",
        H_SERVICE,
        {"role": "admin", "status": "active", "tiktok_username": ADMIN_TIKTOK, "display_name": "ZOE"},
        params={"id": f"eq.{ADMIN_USER_ID}"},
    )
else:
    sc, body = post(
        f"{SUPA_URL}/rest/v1/profiles",
        H_SERVICE,
        {
            "id": ADMIN_USER_ID,
            "email": ADMIN_EMAIL,
            "tiktok_username": ADMIN_TIKTOK,
            "display_name": "ZOE",
            "role": "admin",
            "status": "active",
        },
    )
print(f"  Result: {sc} · {body[:200]}")

# ---------- Step 2: Invite ----------
step(2, "Test-Invite ZOE-2026-TEST01 anlegen")

# Erst alten gleichnamigen löschen falls vorhanden
delete(
    f"{SUPA_URL}/rest/v1/invites",
    H_SERVICE,
    params={"code": f"eq.{INVITE_CODE}"},
)

sc, body = post(
    f"{SUPA_URL}/rest/v1/invites",
    H_SERVICE,
    {
        "code": INVITE_CODE,
        "created_by": ADMIN_USER_ID,
        "intended_role": "creator",
    },
)
print(f"  Invite create: {sc} · {body[:200]}")

# ---------- Step 3: Test-Creator via Admin-API ----------
step(3, f"Test-Creator anlegen ({TEST_EMAIL}) via Admin-API · email_confirm=true")

# Erst altes löschen falls vorhanden (idempotent)
sc, body = get(
    f"{SUPA_URL}/auth/v1/admin/users",
    H_SERVICE,
    params={"email": TEST_EMAIL},
)
if sc == 200:
    users = json.loads(body).get("users", [])
    for u in users:
        if u["email"] == TEST_EMAIL:
            print(f"  Bestehenden Test-User löschen (id={u['id']})")
            requests.delete(
                f"{SUPA_URL}/auth/v1/admin/users/{u['id']}",
                headers=H_SERVICE, timeout=30,
            )

sc, body = post(
    f"{SUPA_URL}/auth/v1/admin/users",
    H_SERVICE,
    {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "email_confirm": True,
        "user_metadata": {
            "tiktok_username": TEST_TIKTOK,
            "display_name": TEST_DISPLAY,
            "invite_code": INVITE_CODE,
        },
    },
)
print(f"  Admin-create: {sc}")
if sc not in (200, 201):
    print(f"  FAIL: {body[:400]}")
    sys.exit(1)

test_user = json.loads(body)
test_user_id = test_user.get("id") or test_user.get("user", {}).get("id")
print(f"  Test-User-ID: {test_user_id}")

# ---------- Step 4: Login als Test-User → JWT ----------
step(4, "Login als Test-User → JWT holen")

sc, body = post(
    f"{SUPA_URL}/auth/v1/token?grant_type=password",
    H_ANON,
    {"email": TEST_EMAIL, "password": TEST_PASSWORD},
)
print(f"  Login: {sc}")
if sc != 200:
    print(f"  FAIL: {body[:400]}")
    sys.exit(1)

login_data = json.loads(body)
access_token = login_data["access_token"]
print(f"  JWT erhalten · Länge {len(access_token)}")

H_USER = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json",
}

# ---------- Step 5: RPC redeem_invite_and_create_profile ----------
step(5, "RPC redeem_invite_and_create_profile aufrufen")

sc, body = post(
    f"{SUPA_URL}/rest/v1/rpc/redeem_invite_and_create_profile",
    H_USER,
    {
        "invite_code_input": INVITE_CODE,
        "tiktok_username_input": TEST_TIKTOK,
        "display_name_input": TEST_DISPLAY,
        "country_input": "DE",
        "language_input": "de",
    },
)
print(f"  RPC: {sc} · {body[:300]}")

# ---------- Step 6: Verification ----------
step(6, "Verification — Profile + Invite-Status checken")

sc, body = get(
    f"{SUPA_URL}/rest/v1/profiles",
    H_SERVICE,
    params={"id": f"eq.{test_user_id}", "select": "*"},
)
print(f"\n  Test-Profile:")
if sc == 200:
    p = json.loads(body)
    if p:
        for key in ("id", "tiktok_username", "display_name", "role", "status", "country", "language"):
            print(f"    {key}: {p[0].get(key)}")
    else:
        print(f"    NICHT GEFUNDEN — RPC hat keine Row angelegt")

sc, body = get(
    f"{SUPA_URL}/rest/v1/invites",
    H_SERVICE,
    params={"code": f"eq.{INVITE_CODE}", "select": "code,used_at,used_by"},
)
print(f"\n  Invite-Status:")
if sc == 200:
    inv = json.loads(body)
    if inv:
        print(f"    code:    {inv[0]['code']}")
        print(f"    used_at: {inv[0]['used_at']}")
        print(f"    used_by: {inv[0]['used_by']}")

# ---------- Step 7: Live-Login-Smoketest ----------
step(7, "Live-Login an Vercel-Deployment testen")

LIVE_URL = "https://zoe-star-agency.vercel.app"
sc = requests.get(LIVE_URL, timeout=15).status_code
print(f"  Homepage: {sc}")
sc = requests.get(f"{LIVE_URL}/portal/login", timeout=15).status_code
print(f"  Login-Page: {sc}")

print(f"\n{'='*60}\nE2E-FLOW FERTIG\n{'='*60}")
print(f"\nLogin-Credentials für Browser-Test:")
print(f"  URL:      {LIVE_URL}/portal/login")
print(f"  E-Mail:   {TEST_EMAIL}")
print(f"  Password: {TEST_PASSWORD}")
