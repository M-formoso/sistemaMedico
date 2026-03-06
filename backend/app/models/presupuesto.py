from datetime import datetime
from enum import Enum as PyEnum
from decimal import Decimal

from sqlalchemy import Column, Integer, String, DateTime, Date, Text, ForeignKey, Enum, Numeric, JSON
from sqlalchemy.orm import relationship

from app.db.session import Base


class EstadoPresupuesto(str, PyEnum):
    BORRADOR = "borrador"
    ENVIADO = "enviado"
    APROBADO = "aprobado"
    RECHAZADO = "rechazado"
    VENCIDO = "vencido"


class Presupuesto(Base):
    """
    Presupuestos para pacientes.
    Detalle de tratamientos/servicios con precios.
    """
    __tablename__ = "presupuestos"

    id = Column(Integer, primary_key=True, index=True)

    paciente_id = Column(Integer, ForeignKey("pacientes.id"), nullable=False, index=True)

    numero = Column(String(50), unique=True, nullable=False, index=True)
    fecha = Column(Date, nullable=False)
    valido_hasta = Column(Date, nullable=True)

    # Items del presupuesto (JSON array)
    # [{"descripcion": "Botox", "cantidad": 1, "precio_unitario": 50000, "subtotal": 50000}, ...]
    items = Column(JSON, nullable=False, default=list)

    subtotal = Column(Numeric(12, 2), nullable=False, default=0)
    descuento_porcentaje = Column(Numeric(5, 2), default=0)
    descuento_monto = Column(Numeric(12, 2), default=0)
    total = Column(Numeric(12, 2), nullable=False, default=0)

    notas = Column(Text, nullable=True)
    condiciones = Column(Text, nullable=True)

    estado = Column(Enum(EstadoPresupuesto), default=EstadoPresupuesto.BORRADOR)

    # Fecha de aprobación/rechazo
    fecha_respuesta = Column(Date, nullable=True)

    created_by = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    paciente = relationship("Paciente", back_populates="presupuestos")

    def __repr__(self):
        return f"<Presupuesto {self.numero} - {self.estado}>"
