from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Column, Integer, String, DateTime, Date, Text, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship

from app.db.session import Base


class TipoConsentimiento(str, PyEnum):
    TRATAMIENTO = "tratamiento"
    DATOS_PERSONALES = "datos_personales"
    FOTOGRAFIAS = "fotografias"
    ANESTESIA = "anestesia"
    PROCEDIMIENTO = "procedimiento"
    OTRO = "otro"


class Consentimiento(Base):
    """
    Consentimientos informados firmados por el paciente.
    Documentos legales como contratos, autorizaciones, etc.
    """
    __tablename__ = "consentimientos"

    id = Column(Integer, primary_key=True, index=True)

    paciente_id = Column(Integer, ForeignKey("pacientes.id"), nullable=False, index=True)
    tratamiento_id = Column(Integer, ForeignKey("tratamientos.id"), nullable=True)

    tipo = Column(Enum(TipoConsentimiento), default=TipoConsentimiento.TRATAMIENTO)
    nombre = Column(String(255), nullable=False)
    descripcion = Column(Text, nullable=True)

    # Archivo del consentimiento firmado
    archivo_url = Column(String(500), nullable=True)

    fecha_firma = Column(Date, nullable=True)
    firmado = Column(Boolean, default=False)

    # Fecha de vencimiento (si aplica)
    fecha_vencimiento = Column(Date, nullable=True)

    created_by = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    paciente = relationship("Paciente", back_populates="consentimientos")

    def __repr__(self):
        return f"<Consentimiento {self.nombre} - {'Firmado' if self.firmado else 'Pendiente'}>"
