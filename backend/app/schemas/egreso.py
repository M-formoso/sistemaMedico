from datetime import datetime, date
from typing import Optional
from decimal import Decimal

from pydantic import BaseModel

from app.models.egreso import CategoriaEgreso, MetodoPagoEgreso


class EgresoBase(BaseModel):
    """Campos comunes de egreso."""
    concepto: str
    monto: Decimal
    categoria: CategoriaEgreso = CategoriaEgreso.OTROS
    metodo_pago: MetodoPagoEgreso = MetodoPagoEgreso.EFECTIVO
    fecha: date
    proveedor: Optional[str] = None
    numero_factura: Optional[str] = None
    notas: Optional[str] = None


class EgresoCreate(EgresoBase):
    """Datos para crear egreso."""
    pass


class EgresoUpdate(BaseModel):
    """Datos para actualizar egreso."""
    concepto: Optional[str] = None
    monto: Optional[Decimal] = None
    categoria: Optional[CategoriaEgreso] = None
    metodo_pago: Optional[MetodoPagoEgreso] = None
    fecha: Optional[date] = None
    proveedor: Optional[str] = None
    numero_factura: Optional[str] = None
    notas: Optional[str] = None


class EgresoResponse(EgresoBase):
    """Respuesta con datos de egreso."""
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EgresosPorCategoria(BaseModel):
    """Egresos agrupados por categoría."""
    categoria: CategoriaEgreso
    total: Decimal
    cantidad: int
