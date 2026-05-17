"""add buy_in_amount to poker_tables

Revision ID: c3d4e5f6a7b8
Revises: 91cc1ec18373
Create Date: 2026-05-17

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, None] = '91cc1ec18373'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # buy_in_amount: monto fijo de entrada para todos los jugadores de la mesa (en décimos)
    op.add_column(
        'poker_tables',
        sa.Column('buy_in_amount', sa.Integer(), nullable=False, server_default='0'),
    )


def downgrade() -> None:
    op.drop_column('poker_tables', 'buy_in_amount')
