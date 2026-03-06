from typing import List, Optional
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.api.deps import get_current_admin
from app.models.estudio import Estudio, BateriaEstudios, EstadoEstudio
from app.models.paciente import Paciente

router = APIRouter()


# Schemas
class EstudioBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    indicaciones: Optional[str] = None
    fecha_solicitud: date
    fecha_realizacion: Optional[date] = None
    estado: Optional[EstadoEstudio] = EstadoEstudio.PENDIENTE
    archivo_url: Optional[str] = None


class EstudioCreate(EstudioBase):
    paciente_id: int


class EstudioUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    indicaciones: Optional[str] = None
    fecha_realizacion: Optional[date] = None
    estado: Optional[EstadoEstudio] = None
    archivo_url: Optional[str] = None


class EstudioResponse(EstudioBase):
    id: int
    paciente_id: int
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


# Batería de estudios schemas
class BateriaEstudiosBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    estudios_incluidos: List[str] = []
    activo: bool = True


class BateriaEstudiosCreate(BateriaEstudiosBase):
    pass


class BateriaEstudiosUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    estudios_incluidos: Optional[List[str]] = None
    activo: Optional[bool] = None


class BateriaEstudiosResponse(BateriaEstudiosBase):
    id: int
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


# Endpoints de Estudios
@router.get("/paciente/{paciente_id}", response_model=List[EstudioResponse])
def listar_estudios_paciente(
    paciente_id: int,
    estado: Optional[EstadoEstudio] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Listar estudios de un paciente."""
    query = db.query(Estudio).filter(Estudio.paciente_id == paciente_id)

    if estado:
        query = query.filter(Estudio.estado == estado)

    estudios = query.order_by(Estudio.fecha_solicitud.desc()).offset(skip).limit(limit).all()
    return estudios


@router.post("/", response_model=EstudioResponse, status_code=status.HTTP_201_CREATED)
def crear_estudio(
    data: EstudioCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Crear nuevo estudio para un paciente."""
    paciente = db.query(Paciente).filter(Paciente.id == data.paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    estudio = Estudio(
        **data.model_dump(),
        created_by=current_user.id
    )
    db.add(estudio)
    db.commit()
    db.refresh(estudio)

    return estudio


@router.post("/desde-bateria/{paciente_id}", response_model=List[EstudioResponse], status_code=status.HTTP_201_CREATED)
def crear_estudios_desde_bateria(
    paciente_id: int,
    bateria_id: int,
    fecha_solicitud: date,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Crear múltiples estudios desde una batería predefinida."""
    paciente = db.query(Paciente).filter(Paciente.id == paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    bateria = db.query(BateriaEstudios).filter(BateriaEstudios.id == bateria_id).first()
    if not bateria:
        raise HTTPException(status_code=404, detail="Batería de estudios no encontrada")

    estudios_creados = []
    for nombre_estudio in bateria.estudios_incluidos:
        estudio = Estudio(
            paciente_id=paciente_id,
            nombre=nombre_estudio,
            fecha_solicitud=fecha_solicitud,
            estado=EstadoEstudio.PENDIENTE,
            created_by=current_user.id
        )
        db.add(estudio)
        estudios_creados.append(estudio)

    db.commit()
    for estudio in estudios_creados:
        db.refresh(estudio)

    return estudios_creados


@router.get("/{estudio_id}", response_model=EstudioResponse)
def obtener_estudio(
    estudio_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Obtener un estudio por ID."""
    estudio = db.query(Estudio).filter(Estudio.id == estudio_id).first()

    if not estudio:
        raise HTTPException(status_code=404, detail="Estudio no encontrado")

    return estudio


@router.put("/{estudio_id}", response_model=EstudioResponse)
def actualizar_estudio(
    estudio_id: int,
    data: EstudioUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Actualizar un estudio."""
    estudio = db.query(Estudio).filter(Estudio.id == estudio_id).first()

    if not estudio:
        raise HTTPException(status_code=404, detail="Estudio no encontrado")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(estudio, field, value)

    db.commit()
    db.refresh(estudio)

    return estudio


@router.delete("/{estudio_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_estudio(
    estudio_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Eliminar un estudio."""
    estudio = db.query(Estudio).filter(Estudio.id == estudio_id).first()

    if not estudio:
        raise HTTPException(status_code=404, detail="Estudio no encontrado")

    db.delete(estudio)
    db.commit()


# Endpoints de Baterías de Estudios
@router.get("/baterias/", response_model=List[BateriaEstudiosResponse])
def listar_baterias(
    activo: Optional[bool] = True,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Listar baterías de estudios."""
    query = db.query(BateriaEstudios)
    if activo is not None:
        query = query.filter(BateriaEstudios.activo == activo)
    return query.all()


@router.post("/baterias/", response_model=BateriaEstudiosResponse, status_code=status.HTTP_201_CREATED)
def crear_bateria(
    data: BateriaEstudiosCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Crear nueva batería de estudios."""
    # Verificar que no existe otra con el mismo nombre
    existente = db.query(BateriaEstudios).filter(BateriaEstudios.nombre == data.nombre).first()
    if existente:
        raise HTTPException(status_code=400, detail="Ya existe una batería con ese nombre")

    bateria = BateriaEstudios(
        **data.model_dump(),
        created_by=current_user.id
    )
    db.add(bateria)
    db.commit()
    db.refresh(bateria)

    return bateria


@router.put("/baterias/{bateria_id}", response_model=BateriaEstudiosResponse)
def actualizar_bateria(
    bateria_id: int,
    data: BateriaEstudiosUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Actualizar una batería de estudios."""
    bateria = db.query(BateriaEstudios).filter(BateriaEstudios.id == bateria_id).first()

    if not bateria:
        raise HTTPException(status_code=404, detail="Batería no encontrada")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(bateria, field, value)

    db.commit()
    db.refresh(bateria)

    return bateria


@router.delete("/baterias/{bateria_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_bateria(
    bateria_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Eliminar una batería de estudios."""
    bateria = db.query(BateriaEstudios).filter(BateriaEstudios.id == bateria_id).first()

    if not bateria:
        raise HTTPException(status_code=404, detail="Batería no encontrada")

    db.delete(bateria)
    db.commit()
