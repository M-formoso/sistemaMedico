from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    pacientes,
    tratamientos,
    sesiones,
    materiales,
    fotos,
    pagos,
    egresos,
    dashboard,
    portal,
    reportes,
    profesionales,
    configuracion,
    evoluciones,
    estudios,
    resultados,
    consentimientos,
    presupuestos,
    turnos_recurrentes,
    integraciones,
)

api_router = APIRouter()

# Autenticación
api_router.include_router(auth.router, prefix="/auth", tags=["Autenticación"])

# Módulos principales (solo administradora)
api_router.include_router(pacientes.router, prefix="/pacientes", tags=["Pacientes"])
api_router.include_router(profesionales.router, prefix="/profesionales", tags=["Profesionales"])
api_router.include_router(tratamientos.router, prefix="/tratamientos", tags=["Tratamientos"])
api_router.include_router(sesiones.router, prefix="/sesiones", tags=["Sesiones/Turnos"])
api_router.include_router(materiales.router, prefix="/materiales", tags=["Materiales/Inventario"])
api_router.include_router(fotos.router, prefix="/fotos", tags=["Fotos"])
api_router.include_router(pagos.router, prefix="/pagos", tags=["Pagos/Ingresos"])
api_router.include_router(egresos.router, prefix="/egresos", tags=["Egresos"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(reportes.router, prefix="/reportes", tags=["Reportes"])
api_router.include_router(configuracion.router, prefix="/configuracion", tags=["Configuración"])

# Portal del paciente
api_router.include_router(portal.router, prefix="/portal", tags=["Portal Paciente"])

# Historia Clínica
api_router.include_router(evoluciones.router, prefix="/evoluciones", tags=["Historia Clínica - Evoluciones"])
api_router.include_router(estudios.router, prefix="/estudios", tags=["Historia Clínica - Estudios"])
api_router.include_router(resultados.router, prefix="/resultados", tags=["Historia Clínica - Resultados"])
api_router.include_router(consentimientos.router, prefix="/consentimientos", tags=["Historia Clínica - Consentimientos"])

# Presupuestos
api_router.include_router(presupuestos.router, prefix="/presupuestos", tags=["Presupuestos"])

# Turnos Recurrentes
api_router.include_router(turnos_recurrentes.router, prefix="/turnos-recurrentes", tags=["Turnos Recurrentes"])

# Integraciones (Google Calendar, WhatsApp, Mercado Pago)
api_router.include_router(integraciones.router, prefix="/integraciones", tags=["Integraciones"])
