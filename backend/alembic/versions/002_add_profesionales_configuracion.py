"""Add profesionales, configuracion and lista_espera tables

Revision ID: 002
Revises: 001
Create Date: 2025-03-06 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Tabla profesionales
    op.execute("""
        CREATE TABLE IF NOT EXISTS profesionales (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            apellido VARCHAR(100) NOT NULL,
            especialidad VARCHAR(100),
            matricula VARCHAR(50) UNIQUE,
            telefono VARCHAR(30),
            email VARCHAR(255),
            direccion VARCHAR(500),
            duracion_turno_default INTEGER DEFAULT 30,
            color_agenda VARCHAR(7) DEFAULT '#E91E63',
            porcentaje_comision NUMERIC(5, 2) DEFAULT 0,
            notas TEXT,
            activo BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)

    # Tabla configuraciones
    op.execute("""
        CREATE TABLE IF NOT EXISTS configuraciones (
            id SERIAL PRIMARY KEY,
            clave VARCHAR(100) UNIQUE NOT NULL,
            valor TEXT,
            descripcion VARCHAR(500),
            tipo VARCHAR(50) DEFAULT 'string',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)

    # Tabla horarios_atencion
    op.execute("""
        CREATE TABLE IF NOT EXISTS horarios_atencion (
            id SERIAL PRIMARY KEY,
            dia_semana INTEGER NOT NULL,
            hora_inicio TIME NOT NULL,
            hora_fin TIME NOT NULL,
            activo BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)

    # Tabla lista_espera
    op.execute("""
        CREATE TABLE IF NOT EXISTS lista_espera (
            id SERIAL PRIMARY KEY,
            paciente_id INTEGER NOT NULL,
            tratamiento_id INTEGER,
            profesional_id INTEGER,
            fecha_preferida TIMESTAMP,
            notas TEXT,
            prioridad INTEGER DEFAULT 0,
            atendido BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)

    # Agregar columna profesional_id a sesiones si no existe
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_name='sesiones' AND column_name='profesional_id') THEN
                ALTER TABLE sesiones ADD COLUMN profesional_id INTEGER REFERENCES profesionales(id);
            END IF;
        END $$;
    """)

    # Crear índices
    op.execute("CREATE INDEX IF NOT EXISTS ix_profesionales_matricula ON profesionales(matricula)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_configuraciones_clave ON configuraciones(clave)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_lista_espera_paciente_id ON lista_espera(paciente_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_sesiones_profesional_id ON sesiones(profesional_id)")


def downgrade() -> None:
    op.execute("ALTER TABLE sesiones DROP COLUMN IF EXISTS profesional_id")
    op.execute("DROP TABLE IF EXISTS lista_espera")
    op.execute("DROP TABLE IF EXISTS horarios_atencion")
    op.execute("DROP TABLE IF EXISTS configuraciones")
    op.execute("DROP TABLE IF EXISTS profesionales")
