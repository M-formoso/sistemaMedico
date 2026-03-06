from typing import List, Optional
from datetime import date, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

from app.db.session import get_db
from app.api.deps import get_current_admin
from app.models.presupuesto import Presupuesto, EstadoPresupuesto
from app.models.paciente import Paciente

router = APIRouter()


# Schemas
class ItemPresupuesto(BaseModel):
    descripcion: str
    cantidad: int = 1
    precio_unitario: Decimal
    subtotal: Decimal


class PresupuestoBase(BaseModel):
    fecha: date
    valido_hasta: Optional[date] = None
    items: List[ItemPresupuesto] = []
    subtotal: Decimal = Decimal("0")
    descuento_porcentaje: Optional[Decimal] = Decimal("0")
    descuento_monto: Optional[Decimal] = Decimal("0")
    total: Decimal = Decimal("0")
    notas: Optional[str] = None
    condiciones: Optional[str] = None
    estado: Optional[EstadoPresupuesto] = EstadoPresupuesto.BORRADOR


class PresupuestoCreate(PresupuestoBase):
    paciente_id: int


class PresupuestoUpdate(BaseModel):
    fecha: Optional[date] = None
    valido_hasta: Optional[date] = None
    items: Optional[List[ItemPresupuesto]] = None
    subtotal: Optional[Decimal] = None
    descuento_porcentaje: Optional[Decimal] = None
    descuento_monto: Optional[Decimal] = None
    total: Optional[Decimal] = None
    notas: Optional[str] = None
    condiciones: Optional[str] = None
    estado: Optional[EstadoPresupuesto] = None


class PresupuestoResponse(PresupuestoBase):
    id: int
    paciente_id: int
    numero: str
    fecha_respuesta: Optional[date] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


def generar_numero_presupuesto(db: Session) -> str:
    """Genera número único de presupuesto con formato PRES-YYYYMMDD-XXX."""
    hoy = date.today()
    prefijo = f"PRES-{hoy.strftime('%Y%m%d')}-"

    # Buscar el último presupuesto del día
    ultimo = db.query(Presupuesto).filter(
        Presupuesto.numero.like(f"{prefijo}%")
    ).order_by(Presupuesto.numero.desc()).first()

    if ultimo:
        ultimo_num = int(ultimo.numero.split("-")[-1])
        nuevo_num = ultimo_num + 1
    else:
        nuevo_num = 1

    return f"{prefijo}{nuevo_num:03d}"


