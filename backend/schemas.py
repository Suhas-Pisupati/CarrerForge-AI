from pydantic import BaseModel, EmailStr


# ==========================================
# REGISTER
# ==========================================

class RegisterRequest(BaseModel):

    name: str

    email: EmailStr

    password: str


# ==========================================
# LOGIN
# ==========================================

class LoginRequest(BaseModel):

    email: EmailStr

    password: str


# ==========================================
# USER RESPONSE
# ==========================================

class UserResponse(BaseModel):

    id: int

    name: str

    email: str

    class Config:

        from_attributes = True