import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { pagosService } from '@/services/pagosService'
import { pacientesService } from '@/services/pacientesService'
import { sesionesService } from '@/services/sesionesService'
import { toast } from '@/hooks/useToast'
import type { Pago, PagoCreate, MetodoPago } from '@/types'

const pagoSchema = z.object({
  paciente_id: z.number({ required_error: 'Selecciona un paciente' }),
  sesion_id: z.number().optional().nullable(),
  monto: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  metodo_pago: z.enum(['efectivo', 'transferencia', 'debito', 'credito', 'mercadopago']),
  fecha: z.string().min(1, 'La fecha es requerida'),
  concepto: z.string().optional(),
  notas: z.string().optional(),
})

type PagoFormData = z.infer<typeof pagoSchema>

interface PagoFormProps {
  pago?: Pago
  pacienteId?: number
  sesionId?: number
  onSuccess?: () => void
  onCancel?: () => void
}

export function PagoForm({ pago, pacienteId, sesionId, onSuccess, onCancel }: PagoFormProps) {
  const queryClient = useQueryClient()
  const isEditing = !!pago

  const { data: pacientes = [] } = useQuery({
    queryKey: ['pacientes'],
    queryFn: () => pacientesService.listar(),
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PagoFormData>({
    resolver: zodResolver(pagoSchema),
    defaultValues: pago
      ? {
          paciente_id: pago.paciente_id,
          sesion_id: pago.sesion_id || null,
          monto: pago.monto,
          metodo_pago: pago.metodo_pago,
          fecha: pago.fecha,
          concepto: pago.concepto || '',
          notas: pago.notas || '',
        }
      : {
          paciente_id: pacienteId,
          sesion_id: sesionId || null,
          metodo_pago: 'efectivo' as MetodoPago,
          fecha: new Date().toISOString().split('T')[0],
        },
  })

  const selectedPacienteId = watch('paciente_id')

  // Obtener sesiones del paciente seleccionado
  const { data: sesiones = [] } = useQuery({
    queryKey: ['sesiones', 'paciente', selectedPacienteId],
    queryFn: () => sesionesService.listar({ paciente_id: selectedPacienteId }),
    enabled: !!selectedPacienteId,
  })

  const mutation = useMutation({
    mutationFn: (data: PagoFormData) => {
      const payload: PagoCreate = {
        paciente_id: data.paciente_id,
        sesion_id: data.sesion_id || undefined,
        monto: data.monto,
        metodo_pago: data.metodo_pago,
        fecha: data.fecha,
        concepto: data.concepto || undefined,
        notas: data.notas || undefined,
      }
      return isEditing
        ? pagosService.actualizar(pago.id, payload)
        : pagosService.crear(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagos'] })
      toast({
        title: isEditing ? 'Pago actualizado' : 'Pago registrado',
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

  const onSubmit = (data: PagoFormData) => {
    mutation.mutate(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Paciente */}
      <div className="space-y-2">
        <Label htmlFor="paciente_id">Paciente *</Label>
        <Select
          value={watch('paciente_id')?.toString() || ''}
          onValueChange={(value) => setValue('paciente_id', parseInt(value))}
          disabled={!!pacienteId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar paciente" />
          </SelectTrigger>
          <SelectContent>
            {pacientes.map((paciente) => (
              <SelectItem key={paciente.id} value={paciente.id.toString()}>
                {paciente.nombre_completo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.paciente_id && (
          <p className="text-sm text-red-500">{errors.paciente_id.message}</p>
        )}
      </div>

      {/* Sesión (opcional) */}
      {selectedPacienteId && sesiones.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="sesion_id">Sesión (opcional)</Label>
          <Select
            value={watch('sesion_id')?.toString() || ''}
            onValueChange={(value) => setValue('sesion_id', value ? parseInt(value) : null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sin sesión asociada" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Sin sesión asociada</SelectItem>
              {sesiones.map((sesion) => (
                <SelectItem key={sesion.id} value={sesion.id.toString()}>
                  {sesion.fecha} - {sesion.tratamiento?.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

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

      {/* Concepto */}
      <div className="space-y-2">
        <Label htmlFor="concepto">Concepto</Label>
        <Input
          id="concepto"
          {...register('concepto')}
          placeholder="Ej: Pago de sesión de Botox"
        />
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
            'Registrar Pago'
          )}
        </Button>
      </div>
    </form>
  )
}
