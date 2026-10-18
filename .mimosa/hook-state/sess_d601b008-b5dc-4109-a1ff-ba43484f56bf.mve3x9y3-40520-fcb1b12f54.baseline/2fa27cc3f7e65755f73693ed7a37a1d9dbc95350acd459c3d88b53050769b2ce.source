"""add legal_updates, chouhaddi, inheritance fields and admin jurisdiction

Revision ID: a1b2c3d4e5f6
Revises: f5cf0029c5b5
Create Date: 2026-10-18 01:00:00.000000

Adds the minimum schema required for the requested feature upgrades:
- legal_updates            : admin-managed bilingual land/registration updates
- users.assigned_upazila_id: jurisdiction-aware admin assignment
- land_parcels.chouhaddi_* : four-side boundary labels (synthetic demo data)
- ownership_records.*      : inheritance/heirship review (ownership consistency)

No existing column or table is modified.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'f5cf0029c5b5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- jurisdiction-aware admin -----------------------------------------
    op.add_column('users', sa.Column('assigned_upazila_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_users_assigned_upazila_id', 'users', 'upazilas',
        ['assigned_upazila_id'], ['id'], ondelete='SET NULL')
    op.create_index('ix_users_assigned_upazila_id', 'users', ['assigned_upazila_id'])

    # --- Chouhaddi / four-side boundaries ---------------------------------
    op.add_column('land_parcels', sa.Column('chouhaddi_north', sa.String(length=255), nullable=True))
    op.add_column('land_parcels', sa.Column('chouhaddi_south', sa.String(length=255), nullable=True))
    op.add_column('land_parcels', sa.Column('chouhaddi_east', sa.String(length=255), nullable=True))
    op.add_column('land_parcels', sa.Column('chouhaddi_west', sa.String(length=255), nullable=True))
    op.add_column('land_parcels', sa.Column('chouhaddi_source', sa.String(length=50), nullable=True))

    # --- inheritance / heirship review ------------------------------------
    op.add_column('ownership_records', sa.Column('succession_record_available', sa.Boolean(), nullable=True))
    op.add_column('ownership_records', sa.Column('declared_heir_count', sa.Integer(), nullable=True))
    op.add_column('ownership_records', sa.Column('recorded_inherited_share', sa.Numeric(12, 4), nullable=True))
    op.add_column('ownership_records', sa.Column('succession_status', sa.String(length=50), nullable=True))
    op.add_column('ownership_records', sa.Column('supporting_record_reference', sa.String(length=150), nullable=True))

    # --- legal / registration updates -------------------------------------
    op.create_table(
        'legal_updates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title_en', sa.String(length=300), nullable=False),
        sa.Column('title_bn', sa.String(length=300), nullable=True),
        sa.Column('summary_en', sa.Text(), nullable=False),
        sa.Column('summary_bn', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('publication_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('effective_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('official_source_name', sa.String(length=255), nullable=True),
        sa.Column('official_source_url', sa.String(length=500), nullable=True),
        sa.Column('language', sa.String(length=5), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('upazila_id', sa.Integer(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['upazila_id'], ['upazilas.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_legal_updates_id', 'legal_updates', ['id'])
    op.create_index('ix_legal_updates_category', 'legal_updates', ['category'])
    op.create_index('ix_legal_updates_status', 'legal_updates', ['status'])
    op.create_index('ix_legal_updates_upazila_id', 'legal_updates', ['upazila_id'])


def downgrade() -> None:
    op.drop_index('ix_legal_updates_upazila_id', table_name='legal_updates')
    op.drop_index('ix_legal_updates_status', table_name='legal_updates')
    op.drop_index('ix_legal_updates_category', table_name='legal_updates')
    op.drop_index('ix_legal_updates_id', table_name='legal_updates')
    op.drop_table('legal_updates')

    op.drop_column('ownership_records', 'supporting_record_reference')
    op.drop_column('ownership_records', 'succession_status')
    op.drop_column('ownership_records', 'recorded_inherited_share')
    op.drop_column('ownership_records', 'declared_heir_count')
    op.drop_column('ownership_records', 'succession_record_available')

    op.drop_column('land_parcels', 'chouhaddi_source')
    op.drop_column('land_parcels', 'chouhaddi_west')
    op.drop_column('land_parcels', 'chouhaddi_east')
    op.drop_column('land_parcels', 'chouhaddi_south')
    op.drop_column('land_parcels', 'chouhaddi_north')

    op.drop_index('ix_users_assigned_upazila_id', table_name='users')
    op.drop_constraint('fk_users_assigned_upazila_id', 'users', type_='foreignkey')
    op.drop_column('users', 'assigned_upazila_id')
