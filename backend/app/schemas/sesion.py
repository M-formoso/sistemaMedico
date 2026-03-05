from datetime import datetime, date, time
from typing import Optional, List
from decimal import Decimal

from pydantic import BaseModel

from app.models.sesion import EstadoSesion


class MaterialUsado(BaseModel):
    """Material utilizado en una sesión."""
    material_id: int
    cantidad: Decimal


class SesionBase(BaseModel):
    """Campos comunes de sesión."""
    paciente_id: int
    tratamiento_id: int
    fecha: date
    hora_inicio: Optional[time] = None
    hora_fin: Optional[time] = None
    precio_cobrado: Optional[Decimal] = None
    descuento_aplicado: Optional[Decimal] = None
    notas: Optional[str] = None
    notas_internas: Optional[str] = None


class SesionCreate(SesionBase):
    """Datos para crear sesión."""
    estado: EstadoSesion = EstadoSesion.PROGRAMADA
    materiales: Optional[List[MaterialUsado]] = None


class SesionUpdate(BaseModel):
    """Datos para actualizar sesión."""
    paciente_id: Optional[int] = None
    tratamiento_id: Optional[int] = None
    fecha: Optional[date] = None
    hora_inicio: Optional[time] = None
    hora_fin: Optional[time] = None
    estado: Optional[EstadoSesion] = None
    precio_cobrado: Optional[Decimal] = None
    descuento_aplicado: Optional[Decimal] = None
    notas: Optional[str] = None
    notas_internas: Optional[str] = None


class SesionMaterialResponse(BaseModel):
    """Respuesta de material usado en sesión."""
    id: int
    sesion_id: int
    material_id: int
    cantidad: Decimal
    costo_unitario: Optional[Decimal] = None

    class Config:
        from_attributes = True


class PacienteMinimal(BaseModel):
    """Datos mínimos del paciente para listados."""
    id: int
    nombre: str
    apellido: str
    nombre_completo: str

    class Config:
        from_attributes = True


class TratamientoMinimal(BaseModel):
    """Datos mínimos del tratamiento para listados."""
    id: int
    nombre: str
    precio_lista: Optional[Decimal] = None

    class Config:
        from_attributes = True


class MaterialMinimal(BaseModel):
    """Datos mínimos del material."""
    id: int
    nombre: str
    unidad_medida: str

    class Config:
        from_attributes = True


class SesionMaterialWithMaterial(SesionMaterialResponse):
    """Material usado con datos del material."""
    material: Optional[MaterialMinimal] = None


class SesionResponse(BaseModel):
    """Respuesta con datos de sesión."""
    id: int
    paciente_id: int
    tratamiento_id: int
    fecha: date
    hora_inicio: Optional[time] = None
    hora_fin: Optional[time] = None
    estado: EstadoSesion
    precio_cobrado: Optional[Decimal] = None
    descuento_aplicado: Optional[Decimal] = None
    notas: Optional[str] = None
    notas_internas: Optional[str] = None
    paciente: Optional[PacienteMinimal] = None
    tratamiento: Optional[TratamientoMinimal] = None
    materiales: List[SesionMaterialWithMaterial] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AsignarMaterial(BaseModel):
    """Datos para asignar un material a una sesión."""
    material_id: int
    cantidad: Decimal


class CambiarEstado(BaseModel):
    """Datos para cambiar estado de sesión."""
    estado: EstadoSesion
