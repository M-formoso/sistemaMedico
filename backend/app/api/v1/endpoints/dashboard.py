from datetime import datetime, date, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.db.session import get_db
from app.api.deps import get_current_admin
from app.models.sesion import Sesion, EstadoSesion
from app.models.pago import Pago, EstadoPago
from app.models.material import Material
from app.models.egreso import Egreso

router = APIRouter()


@router.get("/resumen-dia")
def obtener_resumen_dia(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Resumen operativo del día."""
    hoy = date.today()
    inicio_dia = datetime.combine(hoy, datetime.min.time())
    fin_dia = datetime.combine(hoy, datetime.max.time())

    # Sesiones del día
    sesiones_hoy = db.query(Sesion).filter(
        and_(Sesion.fecha >= inicio_dia, Sesion.fecha <= fin_dia)
    ).all()

    total_sesiones = len(sesiones_hoy)
    sesiones_realizadas = len([s for s in sesiones_hoy if s.estado == EstadoSesion.REALIZADA])
    sesiones_pendientes = len([s for s in sesiones_hoy if s.estado == EstadoSesion.PROGRAMADA])

    # Ingresos del día
    pagos_hoy = db.query(func.sum(Pago.monto)).filter(
        and_(Pago.created_at >= inicio_dia, Pago.created_at <= fin_dia)
    ).scalar() or Decimal("0")

    return {
        "fecha": hoy.isoformat(),
        "sesiones": {
            "total": total_sesiones,
            "realizadas": sesiones_realizadas,
            "pendientes": sesiones_pendientes,
        },
        "ingresos_dia": float(pagos_hoy),
        "proximas_sesiones": [
            {
                "id": s.id,
                "hora": s.fecha.strftime("%H:%M"),
                "paciente_id": s.paciente_id,
                "tratamiento_id": s.tratamiento_id,
            }
            for s in sesiones_hoy if s.estado == EstadoSesion.PROGRAMADA
        ][:5],
    }


@router.get("/alertas")
def obtener_alertas(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Alertas activas del sistema."""
    # Materiales con stock bajo
    materiales_bajo = db.query(Material).filter(
        Material.activo == True,
        Material.stock_actual <= Material.stock_minimo
    ).all()

    # Pagos pendientes
    pagos_pendientes = db.query(Pago).filter(
        Pago.estado == EstadoPago.PENDIENTE
    ).count()

    # Materiales próximos a vencer (30 días)
    fecha_limite = date.today() + timedelta(days=30)
    materiales_vencimiento = db.query(Material).filter(
        Material.activo == True,
        Material.fecha_vencimiento <= fecha_limite,
        Material.fecha_vencimiento >= date.today()
    ).all()

    return {
        "stock_bajo": [
            {"id": m.id, "nombre": m.nombre, "stock_actual": float(m.stock_actual), "stock_minimo": float(m.stock_minimo)}
            for m in materiales_bajo
        ],
        "pagos_pendientes": pagos_pendientes,
        "materiales_por_vencer": [
            {"id": m.id, "nombre": m.nombre, "fecha_vencimiento": m.fecha_vencimiento.isoformat()}
            for m in materiales_vencimiento
        ],
    }


@router.get("/estadisticas-mes")
def obtener_estadisticas_mes(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Estadísticas del mes actual."""
    hoy = date.today()
    inicio_mes = hoy.replace(day=1)
    if hoy.month == 12:
        fin_mes = hoy.replace(year=hoy.year + 1, month=1, day=1) - timedelta(days=1)
    else:
        fin_mes = hoy.replace(month=hoy.month + 1, day=1) - timedelta(days=1)

    # Ingresos del mes
    ingresos = db.query(func.sum(Pago.monto)).filter(
        and_(
            func.date(Pago.created_at) >= inicio_mes,
            func.date(Pago.created_at) <= fin_mes
        )
    ).scalar() or Decimal("0")

    # Egresos del mes
    egresos = db.query(func.sum(Egreso.monto)).filter(
        and_(Egreso.fecha >= inicio_mes, Egreso.fecha <= fin_mes)
    ).scalar() or Decimal("0")

    # Sesiones del mes
    sesiones_mes = db.query(Sesion).filter(
        and_(
            func.date(Sesion.fecha) >= inicio_mes,
            func.date(Sesion.fecha) <= fin_mes
        )
    ).count()

    # Valor del inventario
    materiales = db.query(Material).filter(Material.activo == True).all()
    valor_inventario = sum(m.valor_stock for m in materiales)

    return {
        "periodo": f"{inicio_mes.isoformat()} - {fin_mes.isoformat()}",
        "ingresos": float(ingresos),
        "egresos": float(egresos),
        "balance": float(ingresos - egresos),
        "sesiones_realizadas": sesiones_mes,
        "valor_inventario": float(valor_inventario),
    }
