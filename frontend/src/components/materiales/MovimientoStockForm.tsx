import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { materialesService } from '@/services/materialesService'
import { toast } from '@/hooks/useToast'
import type { Material, TipoMovimientoStock } from '@/types'

const movimientoSchema = z.object({
  tipo: z.enum(['entrada', 'salida', 'ajuste', 'uso_sesion']),
  cantidad: z.number().min(1, 'La cantidad debe ser mayor a 0'),
  motivo: z.string().optional(),
})

type MovimientoFormData = z.infer<typeof movimientoSchema>

interface MovimientoStockFormProps {
  material: Material
  onSuccess?: () => void
  onCancel?: () => void
}

const tipoOptions: { value: TipoMovimientoStock; label: string; icon: typeof Plus }[] = [
  { value: 'entrada', label: 'Entrada (compra/reposición)', icon: Plus },
  { value: 'salida', label: 'Salida (uso/pérdida)', icon: Minus },
  { value: 'ajuste', label: 'Ajuste de inventario', icon: Plus },
]

export function MovimientoStockForm({ material, onSuccess, onCancel }: MovimientoStockFormProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MovimientoFormData>({
    resolver: zodResolver(movimientoSchema),
    defaultValues: {
      tipo: 'entrada',
      cantidad: 1,
    },
  })

  const tipo = watch('tipo')
  const cantidad = watch('cantidad')

  const nuevoStock =
    tipo === 'entrada'
      ? material.stock_actual + (cantidad || 0)
      : material.stock_actual - (cantidad || 0)

  const mutation = useMutation({
    mutationFn: (data: MovimientoFormData) => {
      if (data.tipo === 'entrada') {
        return materialesService.agregarStock(material.id, data.cantidad, data.motivo)
      } else {
        return materialesService.descontarStock(material.id, data.cantidad, data.motivo)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiales'] })
      toast({
        title: 'Movimiento registrado',
        description: `Stock actualizado de ${material.nombre}`,
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

  const onSubmit = (data: MovimientoFormData) => {
    if (data.tipo !== 'entrada' && data.cantidad > material.stock_actual) {
      toast({
        title: 'Stock insuficiente',
        description: `No hay suficiente stock. Disponible: ${material.stock_actual}`,
        variant: 'destructive',
      })
      return
    }
    mutation.mutate(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Info del Material */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900">{material.nombre}</h3>
        <p className="text-sm text-gray-500 mt-1">
          Stock actual: <span className="font-medium">{material.stock_actual}</span> {material.unidad_medida}
        </p>
      </div>

      {/* Tipo de Movimiento */}
      <div className="space-y-2">
        <Label>Tipo de Movimiento *</Label>
        <Select
          value={tipo}
          onValueChange={(value) => setValue('tipo', value as TipoMovimientoStock)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {tipoOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cantidad */}
      <div className="space-y-2">
        <Label htmlFor="cantidad">Cantidad *</Label>
        <Input
          id="cantidad"
          type="number"
          min="1"
          {...register('cantidad', { valueAsNumber: true })}
          placeholder="1"
        />
        {errors.cantidad && (
          <p className="text-sm text-red-500">{errors.cantidad.message}</p>
        )}
      </div>

      {/* Preview del nuevo stock */}
      <div className="bg-primary-50 rounded-lg p-4">
        <p className="text-sm text-gray-600">
          Nuevo stock después del movimiento:
        </p>
        <p className={`text-2xl font-bold ${nuevoStock < 0 ? 'text-red-600' : 'text-primary-600'}`}>
          {nuevoStock} {material.unidad_medida}
        </p>
        {nuevoStock < 0 && (
          <p className="text-sm text-red-500 mt-1">
            Stock insuficiente para esta operación
          </p>
        )}
      </div>

      {/* Motivo */}
      <div className="space-y-2">
        <Label htmlFor="motivo">Motivo / Observaciones</Label>
        <Textarea
          id="motivo"
          {...register('motivo')}
          placeholder="Ej: Compra a proveedor, ajuste por inventario físico..."
          rows={2}
        />
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          disabled={mutation.isPending || nuevoStock < 0}
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Registrando...
            </>
          ) : (
            'Registrar Movimiento'
          )}
        </Button>
      </div>
    </form>
  )
}
