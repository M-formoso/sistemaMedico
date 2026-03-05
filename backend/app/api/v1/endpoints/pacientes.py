from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_admin
from app.models.paciente import Paciente, EstadoPaciente
from app.models.usuario import Usuario, RolUsuario
from app.schemas.paciente import (
    PacienteCreate,
    PacienteUpdate,
    PacienteResponse,
    CrearCredencialesPaciente,
)
from app.core.security import hashear_password

router = APIRouter()


@router.get("/", response_model=List[PacienteResponse])
def listar_pacientes(
    skip: int = 0,
    limit: int = 100,
    estado: Optional[EstadoPaciente] = None,
    buscar: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Listar todos los pacientes (solo administradora)."""
    query = db.query(Paciente).filter(Paciente.activo == True)

    if estado:
        query = query.filter(Paciente.estado == estado)

    if buscar:
        buscar_like = f"%{buscar}%"
        query = query.filter(
            (Paciente.nombre.ilike(buscar_like)) |
            (Paciente.apellido.ilike(buscar_like)) |
            (Paciente.dni.ilike(buscar_like)) |
            (Paciente.telefono.ilike(buscar_like))
        )

    return query.order_by(Paciente.apellido, Paciente.nombre).offset(skip).limit(limit).all()


@router.post("/", response_model=PacienteResponse, status_code=status.HTTP_201_CREATED)
def crear_paciente(
    data: PacienteCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Crear nuevo paciente."""
    # Verificar DNI único si se proporciona
    if data.dni:
        existente = db.query(Paciente).filter(Paciente.dni == data.dni).first()
        if existente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe un paciente con ese DNI"
            )

    paciente = Paciente(**data.model_dump())
    db.add(paciente)
    db.commit()
    db.refresh(paciente)
    return paciente


@router.get("/{paciente_id}", response_model=PacienteResponse)
def obtener_paciente(
    paciente_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Obtener paciente por ID."""
    paciente = db.query(Paciente).filter(
        Paciente.id == paciente_id,
        Paciente.activo == True
    ).first()

    if not paciente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paciente no encontrado"
        )

    return paciente


@router.put("/{paciente_id}", response_model=PacienteResponse)
def actualizar_paciente(
    paciente_id: int,
    data: PacienteUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Actualizar datos del paciente."""
    paciente = db.query(Paciente).filter(
        Paciente.id == paciente_id,
        Paciente.activo == True
    ).first()

    if not paciente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paciente no encontrado"
        )

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(paciente, field, value)

    db.commit()
    db.refresh(paciente)
    return paciente


@router.delete("/{paciente_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_paciente(
    paciente_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Eliminar paciente (soft delete)."""
    paciente = db.query(Paciente).filter(
        Paciente.id == paciente_id,
        Paciente.activo == True
    ).first()

    if not paciente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paciente no encontrado"
        )

    paciente.activo = False
    db.commit()


@router.post("/{paciente_id}/credenciales", status_code=status.HTTP_201_CREATED)
def crear_credenciales_paciente(
    paciente_id: int,
    data: CrearCredencialesPaciente,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Crear credenciales de acceso al portal para un paciente."""
    paciente = db.query(Paciente).filter(
        Paciente.id == paciente_id,
        Paciente.activo == True
    ).first()

    if not paciente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paciente no encontrado"
        )

    # Verificar si ya tiene usuario
    usuario_existente = db.query(Usuario).filter(
        Usuario.paciente_id == paciente_id
    ).first()

    if usuario_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El paciente ya tiene credenciales de acceso"
        )

    # Verificar email único
    email_existente = db.query(Usuario).filter(Usuario.email == data.email).first()
    if email_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un usuario con ese email"
        )

    usuario = Usuario(
        email=data.email,
        password_hash=hashear_password(data.password),
        nombre=paciente.nombre_completo,
        rol=RolUsuario.PACIENTE,
        paciente_id=paciente_id,
    )
    db.add(usuario)
    db.commit()

    return {"message": "Credenciales creadas correctamente"}


@router.get("/{paciente_id}/historial")
def obtener_historial_paciente(
    paciente_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Obtener historial clínico completo del paciente."""
    paciente = db.query(Paciente).filter(
        Paciente.id == paciente_id,
        Paciente.activo == True
    ).first()

    if not paciente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paciente no encontrado"
        )

    return {
        "paciente": paciente,
        "sesiones": paciente.sesiones,
        "fotos": paciente.fotos,
        "pagos": paciente.pagos,
    }
