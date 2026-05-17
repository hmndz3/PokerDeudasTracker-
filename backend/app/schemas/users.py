from pydantic import BaseModel, Field


class UsernameUpdate(BaseModel):
    username: str = Field(min_length=3, max_length=60)


class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6, max_length=128)


class AdminPasswordReset(BaseModel):
    new_password: str = Field(min_length=6, max_length=128)