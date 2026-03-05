import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, Trash2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { sesionesService } from '@/services/sesionesService'
import { pacientesService } from '@/services/pacientesService'
import { tratamientosService } from '@/services/tratamientosService'
import { materialesService } from '@/services/materialesService'
import { toast } from '@/hooks/useToast'
import type { Sesion, SesionCreate, EstadoSesion } from '@/types'

const sesionSchema = z.object({
  paciente_id: z.number({ required_error: 'Selecciona un paciente' }),
  tratamiento_id: z.number({ required_error: 'Selecciona un tratamiento' }),
  fecha: z.string().min(1, 'La fecha es requerida'),
  hora_inicio: z.string().min(1, 'La hora de inicio es requerida'),
  hora_fin: z.string().optional(),
  estado: z.enum(['programada', 'confirmada', 'en_curso', 'completada', 'cancelada', 'no_asistio']),
  precio_cobrado: z.number().min(0).optional().nullable(),
  descuento_aplicado: z.number().min(0).max(100).optional().nullable(),
  notas: z.string().optional(),
  notas_internas: z.string().optional(),
  materiales: z.array(z.object({
    material_id: z.number(),
    cantidad: z.number().min(1),
  })).optional(),
})

type SesionFormData = z.infer<typeof sesionSchema>

interface SesionFormProps {
  sesion?: Sesion
  pacienteId?: number
  onSuccess?: () => void
  onCancel?: () => void
}

