from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, case

from app.db.session import get_db
from app.api.deps import get_current_admin
from app.models.sesion import Sesion, EstadoSesion
from app.models.pago import Pago
from app.models.material import Material
from app.models.egreso import Egreso
from app.models.paciente import Paciente
from app.models.tratamiento import Tratamiento

router = APIRouter()


@router.get("/resumen-dia")
def obtener_resumen_dia(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Resumen operativo del día."""
    hoy = date.today()

    # Sesiones del día
    sesiones_hoy = db.query(Sesion).filter(
        Sesion.fecha == hoy
    ).all()

    total_sesiones = len(sesiones_hoy)
    sesiones_completadas = len([s for s in sesiones_hoy if s.estado == EstadoSesion.COMPLETADA])
    sesiones_pendientes = len([s for s in sesiones_hoy if s.estado == EstadoSesion.PROGRAMADA])

    # Ingresos del día
    pagos_hoy = db.query(func.sum(Pago.monto)).filter(
        Pago.fecha == hoy
    ).scalar() or Decimal("0")

    return {
        "fecha": hoy.isoformat(),
        "sesiones": {
            "total": total_sesiones,
            "completadas": sesiones_completadas,
            "pendientes": sesiones_pendientes,
        },
        "ingresos_dia": float(pagos_hoy),
        "proximas_sesiones": [
            {
                "id": s.id,
                "hora": s.hora_inicio.strftime("%H:%M") if s.hora_inicio else "Sin hora",
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

    return {
        "stock_bajo": [
            {"id": m.id, "nombre": m.nombre, "stock_actual": float(m.stock_actual), "stock_minimo": float(m.stock_minimo)}
            for m in materiales_bajo
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
            Pago.fecha >= inicio_mes,
            Pago.fecha <= fin_mes
        )
    ).scalar() or Decimal("0")

    # Egresos del mes
    egresos = db.query(func.sum(Egreso.monto)).filter(
        and_(Egreso.fecha >= inicio_mes, Egreso.fecha <= fin_mes)
    ).scalar() or Decimal("0")

    # Sesiones del mes
    sesiones_mes = db.query(Sesion).filter(
        and_(
            Sesion.fecha >= inicio_mes,
            Sesion.fecha <= fin_mes
        )
    ).count()

    # Valor del inventario
    valor_inventario = db.query(
        func.sum(Material.stock_actual * Material.precio_costo)
    ).filter(Material.activo == True).scalar() or Decimal("0")

    return {
        "periodo": f"{inicio_mes.isoformat()} - {fin_mes.isoformat()}",
        "ingresos": float(ingresos),
        "egresos": float(egresos),
        "balance": float(ingresos - egresos),
        "sesiones_realizadas": sesiones_mes,
        "valor_inventario": float(valor_inventario),
    }


@router.get("/estadisticas-avanzadas")
def obtener_estadisticas_avanzadas(
    fecha_inicio: Optional[str] = Query(None),
    fecha_fin: Optional[str] = Query(None),
    profesional_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Estadísticas avanzadas con filtros."""
    hoy = date.today()

    # Fechas por defecto: mes actual
    if fecha_inicio:
        inicio = date.fromisoformat(fecha_inicio)
    else:
        inicio = hoy.replace(day=1)

    if fecha_fin:
        fin = date.fromisoformat(fecha_fin)
    else:
        if hoy.month == 12:
            fin = hoy.replace(year=hoy.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            fin = hoy.replace(month=hoy.month + 1, day=1) - timedelta(days=1)

    # Filtro base de sesiones
    sesiones_query = db.query(Sesion).filter(
        and_(Sesion.fecha >= inicio, Sesion.fecha <= fin)
    )

    if profesional_id:
        sesiones_query = sesiones_query.filter(Sesion.profesional_id == profesional_id)

    sesiones = sesiones_query.all()
    total_sesiones = len(sesiones)

    # Ausentismo: sesiones con estado "no_asistio" o "cancelada"
    no_asistio = len([s for s in sesiones if s.estado == EstadoSesion.NO_ASISTIO])
    canceladas = len([s for s in sesiones if s.estado == EstadoSesion.CANCELADA])
    completadas = len([s for s in sesiones if s.estado == EstadoSesion.COMPLETADA])

    tasa_ausentismo = (no_asistio / total_sesiones * 100) if total_sesiones > 0 else 0
    tasa_cancelacion = (canceladas / total_sesiones * 100) if total_sesiones > 0 else 0
    tasa_asistencia = (completadas / total_sesiones * 100) if total_sesiones > 0 else 0

    # Top 5 tratamientos/prestaciones
    tratamientos_count = {}
    for s in sesiones:
        if s.tratamiento_id:
            tratamientos_count[s.tratamiento_id] = tratamientos_count.get(s.tratamiento_id, 0) + 1

    top_tratamientos = []
    if tratamientos_count:
        sorted_tratamientos = sorted(tratamientos_count.items(), key=lambda x: x[1], reverse=True)[:5]
        tratamiento_ids = [t[0] for t in sorted_tratamientos]
        tratamientos_db = db.query(Tratamiento).filter(Tratamiento.id.in_(tratamiento_ids)).all()
        tratamientos_map = {t.id: t.nombre for t in tratamientos_db}

        top_tratamientos = [
            {"id": t_id, "nombre": tratamientos_map.get(t_id, "Desconocido"), "cantidad": count}
            for t_id, count in sorted_tratamientos
        ]

    # Turnos perdidos (ingresos perdidos por cancelaciones y no asistencias)
    sesiones_perdidas = [s for s in sesiones if s.estado in [EstadoSesion.NO_ASISTIO, EstadoSesion.CANCELADA]]
    monto_perdido = Decimal("0")
    for s in sesiones_perdidas:
        if s.tratamiento_id:
            tratamiento = db.query(Tratamiento).filter(Tratamiento.id == s.tratamiento_id).first()
            if tratamiento and tratamiento.precio_lista:
                monto_perdido += tratamiento.precio_lista

    # Pacientes nuevos en el período
    pacientes_nuevos = db.query(Paciente).filter(
        and_(
            Paciente.created_at >= inicio,
            Paciente.created_at <= fin + timedelta(days=1)
        )
    ).count()

    # Total de pacientes
    pacientes_total = db.query(Paciente).filter(Paciente.activo == True).count()

    return {
        "periodo": {
            "inicio": inicio.isoformat(),
            "fin": fin.isoformat(),
        },
        "sesiones": {
            "total": total_sesiones,
            "completadas": completadas,
            "canceladas": canceladas,
            "no_asistio": no_asistio,
        },
        "tasas": {
            "asistencia": round(tasa_asistencia, 1),
            "ausentismo": round(tasa_ausentismo, 1),
            "cancelacion": round(tasa_cancelacion, 1),
        },
        "top_tratamientos": top_tratamientos,
        "turnos_perdidos": {
            "cantidad": no_asistio + canceladas,
            "monto_estimado": float(monto_perdido),
        },
        "pacientes": {
            "total": pacientes_total,
            "nuevos_periodo": pacientes_nuevos,
        },
    }


@router.get("/lista-espera-count")
def obtener_lista_espera_count(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Cantidad de pacientes en lista de espera."""
    from app.models.configuracion import ListaEspera

    count = db.query(ListaEspera).filter(ListaEspera.atendido == False).count()

    # Por prioridad
    urgentes = db.query(ListaEspera).filter(
        and_(ListaEspera.atendido == False, ListaEspera.prioridad == 2)
    ).count()

    altas = db.query(ListaEspera).filter(
        and_(ListaEspera.atendido == False, ListaEspera.prioridad == 1)
    ).count()

    normales = db.query(ListaEspera).filter(
        and_(ListaEspera.atendido == False, ListaEspera.prioridad == 0)
    ).count()

    return {
        "total": count,
        "por_prioridad": {
            "urgentes": urgentes,
            "altas": altas,
            "normales": normales,
        }
    }
