from typing import List, Optional
from datetime import date, time, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.api.deps import get_current_admin
from app.models.turno_recurrente import TurnoRecurrente, FrecuenciaTurno, DiaSemana
from app.models.paciente import Paciente
from app.models.tratamiento import Tratamiento
from app.models.profesional import Profesional
from app.models.sesion import Sesion, EstadoSesion

router = APIRouter()


# Schemas
class TurnoRecurrenteBase(BaseModel):
    dia_semana: DiaSemana
    hora: time
    duracion_minutos: int = 30
    frecuencia: FrecuenciaTurno = FrecuenciaTurno.SEMANAL
    fecha_inicio: date
    fecha_fin: Optional[date] = None
    activo: bool = True
    notas: Optional[str] = None


class TurnoRecurrenteCreate(TurnoRecurrenteBase):
    paciente_id: int
    tratamiento_id: Optional[int] = None
    profesional_id: Optional[int] = None


class TurnoRecurrenteUpdate(BaseModel):
    dia_semana: Optional[DiaSemana] = None
    hora: Optional[time] = None
    duracion_minutos: Optional[int] = None
    frecuencia: Optional[FrecuenciaTurno] = None
    fecha_fin: Optional[date] = None
    activo: Optional[bool] = None
    notas: Optional[str] = None
    tratamiento_id: Optional[int] = None
    profesional_id: Optional[int] = None


class TurnoRecurrenteResponse(TurnoRecurrenteBase):
    id: int
    paciente_id: int
    tratamiento_id: Optional[int] = None
    profesional_id: Optional[int] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class TurnoRecurrenteConPaciente(TurnoRecurrenteResponse):
    paciente_nombre: Optional[str] = None
    tratamiento_nombre: Optional[str] = None
    profesional_nombre: Optional[str] = None


