from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr

from app.models.usuario import RolUsuario


class Token(BaseModel):
    """Respuesta de login con tokens."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """Payload del token JWT."""
    sub: Optional[str] = None
    exp: Optional[int] = None


class TokenRefresh(BaseModel):
    """Request para renovar token."""
    refresh_token: str


class LoginRequest(BaseModel):
    """Request de login."""
    email: EmailStr
    password: str


class UsuarioBase(BaseModel):
    """Campos comunes de usuario."""
    email: EmailStr
    nombre: str
    rol: RolUsuario


class UsuarioCreate(UsuarioBase):
    """Datos para crear usuario."""
    password: str
    paciente_id: Optional[int] = None


class UsuarioResponse(UsuarioBase):
    """Respuesta con datos de usuario."""
    id: int
    paciente_id: Optional[int] = None
    activo: bool
    ultimo_acceso: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CambioPassword(BaseModel):
    """Datos para cambiar contraseña."""
    password_actual: str
    password_nuevo: str
