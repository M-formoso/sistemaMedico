# MedEstetica — Sistema de Gestión Integral para Medicina Estética

**Documentación Técnica Completa v1.0**
Desarrollado por Developnet — developnet.com.ar

---

## 📋 Información del Proyecto

| Campo | Detalle |
|---|---|
| Nombre del Sistema | MedEstetica - Sistema de Gestión Integral |
| Versión | 1.0.0 |
| Tipo de Sistema | Gestión operativa, clínica, financiera y de stock para consultorio de medicina estética |
| Usuarios Estimados | 1 médica administradora + N pacientes (acceso restringido a su perfil) |
| Entorno | Web responsive (desktop + mobile) |
| Moneda | Peso Argentino (ARS) con soporte multi-moneda (ARS / USD) |
| Formato de Fechas | DD/MM/YYYY — estándar argentino |
| Desarrollado por | Developnet — developnet.com.ar |

---

## 🛠️ Stack Tecnológico

### Backend

- **Framework:** FastAPI 0.104+
- **Lenguaje:** Python 3.11+
- **ORM:** SQLAlchemy 2.0
- **Migraciones:** Alembic
- **Validación:** Pydantic v2
- **Autenticación:** python-jose (JWT) + passlib (bcrypt)
- **Base de Datos:** PostgreSQL 15+
- **Workers:** Celery + Redis (alertas de stock y recordatorios)
- **Storage:** Cloudinary (fotos antes/después, documentos clínicos)
- **PDF:** WeasyPrint / ReportLab (historial clínico, recibos)
- **Testing:** Pytest + pytest-asyncio

### Frontend

- **Framework:** React 18 + Vite
- **Lenguaje:** TypeScript 5+
- **Styling:** Tailwind CSS
- **Componentes UI:** shadcn/ui + lucide-react
- **Paleta de Colores:** Rosa/fucsia médico (`#C2185B`, `#E91E63`, `#FCE4EC`) — identidad de marca
- **State Management:** Zustand
- **Data Fetching:** TanStack Query (React Query)
- **Formularios:** React Hook Form + Zod
- **Tablas:** TanStack Table
- **Router:** React Router v6
- **HTTP Client:** Axios

### Infraestructura

- **Containerización:** Docker + Docker Compose
- **Proxy Reverso:** Nginx (producción)
- **Deploy:** VPS (Railway / DigitalOcean)
- **Monitoreo:** Sentry
- **CI/CD:** GitHub Actions (opcional)

---

## 📁 Estructura del Proyecto (Monorepo)

```
medestetica/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                # shadcn/ui components
│   │   │   ├── layout/            # Header, Sidebar, Footer
│   │   │   ├── pacientes/         # Componentes módulo pacientes
│   │   │   ├── tratamientos/      # Componentes módulo tratamientos
│   │   │   ├── materiales/        # Componentes stock materiales
│   │   │   ├── finanzas/          # Componentes módulo finanzas
│   │   │   └── shared/            # Componentes compartidos
│   │   ├── pages/
│   │   │   ├── auth/              # Login (médica + paciente)
│   │   │   ├── dashboard/         # Dashboard principal (médica)
│   │   │   ├── pacientes/         # CRUD pacientes e historiales
│   │   │   ├── tratamientos/      # CRUD tratamientos y sesiones
│   │   │   ├── materiales/        # Stock y control de materiales
│   │   │   ├── finanzas/          # Ingresos, egresos, balance
│   │   │   ├── reportes/          # Reportes y estadísticas
│   │   │   └── portal-paciente/   # Vista del paciente (solo su info)
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── services/              # API calls
│   │   ├── stores/                # Zustand stores
│   │   ├── types/                 # TypeScript types
│   │   └── utils/                 # Formateo, helpers
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── endpoints/
│   │   │       │   ├── auth.py
│   │   │       │   ├── pacientes.py
│   │   │       │   ├── tratamientos.py
│   │   │       │   ├── sesiones.py
│   │   │       │   ├── fotos.py
│   │   │       │   ├── materiales.py
│   │   │       │   ├── finanzas.py
│   │   │       │   ├── pagos.py
│   │   │       │   ├── reportes.py
│   │   │       │   └── dashboard.py
│   │   │       └── api.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   ├── deps.py
│   │   │   └── celery_app.py
│   │   ├── db/
│   │   │   ├── base.py
│   │   │   ├── session.py
│   │   │   └── init_db.py
│   │   ├── models/
│   │   │   ├── usuario.py
│   │   │   ├── paciente.py
│   │   │   ├── tratamiento.py
│   │   │   ├── sesion.py
│   │   │   ├── foto.py
│   │   │   ├── material.py
│   │   │   ├── movimiento_stock.py
│   │   │   ├── pago.py
│   │   │   └── egreso.py
│   │   ├── schemas/
│   │   ├── services/
│   │   └── tasks/
│   ├── alembic/
│   ├── tests/
│   ├── requirements.txt
│   └── pyproject.toml
│
├── docs/
│   ├── agent.md
│   ├── api-documentation.md
│   ├── database-schema.md
│   └── deployment.md
│
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
└── README.md
```

