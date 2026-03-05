from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import (
    verificar_password,
    crear_token_acceso,
    crear_token_refresh,
    decodificar_token,
    hashear_password,
)
from app.models.usuario import Usuario
from app.schemas.auth import Token, TokenRefresh, UsuarioResponse, CambioPassword
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Any:
    """
    Login para médica o paciente.
    Retorna access_token y refresh_token.
    """
    usuario = db.query(Usuario).filter(
        Usuario.email == form_data.username,
        Usuario.activo == True
    ).first()

    if not usuario or not verificar_password(form_data.password, usuario.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Actualizar último acceso
    usuario.ultimo_acceso = datetime.utcnow()
    db.commit()

    access_token = crear_token_acceso(data={"sub": str(usuario.id)})
    refresh_token = crear_token_refresh(data={"sub": str(usuario.id)})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/refresh", response_model=Token)
def refresh_token(
    token_data: TokenRefresh,
    db: Session = Depends(get_db)
) -> Any:
    """
    Renovar access_token usando refresh_token.
    """
    payload = decodificar_token(token_data.refresh_token)

    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de refresh inválido",
        )

    user_id = payload.get("sub")
    usuario = db.query(Usuario).filter(
        Usuario.id == user_id,
        Usuario.activo == True
    ).first()

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado",
        )

    access_token = crear_token_acceso(data={"sub": str(usuario.id)})
    refresh_token = crear_token_refresh(data={"sub": str(usuario.id)})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.get("/me", response_model=UsuarioResponse)
def get_me(current_user: Usuario = Depends(get_current_user)) -> Any:
    """
    Obtener datos del usuario actual.
    """
    return current_user


@router.put("/change-password")
def change_password(
    data: CambioPassword,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
) -> Any:
    """
    Cambiar contraseña del usuario actual.
    """
    if not verificar_password(data.password_actual, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contraseña actual incorrecta",
        )

    current_user.password_hash = hashear_password(data.password_nuevo)
    db.commit()

    return {"message": "Contraseña actualizada correctamente"}


@router.post("/logout")
def logout(current_user: Usuario = Depends(get_current_user)) -> Any:
    """
    Cerrar sesión (invalidar token del lado del cliente).
    """
    return {"message": "Sesión cerrada correctamente"}
