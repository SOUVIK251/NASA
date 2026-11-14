"""
Authentication Routes for Flame in Freefall.
Endpoints:
  POST /api/auth/register        — register new user
  POST /api/auth/verify-email    — verify email OTP
  POST /api/auth/login           — login → JWT token
  GET  /api/auth/me              — get current user (requires JWT)
  GET  /api/auth/admin/users     — admin: list all users
  GET  /api/auth/admin/audit-log — admin: view login audit log
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from pydantic import BaseModel, EmailStr, field_validator

from auth import (
    create_access_token,
    decode_access_token,
    extract_token_from_header,
    generate_otp,
    hash_password,
    verify_password,
)
from auth_models import get_auth_db, init_auth_db
from email_service import (
    send_admin_login_notification,
    send_admin_registration_notification,
    send_verification_email,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# OTP expiry window in minutes
OTP_EXPIRE_MINUTES = 15
# Max failed login attempts before lockout
MAX_FAILED_ATTEMPTS = 5
# Lockout duration in minutes
LOCKOUT_MINUTES = 15


# ── Pydantic Schemas ───────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit.")
        return v


class VerifyEmailRequest(BaseModel):
    email: EmailStr
    otp: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_hours: int
    user: dict


# ── Helpers ────────────────────────────────────────────────────────────────────

def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _get_current_user_from_token(authorization: Optional[str]) -> dict:
    """Decode JWT and return user payload. Raises 401 on failure."""
    token = extract_token_from_header(authorization)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header. Expected: Bearer <token>",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is invalid or has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


def _require_admin(authorization: Optional[str] = Header(None)) -> dict:
    """Dependency: require a valid JWT with admin privileges."""
    payload = _get_current_user_from_token(authorization)
    if not payload.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required."
        )
    return payload


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.on_event("startup")
def startup_auth_db():
    init_auth_db()


@router.post("/register", status_code=status.HTTP_201_CREATED, summary="Register a new user")
def register(payload: RegisterRequest, request: Request):
    """
    Register a new user. Sends a 6-digit OTP to the provided email for verification.
    Also notifies the admin.
    """
    conn = get_auth_db()
    c    = conn.cursor()

    # Check if email already registered
    c.execute("SELECT id, is_verified FROM users WHERE email = ?;", (payload.email,))
    existing = c.fetchone()

    if existing:
        conn.close()
        if existing["is_verified"]:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists."
            )
        else:
            # Re-send OTP for unverified account
            otp        = generate_otp()
            expires_at = (datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRE_MINUTES)).isoformat()
            conn2      = get_auth_db()
            conn2.execute(
                "INSERT INTO email_verifications (email, otp, expires_at) VALUES (?, ?, ?);",
                (payload.email, otp, expires_at)
            )
            conn2.commit()
            conn2.close()
            send_verification_email(payload.email, otp)
            return {"message": "Verification OTP re-sent. Please check your email.", "email": payload.email}

    # Hash password and create user
    pw_hash = hash_password(payload.password)
    c.execute(
        "INSERT INTO users (email, password_hash) VALUES (?, ?);",
        (payload.email, pw_hash)
    )
    conn.commit()

    # Generate and store OTP
    otp        = generate_otp()
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRE_MINUTES)).isoformat()
    c.execute(
        "INSERT INTO email_verifications (email, otp, expires_at) VALUES (?, ?, ?);",
        (payload.email, otp, expires_at)
    )
    conn.commit()
    conn.close()

    # Send OTP to user
    send_verification_email(payload.email, otp)

    # Notify admin
    send_admin_registration_notification(payload.email, _get_client_ip(request))

    return {
        "message": "Registration successful! Please check your email for the verification code.",
        "email":   payload.email,
        "next":    "POST /api/auth/verify-email with your OTP"
    }


@router.post("/verify-email", summary="Verify email with OTP")
def verify_email(payload: VerifyEmailRequest):
    """Verify a user's email address using the 6-digit OTP."""
    conn = get_auth_db()
    c    = conn.cursor()

    # Fetch the latest unused OTP for this email
    c.execute("""
        SELECT id, otp, expires_at FROM email_verifications
        WHERE email = ? AND used = 0
        ORDER BY id DESC LIMIT 1;
    """, (payload.email,))
    record = c.fetchone()

    if not record:
        conn.close()
        raise HTTPException(status_code=400, detail="No pending verification found for this email.")

    # Check expiry
    expires_at = datetime.fromisoformat(record["expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        conn.close()
        raise HTTPException(status_code=400, detail="OTP has expired. Please register again to get a new code.")

    # Validate OTP
    if record["otp"] != payload.otp.strip():
        conn.close()
        raise HTTPException(status_code=400, detail="Incorrect verification code. Please try again.")

    # Mark OTP as used and activate user
    c.execute("UPDATE email_verifications SET used = 1 WHERE id = ?;", (record["id"],))
    c.execute("UPDATE users SET is_verified = 1 WHERE email = ?;", (payload.email,))
    conn.commit()
    conn.close()

    return {"message": "Email verified successfully! You can now log in.", "email": payload.email}


@router.post("/login", response_model=TokenResponse, summary="Login and receive JWT token")
def login(payload: LoginRequest, request: Request):
    """
    Authenticate a user. Returns a JWT access token.
    Triggers an admin notification email on success.
    """
    conn = get_auth_db()
    c    = conn.cursor()
    ip   = _get_client_ip(request)
    ua   = request.headers.get("User-Agent", "Unknown")

    # Fetch user
    c.execute("SELECT * FROM users WHERE email = ?;", (payload.email,))
    user = c.fetchone()

    def _log_attempt(success: bool):
        conn.execute(
            "INSERT INTO login_audit (email, success, ip_address, user_agent) VALUES (?, ?, ?, ?);",
            (payload.email, 1 if success else 0, ip, ua[:512])
        )
        conn.commit()

    if not user:
        _log_attempt(False)
        conn.close()
        # Return generic message to prevent user enumeration
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    # Check lockout
    if user["is_locked"]:
        locked_until = user["locked_until"]
        if locked_until:
            locked_dt = datetime.fromisoformat(locked_until)
            if datetime.now(timezone.utc) < locked_dt:
                remaining = int((locked_dt - datetime.now(timezone.utc)).total_seconds() / 60)
                conn.close()
                raise HTTPException(
                    status_code=status.HTTP_423_LOCKED,
                    detail=f"Account temporarily locked due to too many failed attempts. Try again in {remaining} minutes."
                )
            else:
                # Lockout expired, reset
                conn.execute(
                    "UPDATE users SET is_locked=0, failed_attempts=0, locked_until=NULL WHERE id=?;",
                    (user["id"],)
                )
                conn.commit()

    # Check email verification
    if not user["is_verified"]:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please check your inbox for the verification code."
        )

    # Verify password
    if not verify_password(payload.password, user["password_hash"]):
        new_attempts = user["failed_attempts"] + 1
        if new_attempts >= MAX_FAILED_ATTEMPTS:
            locked_until = (datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_MINUTES)).isoformat()
            conn.execute(
                "UPDATE users SET failed_attempts=?, is_locked=1, locked_until=? WHERE id=?;",
                (new_attempts, locked_until, user["id"])
            )
            conn.commit()
            _log_attempt(False)
            conn.close()
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail=f"Too many failed attempts. Account locked for {LOCKOUT_MINUTES} minutes."
            )
        else:
            conn.execute(
                "UPDATE users SET failed_attempts=? WHERE id=?;",
                (new_attempts, user["id"])
            )
            conn.commit()
            _log_attempt(False)
            conn.close()
            remaining = MAX_FAILED_ATTEMPTS - new_attempts
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid email or password. {remaining} attempt(s) remaining before lockout."
            )

    # ✅ Successful login — reset failed attempts and record last login
    conn.execute(
        "UPDATE users SET failed_attempts=0, is_locked=0, locked_until=NULL, last_login=datetime('now') WHERE id=?;",
        (user["id"],)
    )
    conn.commit()
    _log_attempt(True)
    conn.close()

    # Create JWT token
    token_data  = {"sub": payload.email, "user_id": user["id"], "is_admin": bool(user["is_admin"])}
    access_token = create_access_token(token_data)

    # 🔔 Notify admin immediately (async, non-blocking)
    send_admin_login_notification(payload.email, ip, ua)

    from auth import JWT_EXPIRE_HOURS
    return {
        "access_token":    access_token,
        "token_type":      "bearer",
        "expires_in_hours": JWT_EXPIRE_HOURS,
        "user": {
            "email":      payload.email,
            "is_admin":   bool(user["is_admin"]),
            "is_verified": bool(user["is_verified"])
        }
    }


