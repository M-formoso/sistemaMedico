from typing import List, Optional
from datetime import date, datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_admin
from app.models.sesion import Sesion, SesionMaterial, EstadoSesion
from app.models.material import Material
from app.models.movimiento_stock import MovimientoStock, TipoMovimiento
from app.schemas.sesion import (
    SesionCreate, SesionUpdate, SesionResponse,
    AsignarMaterial, CambiarEstado
)

router = APIRouter()


@router.get("/", response_model=List[SesionResponse])
def listar_sesiones(
    skip: int = 0,
    limit: int = 100,
    paciente_id: Optional[int] = None,
    estado: Optional[EstadoSesion] = None,
    fecha: Optional[date] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Listar sesiones con filtros opcionales."""
    query = db.query(Sesion)

    if paciente_id:
        query = query.filter(Sesion.paciente_id == paciente_id)
    if estado:
        query = query.filter(Sesion.estado == estado)
    # Filtro por fecha exacta
    if fecha:
        query = query.filter(Sesion.fecha == fecha)
    # Filtros por rango de fechas (para calendario)
    if fecha_desde:
        query = query.filter(Sesion.fecha >= fecha_desde)
    if fecha_hasta:
        query = query.filter(Sesion.fecha <= fecha_hasta)
    # Mantener compatibilidad con fecha_inicio/fecha_fin
    if fecha_inicio:
        query = query.filter(Sesion.fecha >= fecha_inicio)
    if fecha_fin:
        query = query.filter(Sesion.fecha <= fecha_fin)

    return query.order_by(Sesion.fecha.desc(), Sesion.hora_inicio).offset(skip).limit(limit).all()


@router.post("/", response_model=SesionResponse, status_code=status.HTTP_201_CREATED)
def crear_sesion(
    data: SesionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Crear nueva sesión clínica.
    Si se incluyen materiales, se descuenta automáticamente el stock.
    """
    sesion_data = data.model_dump(exclude={"materiales"})
    sesion = Sesion(**sesion_data, created_by=current_user.id)
    db.add(sesion)
    db.flush()

    # Procesar materiales si se incluyen
    if data.materiales:
        for mat in data.materiales:
            material = db.query(Material).filter(
                Material.id == mat.material_id,
                Material.activo == True
            ).first()

            if not material:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Material {mat.material_id} no encontrado"
                )

            if float(material.stock_actual) < float(mat.cantidad):
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Stock insuficiente de {material.nombre}. Disponible: {material.stock_actual}"
                )

            stock_anterior = material.stock_actual
            material.stock_actual -= Decimal(str(mat.cantidad))

            # Crear relación sesión-material
            sesion_material = SesionMaterial(
                sesion_id=sesion.id,
                material_id=mat.material_id,
                cantidad=mat.cantidad,
                costo_unitario=material.precio_costo,
            )
            db.add(sesion_material)

            # Crear movimiento de stock
            movimiento = MovimientoStock(
                material_id=mat.material_id,
                tipo=TipoMovimiento.SALIDA,
                cantidad=mat.cantidad,
                stock_anterior=stock_anterior,
                stock_nuevo=material.stock_actual,
                referencia_tipo="sesion",
                referencia_id=sesion.id,
                observaciones=f"Uso en sesión #{sesion.id}",
                created_by=current_user.id,
            )
            db.add(movimiento)

    db.commit()
    db.refresh(sesion)
    return sesion


@router.get("/agenda/hoy", response_model=List[SesionResponse])
def obtener_agenda_hoy(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Obtener sesiones programadas para hoy."""
    hoy = date.today()
    sesiones = db.query(Sesion).filter(
        Sesion.fecha == hoy
    ).order_by(Sesion.hora_inicio).all()

    return sesiones


@router.get("/{sesion_id}", response_model=SesionResponse)
def obtener_sesion(
    sesion_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Obtener sesión por ID."""
    sesion = db.query(Sesion).filter(Sesion.id == sesion_id).first()

    if not sesion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sesión no encontrada"
        )

    return sesion


@router.put("/{sesion_id}", response_model=SesionResponse)
def actualizar_sesion(
    sesion_id: int,
    data: SesionUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Actualizar datos de la sesión."""
    sesion = db.query(Sesion).filter(Sesion.id == sesion_id).first()

    if not sesion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sesión no encontrada"
        )

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(sesion, field, value)

    db.commit()
    db.refresh(sesion)
    return sesion


@router.delete("/{sesion_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_sesion(
    sesion_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Eliminar sesión."""
    sesion = db.query(Sesion).filter(Sesion.id == sesion_id).first()

    if not sesion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sesión no encontrada"
        )

    # Solo se pueden eliminar sesiones programadas o canceladas
    if sesion.estado not in [EstadoSesion.PROGRAMADA, EstadoSesion.CANCELADA]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se pueden eliminar sesiones programadas o canceladas"
        )

    db.delete(sesion)
    db.commit()


@router.patch("/{sesion_id}/estado", response_model=SesionResponse)
def cambiar_estado_sesion(
    sesion_id: int,
    data: CambiarEstado,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Cambiar el estado de una sesión."""
    sesion = db.query(Sesion).filter(Sesion.id == sesion_id).first()

    if not sesion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sesión no encontrada"
        )

    sesion.estado = data.estado
    db.commit()
    db.refresh(sesion)
    return sesion


@router.post("/{sesion_id}/materiales", response_model=SesionResponse)
def asignar_materiales(
    sesion_id: int,
    materiales: List[AsignarMaterial],
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Asignar materiales adicionales a una sesión existente.
    Descuenta automáticamente el stock.
    """
    sesion = db.query(Sesion).filter(Sesion.id == sesion_id).first()

    if not sesion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sesión no encontrada"
        )

    for mat in materiales:
        material = db.query(Material).filter(
            Material.id == mat.material_id,
            Material.activo == True
        ).first()

        if not material:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Material {mat.material_id} no encontrado"
            )

        if float(material.stock_actual) < float(mat.cantidad):
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stock insuficiente de {material.nombre}"
            )

        stock_anterior = material.stock_actual
        material.stock_actual -= Decimal(str(mat.cantidad))

        sesion_material = SesionMaterial(
            sesion_id=sesion.id,
            material_id=mat.material_id,
            cantidad=mat.cantidad,
            costo_unitario=material.precio_costo,
        )
        db.add(sesion_material)

        movimiento = MovimientoStock(
            material_id=mat.material_id,
            tipo=TipoMovimiento.SALIDA,
            cantidad=mat.cantidad,
            stock_anterior=stock_anterior,
            stock_nuevo=material.stock_actual,
            referencia_tipo="sesion",
            referencia_id=sesion.id,
            observaciones=f"Uso adicional en sesión #{sesion.id}",
            created_by=current_user.id,
        )
        db.add(movimiento)

    db.commit()
    db.refresh(sesion)
    return sesion
