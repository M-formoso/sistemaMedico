from typing import Generator, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import decodificar_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    """
    Obtiene el usuario actual a partir del token JWT.

    Raises:
        HTTPException 401: Si el token es inválido o el usuario no existe
    """
    from app.models.usuario import Usuario

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decodificar_token(token)
    if payload is None:
        raise credentials_exception

    user_id = payload.get("sub")
    token_type = payload.get("type")

    if user_id is None or token_type != "access":
        raise credentials_exception

    try:
        user_id_int = int(user_id)
    except ValueError:
        raise credentials_exception

    usuario = db.query(Usuario).filter(Usuario.id == user_id_int, Usuario.activo == True).first()

    if usuario is None:
        raise credentials_exception

    return usuario


def get_current_admin(current_user = Depends(get_current_user)):
    """
    Verifica que el usuario actual sea administradora.

    Raises:
        HTTPException 403: Si el usuario no es administradora
    """
    if current_user.rol != "administradora":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para realizar esta acción"
        )
    return current_user


def get_current_paciente(current_user = Depends(get_current_user)):
    """
    Verifica que el usuario actual sea paciente y retorna su paciente_id.

    Raises:
        HTTPException 403: Si el usuario no es paciente
    """
    if current_user.rol != "paciente":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso solo para pacientes"
        )

    if current_user.paciente_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario paciente sin perfil asociado"
        )

    return current_user
