import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { materialesService } from '@/services/materialesService'
import { toast } from '@/hooks/useToast'
import type { Material, MaterialCreate } from '@/types'

const materialSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  codigo: z.string().optional(),
  unidad_medida: z.string().min(1, 'La unidad de medida es requerida'),
  stock_actual: z.number().min(0),
  stock_minimo: z.number().min(0).optional().nullable(),
  precio_costo: z.number().min(0).optional().nullable(),
  proveedor: z.string().optional(),
})

type MaterialFormData = z.infer<typeof materialSchema>

interface MaterialFormProps {
  material?: Material
  onSuccess?: () => void
  onCancel?: () => void
}

export function MaterialForm({ material, onSuccess, onCancel }: MaterialFormProps) {
  const queryClient = useQueryClient()
  const isEditing = !!material

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
    defaultValues: material
      ? {
          nombre: material.nombre,
          descripcion: material.descripcion || '',
          codigo: material.codigo || '',
          unidad_medida: material.unidad_medida,
          stock_actual: material.stock_actual,
          stock_minimo: material.stock_minimo || null,
          precio_costo: material.precio_costo || null,
          proveedor: material.proveedor || '',
        }
      : {
          unidad_medida: 'unidades',
          stock_actual: 0,
        },
  })

  const mutation = useMutation({
    mutationFn: (data: MaterialFormData) => {
      const payload: MaterialCreate = {
        nombre: data.nombre,
        descripcion: data.descripcion || undefined,
        codigo: data.codigo || undefined,
        unidad_medida: data.unidad_medida,
        stock_actual: data.stock_actual,
        stock_minimo: data.stock_minimo || undefined,
        precio_costo: data.precio_costo || undefined,
        proveedor: data.proveedor || undefined,
      }
      return isEditing
        ? materialesService.actualizar(material.id, payload)
        : materialesService.crear(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiales'] })
      toast({
        title: isEditing ? 'Material actualizado' : 'Material creado',
        variant: 'success',
      })
      onSuccess?.()
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (data: MaterialFormData) => {
    mutation.mutate(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nombre */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="nombre">Nombre del Material *</Label>
          <Input
            id="nombre"
            {...register('nombre')}
            placeholder="Ej: Botox Allergan 50U"
          />
          {errors.nombre && (
            <p className="text-sm text-red-500">{errors.nombre.message}</p>
          )}
        </div>

        {/* Código */}
        <div className="space-y-2">
          <Label htmlFor="codigo">Código / SKU</Label>
          <Input
            id="codigo"
            {...register('codigo')}
            placeholder="Ej: BOT-50U"
          />
        </div>

        {/* Unidad de Medida */}
        <div className="space-y-2">
          <Label htmlFor="unidad_medida">Unidad de Medida *</Label>
          <Input
            id="unidad_medida"
            {...register('unidad_medida')}
            placeholder="Ej: unidades, ml, jeringas..."
          />
          {errors.unidad_medida && (
            <p className="text-sm text-red-500">{errors.unidad_medida.message}</p>
          )}
        </div>

        {/* Stock Actual */}
        <div className="space-y-2">
          <Label htmlFor="stock_actual">Stock Actual *</Label>
          <Input
            id="stock_actual"
            type="number"
            min="0"
            {...register('stock_actual', { valueAsNumber: true })}
            placeholder="0"
          />
          {errors.stock_actual && (
            <p className="text-sm text-red-500">{errors.stock_actual.message}</p>
          )}
        </div>

        {/* Stock Mínimo */}
        <div className="space-y-2">
          <Label htmlFor="stock_minimo">Stock Mínimo (alerta)</Label>
          <Input
            id="stock_minimo"
            type="number"
            min="0"
            {...register('stock_minimo', { valueAsNumber: true })}
            placeholder="0"
          />
        </div>

        {/* Precio Costo */}
        <div className="space-y-2">
          <Label htmlFor="precio_costo">Precio Costo (ARS)</Label>
          <Input
            id="precio_costo"
            type="number"
            step="0.01"
            min="0"
            {...register('precio_costo', { valueAsNumber: true })}
            placeholder="0.00"
          />
        </div>

        {/* Proveedor */}
        <div className="space-y-2">
          <Label htmlFor="proveedor">Proveedor</Label>
          <Input
            id="proveedor"
            {...register('proveedor')}
            placeholder="Nombre del proveedor"
          />
        </div>

        {/* Descripción */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="descripcion">Descripción</Label>
          <Textarea
            id="descripcion"
            {...register('descripcion')}
            placeholder="Descripción del material, notas de uso..."
            rows={3}
          />
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : isEditing ? (
            'Actualizar'
          ) : (
            'Crear Material'
          )}
        </Button>
      </div>
    </form>
  )
}
