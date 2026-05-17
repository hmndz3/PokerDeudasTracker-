from pydantic import BaseModel, Field
from datetime import datetime


class GroupCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)


class GroupMemberOut(BaseModel):
    id: int
    user_id: int
    real_name: str
    username: str
    joined_at: datetime

    model_config = {"from_attributes": True}


class GroupOut(BaseModel):
    id: int
    name: str
    created_by: int
    created_at: datetime
    member_count: int = 0

    model_config = {"from_attributes": True}


class GroupDetailOut(BaseModel):
    id: int
    name: str
    created_by: int
    created_at: datetime
    members: list[GroupMemberOut] = []

    model_config = {"from_attributes": True}


class AddMemberRequest(BaseModel):
    user_id: int
