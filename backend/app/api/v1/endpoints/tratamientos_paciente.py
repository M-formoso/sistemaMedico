from typing import List, Optional
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel

from app.db.session import get_db
from app.api.deps import get_current_admin
from app.models.tratamiento_paciente import TratamientoPaciente, EstadoTratamientoPaciente
from app.models.paciente import Paciente
from app.models.tratamiento import Tratamiento

router = APIRouter()


# Schemas
class TratamientoPacienteBase(BaseModel):
    tratamiento_id: int
    fecha_inicio: Optional[date] = None
    fecha_fin_estimada: Optional[date] = None
    sesiones_planificadas: int = 1
    precio_acordado: Optional[float] = None
    descuento_porcentaje: float = 0
    notas: Optional[str] = None
    zona_especifica: Optional[str] = None
    color: str = "#6366f1"


class TratamientoPacienteCreate(TratamientoPacienteBase):
    paciente_id: int


class TratamientoPacienteUpdate(BaseModel):
    tratamiento_id: Optional[int] = None
    fecha_inicio: Optional[date] = None
    fecha_fin_estimada: Optional[date] = None
    sesiones_planificadas: Optional[int] = None
    sesiones_realizadas: Optional[int] = None
    estado: Optional[EstadoTratamientoPaciente] = None
    precio_acordado: Optional[float] = None
    descuento_porcentaje: Optional[float] = None
    notas: Optional[str] = None
    zona_especifica: Optional[str] = None
    color: Optional[str] = None


class TratamientoInfo(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str] = None
    precio_lista: Optional[float] = None
    duracion_minutos: Optional[int] = None
    zona_corporal: Optional[str] = None
    sesiones_recomendadas: Optional[int] = None

    class Config:
        from_attributes = True


class TratamientoPacienteResponse(BaseModel):
    id: int
    paciente_id: int
    tratamiento_id: int
    tratamiento: Optional[TratamientoInfo] = None
    fecha_inicio: Optional[date] = None
    fecha_fin_estimada: Optional[date] = None
    sesiones_planificadas: int
    sesiones_realizadas: int
    estado: str
    precio_acordado: Optional[float] = None
    descuento_porcentaje: float
    notas: Optional[str] = None
    zona_especifica: Optional[str] = None
    color: str
    progreso_porcentaje: float
    activo: bool

    class Config:
        from_attributes = True


