import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, Enum, UniqueConstraint
)
from sqlalchemy.orm import relationship

from app.database import Base


class TableStatus(str, enum.Enum):
    OPEN = "open"
    CLOSED = "closed"


class PokerTable(Base):
    __tablename__ = "poker_tables"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    status = Column(Enum(TableStatus), nullable=False, default=TableStatus.OPEN)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)

    # Monto fijo de buy-in en décimos (Q45.5 → 455). Mismo para todos.
    buy_in_amount = Column(Integer, nullable=False, default=0)

    results = relationship(
        "TablePlayerResult",
        back_populates="table",
        cascade="all, delete-orphan",
    )


class TablePlayerResult(Base):
    """Resultado de un jugador en una mesa específica.
    - buy_in: monto fijo de la mesa (décimos)
    - rebuys: CANTIDAD de recompras (entero, no monto)
    - cash_out: con cuánto salió (décimos)
    - total_in = buy_in * (1 + rebuys)
    """
    __tablename__ = "table_player_results"
    __table_args__ = (
        UniqueConstraint("table_id", "user_id", name="uq_table_user"),
    )

    id = Column(Integer, primary_key=True, index=True)
    table_id = Column(Integer, ForeignKey("poker_tables.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    buy_in = Column(Integer, nullable=False, default=0)    # monto fijo (= table.buy_in_amount)
    rebuys = Column(Integer, nullable=False, default=0)    # CANTIDAD de recompras
    cash_out = Column(Integer, nullable=False, default=0)  # monto de salida (décimos)

    table = relationship("PokerTable", back_populates="results")
    user = relationship("User")

    @property
    def total_in(self) -> int:
        """buy_in * (1 + rebuys_count)"""
        return self.buy_in * (1 + self.rebuys)

    @property
    def net_result(self) -> int:
        return self.cash_out - self.total_in