---

## 🗂️ Módulos del Sistema

### Módulo 1 — Autenticación y Usuarios

**Control de acceso por roles: médica administradora y pacientes**

#### Roles del Sistema

- **Administradora (Médica):** Acceso total — pacientes, tratamientos, materiales, finanzas, reportes
- **Paciente:** Acceso solo a su propio perfil — historial clínico, fotos, pagos, documentos

#### Funcionalidades

- ✅ Login con JWT (access token + refresh token)
- ✅ La médica crea cuentas de pacientes con credenciales asignadas
- ✅ El paciente solo puede ver SU historial, no el de otros
- ✅ Cambio de contraseña (médica / paciente)
- ✅ Recuperación de contraseña por email
- ✅ Logs de actividad del sistema

#### Endpoints

```
POST   /api/v1/auth/login                  Login médica o paciente
POST   /api/v1/auth/refresh                Renovar access token
POST   /api/v1/auth/logout                 Cerrar sesión
GET    /api/v1/auth/me                     Datos del usuario actual
POST   /api/v1/auth/forgot-password        Recuperar contraseña
PUT    /api/v1/auth/change-password        Cambiar contraseña
```

---

### Módulo 2 — Gestión de Pacientes

**Ficha completa del paciente con historial clínico, fotos y seguimiento**

#### Funcionalidades

- ✅ CRUD completo de pacientes
- ✅ Datos personales: nombre, DNI, fecha de nacimiento, teléfono, email
- ✅ Historial clínico completo (condiciones, alergias, medicación, notas)
- ✅ Galería de fotos antes/después por zona tratada
- ✅ Listado de todas las sesiones realizadas
- ✅ Historial completo de pagos
- ✅ Documentos adjuntos (consentimientos informados, etc.)
- ✅ Creación de credenciales de acceso al portal del paciente
- ✅ Estados: activo, inactivo, nuevo

#### Endpoints

```
GET    /api/v1/pacientes                       Listar todos los pacientes
POST   /api/v1/pacientes                       Crear nuevo paciente
GET    /api/v1/pacientes/{id}                  Obtener paciente por ID
PUT    /api/v1/pacientes/{id}                  Actualizar datos del paciente
DELETE /api/v1/pacientes/{id}                  Eliminar paciente (soft delete)
GET    /api/v1/pacientes/{id}/historial        Historial clínico completo
GET    /api/v1/pacientes/{id}/sesiones         Todas las sesiones
GET    /api/v1/pacientes/{id}/fotos            Galería de fotos antes/después
GET    /api/v1/pacientes/{id}/pagos            Historial de pagos
POST   /api/v1/pacientes/{id}/credenciales     Crear acceso portal paciente
```

---

### Módulo 3 — Tratamientos y Sesiones

**Catálogo de servicios, sesiones clínicas y seguimiento por paciente**

#### Catálogo de Tratamientos

- ✅ Nombre del tratamiento (Botox, Ácido Hialurónico, Laser, etc.)
- ✅ Descripción y protocolo
- ✅ Precio de lista
- ✅ Duración estimada (minutos)
- ✅ Zona del cuerpo aplicable
- ✅ Materiales requeridos (vínculo con stock)
- ✅ Número de sesiones recomendadas
- ✅ Activo / inactivo

#### Registro de Sesiones

