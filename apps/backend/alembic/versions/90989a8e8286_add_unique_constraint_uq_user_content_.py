"""add unique constraint uq_user_content to watch_history

Revision ID: 90989a8e8286
Revises: c72b0abe201d
Create Date: 2026-07-26 00:05:32.712265

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '90989a8e8286'
down_revision: Union[str, Sequence[str], None] = 'c72b0abe201d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_unique_constraint("uq_user_content", "watch_history", ["user_id", "content_id"])


def downgrade() -> None:
    op.drop_constraint("uq_user_content", "watch_history", type_="unique")