# Crear Service Backend

Crea un servicio de lógica de negocio para: $ARGUMENTS

## Instrucciones

1. Crear archivo `backend/app/services/{nombre}_service.py` con:
   - Funciones CRUD básicas
   - Lógica de negocio específica del módulo
   - Validaciones de datos
   - Manejo de errores con HTTPException
   - Transacciones para operaciones que afectan múltiples tablas

## Estructura del Service

```python
from sqlalchemy.orm import Session
from sqlalchemy import and_
from fastapi import HTTPException, status
from typing import List, Optional
from uuid import UUID
from decimal import Decimal

from app.models.{nombre} import {Nombre}
from app.schemas.{nombre} import {Nombre}Create, {Nombre}Update


def obtener_todos(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    solo_activos: bool = True
) -> List[{Nombre}]:
    """Obtener todos los {nombres} con paginación."""
    query = db.query({Nombre})
    if solo_activos:
        query = query.filter({Nombre}.activo == True)
    return query.offset(skip).limit(limit).all()


def obtener_por_id(db: Session, id: UUID) -> Optional[{Nombre}]:
    """Obtener {nombre} por ID."""
    return db.query({Nombre}).filter(
        and_({Nombre}.id == id, {Nombre}.activo == True)
    ).first()


def crear(
    db: Session,
    data: {Nombre}Create,
    usuario_id: UUID
) -> {Nombre}:
    """Crear nuevo {nombre}."""
    db_obj = {Nombre}(**data.model_dump(), created_by=usuario_id)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def actualizar(
    db: Session,
    id: UUID,
    data: {Nombre}Update
) -> {Nombre}:
    """Actualizar {nombre} existente."""
    db_obj = obtener_por_id(db, id)
    if not db_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="{Nombre} no encontrado"
        )

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)

    db.commit()
    db.refresh(db_obj)
    return db_obj


def eliminar(db: Session, id: UUID) -> None:
    """Soft delete de {nombre}."""
    db_obj = obtener_por_id(db, id)
    if not db_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="{Nombre} no encontrado"
        )

    db_obj.activo = False
    db.commit()
```

## Ejemplo: Service con Transacciones (Sesiones con Materiales)

```python
def registrar_sesion_con_materiales(
    db: Session,
    sesion_data: SesionCreate,
    materiales: List[MaterialSesion],
    usuario_id: UUID
) -> Sesion:
    """
    Registra una sesión y descuenta automáticamente el stock.

    CRÍTICO: Esta operación debe ser atómica.
    """
    try:
        # 1. Crear la sesión
        sesion = Sesion(**sesion_data.model_dump(), created_by=usuario_id)
        db.add(sesion)
        db.flush()  # Obtener ID sin commit

        costo_total = Decimal("0")

        # 2. Procesar cada material
        for mat in materiales:
            material = db.query(Material).filter(Material.id == mat.material_id).first()

            if material.stock_actual < mat.cantidad:
                raise HTTPException(
                    status_code=400,
                    detail=f"Stock insuficiente de {material.nombre}"
                )

            # Descontar stock
            material.stock_actual -= mat.cantidad

            # Registrar movimiento
            movimiento = MovimientoStock(
                material_id=material.id,
                tipo="egreso",
                cantidad=mat.cantidad,
                referencia_tipo="sesion",
                referencia_id=sesion.id,
                costo_total=mat.cantidad * material.precio_costo,
                usuario_id=usuario_id
            )
            db.add(movimiento)

            costo_total += mat.cantidad * material.precio_costo

        sesion.costo_materiales = costo_total
        db.commit()
        db.refresh(sesion)
        return sesion

    except Exception as e:
        db.rollback()
        raise
```
