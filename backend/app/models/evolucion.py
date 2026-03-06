from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Date, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


class Evolucion(Base):
    """
    Evoluciones/Notas clínicas diarias del paciente.
    Registro de cada consulta o seguimiento.
    """
    __tablename__ = "evoluciones"

    id = Column(Integer, primary_key=True, index=True)

    paciente_id = Column(Integer, ForeignKey("pacientes.id"), nullable=False, index=True)

    fecha = Column(Date, nullable=False, index=True)
    titulo = Column(String(255), nullable=True)
    descripcion = Column(Text, nullable=False)

    # Signos vitales opcionales
    peso = Column(String(20), nullable=True)
    tension_arterial = Column(String(20), nullable=True)

    created_by = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    paciente = relationship("Paciente", back_populates="evoluciones")

    def __repr__(self):
        return f"<Evolucion {self.id} - {self.fecha}>"
