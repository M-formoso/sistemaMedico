from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, EmailStr

from app.models.usuario import (
    RolUsuario,
    MODULOS_PACIENTE,
    MODULOS_DEFAULT_PACIENTE,
    MODULOS_ADMIN,
    MODULOS_DEFAULT_EMPLEADO,
)


class UsuarioBase(BaseModel):
    """Campos base del usuario."""
    email: EmailStr
    nombre: str
    rol: RolUsuario = RolUsuario.PACIENTE
    paciente_id: Optional[int] = None
    permisos_modulos: Optional[List[str]] = None
    activo: bool = True


class UsuarioCreate(BaseModel):
    """Datos para crear un usuario."""
    email: EmailStr
    password: str
    nombre: str
    rol: RolUsuario = RolUsuario.PACIENTE
    paciente_id: Optional[int] = None
    permisos_modulos: Optional[List[str]] = None


class UsuarioUpdate(BaseModel):
    """Datos para actualizar un usuario."""
    email: Optional[EmailStr] = None
    nombre: Optional[str] = None
    rol: Optional[RolUsuario] = None
    paciente_id: Optional[int] = None
    permisos_modulos: Optional[List[str]] = None
    activo: Optional[bool] = None


class UsuarioResetPassword(BaseModel):
    """Datos para resetear contraseña."""
    password: str


class UsuarioResponse(UsuarioBase):
    """Respuesta con datos del usuario."""
    id: int
    ultimo_acceso: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    paciente_nombre: Optional[str] = None

    class Config:
        from_attributes = True


class UsuarioList(BaseModel):
    """Lista paginada de usuarios."""
    items: list[UsuarioResponse]
    total: int


class ModulosDisponiblesPaciente(BaseModel):
    """Lista de módulos disponibles para asignar a pacientes."""
    modulos: dict = MODULOS_PACIENTE
    default: list = list(MODULOS_DEFAULT_PACIENTE)


class ModulosDisponiblesEmpleado(BaseModel):
    """Lista de módulos disponibles para asignar a empleados."""
    modulos: dict = MODULOS_ADMIN
    default: list = list(MODULOS_DEFAULT_EMPLEADO)


class ModulosDisponibles(BaseModel):
    """Lista completa de módulos disponibles por tipo de rol."""
    paciente: ModulosDisponiblesPaciente = ModulosDisponiblesPaciente()
    empleado: ModulosDisponiblesEmpleado = ModulosDisponiblesEmpleado()
