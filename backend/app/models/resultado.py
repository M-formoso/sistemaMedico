from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Date, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


class Resultado(Base):
    """
    Resultados de estudios/análisis del paciente.
    PDFs o imágenes de los resultados.
    """
    __tablename__ = "resultados"

    id = Column(Integer, primary_key=True, index=True)

    paciente_id = Column(Integer, ForeignKey("pacientes.id"), nullable=False, index=True)
    estudio_id = Column(Integer, ForeignKey("estudios.id"), nullable=True)

    nombre = Column(String(255), nullable=False)
    descripcion = Column(Text, nullable=True)
    fecha = Column(Date, nullable=False)

    # Archivo del resultado
    archivo_url = Column(String(500), nullable=True)
    tipo_archivo = Column(String(50), nullable=True)  # pdf, image, etc

    notas = Column(Text, nullable=True)

    created_by = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    paciente = relationship("Paciente", back_populates="resultados")
    estudio = relationship("Estudio", back_populates="resultados")

    def __repr__(self):
        return f"<Resultado {self.nombre} - {self.fecha}>"
