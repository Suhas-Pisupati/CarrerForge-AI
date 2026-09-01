from pydantic import BaseModel, EmailStr, Field


# ==========================================
# REGISTER
# ==========================================

class RegisterRequest(BaseModel):

    name: str = Field(
        min_length=1,
        max_length=100
    )

    email: EmailStr

    password: str = Field(
        min_length=6,
        max_length=72
    )


# ==========================================
# LOGIN
# ==========================================

class LoginRequest(BaseModel):

    email: EmailStr

    password: str = Field(
        min_length=6,
        max_length=72
    )


# ==========================================
# USER RESPONSE
# ==========================================

class UserResponse(BaseModel):

    id: int

    name: str

    email: str

    class Config:

        from_attributes = True