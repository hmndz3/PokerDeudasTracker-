from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from app.models.poker_table import TableStatus


class TableCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    group_id: int


class PlayerResultCreate(BaseModel):
    user_id: int
    buy_in: int = Field(ge=0)


class PlayerResultUpdate(BaseModel):
    buy_in: Optional[int] = Field(ge=0, default=None)
    rebuys: Optional[int] = Field(ge=0, default=None)
    cash_out: Optional[int] = Field(ge=0, default=None)


class PlayerResultOut(BaseModel):
    id: int
    table_id: int
    user_id: int
    real_name: str
    username: str
    buy_in: int
    rebuys: int
    cash_out: int
    total_in: int
    net_result: int


class TableOut(BaseModel):
    id: int
    name: str
    group_id: int
    group_name: str
    status: TableStatus
    created_by: int
    created_at: datetime
    closed_at: Optional[datetime]
    results: list[PlayerResultOut] = []
    total_in: int = 0
    total_out: int = 0


class TableListOut(BaseModel):
    id: int
    name: str
    group_id: int
    group_name: str
    status: TableStatus
    created_by: int
    created_at: datetime
    closed_at: Optional[datetime]
    player_count: int = 0


class ValidationResult(BaseModel):
    total_in: int
    total_out: int
    difference: int
    can_close: bool