- ✅ Asignación de tratamiento a paciente
- ✅ Fecha y hora de la sesión
- ✅ Zona tratada
- ✅ Producto/material utilizado con cantidad (descuento automático de stock)
- ✅ Dosis o cantidad aplicada
- ✅ Notas clínicas y evolución
- ✅ Próxima sesión recomendada
- ✅ Estado: programada, realizada, cancelada
- ✅ Fotos de la sesión (antes/después)
- ✅ Costo real de materiales (calculado automáticamente)

#### Endpoints

```
GET    /api/v1/tratamientos                        Catálogo de tratamientos
POST   /api/v1/tratamientos                        Crear tratamiento
PUT    /api/v1/tratamientos/{id}                   Actualizar tratamiento
DELETE /api/v1/tratamientos/{id}                   Eliminar tratamiento
GET    /api/v1/sesiones                            Listar sesiones (filtrable)
POST   /api/v1/sesiones                            Registrar nueva sesión
GET    /api/v1/sesiones/{id}                       Detalle de sesión
PUT    /api/v1/sesiones/{id}                       Actualizar sesión
POST   /api/v1/sesiones/{id}/materiales            Asignar materiales (descuenta stock)
GET    /api/v1/sesiones/agenda                     Vista de agenda / calendario
```

---

### Módulo 4 — Galería de Fotos Antes/Después

**Documentación visual del progreso clínico por paciente y zona**

#### Funcionalidades

- ✅ Subida de fotos agrupadas por sesión y zona corporal
- ✅ Comparación visual antes/después en el mismo panel
- ✅ Almacenamiento en Cloudinary con URL segura
- ✅ Etiquetas: zona tratada, fecha, sesión relacionada
- ✅ Visible para la médica y para el paciente desde su portal
- ✅ Descarga de fotos individuales o por conjunto
- ✅ Control de privacidad: la médica decide qué fotos ve el paciente

#### Endpoints

```
POST   /api/v1/fotos/upload                    Subir foto a Cloudinary
GET    /api/v1/fotos/paciente/{id}             Fotos de un paciente
DELETE /api/v1/fotos/{id}                      Eliminar foto
PUT    /api/v1/fotos/{id}/visibilidad          Cambiar visibilidad para paciente
```

---

### Módulo 5 — Control de Materiales e Insumos

**Stock, costos y alertas de todos los productos y materiales del consultorio**

#### Inventario de Materiales

- ✅ Nombre, categoría, marca y código del material
- ✅ Stock actual y stock mínimo de alerta
- ✅ Unidad de medida (unidades, ml, cc, frascos, etc.)
- ✅ Precio de costo unitario y precio de venta implícito
- ✅ Proveedor y datos de contacto
- ✅ Lote y fecha de vencimiento
- ✅ Ubicación en el depósito
- ✅ Valor total del stock (stock × precio costo)
- ✅ Alerta automática cuando stock llega al mínimo

#### Movimientos de Stock

- ✅ **Ingresos:** registro de compras con factura, proveedor y costo
- ✅ **Egresos:** descuento automático por uso en sesión clínica
- ✅ **Ajustes manuales** con justificación
- ✅ Historial completo de movimientos por material

#### Endpoints

```
GET    /api/v1/materiales                          Listar materiales
POST   /api/v1/materiales                          Crear material
GET    /api/v1/materiales/{id}                     Detalle del material
PUT    /api/v1/materiales/{id}                     Actualizar material
DELETE /api/v1/materiales/{id}                     Eliminar material (soft delete)
GET    /api/v1/materiales/stock-bajo               Materiales bajo stock mínimo
GET    /api/v1/materiales/{id}/movimientos         Historial de movimientos
POST   /api/v1/materiales/ingreso                  Registrar compra/ingreso de stock
GET    /api/v1/materiales/valor-total              Valor total del inventario
```

---

### Módulo 6 — Finanzas

**Ingresos, egresos, pagos de pacientes y balance del consultorio**

#### Pagos de Pacientes (Ingresos)

- ✅ Registro de pago por sesión o por tratamiento
- ✅ Monto cobrado en ARS o USD
- ✅ Método de pago: efectivo, transferencia, tarjeta, MercadoPago
- ✅ Estado: pagado, pendiente, parcial, a cuenta
- ✅ Saldo pendiente por paciente
- ✅ Generación de comprobante/recibo en PDF
- ✅ Descuentos y promociones

