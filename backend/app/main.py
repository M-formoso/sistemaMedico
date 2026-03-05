from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.core.config import settings
from app.api.v1.api import api_router

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="API para Sistema de Gestión de Consultorio de Medicina Estética",
    openapi_url="/api/v1/openapi.json",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS - Configuración para Railway
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]

# Agregar FRONTEND_URL si está configurado
frontend_url = os.getenv("FRONTEND_URL", "")
if frontend_url:
    origins.append(frontend_url)

# En producción, permitir el dominio de Railway
railway_domain = os.getenv("RAILWAY_PUBLIC_DOMAIN", "")
if railway_domain:
    origins.append(f"https://{railway_domain}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/api/docs",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
