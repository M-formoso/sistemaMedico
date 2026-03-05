"""Initial migration - Create all tables

Revision ID: 001
Revises:
Create Date: 2025-03-05 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Crear enums (con IF NOT EXISTS para evitar errores si ya existen)
    op.execute("DO $$ BEGIN CREATE TYPE estadopaciente AS ENUM ('activo', 'inactivo', 'nuevo'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE rolusuario AS ENUM ('administradora', 'paciente'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE estadosesion AS ENUM ('programada', 'confirmada', 'en_curso', 'completada', 'cancelada', 'no_asistio'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE tipomovimiento AS ENUM ('entrada', 'salida', 'ajuste'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE metodopago AS ENUM ('efectivo', 'transferencia', 'debito', 'credito', 'mercadopago'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE categoriaegreso AS ENUM ('materiales', 'servicios', 'alquiler', 'sueldos', 'impuestos', 'marketing', 'mantenimiento', 'otros'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE metodopagoegreso AS ENUM ('efectivo', 'transferencia', 'debito', 'credito', 'mercadopago'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE tipofoto AS ENUM ('antes', 'despues', 'evolucion'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;")

    # Tabla pacientes
    op.execute("""
        CREATE TABLE IF NOT EXISTS pacientes (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            apellido VARCHAR(100) NOT NULL,
            dni VARCHAR(20) UNIQUE,
            fecha_nacimiento DATE,
            telefono VARCHAR(30),
            email VARCHAR(255),
            direccion VARCHAR(500),
            antecedentes TEXT,
            alergias TEXT,
            medicacion_actual TEXT,
            notas_medicas TEXT,
            estado estadopaciente DEFAULT 'nuevo',
            activo BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)

    # Tabla usuarios
    op.execute("""
        CREATE TABLE IF NOT EXISTS usuarios (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            nombre VARCHAR(100) NOT NULL,
            rol rolusuario NOT NULL DEFAULT 'paciente',
            paciente_id INTEGER REFERENCES pacientes(id),
            activo BOOLEAN DEFAULT TRUE,
            ultimo_acceso TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)

    # Tabla tratamientos
    op.execute("""
        CREATE TABLE IF NOT EXISTS tratamientos (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(255) NOT NULL,
            descripcion TEXT,
            precio_lista NUMERIC(10, 2),
            duracion_minutos INTEGER,
            zona_corporal VARCHAR(100),
            sesiones_recomendadas INTEGER,
            activo BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)

    # Tabla materiales
    op.execute("""
        CREATE TABLE IF NOT EXISTS materiales (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(255) NOT NULL,
            descripcion TEXT,
            codigo VARCHAR(50) UNIQUE,
            unidad_medida VARCHAR(50) NOT NULL DEFAULT 'unidades',
            stock_actual NUMERIC(10, 3) NOT NULL DEFAULT 0,
            stock_minimo NUMERIC(10, 3) DEFAULT 0,
            precio_costo NUMERIC(12, 2),
            proveedor VARCHAR(255),
            activo BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)

    # Tabla sesiones
    op.execute("""
        CREATE TABLE IF NOT EXISTS sesiones (
            id SERIAL PRIMARY KEY,
            paciente_id INTEGER NOT NULL REFERENCES pacientes(id),
            tratamiento_id INTEGER NOT NULL REFERENCES tratamientos(id),
            fecha DATE NOT NULL,
            hora_inicio TIME,
            hora_fin TIME,
            estado estadosesion DEFAULT 'programada',
            precio_cobrado NUMERIC(12, 2),
            descuento_aplicado NUMERIC(5, 2) DEFAULT 0,
            notas TEXT,
            notas_internas TEXT,
            created_by INTEGER REFERENCES usuarios(id),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)

    # Tabla sesiones_materiales (relación many-to-many)
    op.execute("""
        CREATE TABLE IF NOT EXISTS sesiones_materiales (
            id SERIAL PRIMARY KEY,
            sesion_id INTEGER NOT NULL REFERENCES sesiones(id),
            material_id INTEGER NOT NULL REFERENCES materiales(id),
            cantidad NUMERIC(10, 3) NOT NULL,
            costo_unitario NUMERIC(12, 2),
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)

    # Tabla movimientos_stock
    op.execute("""
        CREATE TABLE IF NOT EXISTS movimientos_stock (
            id SERIAL PRIMARY KEY,
            material_id INTEGER NOT NULL REFERENCES materiales(id),
            tipo tipomovimiento NOT NULL,
            cantidad NUMERIC(10, 3) NOT NULL,
            stock_anterior NUMERIC(10, 3) NOT NULL,
            stock_nuevo NUMERIC(10, 3) NOT NULL,
            referencia_tipo VARCHAR(50),
            referencia_id INTEGER,
            observaciones TEXT,
            created_by INTEGER REFERENCES usuarios(id),
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)

    # Tabla fotos
    op.execute("""
        CREATE TABLE IF NOT EXISTS fotos (
            id SERIAL PRIMARY KEY,
            paciente_id INTEGER NOT NULL REFERENCES pacientes(id),
            sesion_id INTEGER REFERENCES sesiones(id),
            url VARCHAR(500) NOT NULL,
            public_id VARCHAR(255),
            tipo tipofoto DEFAULT 'evolucion',
            zona VARCHAR(100),
            fecha DATE,
            visible_paciente BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)

    # Tabla pagos
    op.execute("""
        CREATE TABLE IF NOT EXISTS pagos (
            id SERIAL PRIMARY KEY,
            paciente_id INTEGER NOT NULL REFERENCES pacientes(id),
            sesion_id INTEGER REFERENCES sesiones(id),
            monto NUMERIC(12, 2) NOT NULL,
            metodo_pago metodopago NOT NULL DEFAULT 'efectivo',
            fecha DATE NOT NULL,
            concepto VARCHAR(500),
            notas TEXT,
            numero_recibo VARCHAR(50),
            created_by INTEGER REFERENCES usuarios(id),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)

    # Tabla egresos
    op.execute("""
        CREATE TABLE IF NOT EXISTS egresos (
            id SERIAL PRIMARY KEY,
            concepto VARCHAR(500) NOT NULL,
            monto NUMERIC(12, 2) NOT NULL,
            categoria categoriaegreso DEFAULT 'otros',
            metodo_pago metodopagoegreso DEFAULT 'efectivo',
            fecha DATE NOT NULL,
            proveedor VARCHAR(255),
            numero_factura VARCHAR(100),
            notas TEXT,
            created_by INTEGER REFERENCES usuarios(id),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)

    # Crear índices si no existen
    op.execute("CREATE INDEX IF NOT EXISTS ix_pacientes_dni ON pacientes(dni)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_usuarios_email ON usuarios(email)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_tratamientos_nombre ON tratamientos(nombre)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_materiales_nombre ON materiales(nombre)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_materiales_codigo ON materiales(codigo)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_sesiones_paciente_id ON sesiones(paciente_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_sesiones_fecha ON sesiones(fecha)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_pagos_paciente_id ON pagos(paciente_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_pagos_fecha ON pagos(fecha)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_egresos_fecha ON egresos(fecha)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_fotos_paciente_id ON fotos(paciente_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_movimientos_stock_material_id ON movimientos_stock(material_id)")


def downgrade() -> None:
    # Eliminar tablas en orden inverso
    op.drop_table('egresos')
    op.drop_table('pagos')
    op.drop_table('fotos')
    op.drop_table('movimientos_stock')
    op.drop_table('sesiones_materiales')
    op.drop_table('sesiones')
    op.drop_table('materiales')
    op.drop_table('tratamientos')
    op.drop_table('usuarios')
    op.drop_table('pacientes')

    # Eliminar enums
    op.execute("DROP TYPE IF EXISTS tipofoto")
    op.execute("DROP TYPE IF EXISTS metodopagoegreso")
    op.execute("DROP TYPE IF EXISTS categoriaegreso")
    op.execute("DROP TYPE IF EXISTS metodopago")
    op.execute("DROP TYPE IF EXISTS tipomovimiento")
    op.execute("DROP TYPE IF EXISTS estadosesion")
    op.execute("DROP TYPE IF EXISTS rolusuario")
    op.execute("DROP TYPE IF EXISTS estadopaciente")
