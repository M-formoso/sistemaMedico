from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Column, Integer, String, DateTime, Date, Text, ForeignKey, Enum, Boolean, JSON
from sqlalchemy.orm import relationship

from app.db.session import Base


class EstadoEstudio(str, PyEnum):
    PENDIENTE = "pendiente"
    SOLICITADO = "solicitado"
    REALIZADO = "realizado"
    CANCELADO = "cancelado"


class Estudio(Base):
    """
    Estudios/Prácticas solicitadas al paciente.
    Ej: Análisis de sangre, ECG, etc.
    """
    __tablename__ = "estudios"

    id = Column(Integer, primary_key=True, index=True)

    paciente_id = Column(Integer, ForeignKey("pacientes.id"), nullable=False, index=True)

    nombre = Column(String(255), nullable=False)
    descripcion = Column(Text, nullable=True)
    indicaciones = Column(Text, nullable=True)

    fecha_solicitud = Column(Date, nullable=False)
    fecha_realizacion = Column(Date, nullable=True)

    estado = Column(Enum(EstadoEstudio), default=EstadoEstudio.PENDIENTE)

    # Archivo del estudio (orden médica)
    archivo_url = Column(String(500), nullable=True)

    created_by = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    paciente = relationship("Paciente", back_populates="estudios")
    resultados = relationship("Resultado", back_populates="estudio")

    def __repr__(self):
        return f"<Estudio {self.nombre} - {self.estado}>"


class BateriaEstudios(Base):
    """
    Baterías/Atajos de estudios predefinidos.
    Ej: "Preoperatorio básico" = [Hemograma, Coagulograma, Glucemia]
    """
    __tablename__ = "baterias_estudios"

    id = Column(Integer, primary_key=True, index=True)

    nombre = Column(String(255), nullable=False, unique=True)
    descripcion = Column(Text, nullable=True)

    # Lista de estudios incluidos
    estudios_incluidos = Column(JSON, nullable=False, default=list)

    activo = Column(Boolean, default=True)

    created_by = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<BateriaEstudios {self.nombre}>"
