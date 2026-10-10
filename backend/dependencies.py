from fastapi import Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from database import get_db
from models.db_models import DBUser
from services.auth_service import decode_jwt_token

def get_token_payload(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication token. Please sign in."
        )
    token = authorization.split(" ")[1].strip()
    payload = decode_jwt_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid. Please sign in again."
        )
    return payload

def require_admin(payload: Dict[str, Any] = Depends(get_token_payload)) -> Dict[str, Any]:
    if payload.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required."
        )
    return payload

def require_user(
    payload: Dict[str, Any] = Depends(get_token_payload),
    db: Session = Depends(get_db)
) -> DBUser:
    if payload.get("role") != "user":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account required for this action."
        )
    user_id = payload.get("sub")
    user = db.query(DBUser).filter(DBUser.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found."
        )
    return user

def get_optional_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[DBUser]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1].strip()
    payload = decode_jwt_token(token)
    if not payload or payload.get("role") != "user":
        return None
    user_id = payload.get("sub")
    return db.query(DBUser).filter(DBUser.id == user_id).first()
