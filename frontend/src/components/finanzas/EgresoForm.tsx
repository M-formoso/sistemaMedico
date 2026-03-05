import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { egresosService } from '@/services/egresosService'
import { toast } from '@/hooks/useToast'
import type { Egreso, EgresoCreate, CategoriaEgreso, MetodoPago } from '@/types'

const egresoSchema = z.object({
  concepto: z.string().min(1, 'El concepto es requerido'),
  monto: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  categoria: z.enum(['materiales', 'servicios', 'alquiler', 'sueldos', 'impuestos', 'marketing', 'mantenimiento', 'otros']),
  metodo_pago: z.enum(['efectivo', 'transferencia', 'debito', 'credito', 'mercadopago']),
  fecha: z.string().min(1, 'La fecha es requerida'),
  proveedor: z.string().optional(),
  numero_factura: z.string().optional(),
  notas: z.string().optional(),
})

type EgresoFormData = z.infer<typeof egresoSchema>

interface EgresoFormProps {
  egreso?: Egreso
  onSuccess?: () => void
  onCancel?: () => void
}

export function EgresoForm({ egreso, onSuccess, onCancel }: EgresoFormProps) {
  const queryClient = useQueryClient()
  const isEditing = !!egreso

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EgresoFormData>({
    resolver: zodResolver(egresoSchema),
    defaultValues: egreso
      ? {
          concepto: egreso.concepto,
          monto: egreso.monto,
          categoria: egreso.categoria,
          metodo_pago: egreso.metodo_pago,
          fecha: egreso.fecha,
          proveedor: egreso.proveedor || '',
          numero_factura: egreso.numero_factura || '',
          notas: egreso.notas || '',
        }
      : {
          categoria: 'otros' as CategoriaEgreso,
          metodo_pago: 'efectivo' as MetodoPago,
          fecha: new Date().toISOString().split('T')[0],
        },
  })

  const mutation = useMutation({
    mutationFn: (data: EgresoFormData) => {
      const payload: EgresoCreate = {
        concepto: data.concepto,
        monto: data.monto,
        categoria: data.categoria,
        metodo_pago: data.metodo_pago,
        fecha: data.fecha,
        proveedor: data.proveedor || undefined,
        numero_factura: data.numero_factura || undefined,
        notas: data.notas || undefined,
      }
      return isEditing
        ? egresosService.actualizar(egreso.id, payload)
        : egresosService.crear(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['egresos'] })
      toast({
        title: isEditing ? 'Egreso actualizado' : 'Egreso registrado',
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

  const onSubmit = (data: EgresoFormData) => {
    mutation.mutate(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Concepto */}
      <div className="space-y-2">
        <Label htmlFor="concepto">Concepto *</Label>
        <Input
          id="concepto"
          {...register('concepto')}
          placeholder="Ej: Compra de materiales, Pago de alquiler..."
        />
        {errors.concepto && (
          <p className="text-sm text-red-500">{errors.concepto.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Monto */}
        <div className="space-y-2">
          <Label htmlFor="monto">Monto (ARS) *</Label>
          <Input
            id="monto"
            type="number"
            step="0.01"
            min="0"
            {...register('monto', { valueAsNumber: true })}
            placeholder="0.00"
          />
          {errors.monto && (
            <p className="text-sm text-red-500">{errors.monto.message}</p>
          )}
        </div>

        {/* Fecha */}
        <div className="space-y-2">
          <Label htmlFor="fecha">Fecha *</Label>
          <Input
            id="fecha"
            type="date"
            {...register('fecha')}
          />
          {errors.fecha && (
            <p className="text-sm text-red-500">{errors.fecha.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Categoría */}
        <div className="space-y-2">
          <Label htmlFor="categoria">Categoría *</Label>
          <Select
            value={watch('categoria')}
            onValueChange={(value) => setValue('categoria', value as CategoriaEgreso)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="materiales">Materiales</SelectItem>
              <SelectItem value="servicios">Servicios</SelectItem>
              <SelectItem value="alquiler">Alquiler</SelectItem>
              <SelectItem value="sueldos">Sueldos</SelectItem>
              <SelectItem value="impuestos">Impuestos</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
              <SelectItem value="otros">Otros</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Método de Pago */}
        <div className="space-y-2">
          <Label htmlFor="metodo_pago">Método de Pago *</Label>
          <Select
            value={watch('metodo_pago')}
            onValueChange={(value) => setValue('metodo_pago', value as MetodoPago)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="efectivo">Efectivo</SelectItem>
              <SelectItem value="transferencia">Transferencia</SelectItem>
              <SelectItem value="debito">Tarjeta Débito</SelectItem>
              <SelectItem value="credito">Tarjeta Crédito</SelectItem>
              <SelectItem value="mercadopago">Mercado Pago</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Proveedor */}
        <div className="space-y-2">
          <Label htmlFor="proveedor">Proveedor</Label>
          <Input
            id="proveedor"
            {...register('proveedor')}
            placeholder="Nombre del proveedor"
          />
        </div>

        {/* Número de Factura */}
        <div className="space-y-2">
          <Label htmlFor="numero_factura">Número de Factura</Label>
          <Input
            id="numero_factura"
            {...register('numero_factura')}
            placeholder="Ej: A-0001-00001234"
          />
        </div>
      </div>

      {/* Notas */}
      <div className="space-y-2">
        <Label htmlFor="notas">Notas</Label>
        <Textarea
          id="notas"
          {...register('notas')}
          placeholder="Notas adicionales..."
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
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : isEditing ? (
            'Actualizar'
          ) : (
            'Registrar Egreso'
          )}
        </Button>
      </div>
    </form>
  )
}
