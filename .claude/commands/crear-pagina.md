# Crear Página React

Crea una nueva página/ruta para: $ARGUMENTS

## Instrucciones

1. Crear archivos en `frontend/src/pages/{modulo}/`:
   - `index.tsx` - Listado principal
   - `create.tsx` - Formulario de creación
   - `[id].tsx` - Detalle/edición

2. Crear service en `frontend/src/services/{modulo}Service.ts`

3. Crear types en `frontend/src/types/{modulo}.ts`

4. Agregar rutas en el Router

## Estructura de Páginas

### Página de Listado
```tsx
// pages/{modulo}/index.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { {Nombre}List } from '@/components/{modulo}/{Nombre}List';

export default function {Nombres}Page() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{Nombres}</h1>
        <Link to="/{modulo}/nuevo">
          <Button className="bg-pink-600 hover:bg-pink-700">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo {Nombre}
          </Button>
        </Link>
      </div>
      <{Nombre}List />
    </div>
  );
}
```

### Página de Creación
```tsx
// pages/{modulo}/create.tsx
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { {Nombre}Form } from '@/components/{modulo}/{Nombre}Form';

export default function Crear{Nombre}Page() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-6">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Nuevo {Nombre}</CardTitle>
        </CardHeader>
        <CardContent>
          <{Nombre}Form onSuccess={() => navigate('/{modulo}')} />
        </CardContent>
      </Card>
    </div>
  );
}
```

### Service API
```tsx
// services/{modulo}Service.ts
import api from '@/lib/axios';
import type { {Nombre}, {Nombre}Create, {Nombre}Update } from '@/types/{modulo}';

export const {nombre}Service = {
  obtenerTodos: async (): Promise<{Nombre}[]> => {
    const { data } = await api.get('/{modulo}');
    return data;
  },

  obtenerPorId: async (id: string): Promise<{Nombre}> => {
    const { data } = await api.get(`/{modulo}/${id}`);
    return data;
  },

  crear: async (payload: {Nombre}Create): Promise<{Nombre}> => {
    const { data } = await api.post('/{modulo}', payload);
    return data;
  },

  actualizar: async (id: string, payload: {Nombre}Update): Promise<{Nombre}> => {
    const { data } = await api.put(`/{modulo}/${id}`, payload);
    return data;
  },

  eliminar: async (id: string): Promise<void> => {
    await api.delete(`/{modulo}/${id}`);
  },
};
```

### Types
```tsx
// types/{modulo}.ts
export interface {Nombre} {
  id: string;
  nombre: string;
  // campos específicos...
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface {Nombre}Create {
  nombre: string;
  // campos requeridos para crear
}

export interface {Nombre}Update {
  nombre?: string;
  // campos opcionales para actualizar
}
```

### Configuración de Rutas
```tsx
// En App.tsx o routes.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import {Nombres}Page from '@/pages/{modulo}';
import Crear{Nombre}Page from '@/pages/{modulo}/create';
import {Nombre}DetailPage from '@/pages/{modulo}/[id]';

// Dentro del Router, layout de administradora:
<Route path="/{modulo}" element={<{Nombres}Page />} />
<Route path="/{modulo}/nuevo" element={<Crear{Nombre}Page />} />
<Route path="/{modulo}/:id" element={<{Nombre}DetailPage />} />
```
