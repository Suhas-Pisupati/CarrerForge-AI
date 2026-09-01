from datetime import datetime, timedelta
import os

from jose import JWTError, jwt
from passlib.context import CryptContext


# ==========================================
# SECURITY CONFIGURATION
# ==========================================

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET_KEY"
)

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24


# ==========================================
# PASSWORD HASHING
# ==========================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


def hash_password(password: str):

    # bcrypt supports maximum 72 bytes
    password_bytes = password.encode("utf-8")

    if len(password_bytes) > 72:
        raise ValueError(
            "Password is too long. Maximum allowed length is 72 bytes."
        )

    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str
):

    if len(plain_password.encode("utf-8")) > 72:
        return False

    return pwd_context.verify(
        plain_password,
        hashed_password
    )


# ==========================================
# CREATE JWT TOKEN
# ==========================================

def create_access_token(
    data: dict,
    expires_delta=None
):

    to_encode = data.copy()

    if expires_delta:

        expire = datetime.utcnow() + expires_delta

    else:

        expire = datetime.utcnow() + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({
        "exp": expire
    })

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return encoded_jwt


# ==========================================
# VERIFY TOKEN
# ==========================================

def verify_token(token: str):

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")

        if user_id is None:
            return None

        return user_id

    except JWTError:

        return None