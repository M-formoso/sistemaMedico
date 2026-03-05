from datetime import datetime
from typing import Optional
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel


class TipoMovimiento(str, Enum):
    ENTRADA = "entrada"
    SALIDA = "salida"
    AJUSTE = "ajuste"


class MaterialBase(BaseModel):
    """Campos comunes de material."""
    nombre: str
    descripcion: Optional[str] = None
    codigo: Optional[str] = None
    unidad_medida: str = "unidades"
    stock_minimo: Decimal = Decimal("0")
    precio_costo: Optional[Decimal] = None
    proveedor: Optional[str] = None


class MaterialCreate(MaterialBase):
    """Datos para crear material."""
    stock_actual: Decimal = Decimal("0")


class MaterialUpdate(BaseModel):
    """Datos para actualizar material."""
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    codigo: Optional[str] = None
    unidad_medida: Optional[str] = None
    stock_minimo: Optional[Decimal] = None
    precio_costo: Optional[Decimal] = None
    proveedor: Optional[str] = None
    activo: Optional[bool] = None


class MaterialResponse(MaterialBase):
    """Respuesta con datos de material."""
    id: int
    stock_actual: Decimal
    activo: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

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


class MaterialBrief(BaseModel):
    """Resumen breve de material para listados."""
    id: int
    nombre: str
    codigo: Optional[str] = None
    stock_actual: Decimal
    unidad_medida: str
    precio_costo: Optional[Decimal] = None

    class Config:
        from_attributes = True


class MovimientoStockBase(BaseModel):
    """Campos comunes de movimiento de stock."""
    material_id: int
    tipo: TipoMovimiento
    cantidad: Decimal
    observaciones: Optional[str] = None


class MovimientoStockCreate(MovimientoStockBase):
    """Datos para crear movimiento de stock."""
    pass


class MovimientoStockResponse(MovimientoStockBase):
    """Respuesta con datos de movimiento de stock."""
    id: int
    stock_anterior: Decimal
    stock_nuevo: Decimal
    created_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class IngresoStock(BaseModel):
    """Datos para registrar ingreso de stock (compra)."""
    material_id: int
    cantidad: Decimal
    precio_costo: Optional[Decimal] = None
    proveedor: Optional[str] = None
    numero_factura: Optional[str] = None
    observaciones: Optional[str] = None


class AjusteStock(BaseModel):
    """Datos para ajuste manual de stock."""
    material_id: int
    cantidad: Decimal  # Positivo para sumar, negativo para restar
    observaciones: str


class ValorInventario(BaseModel):
    """Valor total del inventario."""
    valor_total: Decimal
    cantidad_items: int
    items_stock_bajo: int