#### Egresos del Consultorio

- ✅ Registro de gastos: materiales, alquiler, servicios, sueldos, etc.
- ✅ Categorías de egreso configurables
- ✅ Adjuntar factura o comprobante
- ✅ Fecha y descripción

#### Balance y Resumen Financiero

- ✅ Balance mensual: ingresos - egresos
- ✅ Balance anual con comparativa mensual
- ✅ Desglose de ingresos por tipo de tratamiento
- ✅ Desglose de egresos por categoría
- ✅ Rentabilidad por tratamiento (precio cobrado - costo materiales)
- ✅ Pacientes con saldo deudor
- ✅ Proyección y tendencias

#### Endpoints

```
GET    /api/v1/pagos                           Listar pagos
POST   /api/v1/pagos                           Registrar pago de paciente
GET    /api/v1/pagos/{id}                      Detalle del pago
GET    /api/v1/pagos/{id}/recibo               Generar recibo PDF
GET    /api/v1/egresos                         Listar egresos
POST   /api/v1/egresos                         Registrar egreso
PUT    /api/v1/egresos/{id}                    Actualizar egreso
GET    /api/v1/finanzas/balance-mes            Balance del mes actual
GET    /api/v1/finanzas/balance-anual          Balance anual por mes
GET    /api/v1/finanzas/rentabilidad           Rentabilidad por tratamiento
GET    /api/v1/finanzas/deudores               Pacientes con saldo pendiente
```

---

### Módulo 7 — Dashboard Principal (Médica)

**Vista general diaria y alertas del consultorio**

#### Widgets del Dashboard

- 📅 Sesiones del día: cantidad y recaudación estimada
- 🗓️ Próximas sesiones: agenda de los próximos 7 días
- 🚨 Alertas de stock: materiales bajo el mínimo
- 💰 Balance del mes: ingresos vs egresos
- ⏳ Pagos pendientes: pacientes con saldo deudor
- 📊 Gráfico de sesiones por tratamiento (últimos 30 días)
- 📈 Gráfico de ingresos mensuales (últimos 12 meses)
- 🧴 Valor del stock actual

#### Endpoints

```
GET    /api/v1/dashboard/resumen-dia           Resumen operativo del día
GET    /api/v1/dashboard/alertas               Alertas activas (stock, pagos)
GET    /api/v1/dashboard/estadisticas-mes      Estadísticas del mes
```

---

### Módulo 8 — Portal del Paciente

**Acceso restringido del paciente a su propio historial**

#### Lo que puede ver el paciente

- ✅ Su historial clínico personal
- ✅ Sus sesiones realizadas y próximas
- ✅ Su galería de fotos antes/después (las que la médica autorice)
- ✅ Su historial de pagos y saldo pendiente
- ✅ Documentos: consentimientos firmados, indicaciones
- ✅ Datos de contacto del consultorio

> ⚠️ El paciente **NO** puede ver datos de otros pacientes ni acceder a reportes, finanzas o stock.

#### Endpoints (acceso paciente)

```
GET    /api/v1/portal/mi-historial             Historial clínico propio
GET    /api/v1/portal/mis-sesiones             Sesiones realizadas y próximas
GET    /api/v1/portal/mis-fotos                Galería de fotos autorizadas
GET    /api/v1/portal/mis-pagos                Historial de pagos
GET    /api/v1/portal/mis-documentos           Documentos adjuntos
```

---

### Módulo 9 — Reportes e Informes

**Exportaciones e informes estadísticos completos para la médica**

#### Reportes Disponibles

- ✅ **Reporte de pacientes:** activos, nuevos por período, tratamientos más frecuentes
- ✅ **Reporte de sesiones:** por período, por tratamiento, por zona
- ✅ **Reporte de materiales:** stock, movimientos, valor del inventario
- ✅ **Reporte financiero:** ingresos, egresos, balance, rentabilidad
- ✅ **Reporte de pagos:** cobrados, pendientes, método de pago
- ✅ **Historia clínica completa** de un paciente (PDF imprimible)

#### Funcionalidades de Exportación

