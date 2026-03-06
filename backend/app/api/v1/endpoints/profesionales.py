from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_admin
from app.models.profesional import Profesional
from app.schemas.profesional import (
    ProfesionalCreate,
    ProfesionalUpdate,
    ProfesionalResponse,
    ProfesionalBrief,
)

router = APIRouter()


@router.get("/", response_model=List[ProfesionalResponse])
def listar_profesionales(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    activo: Optional[bool] = None,
    especialidad: Optional[str] = None,
    buscar: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    """Lista todos los profesionales con filtros opcionales."""
    query = db.query(Profesional)

    if activo is not None:
        query = query.filter(Profesional.activo == activo)

    if especialidad:
        query = query.filter(Profesional.especialidad.ilike(f"%{especialidad}%"))

    if buscar:
        query = query.filter(
            (Profesional.nombre.ilike(f"%{buscar}%"))
            | (Profesional.apellido.ilike(f"%{buscar}%"))
            | (Profesional.matricula.ilike(f"%{buscar}%"))
        )

    query = query.order_by(Profesional.apellido, Profesional.nombre)
    profesionales = query.offset(skip).limit(limit).all()

    return profesionales


@router.get("/activos", response_model=List[ProfesionalBrief])
def listar_profesionales_activos(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    """Lista profesionales activos (para selects)."""
    profesionales = (
        db.query(Profesional)
        .filter(Profesional.activo == True)
        .order_by(Profesional.apellido, Profesional.nombre)
        .all()
    )
    return profesionales


@router.get("/especialidades", response_model=List[str])
def listar_especialidades(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    """Lista todas las especialidades únicas."""
    especialidades = (
        db.query(Profesional.especialidad)
        .filter(Profesional.especialidad.isnot(None))
        .distinct()
        .all()
    )
    return [e[0] for e in especialidades if e[0]]


@router.post("/", response_model=ProfesionalResponse, status_code=201)
def crear_profesional(
    profesional_in: ProfesionalCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    """Crea un nuevo profesional."""
    # Verificar matrícula única si se proporciona
    if profesional_in.matricula:
        existente = (
            db.query(Profesional)
            .filter(Profesional.matricula == profesional_in.matricula)
            .first()
        )
        if existente:
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe un profesional con la matrícula {profesional_in.matricula}",
            )

    profesional = Profesional(**profesional_in.model_dump())
    db.add(profesional)
    db.commit()
    db.refresh(profesional)

    return profesional


@router.get("/{profesional_id}", response_model=ProfesionalResponse)
def obtener_profesional(
    profesional_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    """Obtiene un profesional por ID."""
    profesional = db.query(Profesional).filter(Profesional.id == profesional_id).first()

    if not profesional:
        raise HTTPException(status_code=404, detail="Profesional no encontrado")

    return profesional


@router.put("/{profesional_id}", response_model=ProfesionalResponse)
def actualizar_profesional(
    profesional_id: int,
    profesional_in: ProfesionalUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    """Actualiza un profesional existente."""
    profesional = db.query(Profesional).filter(Profesional.id == profesional_id).first()

    if not profesional:
        raise HTTPException(status_code=404, detail="Profesional no encontrado")

    # Verificar matrícula única si se cambia
    if profesional_in.matricula and profesional_in.matricula != profesional.matricula:
        existente = (
            db.query(Profesional)
            .filter(Profesional.matricula == profesional_in.matricula)
            .first()
        )
        if existente:
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe un profesional con la matrícula {profesional_in.matricula}",
            )

    update_data = profesional_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profesional, field, value)

    db.commit()
    db.refresh(profesional)

    return profesional


@router.delete("/{profesional_id}", status_code=204)
def eliminar_profesional(
    profesional_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    """Elimina (desactiva) un profesional."""
    profesional = db.query(Profesional).filter(Profesional.id == profesional_id).first()

    if not profesional:
        raise HTTPException(status_code=404, detail="Profesional no encontrado")

    # Soft delete
    profesional.activo = False
    db.commit()

    return None
