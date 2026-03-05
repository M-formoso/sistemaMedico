import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { tratamientosService } from '@/services/tratamientosService'
import { toast } from '@/hooks/useToast'
import type { Tratamiento, TratamientoCreate } from '@/types'

const tratamientoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  precio_lista: z.number().min(0).optional().nullable(),
  duracion_minutos: z.number().min(1).optional().nullable(),
  zona_corporal: z.string().optional(),
  sesiones_recomendadas: z.number().min(1).optional().nullable(),
})

type TratamientoFormData = z.infer<typeof tratamientoSchema>

interface TratamientoFormProps {
  tratamiento?: Tratamiento
  onSuccess?: () => void
  onCancel?: () => void
}

export function TratamientoForm({ tratamiento, onSuccess, onCancel }: TratamientoFormProps) {
  const queryClient = useQueryClient()
  const isEditing = !!tratamiento

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TratamientoFormData>({
    resolver: zodResolver(tratamientoSchema),
    defaultValues: tratamiento ? {
      nombre: tratamiento.nombre,
      descripcion: tratamiento.descripcion || '',
      precio_lista: tratamiento.precio_lista || null,
      duracion_minutos: tratamiento.duracion_minutos || null,
      zona_corporal: tratamiento.zona_corporal || '',
      sesiones_recomendadas: tratamiento.sesiones_recomendadas || null,
    } : {},
  })

  const mutation = useMutation({
    mutationFn: (data: TratamientoFormData) => {
      const payload: TratamientoCreate = {
        nombre: data.nombre,
        descripcion: data.descripcion || undefined,
        precio_lista: data.precio_lista || undefined,
        duracion_minutos: data.duracion_minutos || undefined,
        zona_corporal: data.zona_corporal || undefined,
        sesiones_recomendadas: data.sesiones_recomendadas || undefined,
      }
      return isEditing
        ? tratamientosService.actualizar(tratamiento.id, payload)
        : tratamientosService.crear(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tratamientos'] })
      toast({
        title: isEditing ? 'Tratamiento actualizado' : 'Tratamiento creado',
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

  const onSubmit = (data: TratamientoFormData) => {
    mutation.mutate(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nombre */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="nombre">Nombre del Tratamiento *</Label>
          <Input
            id="nombre"
            {...register('nombre')}
            placeholder="Ej: Botox, Ácido Hialurónico..."
          />
          {errors.nombre && (
            <p className="text-sm text-red-500">{errors.nombre.message}</p>
          )}
        </div>

        {/* Precio */}
        <div className="space-y-2">
          <Label htmlFor="precio_lista">Precio de Lista (ARS)</Label>
          <Input
            id="precio_lista"
            type="number"
            step="0.01"
            {...register('precio_lista', { valueAsNumber: true })}
            placeholder="0.00"
          />
        </div>

        {/* Duración */}
        <div className="space-y-2">
          <Label htmlFor="duracion_minutos">Duración (minutos)</Label>
          <Input
            id="duracion_minutos"
            type="number"
            {...register('duracion_minutos', { valueAsNumber: true })}
            placeholder="60"
          />
        </div>

        {/* Zona Corporal */}
        <div className="space-y-2">
          <Label htmlFor="zona_corporal">Zona Corporal</Label>
          <Input
            id="zona_corporal"
            {...register('zona_corporal')}
            placeholder="Ej: Rostro, Labios, Frente..."
          />
        </div>

        {/* Sesiones Recomendadas */}
        <div className="space-y-2">
          <Label htmlFor="sesiones_recomendadas">Sesiones Recomendadas</Label>
          <Input
            id="sesiones_recomendadas"
            type="number"
            {...register('sesiones_recomendadas', { valueAsNumber: true })}
            placeholder="1"
          />
        </div>

        {/* Descripción */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="descripcion">Descripción / Protocolo</Label>
          <Textarea
            id="descripcion"
            {...register('descripcion')}
            placeholder="Descripción del tratamiento, protocolo a seguir..."
            rows={4}
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
          ) : (
            isEditing ? 'Actualizar' : 'Crear Tratamiento'
          )}
        </Button>
      </div>
    </form>
  )
}
