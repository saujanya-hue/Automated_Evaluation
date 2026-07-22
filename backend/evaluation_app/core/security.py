import os
import hashlib
import hmac
from datetime import datetime, timedelta
from typing import Union, Any
from jose import jwt, JWTError

# SECRET_KEY for JWT
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super_secret_key_for_answer_script_evaluation_system_998877")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours

# Use a simple salted SHA-256 for password hashing (no external deps required)
_SALT_PREFIX = "aegis_eval_salt:"

def get_password_hash(password: str) -> str:
    """Hash password using SHA-256 with a prefix salt (no bcrypt dependency)."""
    try:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        return pwd_context.hash(password)
    except Exception:
        # Fallback: simple salted sha256
        salted = _SALT_PREFIX + password
        return "sha256:" + hashlib.sha256(salted.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against stored hash."""
    try:
        # If stored hash starts with "sha256:", use our fallback verifier
        if hashed_password.startswith("sha256:"):
            salted = _SALT_PREFIX + plain_password
            computed = "sha256:" + hashlib.sha256(salted.encode()).hexdigest()
            return hmac.compare_digest(computed, hashed_password)
        # Otherwise try passlib/bcrypt
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        # Last resort: plain compare (only works if hash was stored as plain)
        return plain_password == hashed_password

def create_access_token(subject: Union[str, Any], role: str, expires_delta: int = None) -> str:
    if expires_delta is not None:
        expires_delta = datetime.utcnow() + timedelta(minutes=expires_delta)
    else:
        expires_delta = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expires_delta,
        "sub": str(subject),
        "role": role
    }
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
