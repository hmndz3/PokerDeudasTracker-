import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Debt, DebtStatus, PaymentConfirmation, PokerTable, AuditLog
from app.core.deps import get_current_user
from app.schemas.debts import DebtOut

router = APIRouter(prefix="/debts", tags=["debts"])


def _serialize_debt(d: Debt, db: Session) -> dict:
    table = db.query(PokerTable).filter(PokerTable.id == d.table_id).first()
    payer = db.query(User).filter(User.id == d.payer_id).first()
    receiver = db.query(User).filter(User.id == d.receiver_id).first()
    return {
        "id": d.id,
        "table_id": d.table_id,
        "table_name": table.name if table else "",
        "payer_id": d.payer_id,
        "payer_name": payer.real_name if payer else "",
        "receiver_id": d.receiver_id,
        "receiver_name": receiver.real_name if receiver else "",
        "amount": d.amount,
        "status": d.status,
        "created_at": d.created_at,
    }


@router.get("", response_model=list[DebtOut])
def list_debts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.value == "admin":
        debts = db.query(Debt).order_by(Debt.created_at.desc()).all()
    else:
        debts = (
            db.query(Debt)
            .filter(
                (Debt.payer_id == current_user.id) | (Debt.receiver_id == current_user.id)
            )
            .order_by(Debt.created_at.desc())
            .all()
        )
    return [_serialize_debt(d, db) for d in debts]


@router.get("/pending", response_model=list[DebtOut])
def list_pending_debts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    debts = (
        db.query(Debt)
        .filter(
            ((Debt.payer_id == current_user.id) | (Debt.receiver_id == current_user.id)),
            Debt.status != DebtStatus.COMPLETED,
        )
        .order_by(Debt.created_at.desc())
        .all()
    )
    return [_serialize_debt(d, db) for d in debts]


@router.post("/{debt_id}/confirm-payment", response_model=DebtOut)
def confirm_payment(
    debt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deudor marca 'ya pagué'."""
    debt = db.query(Debt).filter(Debt.id == debt_id).first()
    if not debt:
        raise HTTPException(status_code=404, detail="Deuda no encontrada")
    if debt.payer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Solo el deudor puede confirmar el pago")
    if debt.status != DebtStatus.PENDING:
        raise HTTPException(status_code=400, detail="La deuda no está en estado pendiente")

    debt.status = DebtStatus.PAYER_CONFIRMED

    confirmation = PaymentConfirmation(debt_id=debt_id, user_id=current_user.id, role="payer")
    db.add(confirmation)

    _add_audit(db, current_user.id, "debt.payer_confirmed", "Debt", debt_id)
    db.commit()
    db.refresh(debt)
    return _serialize_debt(debt, db)


@router.post("/{debt_id}/confirm-received", response_model=DebtOut)
def confirm_received(
    debt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Receptor confirma 'recibido'."""
    debt = db.query(Debt).filter(Debt.id == debt_id).first()
    if not debt:
        raise HTTPException(status_code=404, detail="Deuda no encontrada")
    if debt.receiver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Solo el receptor puede confirmar la recepción")
    if debt.status != DebtStatus.PAYER_CONFIRMED:
        raise HTTPException(status_code=400, detail="El deudor aún no ha confirmado el pago")

    debt.status = DebtStatus.COMPLETED

    confirmation = PaymentConfirmation(debt_id=debt_id, user_id=current_user.id, role="receiver")
    db.add(confirmation)

    _add_audit(db, current_user.id, "debt.completed", "Debt", debt_id)
    db.commit()
    db.refresh(debt)
    return _serialize_debt(debt, db)


@router.post("/{debt_id}/reject", response_model=DebtOut)
def reject_payment(
    debt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Receptor rechaza la confirmación del pago."""
    debt = db.query(Debt).filter(Debt.id == debt_id).first()
    if not debt:
        raise HTTPException(status_code=404, detail="Deuda no encontrada")
    if debt.receiver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Solo el receptor puede rechazar")
    if debt.status != DebtStatus.PAYER_CONFIRMED:
        raise HTTPException(status_code=400, detail="No hay pago pendiente de confirmación")

    debt.status = DebtStatus.PENDING
    _add_audit(db, current_user.id, "debt.rejected", "Debt", debt_id)
    db.commit()
    db.refresh(debt)
    return _serialize_debt(debt, db)


def _add_audit(db: Session, user_id: int, action: str, entity_type: str, entity_id: int):
    log = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
    )
    db.add(log)