@router.get("/paciente/{paciente_id}", response_model=List[TurnoRecurrenteResponse])
def listar_turnos_recurrentes_paciente(
    paciente_id: int,
    activo: Optional[bool] = True,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Listar turnos recurrentes de un paciente."""
    query = db.query(TurnoRecurrente).filter(TurnoRecurrente.paciente_id == paciente_id)

    if activo is not None:
        query = query.filter(TurnoRecurrente.activo == activo)

    turnos = query.order_by(TurnoRecurrente.dia_semana, TurnoRecurrente.hora).all()
    return turnos


@router.get("/", response_model=List[TurnoRecurrenteConPaciente])
def listar_turnos_recurrentes(
    activo: Optional[bool] = True,
    dia_semana: Optional[DiaSemana] = None,
    profesional_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Listar todos los turnos recurrentes con filtros."""
    query = db.query(TurnoRecurrente)

    if activo is not None:
        query = query.filter(TurnoRecurrente.activo == activo)
    if dia_semana:
        query = query.filter(TurnoRecurrente.dia_semana == dia_semana)
    if profesional_id:
        query = query.filter(TurnoRecurrente.profesional_id == profesional_id)

    turnos = query.order_by(TurnoRecurrente.dia_semana, TurnoRecurrente.hora).all()

    # Enriquecer con nombres
    result = []
    for turno in turnos:
        turno_dict = {
            "id": turno.id,
            "paciente_id": turno.paciente_id,
            "tratamiento_id": turno.tratamiento_id,
            "profesional_id": turno.profesional_id,
            "dia_semana": turno.dia_semana,
            "hora": turno.hora,
            "duracion_minutos": turno.duracion_minutos,
            "frecuencia": turno.frecuencia,
            "fecha_inicio": turno.fecha_inicio,
            "fecha_fin": turno.fecha_fin,
            "activo": turno.activo,
            "notas": turno.notas,
            "created_at": str(turno.created_at) if turno.created_at else None,
            "paciente_nombre": f"{turno.paciente.nombre} {turno.paciente.apellido}" if turno.paciente else None,
            "tratamiento_nombre": turno.tratamiento.nombre if turno.tratamiento else None,
            "profesional_nombre": turno.profesional.nombre if turno.profesional else None,
        }
        result.append(turno_dict)

    return result


@router.post("/", response_model=TurnoRecurrenteResponse, status_code=status.HTTP_201_CREATED)
def crear_turno_recurrente(
    data: TurnoRecurrenteCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Crear nuevo turno recurrente."""
    paciente = db.query(Paciente).filter(Paciente.id == data.paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    if data.tratamiento_id:
        tratamiento = db.query(Tratamiento).filter(Tratamiento.id == data.tratamiento_id).first()
        if not tratamiento:
            raise HTTPException(status_code=404, detail="Tratamiento no encontrado")

    if data.profesional_id:
        profesional = db.query(Profesional).filter(Profesional.id == data.profesional_id).first()
        if not profesional:
            raise HTTPException(status_code=404, detail="Profesional no encontrado")

    turno = TurnoRecurrente(
        **data.model_dump(),
        created_by=current_user.id
    )
    db.add(turno)
    db.commit()
    db.refresh(turno)

    return turno


@router.get("/{turno_id}", response_model=TurnoRecurrenteResponse)
def obtener_turno_recurrente(
    turno_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Obtener un turno recurrente por ID."""
    turno = db.query(TurnoRecurrente).filter(TurnoRecurrente.id == turno_id).first()

    if not turno:
        raise HTTPException(status_code=404, detail="Turno recurrente no encontrado")

    return turno


@router.put("/{turno_id}", response_model=TurnoRecurrenteResponse)
def actualizar_turno_recurrente(
    turno_id: int,
    data: TurnoRecurrenteUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Actualizar un turno recurrente."""
    turno = db.query(TurnoRecurrente).filter(TurnoRecurrente.id == turno_id).first()

    if not turno:
        raise HTTPException(status_code=404, detail="Turno recurrente no encontrado")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(turno, field, value)

    db.commit()
    db.refresh(turno)

    return turno


@router.post("/{turno_id}/desactivar", response_model=TurnoRecurrenteResponse)
def desactivar_turno_recurrente(
    turno_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Desactivar un turno recurrente."""
    turno = db.query(TurnoRecurrente).filter(TurnoRecurrente.id == turno_id).first()

    if not turno:
        raise HTTPException(status_code=404, detail="Turno recurrente no encontrado")

    turno.activo = False
    turno.fecha_fin = date.today()
    db.commit()
    db.refresh(turno)

    return turno


@router.delete("/{turno_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_turno_recurrente(
    turno_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Eliminar un turno recurrente."""
    turno = db.query(TurnoRecurrente).filter(TurnoRecurrente.id == turno_id).first()

    if not turno:
        raise HTTPException(status_code=404, detail="Turno recurrente no encontrado")

    db.delete(turno)
    db.commit()


# Helpers para mapeo de días
DIA_SEMANA_MAP = {
    DiaSemana.LUNES: 0,
    DiaSemana.MARTES: 1,
    DiaSemana.MIERCOLES: 2,
    DiaSemana.JUEVES: 3,
    DiaSemana.VIERNES: 4,
    DiaSemana.SABADO: 5,
}


def obtener_proxima_fecha(dia_semana: DiaSemana, desde: date = None) -> date:
    """Obtiene la próxima fecha para un día de la semana específico."""
    if desde is None:
        desde = date.today()

    dia_objetivo = DIA_SEMANA_MAP[dia_semana]
    dias_hasta = (dia_objetivo - desde.weekday()) % 7
    if dias_hasta == 0:
        dias_hasta = 7  # Si es hoy, programar para la próxima semana
    return desde + timedelta(days=dias_hasta)


@router.post("/{turno_id}/generar-sesiones")
def generar_sesiones_desde_turno(
    turno_id: int,
    semanas: int = 4,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Genera sesiones individuales a partir de un turno recurrente para las próximas X semanas."""
    turno = db.query(TurnoRecurrente).filter(TurnoRecurrente.id == turno_id).first()

    if not turno:
        raise HTTPException(status_code=404, detail="Turno recurrente no encontrado")

    if not turno.activo:
        raise HTTPException(status_code=400, detail="El turno recurrente está desactivado")

    sesiones_creadas = []
    fecha_actual = obtener_proxima_fecha(turno.dia_semana)
    fecha_limite = date.today() + timedelta(weeks=semanas)

    if turno.fecha_fin and turno.fecha_fin < fecha_limite:
        fecha_limite = turno.fecha_fin

    # Determinar incremento según frecuencia
    if turno.frecuencia == FrecuenciaTurno.SEMANAL:
        incremento_dias = 7
    elif turno.frecuencia == FrecuenciaTurno.QUINCENAL:
        incremento_dias = 14
    else:  # MENSUAL
        incremento_dias = 28

    while fecha_actual <= fecha_limite:
        # Verificar si ya existe una sesión para esa fecha/hora
        fecha_hora = datetime.combine(fecha_actual, turno.hora)
        existente = db.query(Sesion).filter(
            Sesion.paciente_id == turno.paciente_id,
            Sesion.fecha_hora == fecha_hora
        ).first()

        if not existente:
            sesion = Sesion(
                paciente_id=turno.paciente_id,
                tratamiento_id=turno.tratamiento_id,
                profesional_id=turno.profesional_id,
                fecha_hora=fecha_hora,
                duracion_minutos=turno.duracion_minutos,
                estado=EstadoSesion.PROGRAMADA,
                notas=f"Generada desde turno recurrente #{turno.id}",
                created_by=current_user.id
            )
            db.add(sesion)
            sesiones_creadas.append({
                "fecha": str(fecha_actual),
                "hora": str(turno.hora)
            })

        fecha_actual += timedelta(days=incremento_dias)

    db.commit()

    return {
        "mensaje": f"Se generaron {len(sesiones_creadas)} sesiones",
        "sesiones": sesiones_creadas
    }
