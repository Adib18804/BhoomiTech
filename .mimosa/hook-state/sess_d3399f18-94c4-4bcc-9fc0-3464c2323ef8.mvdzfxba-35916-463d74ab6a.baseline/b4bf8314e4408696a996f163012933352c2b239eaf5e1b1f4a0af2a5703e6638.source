"""add divisions table and administrative hierarchy columns

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-10-18 02:00:00.000000

Adds the top level of the administrative hierarchy (Division) and the columns
needed to model Bangladesh's 8 divisions / 64 districts reference data:

- divisions                  : new table (bibhag) - top of the hierarchy
- districts.division_id      : FK to divisions (nullable, ON DELETE SET NULL)
- districts.is_active        : soft enable/disable flag
- upazilas.is_active         : soft enable/disable flag
- mouzas.is_active           : soft enable/disable flag

Additive and reversible: no existing column or table is modified, and all new
columns are nullable or carry a server default so existing rows remain valid.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b2c3d4e5f6a7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- divisions (bibhag) -------------------------------------------------
    op.create_table(
        'divisions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name_en', sa.String(length=100), nullable=False),
        sa.Column('name_bn', sa.String(length=100), nullable=False),
        sa.Column('code', sa.String(length=10), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_divisions_id', 'divisions', ['id'])
    op.create_index('ix_divisions_name_en', 'divisions', ['name_en'])
    op.create_index('ix_divisions_name_bn', 'divisions', ['name_bn'])
    op.create_index('ix_divisions_code', 'divisions', ['code'], unique=True)

    # --- districts -> divisions --------------------------------------------
    op.add_column('districts', sa.Column('division_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_districts_division_id', 'districts', 'divisions',
        ['division_id'], ['id'], ondelete='SET NULL')
    op.create_index('ix_districts_division_id', 'districts', ['division_id'])
    op.add_column('districts', sa.Column(
        'is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False))

    # --- upazilas / mouzas soft flags --------------------------------------
    op.add_column('upazilas', sa.Column(
        'is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False))
    op.add_column('mouzas', sa.Column(
        'is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False))


def downgrade() -> None:
    op.drop_column('mouzas', 'is_active')
    op.drop_column('upazilas', 'is_active')

    op.drop_column('districts', 'is_active')
    op.drop_index('ix_districts_division_id', table_name='districts')
    op.drop_constraint('fk_districts_division_id', 'districts', type_='foreignkey')
    op.drop_column('districts', 'division_id')

    op.drop_index('ix_divisions_code', table_name='divisions')
    op.drop_index('ix_divisions_name_bn', table_name='divisions')
    op.drop_index('ix_divisions_name_en', table_name='divisions')
    op.drop_index('ix_divisions_id', table_name='divisions')
    op.drop_table('divisions')
