from typing import List, Optional
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_admin
from app.models.egreso import Egreso, CategoriaEgreso
from app.schemas.egreso import EgresoCreate, EgresoUpdate, EgresoResponse

router = APIRouter()


@router.get("/", response_model=List[EgresoResponse])
def listar_egresos(
    skip: int = 0,
    limit: int = 100,
    categoria: Optional[CategoriaEgreso] = None,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Listar egresos del consultorio."""
    query = db.query(Egreso)

    if categoria:
        query = query.filter(Egreso.categoria == categoria)
    if fecha_inicio:
        query = query.filter(Egreso.fecha >= fecha_inicio)
    if fecha_fin:
        query = query.filter(Egreso.fecha <= fecha_fin)

    return query.order_by(Egreso.fecha.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=EgresoResponse, status_code=status.HTTP_201_CREATED)
def registrar_egreso(
    data: EgresoCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Registrar egreso del consultorio."""
    egreso = Egreso(**data.model_dump(), created_by=current_user.id)
    db.add(egreso)
    db.commit()
    db.refresh(egreso)
    return egreso


@router.get("/{egreso_id}", response_model=EgresoResponse)
def obtener_egreso(
    egreso_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Obtener egreso por ID."""
    egreso = db.query(Egreso).filter(Egreso.id == egreso_id).first()
    if not egreso:
        raise HTTPException(status_code=404, detail="Egreso no encontrado")
    return egreso


@router.put("/{egreso_id}", response_model=EgresoResponse)
def actualizar_egreso(
    egreso_id: int,
    data: EgresoUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Actualizar egreso."""
    egreso = db.query(Egreso).filter(Egreso.id == egreso_id).first()
    if not egreso:
        raise HTTPException(status_code=404, detail="Egreso no encontrado")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(egreso, field, value)

    db.commit()
    db.refresh(egreso)
    return egreso


@router.delete("/{egreso_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_egreso(
    egreso_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Eliminar egreso."""
    egreso = db.query(Egreso).filter(Egreso.id == egreso_id).first()
    if not egreso:
        raise HTTPException(status_code=404, detail="Egreso no encontrado")
    db.delete(egreso)
    db.commit()
