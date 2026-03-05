from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.db.session import get_db
from app.api.deps import get_current_admin
from app.models.paciente import Paciente
from app.models.sesion import Sesion
from app.models.pago import Pago
from app.models.egreso import Egreso
from app.models.material import Material

router = APIRouter()


@router.get("/pacientes")
def reporte_pacientes(
    fecha_desde: date = Query(None),
    fecha_hasta: date = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Estadísticas de pacientes."""
    query = db.query(Paciente).filter(Paciente.activo == True)

    if fecha_desde:
        query = query.filter(func.date(Paciente.created_at) >= fecha_desde)
    if fecha_hasta:
        query = query.filter(func.date(Paciente.created_at) <= fecha_hasta)

    pacientes = query.all()

    return {
        "total_pacientes": len(pacientes),
        "por_estado": {
            "activo": len([p for p in pacientes if p.estado.value == "activo"]),
            "inactivo": len([p for p in pacientes if p.estado.value == "inactivo"]),
            "nuevo": len([p for p in pacientes if p.estado.value == "nuevo"]),
        },
    }


@router.get("/sesiones")
def reporte_sesiones(
    fecha_desde: date = Query(None),
    fecha_hasta: date = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Estadísticas de sesiones."""
    query = db.query(Sesion)

    if fecha_desde:
        query = query.filter(func.date(Sesion.fecha) >= fecha_desde)
    if fecha_hasta:
        query = query.filter(func.date(Sesion.fecha) <= fecha_hasta)

    sesiones = query.all()

    return {
        "total_sesiones": len(sesiones),
        "por_estado": {
            "programada": len([s for s in sesiones if s.estado.value == "programada"]),
            "realizada": len([s for s in sesiones if s.estado.value == "realizada"]),
            "cancelada": len([s for s in sesiones if s.estado.value == "cancelada"]),
        },
        "costo_materiales_total": sum(float(s.costo_materiales or 0) for s in sesiones),
    }


@router.get("/finanzas")
def reporte_finanzas(
    fecha_desde: date = Query(None),
    fecha_hasta: date = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Reporte financiero completo."""
    # Ingresos (pagos)
    query_pagos = db.query(func.sum(Pago.monto))
    if fecha_desde:
        query_pagos = query_pagos.filter(func.date(Pago.created_at) >= fecha_desde)
    if fecha_hasta:
        query_pagos = query_pagos.filter(func.date(Pago.created_at) <= fecha_hasta)
    ingresos = query_pagos.scalar() or 0

    # Egresos
    query_egresos = db.query(func.sum(Egreso.monto))
    if fecha_desde:
        query_egresos = query_egresos.filter(Egreso.fecha >= fecha_desde)
    if fecha_hasta:
        query_egresos = query_egresos.filter(Egreso.fecha <= fecha_hasta)
    egresos = query_egresos.scalar() or 0

    return {
        "periodo": {
            "desde": fecha_desde.isoformat() if fecha_desde else None,
            "hasta": fecha_hasta.isoformat() if fecha_hasta else None,
        },
        "ingresos": float(ingresos),
        "egresos": float(egresos),
        "balance": float(ingresos - egresos),
    }


@router.get("/materiales")
def reporte_materiales(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Reporte de stock de materiales."""
    materiales = db.query(Material).filter(Material.activo == True).all()

    return {
        "total_items": len(materiales),
        "valor_total_inventario": sum(float(m.valor_stock) for m in materiales),
        "items_stock_bajo": len([m for m in materiales if m.stock_bajo]),
        "por_categoria": {},  # TODO: Agrupar por categoría
    }


@router.post("/historia-clinica/{paciente_id}")
def generar_historia_clinica_pdf(
    paciente_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Generar PDF de historia clínica completa.
    TODO: Implementar generación de PDF con WeasyPrint.
    """
    paciente = db.query(Paciente).filter(
        Paciente.id == paciente_id,
        Paciente.activo == True
    ).first()

    if not paciente:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    # TODO: Implementar generación de PDF
    return {
        "message": "Generación de PDF pendiente de implementar",
        "paciente_id": str(paciente_id),
        "nombre": paciente.nombre_completo,
    }
