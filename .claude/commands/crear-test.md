# Crear Tests

Crea tests para el módulo: $ARGUMENTS

## Instrucciones

### Backend (Pytest)

1. Crear archivo en `backend/tests/api/test_{modulo}.py`
2. Crear fixtures en `backend/tests/conftest.py` si es necesario
3. Testear todos los endpoints CRUD
4. Testear validaciones de permisos (admin vs paciente)
5. Testear casos de error

### Frontend (Vitest)

1. Crear archivo en `frontend/src/components/{modulo}/__tests__/{Componente}.test.tsx`
2. Testear renderizado
3. Testear interacciones de usuario
4. Mockear servicios API

## Estructura de Tests Backend

```python
# tests/api/test_{modulo}.py
import pytest
from fastapi.testclient import TestClient
from uuid import uuid4

from app.main import app

client = TestClient(app)


class Test{Modulo}Endpoints:
    """Tests para endpoints de {modulo}."""

    def test_listar_{modulo}_como_admin(self, auth_headers_admin, db):
        """Admin puede listar todos los {modulo}."""
        response = client.get(
            "/api/v1/{modulo}/",
            headers=auth_headers_admin
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_listar_{modulo}_como_paciente_denegado(self, auth_headers_paciente):
        """Paciente NO puede listar {modulo}."""
        response = client.get(
            "/api/v1/{modulo}/",
            headers=auth_headers_paciente
        )
        assert response.status_code == 403

    def test_crear_{modulo}(self, auth_headers_admin):
        """Admin puede crear {modulo}."""
        data = {
            "nombre": "Test {Modulo}",
            # más campos...
        }
        response = client.post(
            "/api/v1/{modulo}/",
            json=data,
            headers=auth_headers_admin
        )
        assert response.status_code == 201
        assert response.json()["nombre"] == "Test {Modulo}"

    def test_obtener_{modulo}_por_id(self, auth_headers_admin, {modulo}_fixture):
        """Admin puede obtener {modulo} por ID."""
        response = client.get(
            f"/api/v1/{modulo}/{{{modulo}_fixture.id}}",
            headers=auth_headers_admin
        )
        assert response.status_code == 200
        assert response.json()["id"] == str({modulo}_fixture.id)

    def test_actualizar_{modulo}(self, auth_headers_admin, {modulo}_fixture):
        """Admin puede actualizar {modulo}."""
        data = {"nombre": "Nombre Actualizado"}
        response = client.put(
            f"/api/v1/{modulo}/{{{modulo}_fixture.id}}",
            json=data,
            headers=auth_headers_admin
        )
        assert response.status_code == 200
        assert response.json()["nombre"] == "Nombre Actualizado"

    def test_eliminar_{modulo}_soft_delete(self, auth_headers_admin, {modulo}_fixture, db):
        """Eliminar hace soft delete (activo=False)."""
        response = client.delete(
            f"/api/v1/{modulo}/{{{modulo}_fixture.id}}",
            headers=auth_headers_admin
        )
        assert response.status_code == 204

        # Verificar soft delete
        db.refresh({modulo}_fixture)
        assert {modulo}_fixture.activo is False


class Test{Modulo}Validaciones:
    """Tests de validaciones de negocio."""

    def test_crear_sin_nombre_falla(self, auth_headers_admin):
        """Crear sin nombre requerido falla con 422."""
        response = client.post(
            "/api/v1/{modulo}/",
            json={},
            headers=auth_headers_admin
        )
        assert response.status_code == 422

    def test_{modulo}_no_encontrado(self, auth_headers_admin):
        """ID inexistente retorna 404."""
        response = client.get(
            f"/api/v1/{modulo}/{uuid4()}",
            headers=auth_headers_admin
        )
        assert response.status_code == 404


# Fixtures específicos
@pytest.fixture
def {modulo}_fixture(db):
    """Crear {modulo} de prueba."""
    from app.models.{modulo} import {Modulo}

    obj = {Modulo}(nombre="Test Fixture")
    db.add(obj)
    db.commit()
    db.refresh(obj)
    yield obj
    # Cleanup
    db.delete(obj)
    db.commit()
```

## Fixtures Globales (conftest.py)

```python
# tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.base import Base
from app.api.deps import get_db
from app.models.usuario import Usuario
from app.core.security import crear_token_acceso

# Test database
SQLALCHEMY_DATABASE_URL = "postgresql://test:test@localhost:5432/medestetica_test"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
TestingSessionLocal = sessionmaker(bind=engine)


@pytest.fixture(scope="session")
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def auth_headers_admin(db):
    """Headers de autenticación para admin."""
    admin = Usuario(
        email="admin@test.com",
        password_hash="...",
        nombre="Admin Test",
        rol="administradora"
    )
    db.add(admin)
    db.commit()

    token = crear_token_acceso({"sub": str(admin.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers_paciente(db, paciente_fixture):
    """Headers de autenticación para paciente."""
    usuario = Usuario(
        email="paciente@test.com",
        password_hash="...",
        nombre="Paciente Test",
        rol="paciente",
        paciente_id=paciente_fixture.id
    )
    db.add(usuario)
    db.commit()

    token = crear_token_acceso({"sub": str(usuario.id)})
    return {"Authorization": f"Bearer {token}"}
```

## Tests Frontend (Vitest)

```tsx
// components/{modulo}/__tests__/{Nombre}Form.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { {Nombre}Form } from '../{Nombre}Form';
import { {nombre}Service } from '@/services/{nombre}Service';
import { vi } from 'vitest';

vi.mock('@/services/{nombre}Service');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('{Nombre}Form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza el formulario correctamente', () => {
    render(<{Nombre}Form />, { wrapper });

    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
  });

  it('muestra errores de validación', async () => {
    render(<{Nombre}Form />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => {
      expect(screen.getByText(/el nombre es requerido/i)).toBeInTheDocument();
    });
  });

  it('envía datos correctamente', async () => {
    const mockCrear = vi.mocked({nombre}Service.crear);
    mockCrear.mockResolvedValueOnce({ id: '1', nombre: 'Test' });

    render(<{Nombre}Form />, { wrapper });

    fireEvent.change(screen.getByLabelText(/nombre/i), {
      target: { value: 'Test {Nombre}' },
    });
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => {
      expect(mockCrear).toHaveBeenCalledWith({ nombre: 'Test {Nombre}' });
    });
  });
});
```

## Comandos

```bash
# Backend
pytest tests/api/test_{modulo}.py -v
pytest tests/ --cov=app --cov-report=html

# Frontend
npm run test
npm run test:coverage
```
