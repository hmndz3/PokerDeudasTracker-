from pydantic import BaseModel, Field

from app.models import UserRole


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserCreate(BaseModel):
    real_name: str = Field(min_length=2, max_length=120)
    username: str = Field(min_length=3, max_length=60)
    password: str = Field(min_length=6, max_length=128)
    role: UserRole = UserRole.PLAYER


class UserOut(BaseModel):
    id: int
    real_name: str
    username: str
    role: UserRole
    is_active: bool

    class Config:
        from_attributes = True