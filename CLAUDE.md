# MedEstetica - Sistema de Gestión Integral

## Contexto del Proyecto

Sistema de Gestión Integral para Consultorio de Medicina Estética que administra:
- Gestión clínica de pacientes con historial, sesiones y fotos antes/después
- Control de stock de materiales e insumos con costos
- Portal privado del paciente (acceso restringido a su propia información)
- Módulo de finanzas: pagos, egresos, balance y rentabilidad
- Dashboard operativo con alertas y agenda
- Reportes exportables a PDF y Excel

**Cliente:** Developnet — developnet.com.ar
**Usuarios:** 1 médica administradora + N pacientes (acceso restringido)
**Entorno:** Web responsive (desktop + mobile)

---

## Stack Tecnológico

### Backend
- Python 3.11+ con FastAPI 0.104+
- PostgreSQL 15+ como base de datos
- SQLAlchemy 2.0 (ORM) + Alembic (migraciones)
- Pydantic v2 para validación
- JWT con python-jose (roles: administradora / paciente)
- Celery + Redis para tareas asíncronas
- Cloudinary para almacenamiento de fotos
- WeasyPrint para generación de PDF

### Frontend
- React 18 + TypeScript 5+ + Vite
- Tailwind CSS + shadcn/ui
- **Paleta:** Rosa/fucsia médico (#C2185B, #E91E63, #FCE4EC)
- Zustand (state) + TanStack Query (data fetching)
- React Hook Form + Zod (formularios)
- TanStack Table (tablas)
- React Router v6

---

## Estructura del Proyecto (Monorepo)

```
medestetica/
├── frontend/           # React + Vite
├── backend/            # FastAPI
├── docs/               # Documentación
├── docker-compose.yml
└── .env.example
```

---

## Principios de Desarrollo

### Arquitectura Backend
- Capas: Endpoints → Services → Models (NUNCA lógica en endpoints)
- Dependency injection de FastAPI para DB, auth y permisos
- Validación Pydantic v2 en todos los endpoints
- **Soft deletes obligatorios** (campo `activo`) — NUNCA eliminar registros clínicos
- Transacciones para operaciones críticas (sesión → descuento de stock)

### Arquitectura Frontend
- Componentes pequeños y reutilizables
- Custom hooks para lógica compartida
- TypeScript estricto — prohibido usar `any`
- Loading states y error handling obligatorios
- Portal médica y portal paciente con layouts separados

---

## Control de Acceso por Rol

| Rol | Acceso |
|-----|--------|
| **Administradora** | Acceso total a todos los módulos |
| **Paciente** | SOLO `/api/v1/portal/*` — sus propios datos |

**CRÍTICO:** Validar en CADA endpoint que el paciente no accede a datos ajenos.

---

## Formato Argentino

- **Fechas:** DD/MM/YYYY
- **Miles:** punto (1.000)
- **Decimales:** coma (10,5)
- **Moneda:** $ (ARS) o USD

---

## Flujos Críticos

### Sesión Clínica con Materiales
1. Médica registra sesión (tratamiento, fecha, zona, notas)
2. Selecciona materiales con cantidades
3. Sistema calcula costo real (cantidad × precio_costo)
4. **CRÍTICO:** Sistema descuenta automáticamente el stock
5. Se crea movimiento de stock tipo `egreso`
6. Si stock bajo → alerta via Celery

### Pago de Paciente
1. Registrar pago asociado a sesión o a cuenta
2. Registrar monto, moneda, método, estado
3. Generar comprobante PDF
4. Actualizar balance del mes

---

## Convenciones de Código

### Python
```python
# Nombres descriptivos en español
def obtener_sesiones_por_paciente(paciente_id: UUID) -> List[SesionSchema]:
    pass

# Type hints SIEMPRE
def registrar_sesion_con_materiales(
    db: Session,
    sesion_data: SesionCreate,
    materiales: List[MaterialSesion],
    usuario_id: UUID
) -> Sesion:
    pass
```

### TypeScript
```typescript
// Interfaces descriptivas
interface SesionFormData {
  pacienteId: string;
  tratamientoId: string;
  fechaSesion: Date;
  zonaTratada: string;
  notasClinicas: string;
  materiales: MaterialUsado[];
}

// Formateo argentino
const formatearMonto = (monto: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(monto);
};
```

---

## Estructura por Módulo

### Backend — nuevo módulo:
```
1. models/{modulo}.py
2. schemas/{modulo}.py
3. services/{modulo}_service.py
4. api/v1/endpoints/{modulo}.py
5. tests/api/test_{modulo}.py
```

### Frontend — por feature:
```
src/
├── components/{modulo}/
│   ├── {Modulo}List.tsx
│   ├── {Modulo}Form.tsx
│   └── {Modulo}Detail.tsx
├── pages/{modulo}/
├── services/{modulo}Service.ts
└── types/{modulo}.ts
```

---

## Comandos Útiles

```bash
# Backend
cd backend && uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend && npm run dev

# Docker
docker-compose up -d

# Tests
pytest tests/ -v

# Migraciones
alembic upgrade head
alembic revision --autogenerate -m "descripcion"
```

---

## Fases de Desarrollo

| Fase | Contenido |
|------|-----------|
| **Fase 1** | Setup monorepo, Docker, PostgreSQL, FastAPI base, React + Vite |
| **Fase 2** | Auth: Usuario, roles, JWT, login, layouts por rol |
| **Fase 3** | Core Clínico: Pacientes, Tratamientos, Sesiones, Fotos |
| **Fase 4** | Stock: Materiales, movimientos, alertas |
| **Fase 5** | Finanzas: Pagos, egresos, balance, rentabilidad |
| **Fase 6** | Portal Paciente: Vista restringida |
| **Fase 7** | Dashboard: Widgets, alertas, agenda |
| **Fase 8** | Reportes: PDF/Excel, historial imprimible |
