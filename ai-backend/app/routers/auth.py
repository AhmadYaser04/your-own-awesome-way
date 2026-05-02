"""Authentication endpoints: /register, /login, /me"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Profile
from app.schemas import UserRegister, UserOut, Token
from app.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    """Register a new user (default role = 'user')."""
    # check uniqueness
    existing = db.query(User).filter(User.username == payload.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="اسم المستخدم مستخدم بالفعل")

    user = User(
        username=payload.username,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        email=payload.email,
        role="user",
    )
    db.add(user)
    db.flush()  # so user.id is available

    # auto-create empty profile
    profile = Profile(
        id=user.id,
        full_name=payload.full_name,
        email=payload.email,
    )
    db.add(profile)
    db.commit()
    db.refresh(user)

    token = create_access_token(user_id=str(user.id), username=user.username, role=user.role)
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login with username + password (uses OAuth2 form for Swagger compatibility)."""
    user = db.query(User).filter(User.username == form.username).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="اسم المستخدم أو كلمة المرور غير صحيحة",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(user_id=str(user.id), username=user.username, role=user.role)
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user."""
    return current_user
