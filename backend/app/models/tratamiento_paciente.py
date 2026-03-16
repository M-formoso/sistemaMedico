from datetime import datetime
from enum import Enum as PyEnum
from decimal import Decimal

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Text, Numeric, ForeignKey, Enum
from sqlalchemy.orm import relationship

from app.db.session import Base


class EstadoTratamientoPaciente(str, PyEnum):
    ACTIVO = "activo"
    EN_CURSO = "en_curso"
    COMPLETADO = "completado"
    PAUSADO = "pausado"
    CANCELADO = "cancelado"


class TratamientoPaciente(Base):
    """
    Relación entre un paciente y un tipo de tratamiento.
    Permite asignar múltiples tratamientos a un paciente con seguimiento individual.
    """
    __tablename__ = "tratamientos_pacientes"

    id = Column(Integer, primary_key=True, index=True)

    paciente_id = Column(Integer, ForeignKey("pacientes.id"), nullable=False, index=True)
    tratamiento_id = Column(Integer, ForeignKey("tratamientos.id"), nullable=False, index=True)

    # Información del plan de tratamiento
    fecha_inicio = Column(Date, nullable=True)
    fecha_fin_estimada = Column(Date, nullable=True)

    sesiones_planificadas = Column(Integer, default=1)
    sesiones_realizadas = Column(Integer, default=0)

    estado = Column(
        Enum(EstadoTratamientoPaciente, values_callable=lambda x: [e.value for e in x]),
        default=EstadoTratamientoPaciente.ACTIVO
    )

    # Precios personalizados para este paciente
    precio_acordado = Column(Numeric(12, 2), nullable=True)
    descuento_porcentaje = Column(Numeric(5, 2), default=0)

    # Notas específicas de este tratamiento para este paciente
    notas = Column(Text, nullable=True)
    zona_especifica = Column(String(255), nullable=True)

    # Color para diferenciación visual
    color = Column(String(7), default="#6366f1")  # Color hex por defecto

    activo = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    paciente = relationship("Paciente", back_populates="tratamientos_asignados")
    tratamiento = relationship("Tratamiento", back_populates="pacientes_asignados")

    def __repr__(self):
        return f"<TratamientoPaciente {self.paciente_id} - {self.tratamiento_id}>"

    @property
    def progreso_porcentaje(self) -> float:
        if self.sesiones_planificadas and self.sesiones_planificadas > 0:
            return min(100, (self.sesiones_realizadas / self.sesiones_planificadas) * 100)
        return 0
