from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Column, Integer, String, DateTime, Date, Time, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship

from app.db.session import Base


class FrecuenciaTurno(str, PyEnum):
    SEMANAL = "semanal"
    QUINCENAL = "quincenal"
    MENSUAL = "mensual"


class DiaSemana(str, PyEnum):
    LUNES = "lunes"
    MARTES = "martes"
    MIERCOLES = "miercoles"
    JUEVES = "jueves"
    VIERNES = "viernes"
    SABADO = "sabado"


class TurnoRecurrente(Base):
    """
    Configuración de turnos recurrentes.
    Permite programar turnos que se repiten automáticamente.
    """
    __tablename__ = "turnos_recurrentes"

    id = Column(Integer, primary_key=True, index=True)

    paciente_id = Column(Integer, ForeignKey("pacientes.id"), nullable=False, index=True)
    tratamiento_id = Column(Integer, ForeignKey("tratamientos.id"), nullable=True)
    profesional_id = Column(Integer, ForeignKey("profesionales.id"), nullable=True)

    dia_semana = Column(Enum(DiaSemana), nullable=False)
    hora = Column(Time, nullable=False)
    duracion_minutos = Column(Integer, default=30)

    frecuencia = Column(Enum(FrecuenciaTurno), default=FrecuenciaTurno.SEMANAL)

    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=True)  # Null = indefinido

    activo = Column(Boolean, default=True)
    notas = Column(String(500), nullable=True)

    created_by = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    paciente = relationship("Paciente", back_populates="turnos_recurrentes")
    tratamiento = relationship("Tratamiento")
    profesional = relationship("Profesional")

    def __repr__(self):
        return f"<TurnoRecurrente {self.paciente_id} - {self.dia_semana} {self.hora}>"
