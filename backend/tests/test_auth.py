import pytest
from app.core.config import settings


def test_send_otp_success(client):
    res = client.post(
        "/api/auth/send-otp",
        json={
            "name": "Jane Doe",
            "phone_country_code": "+91",
            "phone_number": "9988776655",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert "phone_number" in data
    assert data["phone_number"] == "+919988776655"
    assert data["dev_mode"] is True
    assert data["dev_otp"] is not None
    assert len(data["dev_otp"]) == 6


def test_verify_otp_success_creates_user(client):
    # 1. Send OTP
    send_res = client.post(
        "/api/auth/send-otp",
        json={
            "name": "Arjun Kumar",
            "phone_country_code": "+91",
            "phone_number": "9811223344",
        },
    )
    assert send_res.status_code == 200
    otp = send_res.json()["dev_otp"]

    # 2. Verify OTP
    verify_res = client.post(
        "/api/auth/verify-otp",
        json={
            "phone_country_code": "+91",
            "phone_number": "9811223344",
            "otp_code": otp,
        },
    )
    assert verify_res.status_code == 200
    data = verify_res.json()
    assert data["user"]["name"] == "Arjun Kumar"
    assert data["is_new_user"] is True
    assert "access_token" in data
    # Ensure cookie was set
    assert settings.COOKIE_NAME in verify_res.cookies


def test_verify_otp_invalid_code(client):
    # 1. Send OTP
    client.post(
        "/api/auth/send-otp",
        json={
            "name": "Arjun Kumar",
            "phone_country_code": "+91",
            "phone_number": "9811223399",
        },
    )
    # 2. Verify with wrong OTP
    verify_res = client.post(
        "/api/auth/verify-otp",
        json={
            "phone_country_code": "+91",
            "phone_number": "9811223399",
            "otp_code": "000000",
        },
    )
    assert verify_res.status_code == 400
    assert "Invalid OTP" in verify_res.json()["detail"]


def test_returning_user_login(client):
    # First login (creates user)
    s1 = client.post(
        "/api/auth/send-otp",
        json={"name": "Returning Student", "phone_country_code": "+91", "phone_number": "9700011122"},
    )
    otp1 = s1.json()["dev_otp"]
    v1 = client.post(
        "/api/auth/verify-otp",
        json={"phone_country_code": "+91", "phone_number": "9700011122", "otp_code": otp1},
    )
    user_id_1 = v1.json()["user"]["id"]
    assert v1.json()["is_new_user"] is True

    # Second login with same phone
    s2 = client.post(
        "/api/auth/send-otp",
        json={"name": "Returning Student", "phone_country_code": "+91", "phone_number": "9700011122"},
    )
    otp2 = s2.json()["dev_otp"]
    v2 = client.post(
        "/api/auth/verify-otp",
        json={"phone_country_code": "+91", "phone_number": "9700011122", "otp_code": otp2},
    )
    user_id_2 = v2.json()["user"]["id"]
    assert v2.json()["is_new_user"] is False
    assert user_id_1 == user_id_2


def test_get_me_unauthenticated_returns_401(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401


def test_get_me_authenticated(auth_client_a, user_a):
    res = auth_client_a.get("/api/auth/me")
    assert res.status_code == 200
    assert res.json()["id"] == user_a.id
    assert res.json()["name"] == user_a.name


def test_logout_revokes_session(auth_client_a):
    res_me = auth_client_a.get("/api/auth/me")
    assert res_me.status_code == 200

    logout_res = auth_client_a.post("/api/auth/logout")
    assert logout_res.status_code == 200

    # Next call should be unauthenticated
    res_after = auth_client_a.get("/api/auth/me")
    assert res_after.status_code == 401
