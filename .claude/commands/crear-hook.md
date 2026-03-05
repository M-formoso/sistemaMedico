# Crear Custom Hook

Crea un custom hook React para: $ARGUMENTS

## Instrucciones

1. Crear archivo en `frontend/src/hooks/use{Nombre}.ts`
2. Implementar lógica reutilizable con TypeScript estricto
3. Usar TanStack Query para data fetching cuando aplique
4. Documentar con JSDoc

## Ejemplos de Hooks Comunes

### Hook de Query (lectura)
```tsx
// hooks/use{Nombre}.ts
import { useQuery } from '@tanstack/react-query';
import { {nombre}Service } from '@/services/{nombre}Service';
import type { {Nombre} } from '@/types/{nombre}';

export function use{Nombres}() {
  return useQuery({
    queryKey: ['{nombres}'],
    queryFn: {nombre}Service.obtenerTodos,
  });
}

export function use{Nombre}(id: string | undefined) {
  return useQuery({
    queryKey: ['{nombres}', id],
    queryFn: () => {nombre}Service.obtenerPorId(id!),
    enabled: !!id,
  });
}
```

### Hook de Mutation (escritura)
```tsx
// hooks/use{Nombre}Mutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { {nombre}Service } from '@/services/{nombre}Service';
import type { {Nombre}Create, {Nombre}Update } from '@/types/{nombre}';
import { toast } from '@/components/ui/use-toast';

export function useCrear{Nombre}() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {Nombre}Create) => {nombre}Service.crear(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['{nombres}'] });
      toast({ title: '{Nombre} creado correctamente' });
    },
    onError: (error) => {
      toast({
        title: 'Error al crear {nombre}',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useActualizar{Nombre}() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: {Nombre}Update }) =>
      {nombre}Service.actualizar(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['{nombres}'] });
      queryClient.invalidateQueries({ queryKey: ['{nombres}', id] });
      toast({ title: '{Nombre} actualizado correctamente' });
    },
  });
}

export function useEliminar{Nombre}() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {nombre}Service.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['{nombres}'] });
      toast({ title: '{Nombre} eliminado correctamente' });
    },
  });
}
```

### Hook de Autenticación
```tsx
// hooks/useAuth.ts
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

export function useAuth() {
  const navigate = useNavigate();
  const { user, token, setAuth, clearAuth } = useAuthStore();

  const logout = useCallback(() => {
    clearAuth();
    navigate('/login');
  }, [clearAuth, navigate]);

  const isAdmin = user?.rol === 'administradora';
  const isPaciente = user?.rol === 'paciente';

  return {
    user,
    token,
    isAuthenticated: !!token,
    isAdmin,
    isPaciente,
    setAuth,
    logout,
  };
}
```

### Hook de Formateo Argentino
```tsx
// hooks/useFormatters.ts
import { useCallback } from 'react';

export function useFormatters() {
  const formatearMonto = useCallback((monto: number, moneda: 'ARS' | 'USD' = 'ARS'): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: moneda,
    }).format(monto);
  }, []);

  const formatearFecha = useCallback((fecha: Date | string): string => {
    return new Intl.DateTimeFormat('es-AR').format(new Date(fecha));
  }, []);

  const formatearFechaHora = useCallback((fecha: Date | string): string => {
    return new Intl.DateTimeFormat('es-AR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(fecha));
  }, []);

  return { formatearMonto, formatearFecha, formatearFechaHora };
}
```

### Hook de Stock con Alertas
```tsx
// hooks/useMateriales.ts
import { useQuery } from '@tanstack/react-query';
import { materialesService } from '@/services/materialesService';

export function useMaterialesStockBajo() {
  return useQuery({
    queryKey: ['materiales', 'stock-bajo'],
    queryFn: materialesService.obtenerStockBajo,
    refetchInterval: 60000, // Refrescar cada minuto
  });
}

export function useValorInventario() {
  return useQuery({
    queryKey: ['materiales', 'valor-total'],
    queryFn: materialesService.obtenerValorTotal,
  });
}
```
