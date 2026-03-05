# Crear Endpoint API

Crea un nuevo endpoint FastAPI para el módulo: $ARGUMENTS

## Instrucciones

1. Crear archivo `backend/app/api/v1/endpoints/{nombre}.py` con:
   - Router FastAPI con prefix y tags
   - Endpoints CRUD: GET (list), GET (by id), POST, PUT, DELETE
   - Dependency injection para DB session y usuario actual
   - Validación de permisos por rol (administradora vs paciente)
   - Respuestas HTTP correctas (201 para POST, 204 para DELETE)

2. Crear archivo `backend/app/services/{nombre}_service.py` con:
   - Funciones de lógica de negocio
   - Queries a la base de datos
   - Validaciones de negocio
   - Manejo de transacciones para operaciones críticas

3. Registrar el router en `backend/app/api/v1/api.py`

4. Crear tests en `backend/tests/api/test_{nombre}.py`

## Convenciones

### Estructura del endpoint:
```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.api.deps import get_db, get_current_user
from app.models.usuario import Usuario
from app.schemas.{nombre} import {Nombre}Create, {Nombre}Update, {Nombre}Response
from app.services import {nombre}_service

router = APIRouter()

@router.get("/", response_model=List[{Nombre}Response])
def listar_{nombres}(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Listar todos los {nombres} (solo administradora)."""
    if current_user.rol != "administradora":
        raise HTTPException(status_code=403, detail="No autorizado")
    return {nombre}_service.obtener_todos(db, skip=skip, limit=limit)

@router.post("/", response_model={Nombre}Response, status_code=status.HTTP_201_CREATED)
def crear_{nombre}(
    data: {Nombre}Create,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Crear nuevo {nombre}."""
    return {nombre}_service.crear(db, data, current_user.id)
```

### Validación de acceso paciente:
```python
# Para endpoints del portal del paciente
@router.get("/portal/mis-{nombres}")
def obtener_mis_{nombres}(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    # El paciente SOLO ve sus propios datos
    return {nombre}_service.obtener_por_paciente(db, current_user.paciente_id)
```
