from typing import List, Optional
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.api.deps import get_current_admin
from app.models.resultado import Resultado
from app.models.paciente import Paciente
from app.models.estudio import Estudio

router = APIRouter()


# Schemas
class ResultadoBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    fecha: date
    archivo_url: Optional[str] = None
    tipo_archivo: Optional[str] = None
    notas: Optional[str] = None


class ResultadoCreate(ResultadoBase):
    paciente_id: int
    estudio_id: Optional[int] = None


class ResultadoUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    fecha: Optional[date] = None
    archivo_url: Optional[str] = None
    tipo_archivo: Optional[str] = None
    notas: Optional[str] = None


class ResultadoResponse(ResultadoBase):
    id: int
    paciente_id: int
    estudio_id: Optional[int] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("/paciente/{paciente_id}", response_model=List[ResultadoResponse])
def listar_resultados_paciente(
    paciente_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Listar resultados de un paciente."""
    resultados = db.query(Resultado).filter(
        Resultado.paciente_id == paciente_id
    ).order_by(Resultado.fecha.desc()).offset(skip).limit(limit).all()

    return resultados


@router.get("/estudio/{estudio_id}", response_model=List[ResultadoResponse])
def listar_resultados_estudio(
    estudio_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Listar resultados de un estudio específico."""
    resultados = db.query(Resultado).filter(
        Resultado.estudio_id == estudio_id
    ).order_by(Resultado.fecha.desc()).all()

    return resultados


@router.post("/", response_model=ResultadoResponse, status_code=status.HTTP_201_CREATED)
def crear_resultado(
    data: ResultadoCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Crear nuevo resultado."""
    paciente = db.query(Paciente).filter(Paciente.id == data.paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    if data.estudio_id:
        estudio = db.query(Estudio).filter(Estudio.id == data.estudio_id).first()
        if not estudio:
            raise HTTPException(status_code=404, detail="Estudio no encontrado")

    resultado = Resultado(
        **data.model_dump(),
        created_by=current_user.id
    )
    db.add(resultado)
    db.commit()
    db.refresh(resultado)

    return resultado


@router.get("/{resultado_id}", response_model=ResultadoResponse)
def obtener_resultado(
    resultado_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Obtener un resultado por ID."""
    resultado = db.query(Resultado).filter(Resultado.id == resultado_id).first()

    if not resultado:
        raise HTTPException(status_code=404, detail="Resultado no encontrado")

    return resultado


@router.put("/{resultado_id}", response_model=ResultadoResponse)
def actualizar_resultado(
    resultado_id: int,
    data: ResultadoUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Actualizar un resultado."""
    resultado = db.query(Resultado).filter(Resultado.id == resultado_id).first()

    if not resultado:
        raise HTTPException(status_code=404, detail="Resultado no encontrado")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(resultado, field, value)

    db.commit()
    db.refresh(resultado)

    return resultado


@router.delete("/{resultado_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_resultado(
    resultado_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Eliminar un resultado."""
    resultado = db.query(Resultado).filter(Resultado.id == resultado_id).first()

    if not resultado:
        raise HTTPException(status_code=404, detail="Resultado no encontrado")

    db.delete(resultado)
    db.commit()
