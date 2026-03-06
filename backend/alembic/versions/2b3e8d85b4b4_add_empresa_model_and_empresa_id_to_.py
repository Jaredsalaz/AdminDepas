"""Add empresa model and empresa_id to usuario edificio inquilino

Revision ID: 2b3e8d85b4b4
Revises: 84b0076628c0
Create Date: 2026-03-05 12:28:40.413862

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2b3e8d85b4b4'
down_revision: Union[str, Sequence[str], None] = '84b0076628c0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Crear tabla empresas
    op.create_table('empresas',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nombre', sa.String(), nullable=False),
        sa.Column('rfc', sa.String(), nullable=True),
        sa.Column('direccion', sa.String(), nullable=True),
        sa.Column('telefono', sa.String(), nullable=True),
        sa.Column('correo', sa.String(), nullable=True),
        sa.Column('logo_url', sa.String(), nullable=True),
        sa.Column('activa', sa.Boolean(), nullable=True),
        sa.Column('fecha_creacion', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_empresas_id'), 'empresas', ['id'], unique=False)
    op.create_index(op.f('ix_empresas_rfc'), 'empresas', ['rfc'], unique=True)

    # 2. Insertar empresa default "Famesto" con id=1
    op.execute("INSERT INTO empresas (id, nombre, activa) VALUES (1, 'Famesto', true)")

    # 3. Agregar empresa_id a edificios (nullable primero, luego rellenar, luego NOT NULL)
    op.add_column('edificios', sa.Column('empresa_id', sa.Integer(), nullable=True))
    op.execute("UPDATE edificios SET empresa_id = 1")
    op.alter_column('edificios', 'empresa_id', nullable=False)
    op.create_foreign_key('fk_edificios_empresa', 'edificios', 'empresas', ['empresa_id'], ['id'])

    # 4. Agregar empresa_id a inquilinos (mismo proceso)
    op.add_column('inquilinos', sa.Column('empresa_id', sa.Integer(), nullable=True))
    op.execute("UPDATE inquilinos SET empresa_id = 1")
    op.alter_column('inquilinos', 'empresa_id', nullable=False)
    op.create_foreign_key('fk_inquilinos_empresa', 'inquilinos', 'empresas', ['empresa_id'], ['id'])

    # 5. Agregar empresa_id a usuarios (nullable - NULL = SuperAdmin)
    op.add_column('usuarios', sa.Column('empresa_id', sa.Integer(), nullable=True))
    op.execute("UPDATE usuarios SET empresa_id = 1")
    op.create_foreign_key('fk_usuarios_empresa', 'usuarios', 'empresas', ['empresa_id'], ['id'])


def downgrade() -> None:
    op.drop_constraint('fk_usuarios_empresa', 'usuarios', type_='foreignkey')
    op.drop_column('usuarios', 'empresa_id')
    op.drop_constraint('fk_inquilinos_empresa', 'inquilinos', type_='foreignkey')
    op.drop_column('inquilinos', 'empresa_id')
    op.drop_constraint('fk_edificios_empresa', 'edificios', type_='foreignkey')
    op.drop_column('edificios', 'empresa_id')
    op.drop_index(op.f('ix_empresas_rfc'), table_name='empresas')
    op.drop_index(op.f('ix_empresas_id'), table_name='empresas')
    op.drop_table('empresas')
