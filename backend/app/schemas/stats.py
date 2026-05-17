from pydantic import BaseModel
from typing import Optional


class PlayerStat(BaseModel):
    user_id: int
    real_name: str
    username: str
    tables_played: int
    total_net: int
    best_result: int
    worst_result: int
    total_rebuys: int
    avg_net: int


class DashboardStats(BaseModel):
    total_tables: int
    open_tables: int
    total_players: int
    total_groups: int
    top_winner: Optional[PlayerStat]
    top_loser: Optional[PlayerStat]
    ranking: list[PlayerStat]


class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int]
    actor_name: Optional[str]
    action: str
    entity_type: str
    entity_id: Optional[int]
    details: Optional[str]
    created_at: str
