"""add categories table and content.category_id

Revision ID: 091201bcbd65
Revises: 90989a8e8286
Create Date: 2026-07-26 11:27:16.831356

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "091201bcbd65"
down_revision: Union[str, Sequence[str], None] = "90989a8e8286"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create categories table
    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )

    # Insert default category
    op.execute("""
        INSERT INTO categories (name)
        VALUES ('Uncategorized');
    """)

    # Add category_id as nullable temporarily
    op.add_column(
        "content",
        sa.Column("category_id", sa.Integer(), nullable=True),
    )

    # Assign all existing content to the default category
    op.execute("""
        UPDATE content
        SET category_id = (
            SELECT id
            FROM categories
            WHERE name = 'Uncategorized'
        );
    """)

    # Make category_id mandatory
    op.alter_column(
        "content",
        "category_id",
        nullable=False,
    )

    # Add foreign key
    op.create_foreign_key(
        "fk_content_category_id",
        "content",
        "categories",
        ["category_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_content_category_id",
        "content",
        type_="foreignkey",
    )

    op.drop_column(
        "content",
        "category_id",
    )

    op.drop_table("categories")