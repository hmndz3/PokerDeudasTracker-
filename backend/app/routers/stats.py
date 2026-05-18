from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, UserRole, Group, PokerTable, TablePlayerResult, TableStatus
from app.core.deps import get_current_user, require_admin
from app.schemas.stats import DashboardStats, PlayerStat, BiggestTable, DayActivity

router = APIRouter(prefix="/stats", tags=["stats"])


def _compute_player_stat(user: User, db: Session) -> PlayerStat:
    results = (
        db.query(TablePlayerResult)
        .join(PokerTable, TablePlayerResult.table_id == PokerTable.id)
        .filter(
            TablePlayerResult.user_id == user.id,
            PokerTable.status == TableStatus.CLOSED,
        )
        .all()
    )
    if not results:
        return PlayerStat(
            user_id=user.id,
            real_name=user.real_name,
            username=user.username,
            tables_played=0,
            total_net=0,
            best_result=0,
            worst_result=0,
            total_rebuys=0,
            avg_net=0,
        )

    nets = [r.net_result for r in results]
    total_net = sum(nets)
    return PlayerStat(
        user_id=user.id,
        real_name=user.real_name,
        username=user.username,
        tables_played=len(results),
        total_net=total_net,
        best_result=max(nets),
        worst_result=min(nets),
        total_rebuys=sum(r.rebuys for r in results),
        avg_net=total_net // len(results),
    )


@router.get("/dashboard", response_model=DashboardStats)
def dashboard_stats(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    # ── Conteos básicos ────────────────────────────────────────────────────────
    total_tables = db.query(PokerTable).count()
    open_tables = db.query(PokerTable).filter(PokerTable.status == TableStatus.OPEN).count()
    total_players = db.query(User).filter(User.role == UserRole.PLAYER, User.is_active == True).count()
    total_groups = db.query(Group).count()

    # ── Stats por jugador ──────────────────────────────────────────────────────
    players = db.query(User).filter(User.role == UserRole.PLAYER, User.is_active == True).all()
    stats = [_compute_player_stat(u, db) for u in players]
    stats_with_games = [s for s in stats if s.tables_played > 0]

    top_winner  = max(stats_with_games, key=lambda s: s.total_net)  if stats_with_games else None
    top_loser   = min(stats_with_games, key=lambda s: s.total_net)  if stats_with_games else None
    most_active = max(stats_with_games, key=lambda s: s.tables_played) if stats_with_games else None
    ranking     = sorted(stats_with_games, key=lambda s: s.total_net, reverse=True)

    # ── Mesas cerradas ─────────────────────────────────────────────────────────
    closed_tables = (
        db.query(PokerTable)
        .filter(PokerTable.status == TableStatus.CLOSED)
        .all()
    )

    # Pool de cada mesa = suma de total_in de todos los jugadores
    table_pools: list[tuple[PokerTable, int, int]] = []
    for table in closed_tables:
        pool = sum(r.total_in for r in table.results)
        table_pools.append((table, pool, len(table.results)))

    # Dinero total jugado y recompras totales
    total_money_played = sum(p for _, p, _ in table_pools)
    all_results = [r for t in closed_tables for r in t.results]
    total_rebuys = sum(r.rebuys for r in all_results)

    # Mesa más grande (mayor pool)
    biggest_table = None
    if table_pools:
        bt, bt_pool, bt_players = max(table_pools, key=lambda x: x[1])
        biggest_table = BiggestTable(
            id=bt.id,
            name=bt.name,
            total_pool=bt_pool,
            player_count=bt_players,
            closed_at=bt.closed_at.isoformat() if bt.closed_at else None,
        )

    # Serie de tiempo: agrupa por día de cierre
    day_map: dict[str, dict] = defaultdict(lambda: {"pool": 0, "count": 0})
    for table, pool, _ in table_pools:
        if table.closed_at:
            day_str = table.closed_at.strftime("%Y-%m-%d")
            day_map[day_str]["pool"] += pool
            day_map[day_str]["count"] += 1
    tables_by_day = [
        DayActivity(date=d, total_pool=v["pool"], table_count=v["count"])
        for d, v in sorted(day_map.items())
    ]

    return DashboardStats(
        total_tables=total_tables,
        open_tables=open_tables,
        total_players=total_players,
        total_groups=total_groups,
        top_winner=top_winner,
        top_loser=top_loser,
        most_active=most_active,
        ranking=ranking,
        total_money_played=total_money_played,
        total_rebuys=total_rebuys,
        biggest_table=biggest_table,
        tables_by_day=tables_by_day,
    )


@router.get("/me", response_model=PlayerStat)
def my_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _compute_player_stat(current_user, db)


@router.get("/players", response_model=list[PlayerStat])
def all_player_stats(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    players = db.query(User).filter(User.role == UserRole.PLAYER, User.is_active == True).all()
    return [_compute_player_stat(u, db) for u in players]


@router.get("/players/{user_id}", response_model=PlayerStat)
def player_stats(
    user_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return _compute_player_stat(user, db)


@router.get("/me/history")
def my_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    results = (
        db.query(TablePlayerResult)
        .join(PokerTable, TablePlayerResult.table_id == PokerTable.id)
        .filter(
            TablePlayerResult.user_id == current_user.id,
            PokerTable.status == TableStatus.CLOSED,
        )
        .order_by(PokerTable.closed_at)
        .all()
    )
    return [
        {
            "table_id": r.table_id,
            "table_name": r.table.name,
            "net_result": r.net_result,
            "total_in": r.total_in,
            "cash_out": r.cash_out,
            "closed_at": r.table.closed_at.isoformat() if r.table.closed_at else None,
        }
        for r in results
    ]
