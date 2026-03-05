# Despliegue en Railway - MedEstética

## Estructura del Proyecto

El proyecto tiene 2 servicios separados que deben desplegarse:

1. **Backend** (FastAPI + PostgreSQL)
2. **Frontend** (React/Vite)

---

## Paso 1: Crear Proyecto en Railway

1. Ve a [railway.app](https://railway.app) e inicia sesión
2. Click en "New Project"
3. Selecciona "Empty Project"

---

## Paso 2: Agregar Base de Datos PostgreSQL

1. En tu proyecto, click en "New" → "Database" → "Add PostgreSQL"
2. Railway creará automáticamente la base de datos
3. Copia la variable `DATABASE_URL` (la necesitarás para el backend)

---

## Paso 3: Desplegar Backend

### Opción A: Desde GitHub (Recomendado)

1. Sube tu código a GitHub
2. En Railway, click "New" → "GitHub Repo"
3. Selecciona tu repositorio
4. **IMPORTANTE**: Configura el Root Directory como `backend`

### Opción B: Usando Railway CLI

```bash
cd backend
railway login
railway link
railway up
```

### Variables de Entorno del Backend

En Railway, ve a tu servicio backend → "Variables" y agrega:

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
SECRET_KEY=tu-clave-secreta-super-segura-para-produccion
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
FRONTEND_URL=https://tu-frontend.railway.app
```

**Opcional (si usas estos servicios):**
```
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=xxx
SMTP_PASSWORD=xxx
EMAIL_FROM=consultorio@medestetica.com
```

### Configuración del Backend

- **Root Directory**: `backend`
- **Build Command**: (dejarlo vacío, usa nixpacks)
- **Start Command**: (usa el de railway.json automáticamente)

---

## Paso 4: Desplegar Frontend

### Opción A: Desde el mismo repo (monorepo)

1. En Railway, click "New" → "GitHub Repo"
2. Selecciona el mismo repositorio
3. **IMPORTANTE**: Configura el Root Directory como `frontend`

### Opción B: Usando Railway CLI

```bash
cd frontend
railway login
railway link
railway up
```

### Variables de Entorno del Frontend

```
VITE_API_URL=https://tu-backend.railway.app/api/v1
```

Reemplaza `tu-backend.railway.app` con el dominio real de tu backend en Railway.

### Configuración del Frontend

- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run preview`

---

## Paso 5: Configurar Dominios

### Backend
1. Ve a tu servicio backend → "Settings" → "Networking"
2. Click en "Generate Domain" o agrega un dominio personalizado
3. Anota la URL (ej: `medestetica-backend.railway.app`)

### Frontend
1. Ve a tu servicio frontend → "Settings" → "Networking"
2. Click en "Generate Domain" o agrega un dominio personalizado
3. Anota la URL (ej: `medestetica.railway.app`)

---

## Paso 6: Actualizar CORS

Una vez tengas los dominios:

1. Ve al backend → "Variables"
2. Actualiza `FRONTEND_URL` con la URL del frontend

---

## Paso 7: Verificar Despliegue

1. **Backend Health Check**: `https://tu-backend.railway.app/health`
2. **Backend API Docs**: `https://tu-backend.railway.app/api/docs`
3. **Frontend**: `https://tu-frontend.railway.app`

---

## Credenciales por Defecto

Después del primer deploy, puedes iniciar sesión con:

- **Email**: `admin@medestetica.com`
- **Password**: `admin123`

⚠️ **IMPORTANTE**: Cambia la contraseña después del primer login.

---

## Troubleshooting

### Error de CORS
- Verifica que `FRONTEND_URL` en el backend tenga la URL correcta del frontend
- Debe incluir `https://`

### Error de conexión a DB
- Verifica que `DATABASE_URL` use la referencia `${{Postgres.DATABASE_URL}}`
- Railway maneja automáticamente la conexión

### El frontend no carga la API
- Verifica que `VITE_API_URL` apunte al backend correcto
- Debe terminar en `/api/v1`

### Migraciones no se ejecutan
- El comando de inicio del backend incluye `alembic upgrade head`
- Revisa los logs del deploy

---

## Costos Estimados

Railway tiene un plan gratuito con:
- 500 horas de ejecución/mes
- $5 de crédito incluido

Para producción, considera el plan Pro ($20/mes) que incluye:
- Sin límite de horas
- Más recursos
- Dominios personalizados SSL

---

## Arquitectura Final

```
┌─────────────────────────────────────────────────────────┐
│                      Railway                             │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │    Frontend     │  │     Backend     │              │
│  │   (React/Vite)  │─▶│    (FastAPI)    │              │
│  │                 │  │                 │              │
│  └─────────────────┘  └────────┬────────┘              │
│                                │                        │
│                       ┌────────▼────────┐              │
│                       │   PostgreSQL    │              │
│                       │   (Railway)     │              │
│                       └─────────────────┘              │
└─────────────────────────────────────────────────────────┘
```
