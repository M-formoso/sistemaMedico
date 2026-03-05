from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Text, Enum
from sqlalchemy.orm import relationship

from app.db.base import Base


class EstadoPaciente(str, PyEnum):
    ACTIVO = "activo"
    INACTIVO = "inactivo"
    NUEVO = "nuevo"


class Paciente(Base):
    """
    Modelo de Paciente con datos personales e historial clínico.
    """
    __tablename__ = "pacientes"

    id = Column(Integer, primary_key=True, index=True)

    # Datos personales
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=False)
    dni = Column(String(20), unique=True, nullable=True, index=True)
    fecha_nacimiento = Column(Date, nullable=True)
    telefono = Column(String(30), nullable=True)
    email = Column(String(255), nullable=True)
    direccion = Column(String(500), nullable=True)

    # Historial clínico
    antecedentes = Column(Text, nullable=True)
    alergias = Column(Text, nullable=True)
    medicacion_actual = Column(Text, nullable=True)
    notas_medicas = Column(Text, nullable=True)

    # Estado
    estado = Column(Enum(EstadoPaciente), default=EstadoPaciente.NUEVO)
    activo = Column(Boolean, default=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    usuario = relationship("Usuario", back_populates="paciente", uselist=False)
    sesiones = relationship("Sesion", back_populates="paciente")
    fotos = relationship("Foto", back_populates="paciente")
    pagos = relationship("Pago", back_populates="paciente")

    def __repr__(self):
        return f"<Paciente {self.nombre} {self.apellido}>"

    @property
    def nombre_completo(self) -> str:
        return f"{self.nombre} {self.apellido}"
