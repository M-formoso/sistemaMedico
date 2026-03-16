"""Add tratamientos_pacientes table and permisos_modulos field

Revision ID: 005
Revises: 004
Create Date: 2025-03-12

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Crear tabla tratamientos_pacientes
    op.create_table(
        'tratamientos_pacientes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('paciente_id', sa.Integer(), nullable=False),
        sa.Column('tratamiento_id', sa.Integer(), nullable=False),
        sa.Column('fecha_inicio', sa.Date(), nullable=True),
        sa.Column('fecha_fin_estimada', sa.Date(), nullable=True),
        sa.Column('sesiones_planificadas', sa.Integer(), default=1),
        sa.Column('sesiones_realizadas', sa.Integer(), default=0),
        sa.Column('estado', sa.Enum('activo', 'en_curso', 'completado', 'pausado', 'cancelado', name='estadotratamientopaciente'), nullable=True),
        sa.Column('precio_acordado', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('descuento_porcentaje', sa.Numeric(precision=5, scale=2), default=0),
        sa.Column('notas', sa.Text(), nullable=True),
        sa.Column('zona_especifica', sa.String(length=255), nullable=True),
        sa.Column('color', sa.String(length=7), default='#6366f1'),
        sa.Column('activo', sa.Boolean(), default=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['paciente_id'], ['pacientes.id'], ),
        sa.ForeignKeyConstraint(['tratamiento_id'], ['tratamientos.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['usuarios.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tratamientos_pacientes_id'), 'tratamientos_pacientes', ['id'], unique=False)
    op.create_index(op.f('ix_tratamientos_pacientes_paciente_id'), 'tratamientos_pacientes', ['paciente_id'], unique=False)
    op.create_index(op.f('ix_tratamientos_pacientes_tratamiento_id'), 'tratamientos_pacientes', ['tratamiento_id'], unique=False)

    # Agregar campo permisos_modulos a usuarios
    op.add_column('usuarios', sa.Column('permisos_modulos', sa.JSON(), nullable=True))


def downgrade() -> None:
    # Eliminar campo permisos_modulos de usuarios
    op.drop_column('usuarios', 'permisos_modulos')

    # Eliminar tabla tratamientos_pacientes
    op.drop_index(op.f('ix_tratamientos_pacientes_tratamiento_id'), table_name='tratamientos_pacientes')
    op.drop_index(op.f('ix_tratamientos_pacientes_paciente_id'), table_name='tratamientos_pacientes')
    op.drop_index(op.f('ix_tratamientos_pacientes_id'), table_name='tratamientos_pacientes')
    op.drop_table('tratamientos_pacientes')

    # Eliminar enum
    op.execute('DROP TYPE IF EXISTS estadotratamientopaciente')
