from typing import List, Optional
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.api.deps import get_current_admin
from app.models.consentimiento import Consentimiento, TipoConsentimiento
from app.models.paciente import Paciente
from app.models.tratamiento import Tratamiento

router = APIRouter()


# Schemas
class ConsentimientoBase(BaseModel):
    tipo: Optional[TipoConsentimiento] = TipoConsentimiento.TRATAMIENTO
    nombre: str
    descripcion: Optional[str] = None
    archivo_url: Optional[str] = None
    fecha_firma: Optional[date] = None
    firmado: bool = False
    fecha_vencimiento: Optional[date] = None


class ConsentimientoCreate(ConsentimientoBase):
    paciente_id: int
    tratamiento_id: Optional[int] = None


class ConsentimientoUpdate(BaseModel):
    tipo: Optional[TipoConsentimiento] = None
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    archivo_url: Optional[str] = None
    fecha_firma: Optional[date] = None
    firmado: Optional[bool] = None
    fecha_vencimiento: Optional[date] = None


class ConsentimientoResponse(ConsentimientoBase):
    id: int
    paciente_id: int
    tratamiento_id: Optional[int] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("/paciente/{paciente_id}", response_model=List[ConsentimientoResponse])
def listar_consentimientos_paciente(
    paciente_id: int,
    firmado: Optional[bool] = None,
    tipo: Optional[TipoConsentimiento] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Listar consentimientos de un paciente."""
    query = db.query(Consentimiento).filter(Consentimiento.paciente_id == paciente_id)

    if firmado is not None:
        query = query.filter(Consentimiento.firmado == firmado)
    if tipo:
        query = query.filter(Consentimiento.tipo == tipo)

    consentimientos = query.order_by(Consentimiento.created_at.desc()).offset(skip).limit(limit).all()
    return consentimientos


@router.get("/pendientes", response_model=List[ConsentimientoResponse])
def listar_consentimientos_pendientes(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Listar todos los consentimientos pendientes de firma."""
    consentimientos = db.query(Consentimiento).filter(
        Consentimiento.firmado == False
    ).order_by(Consentimiento.created_at.desc()).all()

    return consentimientos


@router.post("/", response_model=ConsentimientoResponse, status_code=status.HTTP_201_CREATED)
def crear_consentimiento(
    data: ConsentimientoCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Crear nuevo consentimiento."""
    paciente = db.query(Paciente).filter(Paciente.id == data.paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    if data.tratamiento_id:
        tratamiento = db.query(Tratamiento).filter(Tratamiento.id == data.tratamiento_id).first()
        if not tratamiento:
            raise HTTPException(status_code=404, detail="Tratamiento no encontrado")

    consentimiento = Consentimiento(
        **data.model_dump(),
        created_by=current_user.id
    )
    db.add(consentimiento)
    db.commit()
    db.refresh(consentimiento)

    return consentimiento


@router.get("/{consentimiento_id}", response_model=ConsentimientoResponse)
def obtener_consentimiento(
    consentimiento_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Obtener un consentimiento por ID."""
    consentimiento = db.query(Consentimiento).filter(Consentimiento.id == consentimiento_id).first()

    if not consentimiento:
        raise HTTPException(status_code=404, detail="Consentimiento no encontrado")

    return consentimiento


@router.put("/{consentimiento_id}", response_model=ConsentimientoResponse)
def actualizar_consentimiento(
    consentimiento_id: int,
    data: ConsentimientoUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Actualizar un consentimiento."""
    consentimiento = db.query(Consentimiento).filter(Consentimiento.id == consentimiento_id).first()

    if not consentimiento:
        raise HTTPException(status_code=404, detail="Consentimiento no encontrado")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(consentimiento, field, value)

    db.commit()
    db.refresh(consentimiento)

    return consentimiento


@router.post("/{consentimiento_id}/firmar", response_model=ConsentimientoResponse)
def firmar_consentimiento(
    consentimiento_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Marcar un consentimiento como firmado."""
    consentimiento = db.query(Consentimiento).filter(Consentimiento.id == consentimiento_id).first()

    if not consentimiento:
        raise HTTPException(status_code=404, detail="Consentimiento no encontrado")

    consentimiento.firmado = True
    consentimiento.fecha_firma = date.today()

    db.commit()
    db.refresh(consentimiento)

    return consentimiento


@router.delete("/{consentimiento_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_consentimiento(
    consentimiento_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Eliminar un consentimiento."""
    consentimiento = db.query(Consentimiento).filter(Consentimiento.id == consentimiento_id).first()

    if not consentimiento:
        raise HTTPException(status_code=404, detail="Consentimiento no encontrado")

    db.delete(consentimiento)
    db.commit()
