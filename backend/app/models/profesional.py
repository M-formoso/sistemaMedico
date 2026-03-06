from datetime import datetime
from decimal import Decimal

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Numeric
from sqlalchemy.orm import relationship

from app.db.session import Base


class Profesional(Base):
    """
    Modelo de Profesional/Médico.
    """
    __tablename__ = "profesionales"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=False)
    especialidad = Column(String(100), nullable=True)
    matricula = Column(String(50), unique=True, nullable=True, index=True)
    telefono = Column(String(30), nullable=True)
    email = Column(String(255), nullable=True)
    direccion = Column(String(500), nullable=True)

    # Configuración de agenda
    duracion_turno_default = Column(Integer, default=30)  # minutos
    color_agenda = Column(String(7), default="#E91E63")  # color hex

    # Datos financieros
    porcentaje_comision = Column(Numeric(5, 2), default=0)

    notas = Column(Text, nullable=True)
    activo = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    sesiones = relationship("Sesion", back_populates="profesional")

    def __repr__(self):
        return f"<Profesional {self.nombre} {self.apellido}>"

    @property
    def nombre_completo(self) -> str:
        return f"{self.nombre} {self.apellido}"
