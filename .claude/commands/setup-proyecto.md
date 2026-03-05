# Setup del Proyecto

Inicializa la estructura base del proyecto MedEstetica.

## Acciones a Realizar

### 1. Estructura de Carpetas Backend

Crear la estructura completa en `backend/`:
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── api.py
│   │       └── endpoints/
│   │           ├── __init__.py
│   │           └── auth.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   └── security.py
│   ├── db/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   └── session.py
│   ├── models/
│   │   └── __init__.py
│   ├── schemas/
│   │   └── __init__.py
│   └── services/
│       └── __init__.py
├── alembic/
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   └── api/
│       └── __init__.py
├── requirements.txt
├── pyproject.toml
└── alembic.ini
```

### 2. Estructura de Carpetas Frontend

Crear la estructura completa en `frontend/`:
```
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── components/
│   │   ├── ui/           # shadcn/ui
│   │   ├── layout/
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── PacienteLayout.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   └── shared/
│   ├── pages/
│   │   ├── auth/
│   │   │   └── Login.tsx
│   │   ├── dashboard/
│   │   └── portal-paciente/
│   ├── hooks/
│   ├── services/
│   ├── stores/
│   │   └── authStore.ts
│   ├── types/
│   ├── utils/
│   │   └── formatters.ts
│   └── lib/
│       └── axios.ts
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── index.html
```

### 3. Archivos de Configuración

#### Docker Compose (docker-compose.yml)
```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: medestetica
      POSTGRES_PASSWORD: medestetica_pass
      POSTGRES_DB: medestetica
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    depends_on:
      - db
      - redis
    environment:
      - DATABASE_URL=postgresql://medestetica:medestetica_pass@db:5432/medestetica
      - REDIS_URL=redis://redis:6379/0

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "5173:5173"
    depends_on:
      - backend

volumes:
  postgres_data:
```

#### requirements.txt (Backend)
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
alembic==1.12.1
psycopg2-binary==2.9.9
pydantic==2.5.2
pydantic-settings==2.1.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
celery==5.3.4
redis==5.0.1
cloudinary==1.36.0
weasyprint==60.1
pytest==7.4.3
pytest-asyncio==0.21.1
httpx==0.25.2
```

#### .env.example
```bash
# Database
DATABASE_URL=postgresql://medestetica:medestetica_pass@localhost:5432/medestetica

# JWT
SECRET_KEY=tu-clave-secreta-cambiar-en-produccion
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Redis
REDIS_URL=redis://localhost:6379/0

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Frontend
VITE_API_URL=http://localhost:8000/api/v1
```

### 4. Iniciar el Proyecto

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev

# Docker (alternativa)
docker-compose up -d
```
