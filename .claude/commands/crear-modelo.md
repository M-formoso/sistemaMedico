# Crear Modelo Backend

Crea un nuevo modelo SQLAlchemy para el módulo: $ARGUMENTS

## Instrucciones

1. Crear archivo `backend/app/models/{nombre}.py` con:
   - Modelo SQLAlchemy 2.0 con campos UUID, created_at, updated_at
   - Campo `activo` para soft delete
   - Relaciones con otros modelos si aplica
   - Índices para campos de búsqueda frecuente

2. Crear archivo `backend/app/schemas/{nombre}.py` con:
   - Schema Base (campos comunes)
   - Schema Create (para POST)
   - Schema Update (campos opcionales)
   - Schema Response (con ID y timestamps)
   - Schema List (para paginación)

3. Actualizar `backend/app/models/__init__.py` para exportar el modelo

4. Crear migración con Alembic:
   ```bash
   alembic revision --autogenerate -m "add {nombre} table"
   ```

## Convenciones
- Nombres de tablas en plural y snake_case
- Campos en español descriptivo
- Type hints en todos los métodos
- Docstrings para campos complejos

## Ejemplo de estructura esperada:

```python
# models/{nombre}.py
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.db.base import Base

class {Nombre}(Base):
    __tablename__ = "{nombres}"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # campos específicos...
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```