export function SesionForm({ sesion, pacienteId, onSuccess, onCancel }: SesionFormProps) {
  const queryClient = useQueryClient()
  const isEditing = !!sesion

  const { data: pacientes = [] } = useQuery({
    queryKey: ['pacientes'],
    queryFn: () => pacientesService.listar(),
  })

  const { data: tratamientos = [] } = useQuery({
    queryKey: ['tratamientos'],
    queryFn: () => tratamientosService.listar(),
  })

  const { data: materiales = [] } = useQuery({
    queryKey: ['materiales'],
    queryFn: () => materialesService.listar(),
  })

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SesionFormData>({
    resolver: zodResolver(sesionSchema),
    defaultValues: sesion ? {
      paciente_id: sesion.paciente_id,
      tratamiento_id: sesion.tratamiento_id,
      fecha: sesion.fecha,
      hora_inicio: sesion.hora_inicio || '',
      hora_fin: sesion.hora_fin || '',
      estado: sesion.estado,
      precio_cobrado: sesion.precio_cobrado || null,
      descuento_aplicado: sesion.descuento_aplicado || null,
      notas: sesion.notas || '',
      notas_internas: sesion.notas_internas || '',
      materiales: sesion.materiales?.map(m => ({
        material_id: m.material_id,
        cantidad: m.cantidad,
      })) || [],
    } : {
      paciente_id: pacienteId,
      estado: 'programada' as EstadoSesion,
      fecha: new Date().toISOString().split('T')[0],
      materiales: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'materiales',
  })

  const selectedTratamiento = watch('tratamiento_id')

  // Auto-fill precio from tratamiento
  useEffect(() => {
    if (selectedTratamiento && !isEditing) {
      const trat = tratamientos.find(t => t.id === selectedTratamiento)
      if (trat?.precio_lista) {
        setValue('precio_cobrado', trat.precio_lista)
      }
    }
  }, [selectedTratamiento, tratamientos, setValue, isEditing])

  const mutation = useMutation({
    mutationFn: (data: SesionFormData) => {
      const payload: SesionCreate = {
        paciente_id: data.paciente_id,
        tratamiento_id: data.tratamiento_id,
        fecha: data.fecha,
        hora_inicio: data.hora_inicio,
        hora_fin: data.hora_fin || undefined,
        estado: data.estado,
        precio_cobrado: data.precio_cobrado || undefined,
        descuento_aplicado: data.descuento_aplicado || undefined,
        notas: data.notas || undefined,
        notas_internas: data.notas_internas || undefined,
      }
      return isEditing
        ? sesionesService.actualizar(sesion.id, payload)
        : sesionesService.crear(payload)
    },
    onSuccess: async (newSesion) => {
      // Si hay materiales, asignarlos
      if (fields.length > 0) {
        const materialesData = fields.map((_, index) => ({
          material_id: watch(`materiales.${index}.material_id`),
          cantidad: watch(`materiales.${index}.cantidad`),
        }))

        for (const mat of materialesData) {
          if (mat.material_id && mat.cantidad) {
            await sesionesService.asignarMaterial(newSesion.id, mat.material_id, mat.cantidad)
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ['sesiones'] })
      queryClient.invalidateQueries({ queryKey: ['materiales'] })
      toast({
        title: isEditing ? 'Sesión actualizada' : 'Sesión creada',
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

  const onSubmit = (data: SesionFormData) => {
    mutation.mutate(data)
  }

  const addMaterial = () => {
    append({ material_id: 0, cantidad: 1 })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* Tratamiento */}
        <div className="space-y-2">
          <Label htmlFor="tratamiento_id">Tratamiento *</Label>
          <Select
            value={watch('tratamiento_id')?.toString() || ''}
            onValueChange={(value) => setValue('tratamiento_id', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tratamiento" />
            </SelectTrigger>
            <SelectContent>
              {tratamientos.map((tratamiento) => (
                <SelectItem key={tratamiento.id} value={tratamiento.id.toString()}>
                  {tratamiento.nombre} - ${tratamiento.precio_lista?.toLocaleString('es-AR') || 'Sin precio'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.tratamiento_id && (
            <p className="text-sm text-red-500">{errors.tratamiento_id.message}</p>
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

        {/* Estado */}
        <div className="space-y-2">
          <Label htmlFor="estado">Estado</Label>
          <Select
            value={watch('estado')}
            onValueChange={(value) => setValue('estado', value as EstadoSesion)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="programada">Programada</SelectItem>
              <SelectItem value="confirmada">Confirmada</SelectItem>
              <SelectItem value="en_curso">En Curso</SelectItem>
              <SelectItem value="completada">Completada</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
              <SelectItem value="no_asistio">No Asistió</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Hora Inicio */}
        <div className="space-y-2">
          <Label htmlFor="hora_inicio">Hora Inicio *</Label>
          <Input
            id="hora_inicio"
            type="time"
            {...register('hora_inicio')}
          />
          {errors.hora_inicio && (
            <p className="text-sm text-red-500">{errors.hora_inicio.message}</p>
          )}
        </div>

        {/* Hora Fin */}
        <div className="space-y-2">
          <Label htmlFor="hora_fin">Hora Fin</Label>
          <Input
            id="hora_fin"
            type="time"
            {...register('hora_fin')}
          />
        </div>

        {/* Precio */}
        <div className="space-y-2">
          <Label htmlFor="precio_cobrado">Precio Cobrado (ARS)</Label>
          <Input
            id="precio_cobrado"
            type="number"
            step="0.01"
            {...register('precio_cobrado', { valueAsNumber: true })}
            placeholder="0.00"
          />
        </div>

        {/* Descuento */}
        <div className="space-y-2">
          <Label htmlFor="descuento_aplicado">Descuento (%)</Label>
          <Input
            id="descuento_aplicado"
            type="number"
            min="0"
            max="100"
            {...register('descuento_aplicado', { valueAsNumber: true })}
            placeholder="0"
          />
        </div>

        {/* Notas */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notas">Notas (visibles para paciente)</Label>
          <Textarea
            id="notas"
            {...register('notas')}
            placeholder="Notas sobre la sesión..."
            rows={3}
          />
        </div>

        {/* Notas Internas */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notas_internas">Notas Internas (solo admin)</Label>
          <Textarea
            id="notas_internas"
            {...register('notas_internas')}
            placeholder="Notas internas del tratamiento..."
            rows={3}
          />
        </div>
      </div>

      {/* Materiales */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Materiales Utilizados
            </CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addMaterial}>
              <Plus className="h-4 w-4 mr-1" />
              Agregar Material
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No hay materiales asignados a esta sesión.
            </p>
          ) : (
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <Select
                      value={watch(`materiales.${index}.material_id`)?.toString() || ''}
                      onValueChange={(value) => setValue(`materiales.${index}.material_id`, parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar material" />
                      </SelectTrigger>
                      <SelectContent>
                        {materiales.map((material) => (
                          <SelectItem key={material.id} value={material.id.toString()}>
                            {material.nombre} (Stock: {material.stock_actual})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      min="1"
                      placeholder="Cant."
                      {...register(`materiales.${index}.cantidad`, { valueAsNumber: true })}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
            isEditing ? 'Actualizar Sesión' : 'Crear Sesión'
          )}
        </Button>
      </div>
    </form>
  )
}
