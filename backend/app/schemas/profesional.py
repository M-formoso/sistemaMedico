from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, EmailStr


class ProfesionalBase(BaseModel):
    """Campos comunes de profesional."""
    nombre: str
    apellido: str
    especialidad: Optional[str] = None
    matricula: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    direccion: Optional[str] = None
    duracion_turno_default: int = 30
    color_agenda: str = "#E91E63"
    porcentaje_comision: Decimal = Decimal("0")
    notas: Optional[str] = None


class ProfesionalCreate(ProfesionalBase):
    """Datos para crear profesional."""
    pass


class ProfesionalUpdate(BaseModel):
    """Datos para actualizar profesional."""
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    especialidad: Optional[str] = None
    matricula: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    direccion: Optional[str] = None
    duracion_turno_default: Optional[int] = None
    color_agenda: Optional[str] = None
    porcentaje_comision: Optional[Decimal] = None
    notas: Optional[str] = None
    activo: Optional[bool] = None


class ProfesionalResponse(ProfesionalBase):
    """Respuesta con datos de profesional."""
    id: int
    activo: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProfesionalBrief(BaseModel):
    """Resumen breve de profesional."""
    id: int
    nombre: str
    apellido: str
    especialidad: Optional[str] = None

    class Config:
        from_attributes = True
