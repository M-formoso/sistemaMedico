from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_admin
from app.models.configuracion import Configuracion, HorarioAtencion, ListaEspera
from app.schemas.configuracion import (
    ConfiguracionCreate,
    ConfiguracionUpdate,
    ConfiguracionResponse,
    HorarioAtencionCreate,
    HorarioAtencionUpdate,
    HorarioAtencionResponse,
    ListaEsperaCreate,
    ListaEsperaUpdate,
    ListaEsperaResponse,
)

router = APIRouter()


# ============ Configuraciones generales ============

@router.get("/", response_model=List[ConfiguracionResponse])
def listar_configuraciones(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    """Lista todas las configuraciones."""
    return db.query(Configuracion).all()


@router.get("/{clave}", response_model=ConfiguracionResponse)
def obtener_configuracion(
    clave: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    """Obtiene una configuración por clave."""
    config = db.query(Configuracion).filter(Configuracion.clave == clave).first()
    if not config:
        raise HTTPException(status_code=404, detail="Configuración no encontrada")
    return config


@router.post("/", response_model=ConfiguracionResponse, status_code=201)
def crear_configuracion(
    config_in: ConfiguracionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    """Crea una nueva configuración."""
    existente = db.query(Configuracion).filter(Configuracion.clave == config_in.clave).first()
    if existente:
        raise HTTPException(status_code=400, detail="Ya existe una configuración con esa clave")

    config = Configuracion(**config_in.model_dump())
    db.add(config)
    db.commit()
    db.refresh(config)
    return config


@router.put("/{clave}", response_model=ConfiguracionResponse)
def actualizar_configuracion(
    clave: str,
    config_in: ConfiguracionUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    """Actualiza una configuración."""
    config = db.query(Configuracion).filter(Configuracion.clave == clave).first()
    if not config:
        raise HTTPException(status_code=404, detail="Configuración no encontrada")

    update_data = config_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(config, field, value)

    db.commit()
    db.refresh(config)
    return config


# ============ Horarios de atención ============

@router.get("/horarios/", response_model=List[HorarioAtencionResponse])
def listar_horarios(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    """Lista todos los horarios de atención."""
    return db.query(HorarioAtencion).order_by(HorarioAtencion.dia_semana).all()


@router.post("/horarios/", response_model=HorarioAtencionResponse, status_code=201)
def crear_horario(
    horario_in: HorarioAtencionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    """Crea un nuevo horario de atención."""
    horario = HorarioAtencion(**horario_in.model_dump())
    db.add(horario)
    db.commit()
    db.refresh(horario)
    return horario


@router.put("/horarios/{horario_id}", response_model=HorarioAtencionResponse)
def actualizar_horario(
    horario_id: int,
    horario_in: HorarioAtencionUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    """Actualiza un horario de atención."""
    horario = db.query(HorarioAtencion).filter(HorarioAtencion.id == horario_id).first()
    if not horario:
        raise HTTPException(status_code=404, detail="Horario no encontrado")

    update_data = horario_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(horario, field, value)

    db.commit()
    db.refresh(horario)
    return horario


@router.delete("/horarios/{horario_id}", status_code=204)
def eliminar_horario(
    horario_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    """Elimina un horario de atención."""
    horario = db.query(HorarioAtencion).filter(HorarioAtencion.id == horario_id).first()
    if not horario:
        raise HTTPException(status_code=404, detail="Horario no encontrado")

    db.delete(horario)
    db.commit()
    return None


# ============ Lista de espera ============

@router.get("/lista-espera/", response_model=List[ListaEsperaResponse])
def listar_lista_espera(
    atendido: Optional[bool] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    """Lista los items en lista de espera."""
    query = db.query(ListaEspera)

    if atendido is not None:
        query = query.filter(ListaEspera.atendido == atendido)

    query = query.order_by(ListaEspera.prioridad.desc(), ListaEspera.created_at)
    return query.offset(skip).limit(limit).all()


@router.get("/lista-espera/count")
def contar_lista_espera(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    """Cuenta los pacientes en lista de espera pendientes."""
    count = db.query(ListaEspera).filter(ListaEspera.atendido == False).count()
    return {"count": count}


@router.post("/lista-espera/", response_model=ListaEsperaResponse, status_code=201)
def agregar_lista_espera(
    item_in: ListaEsperaCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    """Agrega un paciente a la lista de espera."""
    item = ListaEspera(**item_in.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/lista-espera/{item_id}", response_model=ListaEsperaResponse)
def actualizar_lista_espera(
    item_id: int,
    item_in: ListaEsperaUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    """Actualiza un item de la lista de espera."""
    item = db.query(ListaEspera).filter(ListaEspera.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")

    update_data = item_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/lista-espera/{item_id}", status_code=204)
def eliminar_lista_espera(
    item_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    """Elimina un item de la lista de espera."""
    item = db.query(ListaEspera).filter(ListaEspera.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")

    db.delete(item)
    db.commit()
    return None
