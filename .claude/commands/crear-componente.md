# Crear Componente React

Crea un nuevo componente React para: $ARGUMENTS

## Instrucciones

1. Crear componentes en `frontend/src/components/{modulo}/`:
   - `{Nombre}List.tsx` - Tabla con listado
   - `{Nombre}Form.tsx` - Formulario create/edit
   - `{Nombre}Detail.tsx` - Vista detalle
   - `index.ts` - Exports

2. Usar los estilos de shadcn/ui y la paleta rosa/fucsia (#C2185B, #E91E63, #FCE4EC)

3. Implementar TypeScript estricto (prohibido `any`)

4. Incluir loading states y error handling

## Estructura de Componentes

### Lista con TanStack Table
```tsx
// components/{modulo}/{Nombre}List.tsx
import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { {nombre}Service } from '@/services/{nombre}Service';
import type { {Nombre} } from '@/types/{nombre}';

export function {Nombre}List() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['{nombres}'],
    queryFn: {nombre}Service.obtenerTodos,
  });

  const columns: ColumnDef<{Nombre}>[] = [
    {
      accessorKey: 'nombre',
      header: 'Nombre',
    },
    // más columnas...
    {
      id: 'acciones',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Ver</Button>
          <Button variant="outline" size="sm">Editar</Button>
        </div>
      ),
    },
  ];

  if (isLoading) return <div>Cargando...</div>;
  if (error) return <div>Error al cargar datos</div>;

  return (
    <Table>
      {/* ... */}
    </Table>
  );
}
```

### Formulario con React Hook Form + Zod
```tsx
// components/{modulo}/{Nombre}Form.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { {nombre}Service } from '@/services/{nombre}Service';

const {nombre}Schema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  // más campos...
});

type {Nombre}FormData = z.infer<typeof {nombre}Schema>;

interface {Nombre}FormProps {
  {nombre}?: {Nombre};
  onSuccess?: () => void;
}

export function {Nombre}Form({ {nombre}, onSuccess }: {Nombre}FormProps) {
  const queryClient = useQueryClient();

  const form = useForm<{Nombre}FormData>({
    resolver: zodResolver({nombre}Schema),
    defaultValues: {nombre} ?? {
      nombre: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: {Nombre}FormData) =>
      {nombre} ? {nombre}Service.actualizar({nombre}.id, data) : {nombre}Service.crear(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['{nombres}'] });
      onSuccess?.();
    },
  });

  const onSubmit = (data: {Nombre}FormData) => {
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={mutation.isPending}
          className="bg-pink-600 hover:bg-pink-700"
        >
          {mutation.isPending ? 'Guardando...' : 'Guardar'}
        </Button>
      </form>
    </Form>
  );
}
```

## Formateo Argentino

```tsx
// utils/formatters.ts
export const formatearMonto = (monto: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(monto);
};

export const formatearFecha = (fecha: Date | string): string => {
  return new Intl.DateTimeFormat('es-AR').format(new Date(fecha));
};
```
