from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, AuditLog
from app.core.deps import require_admin
from app.schemas.stats import AuditLogOut

router = APIRouter(prefix="/audit", tags=["audit"])


def _serialize_log(log: AuditLog, db: Session) -> dict:
    actor_name = None
    if log.user_id:
        actor = db.query(User).filter(User.id == log.user_id).first()
        actor_name = actor.real_name if actor else None
    return {
        "id": log.id,
        "user_id": log.user_id,
        "actor_name": actor_name,
        "action": log.action,
        "entity_type": log.entity_type,
        "entity_id": log.entity_id,
        "details": log.details,
        "created_at": log.created_at.isoformat(),
    }


@router.get("", response_model=list[AuditLogOut])
def list_audit_logs(
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    logs = (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
        .all()
    )
    return [_serialize_log(log, db) for log in logs]
