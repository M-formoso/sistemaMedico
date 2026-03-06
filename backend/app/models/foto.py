from datetime import datetime, date
from enum import Enum as PyEnum

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, ForeignKey, Enum
from sqlalchemy.orm import relationship

from app.db.session import Base


class TipoFoto(str, PyEnum):
    ANTES = "antes"
    DESPUES = "despues"
    EVOLUCION = "evolucion"


class Foto(Base):
    """
    Galería de fotos antes/después por paciente y sesión.
    Almacenadas en Cloudinary.
    """
    __tablename__ = "fotos"

    id = Column(Integer, primary_key=True, index=True)

    paciente_id = Column(Integer, ForeignKey("pacientes.id"), nullable=False, index=True)
    sesion_id = Column(Integer, ForeignKey("sesiones.id"), nullable=True)

    url = Column(String(500), nullable=False)  # URL de Cloudinary
    public_id = Column(String(255), nullable=True)  # ID de Cloudinary para eliminación

    tipo = Column(Enum(TipoFoto), default=TipoFoto.EVOLUCION)
    zona = Column(String(100), nullable=True)
    fecha = Column(Date, nullable=True)

    # Control de visibilidad para el portal del paciente
    visible_paciente = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relaciones
    paciente = relationship("Paciente", back_populates="fotos")
    sesion = relationship("Sesion", back_populates="fotos")

    def __repr__(self):
        return f"<Foto {self.tipo} - {self.zona}>"
