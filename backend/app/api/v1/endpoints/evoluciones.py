from typing import List, Optional
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.api.deps import get_current_admin
from app.models.evolucion import Evolucion
from app.models.paciente import Paciente

router = APIRouter()


# Schemas
class EvolucionBase(BaseModel):
    fecha: date
    titulo: Optional[str] = None
    descripcion: str
    peso: Optional[str] = None
    tension_arterial: Optional[str] = None


class EvolucionCreate(EvolucionBase):
    paciente_id: int


class EvolucionUpdate(BaseModel):
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    peso: Optional[str] = None
    tension_arterial: Optional[str] = None


class EvolucionResponse(EvolucionBase):
    id: int
    paciente_id: int
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("/paciente/{paciente_id}", response_model=List[EvolucionResponse])
def listar_evoluciones_paciente(
    paciente_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Listar evoluciones de un paciente."""
    evoluciones = db.query(Evolucion).filter(
        Evolucion.paciente_id == paciente_id
    ).order_by(Evolucion.fecha.desc()).offset(skip).limit(limit).all()

    return evoluciones


@router.post("/", response_model=EvolucionResponse, status_code=status.HTTP_201_CREATED)
def crear_evolucion(
    data: EvolucionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Crear nueva evolución para un paciente."""
    # Verificar que el paciente existe
    paciente = db.query(Paciente).filter(Paciente.id == data.paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    evolucion = Evolucion(
        **data.model_dump(),
        created_by=current_user.id
    )
    db.add(evolucion)
    db.commit()
    db.refresh(evolucion)

    return evolucion


@router.get("/{evolucion_id}", response_model=EvolucionResponse)
def obtener_evolucion(
    evolucion_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Obtener una evolución por ID."""
    evolucion = db.query(Evolucion).filter(Evolucion.id == evolucion_id).first()

    if not evolucion:
        raise HTTPException(status_code=404, detail="Evolución no encontrada")

    return evolucion


@router.put("/{evolucion_id}", response_model=EvolucionResponse)
def actualizar_evolucion(
    evolucion_id: int,
    data: EvolucionUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Actualizar una evolución."""
    evolucion = db.query(Evolucion).filter(Evolucion.id == evolucion_id).first()

    if not evolucion:
        raise HTTPException(status_code=404, detail="Evolución no encontrada")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(evolucion, field, value)

    db.commit()
    db.refresh(evolucion)

    return evolucion


@router.delete("/{evolucion_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_evolucion(
    evolucion_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Eliminar una evolución."""
    evolucion = db.query(Evolucion).filter(Evolucion.id == evolucion_id).first()

    if not evolucion:
        raise HTTPException(status_code=404, detail="Evolución no encontrada")

    db.delete(evolucion)
    db.commit()
