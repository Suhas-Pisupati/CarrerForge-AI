from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Header
)

from sqlalchemy.orm import Session

from database import get_db
from models import User

from schemas import (
    RegisterRequest,
    LoginRequest
)

from security import (
    hash_password,
    verify_password,
    create_access_token,
    verify_token
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# ==========================================
# REGISTER
# ==========================================

@router.post("/register")
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db)
):

    # Normalize email
    email = request.email.strip().lower()

    name = request.name.strip()

    # Validate name
    if not name:
        raise HTTPException(
            status_code=400,
            detail="Name is required"
        )

    # Validate email
    if not email:
        raise HTTPException(
            status_code=400,
            detail="Email is required"
        )

    # Check existing user
    existing_user = db.query(User).filter(
        User.email == email
    ).first()

    if existing_user:

        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Validate password
    if len(request.password) < 6:

        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 6 characters"
        )

    # Create user
    new_user = User(

        name=name,

        email=email,

        password=hash_password(
            request.password
        )

    )

    db.add(new_user)

    db.commit()

    db.refresh(new_user)

    return {

        "message": "Registration successful",

        "user": {

            "id": new_user.id,

            "name": new_user.name,

            "email": new_user.email

        }

    }


# ==========================================
# LOGIN
# ==========================================

@router.post("/login")
def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):

    # Normalize email
    email = request.email.strip().lower()

    # Find user
    user = db.query(User).filter(
        User.email == email
    ).first()

    if not user:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Verify password
    if not verify_password(
        request.password,
        user.password
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Create JWT
    token = create_access_token({

        "sub": str(user.id),

        "email": user.email

    })

    # IMPORTANT:
    # Always return the CURRENT database user
    return {

        "access_token": token,

        "token_type": "bearer",

        "user": {

            "id": user.id,

            "name": user.name,

            "email": user.email

        }

    }


# ==========================================
# CURRENT USER
# ==========================================

@router.get("/me")
def get_current_user(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):

    # Check authorization header
    if not authorization:

        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )

    # Check Bearer token
    if not authorization.startswith("Bearer "):

        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header"
        )

    token = authorization.replace(
        "Bearer ",
        "",
        1
    ).strip()

    # Verify token
    user_id = verify_token(token)

    if not user_id:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    try:

        user_id = int(user_id)

    except (ValueError, TypeError):

        raise HTTPException(
            status_code=401,
            detail="Invalid user token"
        )

    # Get CURRENT user from database
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {

        "id": user.id,

        "name": user.name,

        "email": user.email,

        "created_at": user.created_at

    }