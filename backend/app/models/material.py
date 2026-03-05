from datetime import datetime
from decimal import Decimal

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Numeric, Text
from sqlalchemy.orm import relationship

from app.db.base import Base


class Material(Base):
    """
    Inventario de materiales e insumos del consultorio.
    Ej: Botox, Ácido Hialurónico, jeringas, etc.
    """
    __tablename__ = "materiales"

    id = Column(Integer, primary_key=True, index=True)

    nombre = Column(String(255), nullable=False, index=True)
    descripcion = Column(Text, nullable=True)
    codigo = Column(String(50), unique=True, nullable=True, index=True)
    unidad_medida = Column(String(50), nullable=False, default="unidades")

    # Stock
    stock_actual = Column(Numeric(10, 3), nullable=False, default=0)
    stock_minimo = Column(Numeric(10, 3), default=0)

    # Costos
    precio_costo = Column(Numeric(12, 2), nullable=True)

    # Proveedor
    proveedor = Column(String(255), nullable=True)

    activo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    movimientos = relationship("MovimientoStock", back_populates="material")
    sesiones_materiales = relationship("SesionMaterial", back_populates="material")

    def __repr__(self):
        return f"<Material {self.nombre} (Stock: {self.stock_actual})>"

    @property
    def stock_bajo(self) -> bool:
        """Indica si el stock está por debajo del mínimo."""
        if self.stock_minimo:
            return float(self.stock_actual) <= float(self.stock_minimo)
        return False

    @property
    def valor_stock(self) -> Decimal:
        """Valor total del stock (stock × precio_costo)."""
        if self.precio_costo:
            return Decimal(str(self.stock_actual)) * self.precio_costo
        return Decimal("0")
