"""Add historia clinica models

Revision ID: 003
Revises: 002
Create Date: 2024-03-06

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Crear tabla evoluciones
    op.create_table(
        'evoluciones',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('paciente_id', sa.Integer(), nullable=False),
        sa.Column('fecha', sa.Date(), nullable=False),
        sa.Column('titulo', sa.String(255), nullable=True),
        sa.Column('descripcion', sa.Text(), nullable=False),
        sa.Column('peso', sa.String(20), nullable=True),
        sa.Column('tension_arterial', sa.String(20), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['paciente_id'], ['pacientes.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['usuarios.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_evoluciones_paciente_id', 'evoluciones', ['paciente_id'])
    op.create_index('ix_evoluciones_fecha', 'evoluciones', ['fecha'])

    # Crear tabla estudios
    op.create_table(
        'estudios',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('paciente_id', sa.Integer(), nullable=False),
        sa.Column('nombre', sa.String(255), nullable=False),
        sa.Column('descripcion', sa.Text(), nullable=True),
        sa.Column('indicaciones', sa.Text(), nullable=True),
        sa.Column('fecha_solicitud', sa.Date(), nullable=False),
        sa.Column('fecha_realizacion', sa.Date(), nullable=True),
        sa.Column('estado', sa.String(20), nullable=True, default='pendiente'),
        sa.Column('archivo_url', sa.String(500), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['paciente_id'], ['pacientes.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['usuarios.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_estudios_paciente_id', 'estudios', ['paciente_id'])

    # Crear tabla baterias_estudios
    op.create_table(
        'baterias_estudios',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nombre', sa.String(255), nullable=False, unique=True),
        sa.Column('descripcion', sa.Text(), nullable=True),
        sa.Column('estudios_incluidos', sa.JSON(), nullable=False, default=[]),
        sa.Column('activo', sa.Boolean(), default=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['usuarios.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Crear tabla resultados
    op.create_table(
        'resultados',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('paciente_id', sa.Integer(), nullable=False),
        sa.Column('estudio_id', sa.Integer(), nullable=True),
        sa.Column('nombre', sa.String(255), nullable=False),
        sa.Column('descripcion', sa.Text(), nullable=True),
        sa.Column('fecha', sa.Date(), nullable=False),
        sa.Column('archivo_url', sa.String(500), nullable=True),
        sa.Column('tipo_archivo', sa.String(50), nullable=True),
        sa.Column('notas', sa.Text(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['paciente_id'], ['pacientes.id'], ),
        sa.ForeignKeyConstraint(['estudio_id'], ['estudios.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['usuarios.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_resultados_paciente_id', 'resultados', ['paciente_id'])

    # Crear tabla consentimientos
    op.create_table(
        'consentimientos',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('paciente_id', sa.Integer(), nullable=False),
        sa.Column('tratamiento_id', sa.Integer(), nullable=True),
        sa.Column('tipo', sa.String(50), nullable=True, default='tratamiento'),
        sa.Column('nombre', sa.String(255), nullable=False),
        sa.Column('descripcion', sa.Text(), nullable=True),
        sa.Column('archivo_url', sa.String(500), nullable=True),
        sa.Column('fecha_firma', sa.Date(), nullable=True),
        sa.Column('firmado', sa.Boolean(), default=False),
        sa.Column('fecha_vencimiento', sa.Date(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['paciente_id'], ['pacientes.id'], ),
        sa.ForeignKeyConstraint(['tratamiento_id'], ['tratamientos.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['usuarios.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_consentimientos_paciente_id', 'consentimientos', ['paciente_id'])

    # Crear tabla presupuestos
    op.create_table(
        'presupuestos',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('paciente_id', sa.Integer(), nullable=False),
        sa.Column('numero', sa.String(50), nullable=False, unique=True),
        sa.Column('fecha', sa.Date(), nullable=False),
        sa.Column('valido_hasta', sa.Date(), nullable=True),
        sa.Column('items', sa.JSON(), nullable=False, default=[]),
        sa.Column('subtotal', sa.Numeric(12, 2), nullable=False, default=0),
        sa.Column('descuento_porcentaje', sa.Numeric(5, 2), default=0),
        sa.Column('descuento_monto', sa.Numeric(12, 2), default=0),
        sa.Column('total', sa.Numeric(12, 2), nullable=False, default=0),
        sa.Column('notas', sa.Text(), nullable=True),
        sa.Column('condiciones', sa.Text(), nullable=True),
        sa.Column('estado', sa.String(20), nullable=True, default='borrador'),
        sa.Column('fecha_respuesta', sa.Date(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['paciente_id'], ['pacientes.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['usuarios.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_presupuestos_paciente_id', 'presupuestos', ['paciente_id'])
    op.create_index('ix_presupuestos_numero', 'presupuestos', ['numero'])

    # Crear tabla turnos_recurrentes
    op.create_table(
        'turnos_recurrentes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('paciente_id', sa.Integer(), nullable=False),
        sa.Column('tratamiento_id', sa.Integer(), nullable=True),
        sa.Column('profesional_id', sa.Integer(), nullable=True),
        sa.Column('dia_semana', sa.String(20), nullable=False),
        sa.Column('hora', sa.Time(), nullable=False),
        sa.Column('duracion_minutos', sa.Integer(), default=30),
        sa.Column('frecuencia', sa.String(20), default='semanal'),
        sa.Column('fecha_inicio', sa.Date(), nullable=False),
        sa.Column('fecha_fin', sa.Date(), nullable=True),
        sa.Column('activo', sa.Boolean(), default=True),
        sa.Column('notas', sa.String(500), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['paciente_id'], ['pacientes.id'], ),
        sa.ForeignKeyConstraint(['tratamiento_id'], ['tratamientos.id'], ),
        sa.ForeignKeyConstraint(['profesional_id'], ['profesionales.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['usuarios.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_turnos_recurrentes_paciente_id', 'turnos_recurrentes', ['paciente_id'])

    # Agregar columnas a sesiones para integraciones
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_name='sesiones' AND column_name='duracion_minutos') THEN
                ALTER TABLE sesiones ADD COLUMN duracion_minutos INTEGER DEFAULT 30;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_name='sesiones' AND column_name='google_calendar_event_id') THEN
                ALTER TABLE sesiones ADD COLUMN google_calendar_event_id VARCHAR(255);
            END IF;
        END $$;
    """)


def downgrade() -> None:
    op.drop_table('turnos_recurrentes')
    op.drop_table('presupuestos')
    op.drop_table('consentimientos')
    op.drop_table('resultados')
    op.drop_table('baterias_estudios')
    op.drop_table('estudios')
    op.drop_table('evoluciones')
