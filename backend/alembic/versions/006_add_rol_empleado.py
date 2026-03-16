"""Add empleado role to usuarios

Revision ID: 006
Revises: 005
Create Date: 2025-03-16

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '006'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Agregar el valor 'empleado' al enum rolusuario
    # PostgreSQL permite agregar valores a un enum existente
    op.execute("ALTER TYPE rolusuario ADD VALUE IF NOT EXISTS 'empleado'")


def downgrade() -> None:
    # PostgreSQL no permite eliminar valores de un enum directamente
    # Se necesitaría recrear el enum, lo cual es complejo y riesgoso
    # Por ahora, solo documentamos que el downgrade no elimina el valor
    pass
