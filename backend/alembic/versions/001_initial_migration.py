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
    # Crear enums
    op.execute("CREATE TYPE estadopaciente AS ENUM ('activo', 'inactivo', 'nuevo')")
    op.execute("CREATE TYPE rolusuario AS ENUM ('administradora', 'paciente')")
    op.execute("CREATE TYPE estadosesion AS ENUM ('programada', 'confirmada', 'en_curso', 'completada', 'cancelada', 'no_asistio')")
    op.execute("CREATE TYPE tipomovimiento AS ENUM ('entrada', 'salida', 'ajuste')")
    op.execute("CREATE TYPE metodopago AS ENUM ('efectivo', 'transferencia', 'debito', 'credito', 'mercadopago')")
    op.execute("CREATE TYPE categoriaegreso AS ENUM ('materiales', 'servicios', 'alquiler', 'sueldos', 'impuestos', 'marketing', 'mantenimiento', 'otros')")
    op.execute("CREATE TYPE metodopagoegreso AS ENUM ('efectivo', 'transferencia', 'debito', 'credito', 'mercadopago')")
    op.execute("CREATE TYPE tipofoto AS ENUM ('antes', 'despues', 'evolucion')")

    # Tabla pacientes
    op.create_table(
        'pacientes',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('nombre', sa.String(100), nullable=False),
        sa.Column('apellido', sa.String(100), nullable=False),
        sa.Column('dni', sa.String(20), unique=True, nullable=True, index=True),
        sa.Column('fecha_nacimiento', sa.Date(), nullable=True),
        sa.Column('telefono', sa.String(30), nullable=True),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('direccion', sa.String(500), nullable=True),
        sa.Column('antecedentes', sa.Text(), nullable=True),
        sa.Column('alergias', sa.Text(), nullable=True),
        sa.Column('medicacion_actual', sa.Text(), nullable=True),
        sa.Column('notas_medicas', sa.Text(), nullable=True),
        sa.Column('estado', sa.Enum('activo', 'inactivo', 'nuevo', name='estadopaciente'), default='nuevo'),
        sa.Column('activo', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # Tabla usuarios
    op.create_table(
        'usuarios',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('email', sa.String(255), unique=True, nullable=False, index=True),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('nombre', sa.String(100), nullable=False),
        sa.Column('rol', sa.Enum('administradora', 'paciente', name='rolusuario'), nullable=False, default='paciente'),
        sa.Column('paciente_id', sa.Integer(), sa.ForeignKey('pacientes.id'), nullable=True),
        sa.Column('activo', sa.Boolean(), default=True),
        sa.Column('ultimo_acceso', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # Tabla tratamientos
    op.create_table(
        'tratamientos',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('nombre', sa.String(255), nullable=False, index=True),
        sa.Column('descripcion', sa.Text(), nullable=True),
        sa.Column('precio_lista', sa.Numeric(10, 2), nullable=True),
        sa.Column('duracion_minutos', sa.Integer(), nullable=True),
        sa.Column('zona_corporal', sa.String(100), nullable=True),
        sa.Column('sesiones_recomendadas', sa.Integer(), nullable=True),
        sa.Column('activo', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # Tabla materiales
    op.create_table(
        'materiales',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('nombre', sa.String(255), nullable=False, index=True),
        sa.Column('descripcion', sa.Text(), nullable=True),
        sa.Column('codigo', sa.String(50), unique=True, nullable=True, index=True),
        sa.Column('unidad_medida', sa.String(50), nullable=False, default='unidades'),
        sa.Column('stock_actual', sa.Numeric(10, 3), nullable=False, default=0),
        sa.Column('stock_minimo', sa.Numeric(10, 3), default=0),
        sa.Column('precio_costo', sa.Numeric(12, 2), nullable=True),
        sa.Column('proveedor', sa.String(255), nullable=True),
        sa.Column('activo', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # Tabla sesiones
    op.create_table(
        'sesiones',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('paciente_id', sa.Integer(), sa.ForeignKey('pacientes.id'), nullable=False, index=True),
        sa.Column('tratamiento_id', sa.Integer(), sa.ForeignKey('tratamientos.id'), nullable=False),
        sa.Column('fecha', sa.Date(), nullable=False, index=True),
        sa.Column('hora_inicio', sa.Time(), nullable=True),
        sa.Column('hora_fin', sa.Time(), nullable=True),
        sa.Column('estado', sa.Enum('programada', 'confirmada', 'en_curso', 'completada', 'cancelada', 'no_asistio', name='estadosesion'), default='programada'),
        sa.Column('precio_cobrado', sa.Numeric(12, 2), nullable=True),
        sa.Column('descuento_aplicado', sa.Numeric(5, 2), default=0),
        sa.Column('notas', sa.Text(), nullable=True),
        sa.Column('notas_internas', sa.Text(), nullable=True),
        sa.Column('created_by', sa.Integer(), sa.ForeignKey('usuarios.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # Tabla sesiones_materiales (relación many-to-many)
    op.create_table(
        'sesiones_materiales',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('sesion_id', sa.Integer(), sa.ForeignKey('sesiones.id'), nullable=False),
        sa.Column('material_id', sa.Integer(), sa.ForeignKey('materiales.id'), nullable=False),
        sa.Column('cantidad', sa.Numeric(10, 3), nullable=False),
        sa.Column('costo_unitario', sa.Numeric(12, 2), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )

    # Tabla movimientos_stock
    op.create_table(
        'movimientos_stock',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('material_id', sa.Integer(), sa.ForeignKey('materiales.id'), nullable=False, index=True),
        sa.Column('tipo', sa.Enum('entrada', 'salida', 'ajuste', name='tipomovimiento'), nullable=False),
        sa.Column('cantidad', sa.Numeric(10, 3), nullable=False),
        sa.Column('stock_anterior', sa.Numeric(10, 3), nullable=False),
        sa.Column('stock_nuevo', sa.Numeric(10, 3), nullable=False),
        sa.Column('referencia_tipo', sa.String(50), nullable=True),
        sa.Column('referencia_id', sa.Integer(), nullable=True),
        sa.Column('observaciones', sa.Text(), nullable=True),
        sa.Column('created_by', sa.Integer(), sa.ForeignKey('usuarios.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )

    # Tabla fotos
    op.create_table(
        'fotos',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('paciente_id', sa.Integer(), sa.ForeignKey('pacientes.id'), nullable=False, index=True),
        sa.Column('sesion_id', sa.Integer(), sa.ForeignKey('sesiones.id'), nullable=True),
        sa.Column('url', sa.String(500), nullable=False),
        sa.Column('public_id', sa.String(255), nullable=True),
        sa.Column('tipo', sa.Enum('antes', 'despues', 'evolucion', name='tipofoto'), default='evolucion'),
        sa.Column('zona', sa.String(100), nullable=True),
        sa.Column('fecha', sa.Date(), nullable=True),
        sa.Column('visible_paciente', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )

    # Tabla pagos
    op.create_table(
        'pagos',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('paciente_id', sa.Integer(), sa.ForeignKey('pacientes.id'), nullable=False, index=True),
        sa.Column('sesion_id', sa.Integer(), sa.ForeignKey('sesiones.id'), nullable=True),
        sa.Column('monto', sa.Numeric(12, 2), nullable=False),
        sa.Column('metodo_pago', sa.Enum('efectivo', 'transferencia', 'debito', 'credito', 'mercadopago', name='metodopago'), nullable=False, default='efectivo'),
        sa.Column('fecha', sa.Date(), nullable=False, index=True),
        sa.Column('concepto', sa.String(500), nullable=True),
        sa.Column('notas', sa.Text(), nullable=True),
        sa.Column('numero_recibo', sa.String(50), nullable=True),
        sa.Column('created_by', sa.Integer(), sa.ForeignKey('usuarios.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # Tabla egresos
    op.create_table(
        'egresos',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('concepto', sa.String(500), nullable=False),
        sa.Column('monto', sa.Numeric(12, 2), nullable=False),
        sa.Column('categoria', sa.Enum('materiales', 'servicios', 'alquiler', 'sueldos', 'impuestos', 'marketing', 'mantenimiento', 'otros', name='categoriaegreso'), default='otros'),
        sa.Column('metodo_pago', sa.Enum('efectivo', 'transferencia', 'debito', 'credito', 'mercadopago', name='metodopagoegreso'), default='efectivo'),
        sa.Column('fecha', sa.Date(), nullable=False, index=True),
        sa.Column('proveedor', sa.String(255), nullable=True),
        sa.Column('numero_factura', sa.String(100), nullable=True),
        sa.Column('notas', sa.Text(), nullable=True),
        sa.Column('created_by', sa.Integer(), sa.ForeignKey('usuarios.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )


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
