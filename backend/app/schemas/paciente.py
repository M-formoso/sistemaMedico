from datetime import datetime, date
from typing import Optional

from pydantic import BaseModel, EmailStr, computed_field

from app.models.paciente import EstadoPaciente


class PacienteBase(BaseModel):
    """Campos comunes de paciente."""
    nombre: str
    apellido: str
    dni: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    direccion: Optional[str] = None
    antecedentes: Optional[str] = None
    alergias: Optional[str] = None
    medicacion_actual: Optional[str] = None
    notas_medicas: Optional[str] = None


class PacienteCreate(PacienteBase):
    """Datos para crear paciente."""
    estado: EstadoPaciente = EstadoPaciente.NUEVO


class PacienteUpdate(BaseModel):
    """Datos para actualizar paciente."""
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    dni: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    direccion: Optional[str] = None
    antecedentes: Optional[str] = None
    alergias: Optional[str] = None
    medicacion_actual: Optional[str] = None
    notas_medicas: Optional[str] = None
    estado: Optional[EstadoPaciente] = None
    activo: Optional[bool] = None


class PacienteResponse(PacienteBase):
    """Respuesta con datos de paciente."""
    id: int
    estado: EstadoPaciente
    activo: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

    @computed_field
    @property
    def nombre_completo(self) -> str:
        return f"{self.nombre} {self.apellido}"


class PacienteList(BaseModel):
    """Lista paginada de pacientes."""
    items: list[PacienteResponse]
    total: int
    skip: int
    limit: int


class PacienteBrief(BaseModel):
    """Resumen breve de paciente para listados."""
    id: int
    nombre: str
    apellido: str
    dni: Optional[str] = None
    telefono: Optional[str] = None
    estado: EstadoPaciente

    class Config:
        from_attributes = True

    @property
    def nombre_completo(self) -> str:
        return f"{self.nombre} {self.apellido}"


class CrearCredencialesPaciente(BaseModel):
    """Datos para crear credenciales de acceso para un paciente."""
    email: EmailStr
    password: str
