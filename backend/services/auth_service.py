import os
import time
import json
import base64
import hmac
import hashlib
import secrets
import datetime
from typing import Optional, Dict, Any
from config import settings

# Password hashing with bcrypt (or robust fallback)
try:
    import bcrypt
    def hash_password(password: str) -> str:
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    def verify_password(password: str, hashed: str) -> bool:
        try:
            return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
        except Exception:
            return False
except ImportError:
    # Fallback using SHA-256 + salt
    def hash_password(password: str) -> str:
        salt = secrets.token_hex(16)
        hashed = hashlib.sha256((salt + password).encode('utf-8')).hexdigest()
        return f"sha256${salt}${hashed}"

    def verify_password(password: str, hashed: str) -> bool:
        try:
            parts = hashed.split('$')
            if len(parts) != 3 or parts[0] != 'sha256':
                return False
            salt = parts[1]
            expected = hashlib.sha256((salt + password).encode('utf-8')).hexdigest()
            return secrets.compare_digest(expected, parts[2])
        except Exception:
            return False

# JWT Token implementation
try:
    import jwt
    def create_jwt_token(payload: Dict[str, Any], expires_in_days: int = settings.JWT_EXPIRY_DAYS) -> str:
        to_encode = payload.copy()
        expire = datetime.datetime.utcnow() + datetime.timedelta(days=expires_in_days)
        to_encode.update({"exp": expire, "iat": datetime.datetime.utcnow()})
        return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

    def decode_jwt_token(token: str) -> Optional[Dict[str, Any]]:
        try:
            return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        except Exception:
            return None
except ImportError:
    # Native HMAC-SHA256 JWT implementation
    def _b64encode(data: bytes) -> str:
        return base64.urlsafe_b64encode(data).decode('utf-8').replace('=', '')

    def _b64decode(data: str) -> bytes:
        padding = 4 - (len(data) % 4)
        if padding < 4:
            data += '=' * padding
        return base64.urlsafe_b64decode(data.encode('utf-8'))

    def create_jwt_token(payload: Dict[str, Any], expires_in_days: int = settings.JWT_EXPIRY_DAYS) -> str:
        header = {"alg": "HS256", "typ": "JWT"}
        to_encode = payload.copy()
        expire = int(time.time()) + (expires_in_days * 86400)
        to_encode.update({"exp": expire, "iat": int(time.time())})

        header_b64 = _b64encode(json.dumps(header).encode('utf-8'))
        payload_b64 = _b64encode(json.dumps(to_encode).encode('utf-8'))
        signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
        signature = hmac.new(settings.JWT_SECRET.encode('utf-8'), signing_input, hashlib.sha256).digest()
        sig_b64 = _b64encode(signature)
        return f"{header_b64}.{payload_b64}.{sig_b64}"

    def decode_jwt_token(token: str) -> Optional[Dict[str, Any]]:
        try:
            parts = token.split('.')
            if len(parts) != 3:
                return None
            header_b64, payload_b64, sig_b64 = parts
            signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
            expected_sig = hmac.new(settings.JWT_SECRET.encode('utf-8'), signing_input, hashlib.sha256).digest()
            if not secrets.compare_digest(_b64encode(expected_sig), sig_b64):
                return None
            payload = json.loads(_b64decode(payload_b64).decode('utf-8'))
            if "exp" in payload and payload["exp"] < time.time():
                return None
            return payload
        except Exception:
            return None

def verify_admin_password(password: str) -> bool:
    """Verify admin password using constant-time comparison against ADMIN_PASSWORD env."""
    return secrets.compare_digest(password.strip(), settings.ADMIN_PASSWORD.strip())

# Simple in-memory rate limiter per IP (10 attempts per minute)
_login_attempts: Dict[str, list] = {}

def check_login_rate_limit(client_ip: str, max_attempts: int = 10, window_seconds: int = 60) -> bool:
    now = time.time()
    attempts = _login_attempts.get(client_ip, [])
    # filter out attempts outside window
    attempts = [t for t in attempts if now - t < window_seconds]
    if len(attempts) >= max_attempts:
        _login_attempts[client_ip] = attempts
        return False
    attempts.append(now)
    _login_attempts[client_ip] = attempts
    return True