@router.get("/me", summary="Get current authenticated user")
def get_me(authorization: Optional[str] = Header(None)):
    """Returns the profile of the currently authenticated user."""
    payload = _get_current_user_from_token(authorization)
    email   = payload.get("sub")

    conn = get_auth_db()
    c    = conn.cursor()
    c.execute(
        "SELECT id, email, is_verified, is_admin, created_at, last_login FROM users WHERE email = ?;",
        (email,)
    )
    user = c.fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    return {
        "id":          user["id"],
        "email":       user["email"],
        "is_verified": bool(user["is_verified"]),
        "is_admin":    bool(user["is_admin"]),
        "created_at":  user["created_at"],
        "last_login":  user["last_login"],
    }


@router.get("/admin/users", summary="[Admin] List all registered users")
def admin_list_users(admin: dict = Depends(_require_admin)):
    """Admin-only: returns all registered users with their status."""
    conn = get_auth_db()
    c    = conn.cursor()
    c.execute("""
        SELECT id, email, is_verified, is_admin, is_locked,
               failed_attempts, created_at, last_login
        FROM users ORDER BY created_at DESC;
    """)
    users = [dict(u) for u in c.fetchall()]
    conn.close()
    return {"count": len(users), "users": users}


@router.get("/admin/audit-log", summary="[Admin] View login audit log")
def admin_audit_log(
    limit: int = 50,
    admin: dict = Depends(_require_admin)
):
    """Admin-only: returns recent login attempts (success and failures)."""
    conn = get_auth_db()
    c    = conn.cursor()
    c.execute("""
        SELECT id, email, success, ip_address, user_agent, timestamp
        FROM login_audit
        ORDER BY id DESC LIMIT ?;
    """, (min(limit, 500),))
    logs = [dict(r) for r in c.fetchall()]
    conn.close()
    return {"count": len(logs), "audit_log": logs}
