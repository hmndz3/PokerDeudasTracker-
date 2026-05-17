from pydantic import BaseModel
from datetime import datetime
from app.models.debt import DebtStatus


class DebtOut(BaseModel):
    id: int
    table_id: int
    table_name: str
    payer_id: int
    payer_name: str
    receiver_id: int
    receiver_name: str
    amount: int
    status: DebtStatus
    created_at: datetime
