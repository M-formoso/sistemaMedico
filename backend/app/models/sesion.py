from datetime import datetime
from enum import Enum as PyEnum
from decimal import Decimal

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Time, Text, Numeric, ForeignKey, Enum
from sqlalchemy.orm import relationship

from app.db.session import Base


class EstadoSesion(str, PyEnum):
    PROGRAMADA = "programada"
    CONFIRMADA = "confirmada"
    EN_CURSO = "en_curso"
    COMPLETADA = "completada"
    CANCELADA = "cancelada"
    NO_ASISTIO = "no_asistio"


class Sesion(Base):
    """
    Registro de sesiones clínicas realizadas a pacientes.
    """
    __tablename__ = "sesiones"

    id = Column(Integer, primary_key=True, index=True)

    paciente_id = Column(Integer, ForeignKey("pacientes.id"), nullable=False, index=True)
    tratamiento_id = Column(Integer, ForeignKey("tratamientos.id"), nullable=False)
    profesional_id = Column(Integer, ForeignKey("profesionales.id"), nullable=True, index=True)

    fecha = Column(Date, nullable=False, index=True)
    hora_inicio = Column(Time, nullable=True)
    hora_fin = Column(Time, nullable=True)

    estado = Column(Enum(EstadoSesion), default=EstadoSesion.PROGRAMADA)

    precio_cobrado = Column(Numeric(12, 2), nullable=True)
    descuento_aplicado = Column(Numeric(5, 2), default=0)

    duracion_minutos = Column(Integer, nullable=True, default=30)
    notas = Column(Text, nullable=True)
    notas_internas = Column(Text, nullable=True)
    google_calendar_event_id = Column(String(255), nullable=True)

    created_by = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    paciente = relationship("Paciente", back_populates="sesiones")
    tratamiento = relationship("Tratamiento", back_populates="sesiones")
    profesional = relationship("Profesional", back_populates="sesiones")
    fotos = relationship("Foto", back_populates="sesion")
    materiales = relationship("SesionMaterial", back_populates="sesion", cascade="all, delete-orphan")
    pagos = relationship("Pago", back_populates="sesion")

    def __repr__(self):
        return f"<Sesion {self.id} - {self.fecha}>"


class SesionMaterial(Base):
    """
    Relación many-to-many entre sesiones y materiales usados.
    Registra la cantidad de cada material utilizado en una sesión.
    """
    __tablename__ = "sesiones_materiales"

    id = Column(Integer, primary_key=True, index=True)

    sesion_id = Column(Integer, ForeignKey("sesiones.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("materiales.id"), nullable=False)

    cantidad = Column(Numeric(10, 3), nullable=False)
    costo_unitario = Column(Numeric(12, 2), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relaciones
    sesion = relationship("Sesion", back_populates="materiales")
    material = relationship("Material", back_populates="sesiones_materiales")
