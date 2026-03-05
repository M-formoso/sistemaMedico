"""
Script de inicialización de la base de datos.
Crea el usuario administrador inicial y datos de ejemplo.
"""
from sqlalchemy.orm import Session

from app.core.security import hashear_password
from app.models.usuario import Usuario, RolUsuario
from app.models.tratamiento import Tratamiento


def init_db(db: Session) -> None:
    """
    Inicializa la base de datos con datos iniciales.
    """
    # Verificar si ya existe un usuario administrador
    admin = db.query(Usuario).filter(Usuario.rol == RolUsuario.ADMINISTRADORA).first()

    if not admin:
        print("Creando usuario administrador...")
        admin = Usuario(
            email="admin@medestetica.com",
            password_hash=hashear_password("admin123"),
            nombre="Administradora",
            rol=RolUsuario.ADMINISTRADORA,
            activo=True,
        )
        db.add(admin)
        db.commit()
        print(f"Usuario administrador creado: {admin.email}")
    else:
        print("Usuario administrador ya existe.")

    # Crear tratamientos de ejemplo si no existen
    tratamientos_count = db.query(Tratamiento).count()

    if tratamientos_count == 0:
        print("Creando tratamientos de ejemplo...")
        tratamientos_ejemplo = [
            {
                "nombre": "Botox",
                "descripcion": "Toxina botulínica para tratamiento de arrugas dinámicas",
                "precio_lista": 50000,
                "duracion_minutos": 30,
                "zona_corporal": "Rostro",
                "sesiones_recomendadas": 1,
            },
            {
                "nombre": "Ácido Hialurónico - Labios",
                "descripcion": "Relleno de labios con ácido hialurónico",
                "precio_lista": 80000,
                "duracion_minutos": 45,
                "zona_corporal": "Labios",
                "sesiones_recomendadas": 1,
            },
            {
                "nombre": "Ácido Hialurónico - Surcos",
                "descripcion": "Relleno de surcos nasogenianos",
                "precio_lista": 70000,
                "duracion_minutos": 45,
                "zona_corporal": "Rostro",
                "sesiones_recomendadas": 1,
            },
            {
                "nombre": "Mesoterapia Facial",
                "descripcion": "Revitalización facial con vitaminas y aminoácidos",
                "precio_lista": 35000,
                "duracion_minutos": 40,
                "zona_corporal": "Rostro",
                "sesiones_recomendadas": 4,
            },
            {
                "nombre": "Plasma Rico en Plaquetas",
                "descripcion": "PRP para rejuvenecimiento facial",
                "precio_lista": 60000,
                "duracion_minutos": 60,
                "zona_corporal": "Rostro",
                "sesiones_recomendadas": 3,
            },
            {
                "nombre": "Radiofrecuencia Facial",
                "descripcion": "Tratamiento de tensado y rejuvenecimiento con radiofrecuencia",
                "precio_lista": 25000,
                "duracion_minutos": 45,
                "zona_corporal": "Rostro",
                "sesiones_recomendadas": 6,
            },
        ]

        for t_data in tratamientos_ejemplo:
            tratamiento = Tratamiento(**t_data)
            db.add(tratamiento)

        db.commit()
        print(f"Creados {len(tratamientos_ejemplo)} tratamientos de ejemplo.")

    print("Inicialización completada.")


def create_admin_user(db: Session, email: str, password: str, nombre: str) -> Usuario:
    """
    Crea un usuario administrador con los datos especificados.
    """
    # Verificar si el email ya existe
    existing = db.query(Usuario).filter(Usuario.email == email).first()
    if existing:
        raise ValueError(f"Ya existe un usuario con el email {email}")

    admin = Usuario(
        email=email,
        password_hash=hashear_password(password),
        nombre=nombre,
        rol=RolUsuario.ADMINISTRADORA,
        activo=True,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


if __name__ == "__main__":
    from app.db.session import SessionLocal

    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()
