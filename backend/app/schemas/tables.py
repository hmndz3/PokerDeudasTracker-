from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from app.models.poker_table import TableStatus


class TableCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    group_id: int
    buy_in_amount: int = Field(ge=1)  # monto fijo en décimos (Q50.0 → 500)


class PlayerResultCreate(BaseModel):
    user_id: int
    # buy_in viene del table.buy_in_amount, no se pasa aquí


class PlayerResultUpdate(BaseModel):
    rebuys: Optional[int] = Field(ge=0, default=None)   # CANTIDAD de recompras
    cash_out: Optional[int] = Field(ge=0, default=None)  # monto de salida en décimos


class PlayerResultOut(BaseModel):
    id: int
    table_id: int
    user_id: int
    real_name: str
    username: str
    buy_in: int       # monto (décimos)
    rebuys: int       # CANTIDAD de recompras
    cash_out: int     # monto (décimos)
    total_in: int     # buy_in * (1 + rebuys)
    net_result: int   # cash_out - total_in


class TableOut(BaseModel):
    id: int
    name: str
    group_id: int
    group_name: str
    status: TableStatus
    created_by: int
    created_at: datetime
    closed_at: Optional[datetime]
    buy_in_amount: int
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
    buy_in_amount: int
    player_count: int = 0


class ValidationResult(BaseModel):
    total_in: int
    total_out: int
    difference: int
    can_close: bool