- ✅ Filtros por fecha (desde / hasta)
- ✅ Filtros por paciente, tratamiento o categoría
- ✅ Exportar a PDF
- ✅ Exportar a Excel (.xlsx)
- ✅ Gráficos interactivos en pantalla

#### Endpoints

```
GET    /api/v1/reportes/pacientes              Estadísticas de pacientes
GET    /api/v1/reportes/sesiones               Estadísticas de sesiones
GET    /api/v1/reportes/materiales             Reporte de stock
GET    /api/v1/reportes/finanzas               Reporte financiero
POST   /api/v1/reportes/historia-clinica/{id}  PDF historia clínica paciente
POST   /api/v1/reportes/export-pdf             Exportar cualquier reporte a PDF
POST   /api/v1/reportes/export-excel           Exportar a Excel
```

---

## 💾 Esquema de Base de Datos

### `usuarios`
```sql
id                UUID (PK)
email             VARCHAR(255) UNIQUE NOT NULL
password_hash     VARCHAR(255) NOT NULL
nombre            VARCHAR(100) NOT NULL
rol               ENUM ('administradora', 'paciente')
paciente_id       UUID (FK) NULL        -- enlace al perfil si rol=paciente
activo            BOOLEAN DEFAULT TRUE
ultimo_acceso     TIMESTAMP
created_at        TIMESTAMP
updated_at        TIMESTAMP
```

### `pacientes`
```sql
id                UUID (PK)
nombre            VARCHAR(100) NOT NULL
apellido          VARCHAR(100) NOT NULL
dni               VARCHAR(20) UNIQUE
fecha_nacimiento  DATE
telefono          VARCHAR(30)
email             VARCHAR(255)
antecedentes      TEXT
alergias          TEXT
medicacion_actual TEXT
notas_medicas     TEXT
estado            ENUM ('activo', 'inactivo', 'nuevo')
activo            BOOLEAN DEFAULT TRUE
created_at        TIMESTAMP
updated_at        TIMESTAMP
```

### `tratamientos`
```sql
id                    UUID (PK)
nombre                VARCHAR(255) NOT NULL
descripcion           TEXT
precio_lista          DECIMAL(10,2)
duracion_minutos      INTEGER
zona_corporal         VARCHAR(100)
sesiones_recomendadas INTEGER
activo                BOOLEAN DEFAULT TRUE
created_at            TIMESTAMP
updated_at            TIMESTAMP
```

### `sesiones`
```sql
id                UUID (PK)
paciente_id       UUID (FK pacientes)
tratamiento_id    UUID (FK tratamientos)
fecha             TIMESTAMP NOT NULL
zona_tratada      VARCHAR(100)
notas_clinicas    TEXT
proxima_sesion    DATE NULL
estado            ENUM ('programada', 'realizada', 'cancelada')
costo_materiales  DECIMAL(10,2)    -- calculado automáticamente
created_by        UUID (FK usuarios)
created_at        TIMESTAMP
updated_at        TIMESTAMP
```

### `sesiones_materiales` (many-to-many)
```sql
id                    UUID (PK)
sesion_id             UUID (FK sesiones)
material_id           UUID (FK materiales)
cantidad              DECIMAL(10,3) NOT NULL
precio_costo_unitario DECIMAL(10,2)
subtotal              DECIMAL(10,2)    -- calculado
created_at            TIMESTAMP
```

### `fotos`
```sql
id                UUID (PK)
paciente_id       UUID (FK pacientes)
sesion_id         UUID (FK sesiones) NULL
url               VARCHAR(500)        -- URL en Cloudinary
tipo              ENUM ('antes', 'despues', 'evolucion')
zona              VARCHAR(100)
fecha             DATE
visible_paciente  BOOLEAN DEFAULT FALSE
created_at        TIMESTAMP
```

