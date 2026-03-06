# Plan de Desarrollo - Sistema MedEstética v2.0

## Resumen de Funcionalidades

### FASE 1: Historia Clínica Completa (Ficha del Paciente)
Cada paciente tendrá las siguientes subcarpetas/secciones:

1. **Evoluciones** - Notas diarias del tratamiento
2. **Resumen Clínico** - Historial de procedimientos realizados
3. **Fotos** - Galería antes/durante/después
4. **Estudios/Prácticas** - Con baterías predefinidas
5. **Resultados** - Cargar PDFs/imágenes de análisis
6. **Consentimientos** - Documentos firmados

### FASE 2: Gestión de Turnos Avanzada
1. Renombrar "Sesión" → "Turno"
2. Turnos recurrentes (semanal, quincenal, mensual)
3. Sobreturnos
4. Integración Google Calendar
5. Recordatorios WhatsApp 24hs antes

### FASE 3: Finanzas y Pagos
1. Presupuestos (crear, enviar, aprobar)
2. Integración Mercado Pago

### FASE 4: Integraciones
1. Link RCTA para recetas digitales
2. Portal paciente con edad automática

---

## Modelos de Base de Datos a Crear

### Evoluciones
```python
class Evolucion:
    id
    paciente_id
    fecha
    descripcion (texto largo)
    created_by (usuario)
    created_at
```

### Estudios/Prácticas
```python
class Estudio:
    id
    paciente_id
    nombre
    descripcion
    fecha_solicitud
    fecha_realizacion
    archivo_url
    estado (pendiente, realizado)

class BateriaEstudios:
    id
    nombre (ej: "Checkeo preoperatorio")
    estudios_incluidos (JSON array)
    created_by
```

### Resultados
```python
class Resultado:
    id
    paciente_id
    estudio_id (opcional)
    nombre
    fecha
    archivo_url
    notas
```

### Consentimientos
```python
class Consentimiento:
    id
    paciente_id
    tipo (tratamiento, datos, etc)
    archivo_url
    fecha_firma
    firmado (boolean)
```

### Presupuestos
```python
class Presupuesto:
    id
    paciente_id
    numero
    fecha
    items (JSON)
    subtotal
    descuento
    total
    estado (borrador, enviado, aprobado, rechazado)
    valido_hasta
```

### Turnos Recurrentes
```python
class TurnoRecurrente:
    id
    paciente_id
    tratamiento_id
    dia_semana
    hora
    frecuencia (semanal, quincenal, mensual)
    fecha_inicio
    fecha_fin
    activo
```

---

## Estructura de Carpetas Frontend

```
src/
├── pages/
│   ├── pacientes/
│   │   ├── [id]/
│   │   │   ├── index.tsx (resumen)
│   │   │   ├── evoluciones.tsx
│   │   │   ├── fotos.tsx
│   │   │   ├── estudios.tsx
│   │   │   ├── resultados.tsx
│   │   │   └── consentimientos.tsx
│   ├── turnos/ (renombrado de sesiones)
│   ├── presupuestos/
│   └── configuracion/
│       └── baterias-estudios.tsx
```

---

## Orden de Implementación

1. ✅ Modelos de BD (migraciones)
2. ✅ Endpoints API
3. ✅ Componentes Frontend
4. ✅ Integraciones externas
