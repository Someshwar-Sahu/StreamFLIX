from alembic import op
import sqlalchemy as sa

revision = "<keep as generated>"
down_revision = "091201bcbd65"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "content_categories",
        sa.Column("content_id", sa.Integer(), sa.ForeignKey("content.id"), primary_key=True),
        sa.Column("category_id", sa.Integer(), sa.ForeignKey("categories.id"), primary_key=True),
    )

    # migrate existing single category_id values into the junction table
    op.execute("""
        INSERT INTO content_categories (content_id, category_id)
        SELECT id, category_id FROM content WHERE category_id IS NOT NULL;
    """)

    op.drop_constraint("fk_content_category_id", "content", type_="foreignkey")
    op.drop_column("content", "category_id")


def downgrade() -> None:
    op.add_column("content", sa.Column("category_id", sa.Integer(), nullable=True))
    op.create_foreign_key("fk_content_category_id", "content", "categories", ["category_id"], ["id"])
    op.execute("""
        UPDATE content SET category_id = (
            SELECT category_id FROM content_categories WHERE content_categories.content_id = content.id LIMIT 1
        );
    """)
    op.drop_table("content_categories")