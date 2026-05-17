import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    User, Group, GroupMember, PokerTable, TablePlayerResult,
    Debt, DebtStatus, TableStatus, AuditLog,
)
from app.core.deps import get_current_user, require_admin
from app.schemas.tables import (
    TableCreate, PlayerResultCreate, PlayerResultUpdate,
    TableOut, TableListOut, ValidationResult,
)

router = APIRouter(prefix="/tables", tags=["tables"])


# ── helpers ──────────────────────────────────────────────────────────────────

def _serialize_result(r: TablePlayerResult) -> dict:
    return {
        "id": r.id,
        "table_id": r.table_id,
        "user_id": r.user_id,
        "real_name": r.user.real_name,
        "username": r.user.username,
        "buy_in": r.buy_in,
        "rebuys": r.rebuys,        # CANTIDAD de recompras
        "cash_out": r.cash_out,
        "total_in": r.total_in,    # buy_in * (1 + rebuys)
        "net_result": r.net_result,
    }


def _serialize_table(t: PokerTable, db: Session) -> dict:
    group = db.query(Group).filter(Group.id == t.group_id).first()
    results = [_serialize_result(r) for r in t.results]
    total_in = sum(r["total_in"] for r in results)
    total_out = sum(r["cash_out"] for r in results)
    return {
        "id": t.id,
        "name": t.name,
        "group_id": t.group_id,
        "group_name": group.name if group else "",
        "status": t.status,
        "created_by": t.created_by,
        "created_at": t.created_at,
        "closed_at": t.closed_at,
        "buy_in_amount": t.buy_in_amount,
        "results": results,
        "total_in": total_in,
        "total_out": total_out,
    }


def _serialize_table_list(t: PokerTable, db: Session) -> dict:
    group = db.query(Group).filter(Group.id == t.group_id).first()
    return {
        "id": t.id,
        "name": t.name,
        "group_id": t.group_id,
        "group_name": group.name if group else "",
        "status": t.status,
        "created_by": t.created_by,
        "created_at": t.created_at,
        "closed_at": t.closed_at,
        "buy_in_amount": t.buy_in_amount,
        "player_count": len(t.results),
    }


def _simplify_debts(results: list[TablePlayerResult]) -> list[tuple[int, int, int]]:
    """Algoritmo greedy de mínimas transacciones."""
    creditors: list[list] = []
    debtors: list[list] = []
    for r in results:
        net = r.net_result
        if net > 0:
            creditors.append([net, r.user_id])
        elif net < 0:
            debtors.append([-net, r.user_id])

    transactions = []
    i = j = 0
    while i < len(debtors) and j < len(creditors):
        pay = min(debtors[i][0], creditors[j][0])
        transactions.append((debtors[i][1], creditors[j][1], pay))
        debtors[i][0] -= pay
        creditors[j][0] -= pay
        if debtors[i][0] == 0:
            i += 1
        if creditors[j][0] == 0:
            j += 1
    return transactions


def _add_audit(db: Session, user_id: int, action: str, entity_type: str, entity_id: int, details: dict = None):
    log = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=json.dumps(details) if details else None,
    )
    db.add(log)


# ── routes ───────────────────────────────────────────────────────────────────

