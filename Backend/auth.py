from pathlib import Path
from typing import Dict, Optional
import logging
from .schema import UserRecord
import json
from .constants import USERS_PATH, JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRES_MIN, ROLE_TO_COLLECTIONS, ALL_ROLES
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from fastapi import Header, HTTPException, status



log = logging.getLogger(__name__)





def _load_users() -> Dict[str, UserRecord]:
    path = Path(USERS_PATH)
    if not path.exists():
        log.warning("users.json not found at %s — run scripts/seed_users.py", path)
        return {}
    raw = json.loads(path.read_text(encoding="utf-8"))
    return {u["username"]: UserRecord(**u) for u in raw}

def get_user(username: str) -> Optional[UserRecord]:
    users = _load_users()
    return users.get(username)

def authenticate(username: str, password: str) -> Optional[UserRecord]:
    user = get_user(username)
    if user is None or user.password != password:
        return None
    return user

def issue_token(username: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": username,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=JWT_EXPIRES_MIN)).timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _rbac_refusal(role: str, hint: str = "") -> str:
    accessible = ROLE_TO_COLLECTIONS[role]
    coll_str = ", ".join(accessible)
    base = (
        f"Access restricted: as a '{role}', you do not have permission to retrieve "
        f"this content. I can only answer questions from the {coll_str} collection(s). "
        f"Please contact the admin team if you believe this is an error."
    )
    if hint:
        base = f"{hint}  {base}"
    return base


def verify_token(token: str) -> Dict[str, str]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {e}",
        )

async def get_current_user(authorization: str = Header(...)) -> UserRecord:
    if not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Bearer token",
        )
    token = authorization.split(" ", 1)[1].strip()
    payload = verify_token(token)
    username = payload.get("sub")
    role = payload.get("role")
    if not username or not role or role not in ALL_ROLES:
        raise HTTPException(status_code=401, detail="Malformed token")
    user = get_user(username)
    if user is None or user.role != role:
        raise HTTPException(status_code=401, detail="Stale token (user missing)")
    return user