from datetime import datetime
from enum import Enum as PyEnum
from decimal import Decimal

from sqlalchemy import Column, Integer, String, DateTime, Text, Numeric, ForeignKey, Enum
from sqlalchemy.orm import relationship

from app.db.base import Base


class TipoMovimiento(str, PyEnum):
    ENTRADA = "entrada"
    SALIDA = "salida"
    AJUSTE = "ajuste"


class MovimientoStock(Base):
    """
    Registro de movimientos de stock (entradas, salidas, ajustes).
    """
    __tablename__ = "movimientos_stock"

    id = Column(Integer, primary_key=True, index=True)

    material_id = Column(Integer, ForeignKey("materiales.id"), nullable=False, index=True)

    tipo = Column(Enum(TipoMovimiento), nullable=False)
    cantidad = Column(Numeric(10, 3), nullable=False)
    stock_anterior = Column(Numeric(10, 3), nullable=False)
    stock_nuevo = Column(Numeric(10, 3), nullable=False)

    # Referencia al origen del movimiento
    referencia_tipo = Column(String(50), nullable=True)  # 'sesion', 'compra', 'ajuste_manual'
    referencia_id = Column(Integer, nullable=True)

    observaciones = Column(Text, nullable=True)

    created_by = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relaciones
    material = relationship("Material", back_populates="movimientos")

    def __repr__(self):
        return f"<MovimientoStock {self.tipo} - {self.cantidad}>"
