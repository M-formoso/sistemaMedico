from datetime import datetime
from enum import Enum as PyEnum
from decimal import Decimal

from sqlalchemy import Column, Integer, String, DateTime, Date, Text, Numeric, ForeignKey, Enum
from sqlalchemy.orm import relationship

from app.db.session import Base


class MetodoPago(str, PyEnum):
    EFECTIVO = "efectivo"
    TRANSFERENCIA = "transferencia"
    DEBITO = "debito"
    CREDITO = "credito"
    MERCADOPAGO = "mercadopago"


class Pago(Base):
    """
    Registro de pagos de pacientes (ingresos).
    """
    __tablename__ = "pagos"

    id = Column(Integer, primary_key=True, index=True)

    paciente_id = Column(Integer, ForeignKey("pacientes.id"), nullable=False, index=True)
    sesion_id = Column(Integer, ForeignKey("sesiones.id"), nullable=True)

    monto = Column(Numeric(12, 2), nullable=False)
    metodo_pago = Column(Enum(MetodoPago), nullable=False, default=MetodoPago.EFECTIVO)
    fecha = Column(Date, nullable=False, index=True)

    concepto = Column(String(500), nullable=True)
    notas = Column(Text, nullable=True)
    numero_recibo = Column(String(50), nullable=True)

    created_by = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    paciente = relationship("Paciente", back_populates="pagos")
    sesion = relationship("Sesion", back_populates="pagos")

    def __repr__(self):
        return f"<Pago {self.monto} - {self.fecha}>"
