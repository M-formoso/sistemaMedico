import os
from pydantic_settings import BaseSettings
from typing import Optional, List


class Settings(BaseSettings):
    """Configuración de la aplicación MedEstetica."""

    # Aplicación
    APP_NAME: str = "MedEstetica API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Base de datos - Railway provee DATABASE_URL automáticamente
    DATABASE_URL: str = "postgresql://medestetica:medestetica_pass@localhost:5432/medestetica"

    # JWT
    SECRET_KEY: str = "tu-clave-secreta-cambiar-en-produccion"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Redis / Celery (opcional)
    REDIS_URL: Optional[str] = None
    CELERY_BROKER_URL: Optional[str] = None
    CELERY_RESULT_BACKEND: Optional[str] = None

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: Optional[str] = None
    CLOUDINARY_API_KEY: Optional[str] = None
    CLOUDINARY_API_SECRET: Optional[str] = None

    # Email
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAIL_FROM: Optional[str] = None

    # Google Calendar
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None

    # WhatsApp (Twilio o Meta)
    WHATSAPP_PROVIDER: str = "mock"  # 'twilio', 'meta', o 'mock'
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    WHATSAPP_FROM_NUMBER: Optional[str] = None
    WHATSAPP_API_URL: Optional[str] = None

    # Mercado Pago
    MERCADOPAGO_ACCESS_TOKEN: Optional[str] = None
    MERCADOPAGO_PUBLIC_KEY: Optional[str] = None

    # CORS - URLs permitidas
    FRONTEND_URL: str = "http://localhost:5173"
    BACKEND_CORS_ORIGINS: List[str] = []

    class Config:
        env_file = ".env"
        case_sensitive = True

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Configurar CORS dinámicamente
        origins = [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
        ]
        if self.FRONTEND_URL:
            origins.append(self.FRONTEND_URL)
        # Permitir cualquier subdominio de railway.app
        origins.append("https://*.railway.app")
        self.BACKEND_CORS_ORIGINS = origins

    @property
    def celery_broker(self) -> Optional[str]:
        return self.CELERY_BROKER_URL or self.REDIS_URL

    @property
    def celery_backend(self) -> Optional[str]:
        return self.CELERY_RESULT_BACKEND or self.REDIS_URL


settings = Settings()