@router.get("", response_model=list[TableListOut])
def list_tables(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.value == "admin":
        tables = db.query(PokerTable).order_by(PokerTable.created_at.desc()).all()
    else:
        memberships = db.query(GroupMember).filter(GroupMember.user_id == current_user.id).all()
        group_ids = [m.group_id for m in memberships]
        tables = (
            db.query(PokerTable)
            .filter(PokerTable.group_id.in_(group_ids))
            .order_by(PokerTable.created_at.desc())
            .all()
        )
    return [_serialize_table_list(t, db) for t in tables]


@router.post("", response_model=TableOut, status_code=201)
def create_table(
    payload: TableCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    group = db.query(Group).filter(Group.id == payload.group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")

    table = PokerTable(
        name=payload.name,
        group_id=payload.group_id,
        created_by=admin.id,
        buy_in_amount=payload.buy_in_amount,
    )
    db.add(table)
    db.flush()

    _add_audit(db, admin.id, "table.created", "PokerTable", table.id, {
        "name": payload.name,
        "buy_in_amount": payload.buy_in_amount,
    })
    db.commit()
    db.refresh(table)
    return _serialize_table(table, db)


@router.get("/{table_id}", response_model=TableOut)
def get_table(
    table_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    table = db.query(PokerTable).filter(PokerTable.id == table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")
    return _serialize_table(table, db)


@router.post("/{table_id}/players", status_code=201)
def add_player(
    table_id: int,
    payload: PlayerResultCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    table = db.query(PokerTable).filter(PokerTable.id == table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")
    if table.status == TableStatus.CLOSED:
        raise HTTPException(status_code=400, detail="No se puede modificar una mesa cerrada")

    existing = db.query(TablePlayerResult).filter(
        TablePlayerResult.table_id == table_id,
        TablePlayerResult.user_id == payload.user_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="El jugador ya está en esta mesa")

    user = db.query(User).filter(User.id == payload.user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # buy_in se toma del table.buy_in_amount (igual para todos)
    result = TablePlayerResult(
        table_id=table_id,
        user_id=payload.user_id,
        buy_in=table.buy_in_amount,
        rebuys=0,
        cash_out=0,
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    return _serialize_result(result)


@router.patch("/{table_id}/players/{user_id}")
def update_player_result(
    table_id: int,
    user_id: int,
    payload: PlayerResultUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    table = db.query(PokerTable).filter(PokerTable.id == table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")

    result = db.query(TablePlayerResult).filter(
        TablePlayerResult.table_id == table_id,
        TablePlayerResult.user_id == user_id,
    ).first()
    if not result:
        raise HTTPException(status_code=404, detail="Jugador no encontrado en esta mesa")

    if table.status == TableStatus.CLOSED:
        before = {"rebuys": result.rebuys, "cash_out": result.cash_out}

    # rebuys = CANTIDAD de recompras (no monto)
    if payload.rebuys is not None:
        result.rebuys = payload.rebuys
    if payload.cash_out is not None:
        result.cash_out = payload.cash_out

    if table.status == TableStatus.CLOSED:
        _add_audit(db, admin.id, "table.result_edited_after_close", "TablePlayerResult", result.id, {
            "table_id": table_id, "user_id": user_id, "before": before,
        })

    db.commit()
    db.refresh(result)
    return _serialize_result(result)


@router.delete("/{table_id}/players/{user_id}", status_code=204)
def remove_player(
    table_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    table = db.query(PokerTable).filter(PokerTable.id == table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")
    if table.status == TableStatus.CLOSED:
        raise HTTPException(status_code=400, detail="Mesa cerrada")

    result = db.query(TablePlayerResult).filter(
        TablePlayerResult.table_id == table_id,
        TablePlayerResult.user_id == user_id,
    ).first()
    if not result:
        raise HTTPException(status_code=404, detail="Jugador no encontrado")
    db.delete(result)
    db.commit()


@router.get("/{table_id}/validate", response_model=ValidationResult)
def validate_table(
    table_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    table = db.query(PokerTable).filter(PokerTable.id == table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")

    total_in = sum(r.total_in for r in table.results)
    total_out = sum(r.cash_out for r in table.results)
    difference = total_out - total_in

    return {
        "total_in": total_in,
        "total_out": total_out,
        "difference": difference,
        "can_close": difference == 0 and len(table.results) > 0,
    }


@router.post("/{table_id}/close", response_model=TableOut)
def close_table(
    table_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    table = db.query(PokerTable).filter(PokerTable.id == table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")
    if table.status == TableStatus.CLOSED:
        raise HTTPException(status_code=400, detail="La mesa ya está cerrada")
    if not table.results:
        raise HTTPException(status_code=400, detail="La mesa no tiene jugadores")

    total_in = sum(r.total_in for r in table.results)
    total_out = sum(r.cash_out for r in table.results)
    if total_in != total_out:
        diff = total_out - total_in
        raise HTTPException(
            status_code=400,
            detail=f"No cuadra: total_metido={total_in} total_salido={total_out} diferencia={diff}",
        )

    table.status = TableStatus.CLOSED
    table.closed_at = datetime.utcnow()

    transactions = _simplify_debts(table.results)
    for payer_id, receiver_id, amount in transactions:
        debt = Debt(
            table_id=table_id,
            payer_id=payer_id,
            receiver_id=receiver_id,
            amount=amount,
            status=DebtStatus.PENDING,
        )
        db.add(debt)

    _add_audit(db, admin.id, "table.closed", "PokerTable", table_id, {
        "total_in": total_in,
        "debts_created": len(transactions),
    })

    db.commit()
    db.refresh(table)
    return _serialize_table(table, db)
