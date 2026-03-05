from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_admin, get_current_user
from app.models.tratamiento import Tratamiento
from app.schemas.tratamiento import TratamientoCreate, TratamientoUpdate, TratamientoResponse

router = APIRouter()


@router.get("/", response_model=List[TratamientoResponse])
def listar_tratamientos(
    skip: int = 0,
    limit: int = 100,
    solo_activos: Optional[bool] = True,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Listar catálogo de tratamientos."""
    query = db.query(Tratamiento)
    if solo_activos:
        query = query.filter(Tratamiento.activo == True)
    return query.order_by(Tratamiento.nombre).offset(skip).limit(limit).all()


@router.post("/", response_model=TratamientoResponse, status_code=status.HTTP_201_CREATED)
def crear_tratamiento(
    data: TratamientoCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Crear nuevo tratamiento (solo administradora)."""
    tratamiento = Tratamiento(**data.model_dump())
    db.add(tratamiento)
    db.commit()
    db.refresh(tratamiento)
    return tratamiento


@router.get("/{tratamiento_id}", response_model=TratamientoResponse)
def obtener_tratamiento(
    tratamiento_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Obtener tratamiento por ID."""
    tratamiento = db.query(Tratamiento).filter(
        Tratamiento.id == tratamiento_id
    ).first()

    if not tratamiento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tratamiento no encontrado"
        )

    return tratamiento


@router.put("/{tratamiento_id}", response_model=TratamientoResponse)
def actualizar_tratamiento(
    tratamiento_id: int,
    data: TratamientoUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Actualizar tratamiento (solo administradora)."""
    tratamiento = db.query(Tratamiento).filter(
        Tratamiento.id == tratamiento_id
    ).first()

    if not tratamiento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tratamiento no encontrado"
        )

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tratamiento, field, value)

    db.commit()
    db.refresh(tratamiento)
    return tratamiento


@router.delete("/{tratamiento_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_tratamiento(
    tratamiento_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Eliminar tratamiento (soft delete, solo administradora)."""
    tratamiento = db.query(Tratamiento).filter(
        Tratamiento.id == tratamiento_id
    ).first()

    if not tratamiento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tratamiento no encontrado"
        )

    tratamiento.activo = False
    db.commit()
