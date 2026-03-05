from datetime import datetime
from decimal import Decimal

from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, Numeric
from sqlalchemy.orm import relationship

from app.db.base import Base


class Tratamiento(Base):
    """
    Catálogo de tratamientos disponibles.
    Ej: Botox, Ácido Hialurónico, Láser, etc.
    """
    __tablename__ = "tratamientos"

    id = Column(Integer, primary_key=True, index=True)

    nombre = Column(String(255), nullable=False, index=True)
    descripcion = Column(Text, nullable=True)
    precio_lista = Column(Numeric(10, 2), nullable=True)
    duracion_minutos = Column(Integer, nullable=True)
    zona_corporal = Column(String(100), nullable=True)
    sesiones_recomendadas = Column(Integer, nullable=True)

    activo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    sesiones = relationship("Sesion", back_populates="tratamiento")

    def __repr__(self):
        return f"<Tratamiento {self.nombre}>"
