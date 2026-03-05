"""
Router principal que agrupa todos los endpoints de la API v1.
"""
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
)

api_router = APIRouter()

# Autenticación
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["Autenticación"]
)

# Pacientes
api_router.include_router(
    pacientes.router,
    prefix="/pacientes",
    tags=["Pacientes"]
)

# Tratamientos
api_router.include_router(
    tratamientos.router,
    prefix="/tratamientos",
    tags=["Tratamientos"]
)

# Sesiones
api_router.include_router(
    sesiones.router,
    prefix="/sesiones",
    tags=["Sesiones"]
)

# Materiales
api_router.include_router(
    materiales.router,
    prefix="/materiales",
    tags=["Materiales"]
)

# Fotos
api_router.include_router(
    fotos.router,
    prefix="/fotos",
    tags=["Fotos"]
)

# Pagos
api_router.include_router(
    pagos.router,
    prefix="/pagos",
    tags=["Pagos"]
)

# Egresos
api_router.include_router(
    egresos.router,
    prefix="/egresos",
    tags=["Egresos"]
)

# Dashboard
api_router.include_router(
    dashboard.router,
    prefix="/dashboard",
    tags=["Dashboard"]
)

# Portal Paciente
api_router.include_router(
    portal.router,
    prefix="/portal",
    tags=["Portal Paciente"]
)

# Reportes
api_router.include_router(
    reportes.router,
    prefix="/reportes",
    tags=["Reportes"]
)
