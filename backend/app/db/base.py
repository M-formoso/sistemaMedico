"""
Importar todos los modelos aquí para que Alembic los detecte.
"""
from app.db.session import Base

# Importar todos los modelos
from app.models.usuario import Usuario
from app.models.paciente import Paciente
from app.models.tratamiento import Tratamiento
from app.models.sesion import Sesion, SesionMaterial
from app.models.foto import Foto
from app.models.material import Material
from app.models.movimiento_stock import MovimientoStock
from app.models.pago import Pago
from app.models.egreso import Egreso
from app.models.profesional import Profesional
from app.models.configuracion import Configuracion, HorarioAtencion, ListaEspera
