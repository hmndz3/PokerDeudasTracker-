from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text

from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(80), nullable=False)         # ej: "table.closed"
    entity_type = Column(String(60), nullable=False)    # ej: "PokerTable"
    entity_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)               # JSON serializado como texto
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)