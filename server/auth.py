from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas

# Configuration
SECRET_KEY = "hairskiin-crm-secret-key-change-in-production-2024"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate password hash"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def authenticate_user(db: Session, username: str, password: str):
    """Authenticate user and return user object"""
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        return False
    if not verify_password(password, user.password_hash):
        return False
    if user.status != "active":
        return False
    return user


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    """Get current user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username, role=payload.get("role"))
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    return user


def get_current_branch_id(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[int]:
    """Get current branch_id from token or query parameter"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        branch_id = payload.get("branch_id")
        return branch_id
    except JWTError:
        return None


async def get_current_branch(
    branch_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
) -> Optional[models.Branch]:
    """Get current branch - from user's branch_id or provided branch_id"""
    # If user has a branch_id, use that
    if current_user.branch_id:
        branch = db.query(models.Branch).filter(models.Branch.branch_id == current_user.branch_id).first()
        if branch and branch.is_active:
            return branch
    
    # Otherwise use provided branch_id
    if branch_id:
        branch = db.query(models.Branch).filter(models.Branch.branch_id == branch_id).first()
        if branch and branch.is_active:
            return branch
    
    return None


def get_branch_id_dependency(
    branch_id: Optional[int] = Query(None, description="Filter by branch ID"),
    current_user: models.User = Depends(get_current_user)
) -> Optional[int]:
    """Dependency to get branch_id from query param or user's branch_id"""
    # If branch_id is provided in query, use it (admin/manager can switch branches)
    if branch_id:
        return branch_id
    
    # Otherwise use user's branch_id
    return current_user.branch_id


async def get_current_active_user(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    """Ensure user is active"""
    if current_user.status != "active":
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def require_role(*roles: str):
    """Dependency to require specific roles"""
    async def role_checker(current_user: models.User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {', '.join(roles)}"
            )
        return current_user
    return role_checker


# Role-based dependencies
# Role-based dependencies
require_admin = require_role("admin", "super_admin")
require_admin_or_manager = require_role("admin", "manager", "director", "super_admin")
require_any_role = require_role("admin", "manager", "receptionist", "director", "cashier", "super_admin")
