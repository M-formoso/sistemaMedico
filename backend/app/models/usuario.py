from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship

from app.db.session import Base


class RolUsuario(str, PyEnum):
    ADMINISTRADORA = "administradora"
    PACIENTE = "paciente"


class Usuario(Base):
    """
    Modelo de Usuario para autenticación.

    Roles:
        - administradora: Acceso total al sistema
        - paciente: Acceso solo a su portal personal
    """
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    nombre = Column(String(100), nullable=False)
    rol = Column(Enum(RolUsuario), nullable=False, default=RolUsuario.PACIENTE)

    # Si es paciente, enlace a su perfil
    paciente_id = Column(Integer, ForeignKey("pacientes.id"), nullable=True)

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
    def es_paciente(self) -> bool:
        return self.rol == RolUsuario.PACIENTE
