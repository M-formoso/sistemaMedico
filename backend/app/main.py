from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from app.core.config import settings
from app.api.v1.api import api_router

print("Starting FastAPI app...")


def run_migrations():
    """Ejecutar migraciones de Alembic automáticamente."""
    try:
        from alembic.config import Config
        from alembic import command

        alembic_cfg = Config("alembic.ini")
        command.upgrade(alembic_cfg, "head")
        print("Migrations completed successfully")
    except Exception as e:
        print(f"Error running migrations: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ejecutar migraciones y luego inicializar base de datos
    print("Running database migrations...")
    run_migrations()

    try:
        from app.db.session import SessionLocal
        from app.db.init_db import init_db
        db = SessionLocal()
        init_db(db)
        db.close()
        print("Database initialized successfully")
    except Exception as e:
        print(f"Error initializing database: {e}")
    yield
    print("Shutting down...")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="API para Sistema de Gestión de Consultorio de Medicina Estética",
    openapi_url="/api/v1/openapi.json",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# CORS - Configuración para Railway
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    # Dominios de producción en Railway
    "https://sistemamedico-production-860d.up.railway.app",
    "https://draformosomedicinaestetic-production.up.railway.app",
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