### `materiales`
```sql
id                  UUID (PK)
nombre              VARCHAR(255) NOT NULL
categoria           VARCHAR(100)
marca               VARCHAR(100)
codigo              VARCHAR(50) UNIQUE
stock_actual        DECIMAL(10,3) NOT NULL
stock_minimo        DECIMAL(10,3) DEFAULT 0
unidad              VARCHAR(20)         -- ml, cc, unidad, frasco, etc.
precio_costo        DECIMAL(10,2)
proveedor           VARCHAR(255)
contacto_proveedor  VARCHAR(255)
lote                VARCHAR(100)
fecha_vencimiento   DATE NULL
activo              BOOLEAN DEFAULT TRUE
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

### `movimientos_stock`
```sql
id               UUID (PK)
material_id      UUID (FK materiales)
tipo             ENUM ('ingreso', 'egreso', 'ajuste')
cantidad         DECIMAL(10,3) NOT NULL
referencia_tipo  VARCHAR(50)     -- 'sesion', 'compra', 'ajuste_manual'
referencia_id    UUID NULL
costo_total      DECIMAL(10,2)
observaciones    TEXT
usuario_id       UUID (FK usuarios)
created_at       TIMESTAMP
```

### `pagos`
```sql
id              UUID (PK)
paciente_id     UUID (FK pacientes)
sesion_id       UUID (FK sesiones) NULL
monto           DECIMAL(10,2) NOT NULL
moneda          ENUM ('ARS', 'USD')
metodo_pago     ENUM ('efectivo', 'transferencia', 'tarjeta', 'mercadopago')
estado          ENUM ('pagado', 'pendiente', 'parcial')
descuento       DECIMAL(5,2) DEFAULT 0
observaciones   TEXT
created_by      UUID (FK usuarios)
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### `egresos`
```sql
id               UUID (PK)
fecha            DATE NOT NULL
categoria        VARCHAR(100)    -- materiales, alquiler, servicios, honorarios, otro
descripcion      TEXT NOT NULL
monto            DECIMAL(10,2) NOT NULL
proveedor        VARCHAR(255) NULL
numero_factura   VARCHAR(100) NULL
comprobante_url  VARCHAR(500) NULL
created_by       UUID (FK usuarios)
created_at       TIMESTAMP
```

---

## 🤖 Archivo para Claude Code (`docs/agent.md`)

