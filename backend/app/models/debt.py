import enum
from datetime import datetime
from sqlalchemy import Column, Integer, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship

from app.database import Base


class DebtStatus(str, enum.Enum):
    PENDING = "pending"
    PAYER_CONFIRMED = "payer_confirmed"   # deudor dijo "ya pagué"
    COMPLETED = "completed"                # receptor confirmó
    REJECTED = "rejected"


class Debt(Base):
    __tablename__ = "debts"

    id = Column(Integer, primary_key=True, index=True)
    table_id = Column(Integer, ForeignKey("poker_tables.id"), nullable=False)
    payer_id = Column(Integer, ForeignKey("users.id"), nullable=False)     # debe
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # recibe
    amount = Column(Integer, nullable=False)  # en décimos
    status = Column(Enum(DebtStatus), nullable=False, default=DebtStatus.PENDING)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    confirmations = relationship(
        "PaymentConfirmation",
        back_populates="debt",
        cascade="all, delete-orphan",
    )


class PaymentConfirmation(Base):
    __tablename__ = "payment_confirmations"

    id = Column(Integer, primary_key=True, index=True)
    debt_id = Column(Integer, ForeignKey("debts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(Enum("payer", "receiver", name="confirmation_role"), nullable=False)
    confirmed_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    debt = relationship("Debt", back_populates="confirmations")