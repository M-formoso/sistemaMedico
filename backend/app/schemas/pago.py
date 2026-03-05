from datetime import datetime, date
from typing import Optional
from decimal import Decimal

from pydantic import BaseModel

from app.models.pago import MetodoPago


class PagoBase(BaseModel):
    """Campos comunes de pago."""
    paciente_id: int
    sesion_id: Optional[int] = None
    monto: Decimal
    metodo_pago: MetodoPago = MetodoPago.EFECTIVO
    fecha: date
    concepto: Optional[str] = None
    notas: Optional[str] = None
    numero_recibo: Optional[str] = None


class PagoCreate(PagoBase):
    """Datos para crear pago."""
    pass


class PagoUpdate(BaseModel):
    """Datos para actualizar pago."""
    monto: Optional[Decimal] = None
    metodo_pago: Optional[MetodoPago] = None
    fecha: Optional[date] = None
    concepto: Optional[str] = None
    notas: Optional[str] = None
    numero_recibo: Optional[str] = None


class PagoResponse(PagoBase):
    """Respuesta con datos de pago."""
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PagoConPaciente(PagoResponse):
    """Pago con información del paciente."""
    paciente_nombre: Optional[str] = None

    class Config:
        from_attributes = True


class ResumenFinanciero(BaseModel):
    """Resumen financiero de un período."""
    total_ingresos: Decimal
    total_egresos: Decimal
    balance: Decimal
    cantidad_pagos: int
    cantidad_egresos: int
