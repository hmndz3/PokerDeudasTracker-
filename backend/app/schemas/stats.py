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


class BiggestTable(BaseModel):
    id: int
    name: str
    total_pool: int
    player_count: int
    closed_at: Optional[str]


class DayActivity(BaseModel):
    date: str          # "YYYY-MM-DD"
    total_pool: int    # suma de buy-ins de ese día (décimos)
    table_count: int


class DashboardStats(BaseModel):
    # Conteos básicos
    total_tables: int
    open_tables: int
    total_players: int
    total_groups: int

    # Jugadores destacados
    top_winner: Optional[PlayerStat]
    top_loser: Optional[PlayerStat]
    most_active: Optional[PlayerStat]
    ranking: list[PlayerStat]

    # Dinero
    total_money_played: int   # suma de todos los total_in (décimos)
    total_rebuys: int         # total de recompras en todas las mesas

    # Tabla más grande
    biggest_table: Optional[BiggestTable]

    # Serie de tiempo
    tables_by_day: list[DayActivity]


class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int]
    actor_name: Optional[str]
    action: str
    entity_type: str
    entity_id: Optional[int]
    details: Optional[str]
    created_at: str
