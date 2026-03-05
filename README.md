# MedEstética - Sistema de Gestión para Consultorio de Medicina Estética

Sistema completo de gestión para consultorios de medicina estética con módulos de pacientes, sesiones, materiales, finanzas y portal de pacientes.

## Stack Tecnológico

### Backend
- **FastAPI** - Framework web moderno
- **SQLAlchemy 2.0** - ORM
- **PostgreSQL** - Base de datos
- **Alembic** - Migraciones
- **JWT** - Autenticación
- **Celery + Redis** - Tareas asíncronas (opcional)

### Frontend
- **React 18** + TypeScript
- **Vite** - Build tool
- **Tailwind CSS** - Estilos
- **Zustand** - State management
- **TanStack Query** - Server state
- **React Hook Form + Zod** - Formularios

## Requisitos

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- Redis (opcional, para tareas async)

## Instalación

### 1. Clonar repositorio
```bash
git clone <repo-url>
cd SistemaMedico
```

### 2. Base de datos
```bash
# Crear base de datos PostgreSQL
createdb medestetica
```

### 3. Backend
```bash
cd backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno (editar .env si es necesario)
cp .env.example .env

# Ejecutar migraciones
alembic upgrade head

# Crear usuario admin inicial
python -m app.db.init_db

# Iniciar servidor
uvicorn app.main:app --reload --port 8000
```

### 4. Frontend
```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

## Acceso

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Credenciales por defecto
- Email: `admin@medestetica.com`
- Password: `admin123`

## Estructura del Proyecto

```
SistemaMedico/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # Endpoints REST
│   │   ├── core/               # Config, security
│   │   ├── db/                 # Database setup
│   │   ├── models/             # SQLAlchemy models
│   │   ├── schemas/            # Pydantic schemas
│   │   └── main.py
│   ├── alembic/                # Migraciones
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/         # Componentes React
│   │   ├── pages/              # Páginas
│   │   ├── services/           # API services
│   │   ├── stores/             # Zustand stores
│   │   ├── types/              # TypeScript types
│   │   └── App.tsx
│   └── package.json
└── docker-compose.yml
```

## Módulos

1. **Pacientes** - Gestión de pacientes e historial clínico
2. **Tratamientos** - Catálogo de tratamientos
3. **Sesiones** - Agenda y registro de sesiones
4. **Materiales** - Inventario y stock
5. **Finanzas** - Pagos y egresos
6. **Reportes** - Estadísticas y análisis
7. **Portal Paciente** - Acceso para pacientes

## Docker (Producción)

```bash
docker-compose up -d
```

## Licencia

Proyecto privado - Todos los derechos reservados.
