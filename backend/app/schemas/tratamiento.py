from datetime import datetime
from typing import Optional
from decimal import Decimal

from pydantic import BaseModel


class TratamientoBase(BaseModel):
    """Campos comunes de tratamiento."""
    nombre: str
    descripcion: Optional[str] = None
    precio_lista: Optional[Decimal] = None
    duracion_minutos: Optional[int] = None
    zona_corporal: Optional[str] = None
    sesiones_recomendadas: Optional[int] = None


class TratamientoCreate(TratamientoBase):
    """Datos para crear tratamiento."""
    pass


class TratamientoUpdate(BaseModel):
    """Datos para actualizar tratamiento."""
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio_lista: Optional[Decimal] = None
    duracion_minutos: Optional[int] = None
    zona_corporal: Optional[str] = None
    sesiones_recomendadas: Optional[int] = None
    activo: Optional[bool] = None


class TratamientoResponse(TratamientoBase):
    """Respuesta con datos de tratamiento."""
    id: int
    activo: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TratamientoBrief(BaseModel):
    """Resumen breve de tratamiento para listados."""
    id: int
    nombre: str
    precio_lista: Optional[Decimal] = None
    duracion_minutos: Optional[int] = None

    class Config:
        from_attributes = True
