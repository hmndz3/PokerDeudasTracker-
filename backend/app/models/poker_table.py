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

    # Montos en décimos (Q45.5 = 455)
    results = relationship(
        "TablePlayerResult",
        back_populates="table",
        cascade="all, delete-orphan",
    )


class TablePlayerResult(Base):
    """Resultado de un jugador en una mesa específica.
    Todos los montos son enteros en décimos (Q45.5 → 455).
    """
    __tablename__ = "table_player_results"
    __table_args__ = (
        UniqueConstraint("table_id", "user_id", name="uq_table_user"),
    )

    id = Column(Integer, primary_key=True, index=True)
    table_id = Column(Integer, ForeignKey("poker_tables.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    buy_in = Column(Integer, nullable=False, default=0)       # entrada base
    rebuys = Column(Integer, nullable=False, default=0)       # suma de recompras
    cash_out = Column(Integer, nullable=False, default=0)     # con cuánto salió

    table = relationship("PokerTable", back_populates="results")
    user = relationship("User")

    @property
    def total_in(self) -> int:
        return self.buy_in + self.rebuys

    @property
    def net_result(self) -> int:
        return self.cash_out - self.total_in