```markdown
# Agent Instructions — Sistema MedEstetica

## Contexto del Proyecto

Estás trabajando en un **Sistema de Gestión Integral para un Consultorio de Medicina Estética** que administra:
- Gestión clínica de pacientes con historial, sesiones y fotos antes/después
- Control de stock de materiales e insumos con costos
- Portal privado del paciente (ve solo su propia información)
- Módulo de finanzas: pagos, egresos, balance y rentabilidad
- Dashboard operativo con alertas y agenda
- Reportes exportables a PDF y Excel

**Usuarios del sistema:** 1 médica administradora + N pacientes (acceso restringido)
**Acceso:** Web responsive (desktop + mobile)

---

## Stack Tecnológico

### Backend
- Python 3.11+ con FastAPI 0.104+
- PostgreSQL 15+ como base de datos
- SQLAlchemy 2.0 como ORM / Alembic para migraciones
- Pydantic v2 para validación
- JWT con python-jose para autenticación (roles: administradora / paciente)
- Celery + Redis para alertas de stock y recordatorios
- Cloudinary para fotos antes/después
- WeasyPrint para generación de PDF (recibos, historial clínico)
- Pytest para testing

### Frontend
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui para componentes
- **Colores:** Rosa/fucsia médico (#C2185B, #E91E63, #FCE4EC)
- Zustand para state management
- TanStack Query para data fetching
- React Hook Form + Zod para formularios
- TanStack Table para tablas
- React Router v6
- Portal médica y portal paciente son **layouts y rutas completamente separadas**

---

## Principios de Desarrollo

### Arquitectura Backend
- Capas: Endpoints → Services → Models (NUNCA lógica de negocio en endpoints)
- Dependency injection de FastAPI para DB, auth y permisos
- Validación Pydantic v2 en todos los endpoints
- **Soft deletes obligatorios** (campo `activo`) — NUNCA eliminar registros clínicos
- Transacciones de BD para operaciones críticas (uso de material → descuento stock)

### Arquitectura Frontend
- Componentes pequeños y reutilizables
- Custom hooks para lógica compartida
- TypeScript SIEMPRE — prohibido usar `any`
- Loading states y error handling en todas las operaciones
- El portal de la médica y el portal del paciente tienen layouts distintos

---

## Características Específicas del Proyecto

### Cálculos Automáticos
- Costo sesión = Suma(cantidad_material × precio_costo_unitario)
- Stock material = Stock anterior − cantidad usada en sesión
- Balance mensual = Total ingresos (pagos) − Total egresos
- Rentabilidad tratamiento = Precio cobrado − Costo real materiales

### Alertas Automáticas
- Stock bajo cuando `stock_actual <= stock_minimo` (Celery task)
- Pacientes con pagos pendientes (dashboard)
- Materiales con fecha de vencimiento próxima (Celery beat)

### Control de Acceso por Rol
- **Administradora:** acceso total a todos los módulos
- **Paciente:** SOLO puede acceder a `/api/v1/portal/*` — sus propios datos
- Validar en CADA endpoint que el paciente no accede a datos ajenos

### Formato Argentino
- Fechas: DD/MM/YYYY
- Números: separador de miles con punto (1.000)
- Decimales: coma (10,5)
- Moneda: $ (peso argentino) o USD

---

## Flujos Críticos

### Flujo de Sesión Clínica con Materiales
1. Médica registra sesión para paciente (tratamiento, fecha, zona, notas)
2. Selecciona materiales utilizados con cantidades exactas
3. Sistema calcula costo real de la sesión (cantidad × precio_costo)
4. **CRÍTICO:** Sistema descuenta automáticamente el stock de cada material
5. Sistema crea movimiento de stock tipo `egreso` vinculado a la sesión
6. Si algún material queda en stock mínimo → alerta via Celery
7. La sesión queda disponible en el portal del paciente

### Flujo de Pago de Paciente
1. Médica registra pago asociado a una sesión (o a cuenta general)
2. Se registra monto, moneda, método de pago y estado
3. Se genera comprobante/recibo en PDF
4. El recibo es visible para la médica y para el paciente en su portal
5. El dashboard actualiza automáticamente el balance del mes

### Flujo de Acceso del Paciente al Portal
1. La médica crea la cuenta del paciente con email y contraseña asignada
2. El paciente ingresa con sus credenciales al portal
3. Solo puede ver SU información (historial, fotos autorizadas, pagos)
4. La médica controla qué fotos son visibles para el paciente
5. No tiene acceso a ningún otro módulo ni a datos de otros pacientes

### Flujo de Control de Materiales
1. Médica registra ingreso de stock (compra con factura, proveedor, costo)
2. Sistema suma automáticamente al stock actual
3. Crea movimiento de stock tipo `ingreso`
4. Al usarse en sesión → egreso automático
5. Dashboard muestra valor total del inventario en tiempo real

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

# Docstrings para funciones públicas
def descontar_stock_material(
    db: Session,
    material_id: UUID,
    cantidad: Decimal,
    sesion_id: UUID
) -> None:
    """
    Descuenta stock de un material y crea movimiento de egreso.

    Args:
        db: Sesión de base de datos
        material_id: ID del material
        cantidad: Cantidad a descontar
        sesion_id: ID de la sesión que origina el egreso

    Raises:
        HTTPException 400: Si no hay stock suficiente
    """
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

interface MaterialUsado {
  materialId: string;
  cantidad: number;
}

// Formateo argentino
const formatearMonto = (monto: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(monto);
};

const formatearFecha = (fecha: Date): string => {
  return new Intl.DateTimeFormat('es-AR').format(fecha);
};
```

---

## Estructura de Archivos por Módulo

### Backend — al crear nuevo módulo:
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
│   ├── {Modulo}Detail.tsx
│   └── index.ts
├── pages/{modulo}/
│   ├── index.tsx
│   ├── create.tsx
│   └── [id].tsx
├── services/{modulo}Service.ts
└── types/{modulo}.ts
```

---

## Seguridad

- ✅ Validación de permisos en TODOS los endpoints
- ✅ Paciente solo accede a `/portal/*` y solo a sus propios datos
- ✅ Administradora tiene acceso total
- ✅ Passwords hasheados con bcrypt
- ✅ JWT con expiración (access: 30min, refresh: 7 días)
- ✅ Logs de todas las operaciones críticas
- ✅ Soft delete obligatorio en registros clínicos

---

## Testing — Mínimo Requerido

```python
# tests/api/test_sesiones.py
def test_sesion_descuenta_stock_material(client, auth_headers, db, paciente, material):
    stock_inicial = material.stock_actual

    response = client.post(
        "/api/v1/sesiones/",
        json={
            "paciente_id": str(paciente.id),
            "tratamiento_id": str(tratamiento.id),
            "fecha": "2024-06-15T10:00:00",
            "zona_tratada": "Frente",
            "notas_clinicas": "Primera sesión",
            "materiales": [
                {
                    "material_id": str(material.id),
                    "cantidad": 0.5
                }
            ]
        },
        headers=auth_headers
    )

    assert response.status_code == 201
    db.refresh(material)
    assert material.stock_actual == stock_inicial - 0.5

def test_paciente_no_accede_a_otros_pacientes(client, paciente_headers, otro_paciente):
    response = client.get(
        f"/api/v1/pacientes/{otro_paciente.id}",
        headers=paciente_headers
    )
    assert response.status_code == 403
```

---

## Comandos Útiles

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev

# Docker
docker-compose up -d
docker-compose logs -f backend
docker-compose exec backend alembic upgrade head

# Tests
pytest
pytest tests/api/test_sesiones.py -v
pytest --cov=app tests/

# Celery
celery -A app.core.celery_app worker --loglevel=info
celery -A app.core.celery_app beat --loglevel=info
```

---

## Próximos Pasos

### Fase 1 — Setup Inicial
1. Estructura de carpetas (monorepo backend + frontend)
2. Docker Compose con PostgreSQL + Redis
3. Setup inicial FastAPI + React/Vite

### Fase 2 — Autenticación (Prioridad 1)
1. Modelo Usuario con roles administradora/paciente
2. Endpoints de auth (login, refresh, me)
3. JWT implementation
4. Frontend: login page + layouts separados por rol

### Fase 3 — Core Clínico (Prioridad 2)
1. Pacientes: CRUD completo + historia clínica
2. Tratamientos: catálogo
3. Sesiones: registro con materiales + descuento automático de stock
4. Fotos: subida a Cloudinary + control de visibilidad

### Fase 4 — Stock de Materiales (Prioridad 3)
1. CRUD materiales
2. Movimientos (ingresos/egresos)
3. Valor total del inventario
4. Alertas automáticas de stock bajo (Celery)

### Fase 5 — Finanzas
1. Registro de pagos + recibo PDF
2. Registro de egresos
3. Balance mensual/anual
4. Rentabilidad por tratamiento

### Fase 6 — Portal Paciente
1. Rutas y layout separado para paciente
2. Vistas: historial, sesiones, fotos, pagos, documentos

### Fase 7 — Dashboard y Reportes
1. Widgets del dashboard con estadísticas del día
2. Reportes exportables a PDF y Excel
3. Historia clínica imprimible

---

**¿Listo para empezar? Indicá qué módulo querés implementar primero y te doy el código completo.**
```

---

## ⚙️ Variables de Entorno (`.env.example`)

```bash
# Base de datos
DATABASE_URL=postgresql://user:password@localhost:5432/medestetica

# JWT
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Celery & Redis
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Cloudinary (fotos antes/después)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (recibos, recordatorios a pacientes)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=consultorio@example.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=consultorio.medestetica@example.com

# Frontend
VITE_API_URL=http://localhost:8000/api/v1
```

---

## 🗓️ Fases de Desarrollo

| Fase | Contenido |
|---|---|
| Fase 1 — Setup | Estructura monorepo, Docker Compose, PostgreSQL, FastAPI base, React + Vite |
| Fase 2 — Auth | Modelo Usuario, roles médica/paciente, JWT, login, layouts separados por rol |
| Fase 3 — Core Clínico | Pacientes, Tratamientos, Sesiones (con descuento de stock), Fotos |
| Fase 4 — Stock | Materiales, movimientos, valor inventario, alertas automáticas |
| Fase 5 — Finanzas | Pagos, egresos, balance mensual/anual, rentabilidad por tratamiento |
| Fase 6 — Portal Paciente | Vista restringida del paciente a su propio historial y fotos |
| Fase 7 — Dashboard | Widgets, alertas, gráficos, agenda del día |
| Fase 8 — Reportes | Exportación PDF/Excel, historial clínico imprimible, informes financieros |

---

*Desarrollado por **Developnet** — developnet.com.ar — Villa Gesell, Buenos Aires, Argentina*