@router.get("/paciente/{paciente_id}", response_model=List[TratamientoPacienteResponse])
def listar_tratamientos_paciente(
    paciente_id: int,
    estado: Optional[EstadoTratamientoPaciente] = None,
    incluir_inactivos: bool = False,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Listar tratamientos asignados a un paciente."""
    query = db.query(TratamientoPaciente).options(
        joinedload(TratamientoPaciente.tratamiento)
    ).filter(TratamientoPaciente.paciente_id == paciente_id)

    if not incluir_inactivos:
        query = query.filter(TratamientoPaciente.activo == True)

    if estado:
        query = query.filter(TratamientoPaciente.estado == estado)

    tratamientos = query.order_by(TratamientoPaciente.created_at.desc()).all()

    return [
        {
            **{k: v for k, v in tp.__dict__.items() if not k.startswith('_')},
            "tratamiento": tp.tratamiento,
            "estado": tp.estado.value if hasattr(tp.estado, 'value') else str(tp.estado),
            "progreso_porcentaje": tp.progreso_porcentaje,
            "precio_acordado": float(tp.precio_acordado) if tp.precio_acordado else None,
            "descuento_porcentaje": float(tp.descuento_porcentaje) if tp.descuento_porcentaje else 0,
        }
        for tp in tratamientos
    ]


@router.post("/", response_model=TratamientoPacienteResponse, status_code=status.HTTP_201_CREATED)
def asignar_tratamiento(
    data: TratamientoPacienteCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Asignar un tratamiento a un paciente."""
    # Validar paciente
    paciente = db.query(Paciente).filter(Paciente.id == data.paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    # Validar tratamiento
    tratamiento = db.query(Tratamiento).filter(Tratamiento.id == data.tratamiento_id).first()
    if not tratamiento:
        raise HTTPException(status_code=404, detail="Tratamiento no encontrado")

    # Crear asignación
    tratamiento_paciente = TratamientoPaciente(
        paciente_id=data.paciente_id,
        tratamiento_id=data.tratamiento_id,
        fecha_inicio=data.fecha_inicio,
        fecha_fin_estimada=data.fecha_fin_estimada,
        sesiones_planificadas=data.sesiones_planificadas,
        precio_acordado=data.precio_acordado,
        descuento_porcentaje=data.descuento_porcentaje,
        notas=data.notas,
        zona_especifica=data.zona_especifica,
        color=data.color,
        created_by=current_user.id
    )

    db.add(tratamiento_paciente)
    db.commit()
    db.refresh(tratamiento_paciente)

    # Cargar relación
    db.refresh(tratamiento_paciente, ["tratamiento"])

    return {
        **{k: v for k, v in tratamiento_paciente.__dict__.items() if not k.startswith('_')},
        "tratamiento": tratamiento_paciente.tratamiento,
        "estado": tratamiento_paciente.estado.value if hasattr(tratamiento_paciente.estado, 'value') else str(tratamiento_paciente.estado),
        "progreso_porcentaje": tratamiento_paciente.progreso_porcentaje,
        "precio_acordado": float(tratamiento_paciente.precio_acordado) if tratamiento_paciente.precio_acordado else None,
        "descuento_porcentaje": float(tratamiento_paciente.descuento_porcentaje) if tratamiento_paciente.descuento_porcentaje else 0,
    }


@router.get("/{tratamiento_paciente_id}", response_model=TratamientoPacienteResponse)
def obtener_tratamiento_paciente(
    tratamiento_paciente_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Obtener un tratamiento asignado por ID."""
    tp = db.query(TratamientoPaciente).options(
        joinedload(TratamientoPaciente.tratamiento)
    ).filter(TratamientoPaciente.id == tratamiento_paciente_id).first()

    if not tp:
        raise HTTPException(status_code=404, detail="Tratamiento asignado no encontrado")

    return {
        **{k: v for k, v in tp.__dict__.items() if not k.startswith('_')},
        "tratamiento": tp.tratamiento,
        "estado": tp.estado.value if hasattr(tp.estado, 'value') else str(tp.estado),
        "progreso_porcentaje": tp.progreso_porcentaje,
        "precio_acordado": float(tp.precio_acordado) if tp.precio_acordado else None,
        "descuento_porcentaje": float(tp.descuento_porcentaje) if tp.descuento_porcentaje else 0,
    }


@router.put("/{tratamiento_paciente_id}", response_model=TratamientoPacienteResponse)
def actualizar_tratamiento_paciente(
    tratamiento_paciente_id: int,
    data: TratamientoPacienteUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Actualizar un tratamiento asignado."""
    tp = db.query(TratamientoPaciente).filter(TratamientoPaciente.id == tratamiento_paciente_id).first()

    if not tp:
        raise HTTPException(status_code=404, detail="Tratamiento asignado no encontrado")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tp, field, value)

    db.commit()
    db.refresh(tp)
    db.refresh(tp, ["tratamiento"])

    return {
        **{k: v for k, v in tp.__dict__.items() if not k.startswith('_')},
        "tratamiento": tp.tratamiento,
        "estado": tp.estado.value if hasattr(tp.estado, 'value') else str(tp.estado),
        "progreso_porcentaje": tp.progreso_porcentaje,
        "precio_acordado": float(tp.precio_acordado) if tp.precio_acordado else None,
        "descuento_porcentaje": float(tp.descuento_porcentaje) if tp.descuento_porcentaje else 0,
    }


@router.post("/{tratamiento_paciente_id}/incrementar-sesion", response_model=TratamientoPacienteResponse)
def incrementar_sesion(
    tratamiento_paciente_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Incrementar el contador de sesiones realizadas."""
    tp = db.query(TratamientoPaciente).filter(TratamientoPaciente.id == tratamiento_paciente_id).first()

    if not tp:
        raise HTTPException(status_code=404, detail="Tratamiento asignado no encontrado")

    tp.sesiones_realizadas += 1

    # Actualizar estado si se completaron todas las sesiones
    if tp.sesiones_realizadas >= tp.sesiones_planificadas:
        tp.estado = EstadoTratamientoPaciente.COMPLETADO

    db.commit()
    db.refresh(tp)
    db.refresh(tp, ["tratamiento"])

    return {
        **{k: v for k, v in tp.__dict__.items() if not k.startswith('_')},
        "tratamiento": tp.tratamiento,
        "estado": tp.estado.value if hasattr(tp.estado, 'value') else str(tp.estado),
        "progreso_porcentaje": tp.progreso_porcentaje,
        "precio_acordado": float(tp.precio_acordado) if tp.precio_acordado else None,
        "descuento_porcentaje": float(tp.descuento_porcentaje) if tp.descuento_porcentaje else 0,
    }


@router.delete("/{tratamiento_paciente_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_tratamiento_paciente(
    tratamiento_paciente_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Eliminar (desactivar) un tratamiento asignado."""
    tp = db.query(TratamientoPaciente).filter(TratamientoPaciente.id == tratamiento_paciente_id).first()

    if not tp:
        raise HTTPException(status_code=404, detail="Tratamiento asignado no encontrado")

    # Soft delete
    tp.activo = False
    db.commit()
