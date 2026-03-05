from typing import List, Optional
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_admin
from app.models.pago import Pago
from app.schemas.pago import PagoCreate, PagoUpdate, PagoResponse

router = APIRouter()


@router.get("/", response_model=List[PagoResponse])
def listar_pagos(
    skip: int = 0,
    limit: int = 100,
    paciente_id: Optional[int] = None,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Listar pagos con filtros opcionales."""
    query = db.query(Pago)

    if paciente_id:
        query = query.filter(Pago.paciente_id == paciente_id)
    if fecha_inicio:
        query = query.filter(Pago.fecha >= fecha_inicio)
    if fecha_fin:
        query = query.filter(Pago.fecha <= fecha_fin)

    return query.order_by(Pago.fecha.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=PagoResponse, status_code=status.HTTP_201_CREATED)
def registrar_pago(
    data: PagoCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Registrar pago de paciente."""
    pago = Pago(**data.model_dump(), created_by=current_user.id)
    db.add(pago)
    db.commit()
    db.refresh(pago)
    return pago


@router.get("/{pago_id}", response_model=PagoResponse)
def obtener_pago(
    pago_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Obtener pago por ID."""
    pago = db.query(Pago).filter(Pago.id == pago_id).first()
    if not pago:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    return pago


@router.put("/{pago_id}", response_model=PagoResponse)
def actualizar_pago(
    pago_id: int,
    data: PagoUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Actualizar pago."""
    pago = db.query(Pago).filter(Pago.id == pago_id).first()
    if not pago:
        raise HTTPException(status_code=404, detail="Pago no encontrado")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(pago, field, value)

    db.commit()
    db.refresh(pago)
    return pago


@router.delete("/{pago_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_pago(
    pago_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Eliminar pago."""
    pago = db.query(Pago).filter(Pago.id == pago_id).first()
    if not pago:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    db.delete(pago)
    db.commit()


@router.get("/{pago_id}/recibo")
def generar_recibo(
    pago_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Generar recibo PDF del pago.
    TODO: Implementar generación de PDF con WeasyPrint.
    """
    pago = db.query(Pago).filter(Pago.id == pago_id).first()
    if not pago:
        raise HTTPException(status_code=404, detail="Pago no encontrado")

    # TODO: Implementar generación de PDF
    return {"message": "Generación de PDF pendiente de implementar", "pago_id": pago_id}
