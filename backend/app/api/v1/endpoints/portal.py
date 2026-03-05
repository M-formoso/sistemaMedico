from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_paciente
from app.models.paciente import Paciente
from app.models.sesion import Sesion
from app.models.foto import Foto
from app.models.pago import Pago

router = APIRouter()


@router.get("/mi-historial")
def obtener_mi_historial(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_paciente)
):
    """Obtener historial clínico propio del paciente."""
    paciente = db.query(Paciente).filter(
        Paciente.id == current_user.paciente_id,
        Paciente.activo == True
    ).first()

    if not paciente:
        raise HTTPException(status_code=404, detail="Perfil de paciente no encontrado")

    return {
        "nombre": paciente.nombre_completo,
        "fecha_nacimiento": paciente.fecha_nacimiento,
        "antecedentes": paciente.antecedentes,
        "alergias": paciente.alergias,
        "medicacion_actual": paciente.medicacion_actual,
    }


@router.get("/mis-sesiones")
def obtener_mis_sesiones(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_paciente)
):
    """Obtener sesiones del paciente."""
    sesiones = db.query(Sesion).filter(
        Sesion.paciente_id == current_user.paciente_id
    ).order_by(Sesion.fecha.desc()).offset(skip).limit(limit).all()

    return [
        {
            "id": s.id,
            "fecha": s.fecha,
            "tratamiento_id": s.tratamiento_id,
            "zona_tratada": s.zona_tratada,
            "estado": s.estado,
            "proxima_sesion": s.proxima_sesion,
        }
        for s in sesiones
    ]


@router.get("/mis-fotos")
def obtener_mis_fotos(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_paciente)
):
    """Obtener fotos autorizadas del paciente."""
    fotos = db.query(Foto).filter(
        Foto.paciente_id == current_user.paciente_id,
        Foto.visible_paciente == True  # Solo fotos autorizadas por la médica
    ).order_by(Foto.fecha.desc()).all()

    return [
        {
            "id": f.id,
            "url": f.url,
            "tipo": f.tipo,
            "zona": f.zona,
            "fecha": f.fecha,
        }
        for f in fotos
    ]


@router.get("/mis-pagos")
def obtener_mis_pagos(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_paciente)
):
    """Obtener historial de pagos del paciente."""
    pagos = db.query(Pago).filter(
        Pago.paciente_id == current_user.paciente_id
    ).order_by(Pago.created_at.desc()).offset(skip).limit(limit).all()

    return [
        {
            "id": p.id,
            "fecha": p.created_at,
            "monto": float(p.monto),
            "moneda": p.moneda,
            "metodo_pago": p.metodo_pago,
            "estado": p.estado,
        }
        for p in pagos
    ]


@router.get("/mi-saldo")
def obtener_mi_saldo(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_paciente)
):
    """Obtener saldo pendiente del paciente."""
    from sqlalchemy import func
    from app.models.pago import EstadoPago
    from decimal import Decimal

    total_pendiente = db.query(func.sum(Pago.monto)).filter(
        Pago.paciente_id == current_user.paciente_id,
        Pago.estado == EstadoPago.PENDIENTE
    ).scalar() or Decimal("0")

    return {
        "saldo_pendiente": float(total_pendiente),
    }
