from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Column, Integer, String, DateTime, Date, Text, Numeric, ForeignKey, Enum

from app.db.session import Base


class CategoriaEgreso(str, PyEnum):
    MATERIALES = "materiales"
    SERVICIOS = "servicios"
    ALQUILER = "alquiler"
    SUELDOS = "sueldos"
    IMPUESTOS = "impuestos"
    MARKETING = "marketing"
    MANTENIMIENTO = "mantenimiento"
    OTROS = "otros"


class MetodoPagoEgreso(str, PyEnum):
    EFECTIVO = "efectivo"
    TRANSFERENCIA = "transferencia"
    DEBITO = "debito"
    CREDITO = "credito"
    MERCADOPAGO = "mercadopago"


class Egreso(Base):
    """
    Registro de egresos del consultorio (gastos).
    Ej: materiales, alquiler, servicios, honorarios, etc.
    """
    __tablename__ = "egresos"

    id = Column(Integer, primary_key=True, index=True)

    concepto = Column(String(500), nullable=False)
    monto = Column(Numeric(12, 2), nullable=False)
    categoria = Column(Enum(CategoriaEgreso), default=CategoriaEgreso.OTROS)
    metodo_pago = Column(Enum(MetodoPagoEgreso), default=MetodoPagoEgreso.EFECTIVO)
    fecha = Column(Date, nullable=False, index=True)

    proveedor = Column(String(255), nullable=True)
    numero_factura = Column(String(100), nullable=True)
    notas = Column(Text, nullable=True)

    created_by = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Egreso {self.categoria} - {self.monto}>"
