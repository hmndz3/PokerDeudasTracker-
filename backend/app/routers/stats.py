from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, UserRole, Group, PokerTable, TablePlayerResult, TableStatus
from app.core.deps import get_current_user, require_admin
from app.schemas.stats import DashboardStats, PlayerStat

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
    total_tables = db.query(PokerTable).count()
    open_tables = db.query(PokerTable).filter(PokerTable.status == TableStatus.OPEN).count()
    total_players = db.query(User).filter(User.role == UserRole.PLAYER, User.is_active == True).count()
    total_groups = db.query(Group).count()

    players = db.query(User).filter(User.role == UserRole.PLAYER, User.is_active == True).all()
    stats = [_compute_player_stat(u, db) for u in players]
    stats_with_games = [s for s in stats if s.tables_played > 0]

    top_winner = max(stats_with_games, key=lambda s: s.total_net) if stats_with_games else None
    top_loser = min(stats_with_games, key=lambda s: s.total_net) if stats_with_games else None
    ranking = sorted(stats_with_games, key=lambda s: s.total_net, reverse=True)

    return DashboardStats(
        total_tables=total_tables,
        open_tables=open_tables,
        total_players=total_players,
        total_groups=total_groups,
        top_winner=top_winner,
        top_loser=top_loser,
        ranking=ranking,
    )


@router.get("/me", response_model=PlayerStat)
def my_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _compute_player_stat(current_user, db)


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
