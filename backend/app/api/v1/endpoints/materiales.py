from typing import List, Optional
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_admin
from app.models.material import Material
from app.models.movimiento_stock import MovimientoStock, TipoMovimiento
from app.schemas.material import (
    MaterialCreate, MaterialUpdate, MaterialResponse,
    MovimientoStockCreate, MovimientoStockResponse,
    IngresoStock, AjusteStock, ValorInventario
)

router = APIRouter()


@router.get("/", response_model=List[MaterialResponse])
def listar_materiales(
    skip: int = 0,
    limit: int = 100,
    activo: Optional[bool] = True,
    buscar: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Listar materiales."""
    query = db.query(Material)

    if activo is not None:
        query = query.filter(Material.activo == activo)

    if buscar:
        buscar_like = f"%{buscar}%"
        query = query.filter(
            (Material.nombre.ilike(buscar_like)) |
            (Material.codigo.ilike(buscar_like))
        )

    return query.order_by(Material.nombre).offset(skip).limit(limit).all()


@router.post("/", response_model=MaterialResponse, status_code=status.HTTP_201_CREATED)
def crear_material(
    data: MaterialCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Crear nuevo material."""
    if data.codigo:
        existente = db.query(Material).filter(Material.codigo == data.codigo).first()
        if existente:
            raise HTTPException(status_code=400, detail="Ya existe un material con ese código")

    material = Material(**data.model_dump())
    db.add(material)
    db.commit()
    db.refresh(material)
    return material


@router.get("/stock-bajo", response_model=List[MaterialResponse])
def listar_stock_bajo(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Listar materiales con stock bajo el mínimo."""
    return db.query(Material).filter(
        Material.activo == True,
        Material.stock_actual <= Material.stock_minimo
    ).all()


@router.get("/valor-total", response_model=ValorInventario)
def obtener_valor_inventario(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Obtener valor total del inventario."""
    materiales = db.query(Material).filter(Material.activo == True).all()

    valor_total = sum(m.valor_stock for m in materiales)
    stock_bajo = sum(1 for m in materiales if m.stock_bajo)

    return ValorInventario(
        valor_total=valor_total,
        cantidad_items=len(materiales),
        items_stock_bajo=stock_bajo
    )


@router.get("/{material_id}", response_model=MaterialResponse)
def obtener_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Obtener material por ID."""
    material = db.query(Material).filter(Material.id == material_id, Material.activo == True).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material no encontrado")
    return material


@router.put("/{material_id}", response_model=MaterialResponse)
def actualizar_material(
    material_id: int,
    data: MaterialUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Actualizar material."""
    material = db.query(Material).filter(Material.id == material_id, Material.activo == True).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material no encontrado")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(material, field, value)

    db.commit()
    db.refresh(material)
    return material


@router.delete("/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Eliminar material (soft delete)."""
    material = db.query(Material).filter(Material.id == material_id, Material.activo == True).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material no encontrado")
    material.activo = False
    db.commit()


@router.post("/movimiento", response_model=MovimientoStockResponse, status_code=status.HTTP_201_CREATED)
def registrar_movimiento(
    data: MovimientoStockCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Registrar movimiento de stock (entrada, salida o ajuste)."""
    material = db.query(Material).filter(Material.id == data.material_id, Material.activo == True).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material no encontrado")

    stock_anterior = material.stock_actual
    cantidad = Decimal(str(data.cantidad))

    if data.tipo == TipoMovimiento.ENTRADA:
        material.stock_actual += cantidad
    elif data.tipo == TipoMovimiento.SALIDA:
        if float(material.stock_actual) < float(cantidad):
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente. Disponible: {material.stock_actual}"
            )
        material.stock_actual -= cantidad
    else:  # AJUSTE
        # El ajuste puede ser positivo o negativo, pero el resultado no puede ser negativo
        nuevo_stock = float(material.stock_actual) + float(cantidad)
        if nuevo_stock < 0:
            raise HTTPException(
                status_code=400,
                detail="El ajuste resultaría en stock negativo"
            )
        material.stock_actual = Decimal(str(nuevo_stock))

    movimiento = MovimientoStock(
        material_id=data.material_id,
        tipo=data.tipo,
        cantidad=abs(cantidad),
        stock_anterior=stock_anterior,
        stock_nuevo=material.stock_actual,
        observaciones=data.observaciones,
        created_by=current_user.id,
    )
    db.add(movimiento)
    db.commit()
    db.refresh(movimiento)

    return movimiento


@router.get("/{material_id}/movimientos", response_model=List[MovimientoStockResponse])
def obtener_movimientos(
    material_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Obtener historial de movimientos de un material."""
    return db.query(MovimientoStock).filter(
        MovimientoStock.material_id == material_id
    ).order_by(MovimientoStock.created_at.desc()).offset(skip).limit(limit).all()
