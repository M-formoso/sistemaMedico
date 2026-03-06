from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from decimal import Decimal

from app.db.session import get_db
from app.api.deps import get_current_paciente
from app.models.paciente import Paciente
from app.models.sesion import Sesion
from app.models.tratamiento import Tratamiento
from app.models.foto import Foto
from app.models.pago import Pago, EstadoPago

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

    # Obtener tratamientos únicos del paciente basados en sus sesiones
    sesiones = db.query(Sesion).options(
        joinedload(Sesion.tratamiento)
    ).filter(
        Sesion.paciente_id == current_user.paciente_id
    ).all()

    # Agrupar por tratamiento
    tratamientos_dict = {}
    for s in sesiones:
        if s.tratamiento_id not in tratamientos_dict:
            tratamientos_dict[s.tratamiento_id] = {
                "id": s.tratamiento_id,
                "tipo_tratamiento_nombre": s.tratamiento.nombre if s.tratamiento else "Tratamiento",
                "fecha_inicio": s.fecha,
                "estado": "en_curso",
                "sesiones_realizadas": 0,
                "total_sesiones": s.tratamiento.sesiones_recomendadas if s.tratamiento else 1,
            }

        # Actualizar fecha más antigua
        if s.fecha < tratamientos_dict[s.tratamiento_id]["fecha_inicio"]:
            tratamientos_dict[s.tratamiento_id]["fecha_inicio"] = s.fecha

        # Contar sesiones completadas
        if s.estado == "completada":
            tratamientos_dict[s.tratamiento_id]["sesiones_realizadas"] += 1

    # Determinar estado de cada tratamiento
    for t_id, t_data in tratamientos_dict.items():
        if t_data["sesiones_realizadas"] >= t_data["total_sesiones"]:
            t_data["estado"] = "completado"

    tratamientos_data = list(tratamientos_dict.values())

    return {
        "id": paciente.id,
        "nombre": paciente.nombre,
        "apellido": paciente.apellido,
        "email": paciente.email,
        "telefono": paciente.telefono,
        "fecha_nacimiento": paciente.fecha_nacimiento,
        "direccion": paciente.direccion,
        "antecedentes": paciente.antecedentes,
        "alergias": paciente.alergias,
        "medicacion_actual": paciente.medicacion_actual,
        "notas_medicas": paciente.notas,
        "tratamientos": tratamientos_data,
    }


@router.get("/mis-sesiones")
def obtener_mis_sesiones(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_paciente)
):
    """Obtener sesiones del paciente."""
    sesiones = db.query(Sesion).options(
        joinedload(Sesion.tratamiento)
    ).filter(
        Sesion.paciente_id == current_user.paciente_id
    ).order_by(Sesion.fecha.desc()).offset(skip).limit(limit).all()

    return [
        {
            "id": s.id,
            "fecha": s.fecha,
            "hora_inicio": str(s.hora_inicio) if s.hora_inicio else None,
            "hora_fin": str(s.hora_fin) if s.hora_fin else None,
            "tratamiento_id": s.tratamiento_id,
            "zona_tratada": s.tratamiento.zona_corporal if s.tratamiento else None,
            "estado": s.estado.value if hasattr(s.estado, 'value') else s.estado,
            "notas": s.notas,
        }
        for s in sesiones
    ]


@router.get("/mis-fotos")
def obtener_mis_fotos(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_paciente)
):
    """Obtener fotos autorizadas del paciente."""
    fotos = db.query(Foto).options(
        joinedload(Foto.sesion).joinedload(Sesion.tratamiento)
    ).filter(
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
            "tratamiento_nombre": f.sesion.tratamiento.nombre if f.sesion and f.sesion.tratamiento else None,
            "notas": f.notas,
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
    pagos = db.query(Pago).options(
        joinedload(Pago.sesion).joinedload(Sesion.tratamiento)
    ).filter(
        Pago.paciente_id == current_user.paciente_id
    ).order_by(Pago.created_at.desc()).offset(skip).limit(limit).all()

    return [
        {
            "id": p.id,
            "fecha": p.created_at,
            "monto": float(p.monto),
            "moneda": p.moneda,
            "metodo_pago": p.metodo_pago,
            "estado": p.estado.value if hasattr(p.estado, 'value') else p.estado,
            "tratamiento_nombre": p.sesion.tratamiento.nombre if p.sesion and p.sesion.tratamiento else None,
        }
        for p in pagos
    ]


@router.get("/mi-saldo")
def obtener_mi_saldo(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_paciente)
):
    """Obtener saldo pendiente del paciente."""
    total_pendiente = db.query(func.sum(Pago.monto)).filter(
        Pago.paciente_id == current_user.paciente_id,
        Pago.estado == EstadoPago.PENDIENTE
    ).scalar() or Decimal("0")

    total_pagado = db.query(func.sum(Pago.monto)).filter(
        Pago.paciente_id == current_user.paciente_id,
        Pago.estado == EstadoPago.PAGADO
    ).scalar() or Decimal("0")

    # Total cobrado en sesiones
    total_tratamientos = db.query(func.sum(Sesion.precio_cobrado)).filter(
        Sesion.paciente_id == current_user.paciente_id,
        Sesion.precio_cobrado != None
    ).scalar() or Decimal("0")

    return {
        "saldo_pendiente": float(total_pendiente),
        "total_pagado": float(total_pagado),
        "total_tratamientos": float(total_tratamientos),
    }
