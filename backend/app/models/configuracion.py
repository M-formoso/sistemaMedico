from datetime import datetime

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Time

from app.db.session import Base


class Configuracion(Base):
    """
    Configuración general del sistema.
    """
    __tablename__ = "configuraciones"

    id = Column(Integer, primary_key=True, index=True)
    clave = Column(String(100), unique=True, nullable=False, index=True)
    valor = Column(Text, nullable=True)
    descripcion = Column(String(500), nullable=True)
    tipo = Column(String(50), default="string")  # string, number, boolean, json

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Configuracion {self.clave}={self.valor}>"


class HorarioAtencion(Base):
    """
    Horarios de atención del consultorio.
    """
    __tablename__ = "horarios_atencion"

    id = Column(Integer, primary_key=True, index=True)
    dia_semana = Column(Integer, nullable=False)  # 0=Lunes, 6=Domingo
    hora_inicio = Column(Time, nullable=False)
    hora_fin = Column(Time, nullable=False)
    activo = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ListaEspera(Base):
    """
    Lista de espera para turnos.
    """
    __tablename__ = "lista_espera"

    id = Column(Integer, primary_key=True, index=True)
    paciente_id = Column(Integer, nullable=False, index=True)
    tratamiento_id = Column(Integer, nullable=True)
    profesional_id = Column(Integer, nullable=True)
    fecha_preferida = Column(DateTime, nullable=True)
    notas = Column(Text, nullable=True)
    prioridad = Column(Integer, default=0)  # 0=normal, 1=alta, 2=urgente
    atendido = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
