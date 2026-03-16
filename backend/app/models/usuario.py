from datetime import datetime
from enum import Enum as PyEnum
from typing import List

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship

from app.db.session import Base


class RolUsuario(str, PyEnum):
    ADMINISTRADORA = "administradora"
    EMPLEADO = "empleado"
    PACIENTE = "paciente"


# Módulos de administración disponibles para asignar a empleados
MODULOS_ADMIN = {
    "pacientes": "Pacientes",
    "tratamientos": "Tratamientos",
    "sesiones": "Sesiones",
    "historia_clinica": "Historia Clínica",
    "fotos": "Fotos",
    "materiales": "Stock/Materiales",
    "finanzas": "Finanzas",
    "reportes": "Reportes",
    "agenda": "Agenda/Turnos",
    "dashboard": "Dashboard",
}

# Módulos por defecto para empleados nuevos (acceso básico)
MODULOS_DEFAULT_EMPLEADO = ["pacientes", "agenda", "dashboard"]

# Módulos disponibles para asignar permisos a pacientes
MODULOS_PACIENTE = {
    "turnos": "Mis Turnos",
    "tratamientos": "Mis Tratamientos",
    "consentimientos": "Mis Consentimientos",
    "fotos": "Mis Fotos",
    "pagos": "Mis Pagos",
    "historial": "Mi Historial",
}

# Módulos por defecto para pacientes nuevos
MODULOS_DEFAULT_PACIENTE = ["turnos", "tratamientos", "consentimientos"]


class Usuario(Base):
    """
    Modelo de Usuario para autenticación.

    Roles:
        - administradora: Acceso total al sistema (incluye gestión de usuarios)
        - empleado: Acceso a módulos de administración según permisos asignados
        - paciente: Acceso solo a su portal personal (según permisos)
    """
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    nombre = Column(String(100), nullable=False)
    rol = Column(Enum(RolUsuario, values_callable=lambda x: [e.value for e in x]), nullable=False, default=RolUsuario.PACIENTE)

    # Si es paciente, enlace a su perfil
    paciente_id = Column(Integer, ForeignKey("pacientes.id"), nullable=True)

    # Permisos granulares para pacientes (lista de módulos habilitados)
    # Por defecto: ["turnos", "tratamientos", "consentimientos"]
    permisos_modulos = Column(JSON, default=MODULOS_DEFAULT_PACIENTE)

    activo = Column(Boolean, default=True)
    ultimo_acceso = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    paciente = relationship("Paciente", back_populates="usuario", foreign_keys=[paciente_id])

    def __repr__(self):
        return f"<Usuario {self.email} ({self.rol})>"

    @property
    def es_admin(self) -> bool:
        return self.rol == RolUsuario.ADMINISTRADORA

    @property
    def es_empleado(self) -> bool:
        return self.rol == RolUsuario.EMPLEADO

    @property
    def es_paciente(self) -> bool:
        return self.rol == RolUsuario.PACIENTE

    @property
    def es_staff(self) -> bool:
        """Retorna True si es administradora o empleado (acceso al panel de admin)."""
        return self.rol in [RolUsuario.ADMINISTRADORA, RolUsuario.EMPLEADO]

    def tiene_permiso(self, modulo: str) -> bool:
        """Verifica si el usuario tiene permiso para acceder a un módulo."""
        if self.es_admin:
            return True
        if self.es_empleado:
            if not self.permisos_modulos:
                return modulo in MODULOS_DEFAULT_EMPLEADO
            return modulo in self.permisos_modulos
        # Paciente
        if not self.permisos_modulos:
            return modulo in MODULOS_DEFAULT_PACIENTE
        return modulo in self.permisos_modulos

    def get_modulos_permitidos(self) -> List[str]:
        """Retorna la lista de módulos a los que tiene acceso."""
        if self.es_admin:
            return list(MODULOS_ADMIN.keys())
        if self.es_empleado:
            return self.permisos_modulos or list(MODULOS_DEFAULT_EMPLEADO)
        # Paciente
        return self.permisos_modulos or list(MODULOS_DEFAULT_PACIENTE)
