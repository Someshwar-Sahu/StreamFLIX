"""add check constraints to watchlist and ratings

Revision ID: 0e2cebdc15c7
Revises: 06308b6fc128
Create Date: 2026-07-27 13:48:26.899673

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0e2cebdc15c7'
down_revision: Union[str, Sequence[str], None] = '06308b6fc128'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_check_constraint(
        "ck_watchlist_exactly_one_target",
        "watchlist",
        "(content_id IS NOT NULL AND series_id IS NULL) OR (content_id IS NULL AND series_id IS NOT NULL)",
    )
    op.create_check_constraint(
        "ck_rating_exactly_one_target",
        "ratings",
        "(content_id IS NOT NULL AND series_id IS NULL) OR (content_id IS NULL AND series_id IS NOT NULL)",
    )


def downgrade() -> None:
    op.drop_constraint("ck_watchlist_exactly_one_target", "watchlist", type_="check")
    op.drop_constraint("ck_rating_exactly_one_target", "ratings", type_="check")