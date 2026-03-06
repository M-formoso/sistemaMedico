from datetime import datetime, time
from typing import Optional, List

from pydantic import BaseModel


class ConfiguracionBase(BaseModel):
    """Campos comunes de configuración."""
    clave: str
    valor: Optional[str] = None
    descripcion: Optional[str] = None
    tipo: str = "string"


class ConfiguracionCreate(ConfiguracionBase):
    """Datos para crear configuración."""
    pass


class ConfiguracionUpdate(BaseModel):
    """Datos para actualizar configuración."""
    valor: Optional[str] = None
    descripcion: Optional[str] = None


class ConfiguracionResponse(ConfiguracionBase):
    """Respuesta con datos de configuración."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class HorarioAtencionBase(BaseModel):
    """Campos comunes de horario."""
    dia_semana: int  # 0=Lunes, 6=Domingo
    hora_inicio: time
    hora_fin: time
    activo: bool = True


class HorarioAtencionCreate(HorarioAtencionBase):
    """Datos para crear horario."""
    pass


class HorarioAtencionUpdate(BaseModel):
    """Datos para actualizar horario."""
    hora_inicio: Optional[time] = None
    hora_fin: Optional[time] = None
    activo: Optional[bool] = None


class HorarioAtencionResponse(HorarioAtencionBase):
    """Respuesta con datos de horario."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ListaEsperaBase(BaseModel):
    """Campos comunes de lista de espera."""
    paciente_id: int
    tratamiento_id: Optional[int] = None
    profesional_id: Optional[int] = None
    fecha_preferida: Optional[datetime] = None
    notas: Optional[str] = None
    prioridad: int = 0


class ListaEsperaCreate(ListaEsperaBase):
    """Datos para crear item en lista de espera."""
    pass


class ListaEsperaUpdate(BaseModel):
    """Datos para actualizar item en lista de espera."""
    tratamiento_id: Optional[int] = None
    profesional_id: Optional[int] = None
    fecha_preferida: Optional[datetime] = None
    notas: Optional[str] = None
    prioridad: Optional[int] = None
    atendido: Optional[bool] = None


class ListaEsperaResponse(ListaEsperaBase):
    """Respuesta con datos de lista de espera."""
    id: int
    atendido: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
