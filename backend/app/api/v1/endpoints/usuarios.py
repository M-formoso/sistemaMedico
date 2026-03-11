from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_admin
from app.models.usuario import Usuario, RolUsuario
from app.models.paciente import Paciente
from app.schemas.usuario import (
    UsuarioCreate,
    UsuarioUpdate,
    UsuarioResponse,
    UsuarioResetPassword,
)
from app.core.security import hashear_password

router = APIRouter()


@router.get("/", response_model=List[UsuarioResponse])
def listar_usuarios(
    skip: int = 0,
    limit: int = 100,
    rol: Optional[RolUsuario] = None,
    activo: Optional[bool] = None,
    buscar: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Listar todos los usuarios (solo administradora)."""
    query = db.query(Usuario)

    if rol:
        query = query.filter(Usuario.rol == rol)

    if activo is not None:
        query = query.filter(Usuario.activo == activo)

    if buscar:
        buscar_like = f"%{buscar}%"
        query = query.filter(
            (Usuario.nombre.ilike(buscar_like)) |
            (Usuario.email.ilike(buscar_like))
        )

    usuarios = query.order_by(Usuario.nombre).offset(skip).limit(limit).all()

    # Agregar nombre del paciente si corresponde
    result = []
    for u in usuarios:
        usuario_dict = {
            "id": u.id,
            "email": u.email,
            "nombre": u.nombre,
            "rol": u.rol,
            "paciente_id": u.paciente_id,
            "activo": u.activo,
            "ultimo_acceso": u.ultimo_acceso,
            "created_at": u.created_at,
            "updated_at": u.updated_at,
            "paciente_nombre": None,
        }
        if u.paciente_id:
            paciente = db.query(Paciente).filter(Paciente.id == u.paciente_id).first()
            if paciente:
                usuario_dict["paciente_nombre"] = f"{paciente.nombre} {paciente.apellido}"
        result.append(usuario_dict)

    return result


@router.post("/", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def crear_usuario(
    data: UsuarioCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Crear nuevo usuario."""
    # Verificar email único
    existente = db.query(Usuario).filter(Usuario.email == data.email).first()
    if existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un usuario con ese email"
        )

    # Si es paciente, verificar que el paciente_id exista
    paciente_nombre = None
    if data.rol == RolUsuario.PACIENTE:
        if not data.paciente_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Los usuarios pacientes deben tener un paciente_id asociado"
            )
        paciente = db.query(Paciente).filter(
            Paciente.id == data.paciente_id,
            Paciente.activo == True
        ).first()
        if not paciente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Paciente no encontrado"
            )
        paciente_nombre = f"{paciente.nombre} {paciente.apellido}"

        # Verificar que el paciente no tenga ya un usuario
        usuario_existente = db.query(Usuario).filter(
            Usuario.paciente_id == data.paciente_id
        ).first()
        if usuario_existente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El paciente ya tiene un usuario asociado"
            )

    usuario = Usuario(
        email=data.email,
        password_hash=hashear_password(data.password),
        nombre=data.nombre,
        rol=data.rol,
        paciente_id=data.paciente_id,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)

    return {
        **usuario.__dict__,
        "paciente_nombre": paciente_nombre,
    }


@router.get("/{usuario_id}", response_model=UsuarioResponse)
def obtener_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Obtener usuario por ID."""
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    paciente_nombre = None
    if usuario.paciente_id:
        paciente = db.query(Paciente).filter(Paciente.id == usuario.paciente_id).first()
        if paciente:
            paciente_nombre = f"{paciente.nombre} {paciente.apellido}"

    return {
        **usuario.__dict__,
        "paciente_nombre": paciente_nombre,
    }


@router.put("/{usuario_id}", response_model=UsuarioResponse)
def actualizar_usuario(
    usuario_id: int,
    data: UsuarioUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Actualizar datos del usuario."""
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    # No permitir desactivar al propio usuario
    if data.activo == False and usuario.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No podés desactivar tu propio usuario"
        )

    # Verificar email único si se está cambiando
    if data.email and data.email != usuario.email:
        existente = db.query(Usuario).filter(Usuario.email == data.email).first()
        if existente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe un usuario con ese email"
            )

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(usuario, field, value)

    db.commit()
    db.refresh(usuario)

    paciente_nombre = None
    if usuario.paciente_id:
        paciente = db.query(Paciente).filter(Paciente.id == usuario.paciente_id).first()
        if paciente:
            paciente_nombre = f"{paciente.nombre} {paciente.apellido}"

    return {
        **usuario.__dict__,
        "paciente_nombre": paciente_nombre,
    }


@router.put("/{usuario_id}/reset-password")
def resetear_password(
    usuario_id: int,
    data: UsuarioResetPassword,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Resetear contraseña de un usuario."""
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    usuario.password_hash = hashear_password(data.password)
    db.commit()

    return {"message": "Contraseña actualizada correctamente"}


@router.delete("/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Desactivar usuario (soft delete)."""
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    # No permitir eliminar al propio usuario
    if usuario.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No podés eliminar tu propio usuario"
        )

    usuario.activo = False
    db.commit()