@router.get("/paciente/{paciente_id}", response_model=List[PresupuestoResponse])
def listar_presupuestos_paciente(
    paciente_id: int,
    estado: Optional[EstadoPresupuesto] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Listar presupuestos de un paciente."""
    query = db.query(Presupuesto).filter(Presupuesto.paciente_id == paciente_id)

    if estado:
        query = query.filter(Presupuesto.estado == estado)

    presupuestos = query.order_by(Presupuesto.fecha.desc()).offset(skip).limit(limit).all()
    return presupuestos


@router.get("/", response_model=List[PresupuestoResponse])
def listar_presupuestos(
    estado: Optional[EstadoPresupuesto] = None,
    desde: Optional[date] = None,
    hasta: Optional[date] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Listar todos los presupuestos con filtros."""
    query = db.query(Presupuesto)

    if estado:
        query = query.filter(Presupuesto.estado == estado)
    if desde:
        query = query.filter(Presupuesto.fecha >= desde)
    if hasta:
        query = query.filter(Presupuesto.fecha <= hasta)

    presupuestos = query.order_by(Presupuesto.fecha.desc()).offset(skip).limit(limit).all()
    return presupuestos


@router.post("/", response_model=PresupuestoResponse, status_code=status.HTTP_201_CREATED)
def crear_presupuesto(
    data: PresupuestoCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Crear nuevo presupuesto."""
    paciente = db.query(Paciente).filter(Paciente.id == data.paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    numero = generar_numero_presupuesto(db)

    # Convertir items a dict para JSON
    items_dict = [item.model_dump() for item in data.items] if data.items else []

    presupuesto = Presupuesto(
        paciente_id=data.paciente_id,
        numero=numero,
        fecha=data.fecha,
        valido_hasta=data.valido_hasta or (data.fecha + timedelta(days=30)),
        items=items_dict,
        subtotal=data.subtotal,
        descuento_porcentaje=data.descuento_porcentaje,
        descuento_monto=data.descuento_monto,
        total=data.total,
        notas=data.notas,
        condiciones=data.condiciones,
        estado=data.estado,
        created_by=current_user.id
    )
    db.add(presupuesto)
    db.commit()
    db.refresh(presupuesto)

    return presupuesto


@router.get("/{presupuesto_id}", response_model=PresupuestoResponse)
def obtener_presupuesto(
    presupuesto_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Obtener un presupuesto por ID."""
    presupuesto = db.query(Presupuesto).filter(Presupuesto.id == presupuesto_id).first()

    if not presupuesto:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")

    return presupuesto


@router.get("/numero/{numero}", response_model=PresupuestoResponse)
def obtener_presupuesto_por_numero(
    numero: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Obtener un presupuesto por número."""
    presupuesto = db.query(Presupuesto).filter(Presupuesto.numero == numero).first()

    if not presupuesto:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")

    return presupuesto


@router.put("/{presupuesto_id}", response_model=PresupuestoResponse)
def actualizar_presupuesto(
    presupuesto_id: int,
    data: PresupuestoUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Actualizar un presupuesto."""
    presupuesto = db.query(Presupuesto).filter(Presupuesto.id == presupuesto_id).first()

    if not presupuesto:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")

    update_data = data.model_dump(exclude_unset=True)

    # Convertir items a dict si están presentes
    if "items" in update_data and update_data["items"]:
        update_data["items"] = [item.model_dump() if hasattr(item, 'model_dump') else item for item in update_data["items"]]

    for field, value in update_data.items():
        setattr(presupuesto, field, value)

    db.commit()
    db.refresh(presupuesto)

    return presupuesto


@router.post("/{presupuesto_id}/enviar", response_model=PresupuestoResponse)
def enviar_presupuesto(
    presupuesto_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Marcar presupuesto como enviado."""
    presupuesto = db.query(Presupuesto).filter(Presupuesto.id == presupuesto_id).first()

    if not presupuesto:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")

    presupuesto.estado = EstadoPresupuesto.ENVIADO
    db.commit()
    db.refresh(presupuesto)

    return presupuesto


@router.post("/{presupuesto_id}/aprobar", response_model=PresupuestoResponse)
def aprobar_presupuesto(
    presupuesto_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Marcar presupuesto como aprobado."""
    presupuesto = db.query(Presupuesto).filter(Presupuesto.id == presupuesto_id).first()

    if not presupuesto:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")

    presupuesto.estado = EstadoPresupuesto.APROBADO
    presupuesto.fecha_respuesta = date.today()
    db.commit()
    db.refresh(presupuesto)

    return presupuesto


@router.post("/{presupuesto_id}/rechazar", response_model=PresupuestoResponse)
def rechazar_presupuesto(
    presupuesto_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Marcar presupuesto como rechazado."""
    presupuesto = db.query(Presupuesto).filter(Presupuesto.id == presupuesto_id).first()

    if not presupuesto:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")

    presupuesto.estado = EstadoPresupuesto.RECHAZADO
    presupuesto.fecha_respuesta = date.today()
    db.commit()
    db.refresh(presupuesto)

    return presupuesto


@router.delete("/{presupuesto_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_presupuesto(
    presupuesto_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Eliminar un presupuesto."""
    presupuesto = db.query(Presupuesto).filter(Presupuesto.id == presupuesto_id).first()

    if not presupuesto:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")

    db.delete(presupuesto)
    db.commit()
