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
import { pacientesService } from '@/services/pacientesService'
import { toast } from '@/hooks/useToast'
import type { Paciente, PacienteCreate } from '@/types'

const pacienteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellido: z.string().min(1, 'El apellido es requerido'),
  dni: z.string().optional(),
  fecha_nacimiento: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  antecedentes: z.string().optional(),
  alergias: z.string().optional(),
  medicacion_actual: z.string().optional(),
  notas_medicas: z.string().optional(),
  estado: z.enum(['activo', 'inactivo', 'nuevo']).optional(),
})

type PacienteFormData = z.infer<typeof pacienteSchema>

interface PacienteFormProps {
  paciente?: Paciente
  onSuccess?: () => void
  onCancel?: () => void
}

export function PacienteForm({ paciente, onSuccess, onCancel }: PacienteFormProps) {
  const queryClient = useQueryClient()
  const isEditing = !!paciente

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PacienteFormData>({
    resolver: zodResolver(pacienteSchema),
    defaultValues: paciente ? {
      nombre: paciente.nombre,
      apellido: paciente.apellido,
      dni: paciente.dni || '',
      fecha_nacimiento: paciente.fecha_nacimiento || '',
      telefono: paciente.telefono || '',
      email: paciente.email || '',
      antecedentes: paciente.antecedentes || '',
      alergias: paciente.alergias || '',
      medicacion_actual: paciente.medicacion_actual || '',
      notas_medicas: paciente.notas_medicas || '',
      estado: paciente.estado,
    } : {
      estado: 'nuevo',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: PacienteFormData) => {
      const payload: PacienteCreate = {
        ...data,
        email: data.email || undefined,
      }
      return isEditing
        ? pacientesService.actualizar(paciente.id, payload)
        : pacientesService.crear(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] })
      toast({
        title: isEditing ? 'Paciente actualizado' : 'Paciente creado',
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

  const onSubmit = (data: PacienteFormData) => {
    mutation.mutate(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nombre */}
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre *</Label>
          <Input
            id="nombre"
            {...register('nombre')}
            placeholder="Juan"
          />
          {errors.nombre && (
            <p className="text-sm text-red-500">{errors.nombre.message}</p>
          )}
        </div>

        {/* Apellido */}
        <div className="space-y-2">
          <Label htmlFor="apellido">Apellido *</Label>
          <Input
            id="apellido"
            {...register('apellido')}
            placeholder="Pérez"
          />
          {errors.apellido && (
            <p className="text-sm text-red-500">{errors.apellido.message}</p>
          )}
        </div>

        {/* DNI */}
        <div className="space-y-2">
          <Label htmlFor="dni">DNI</Label>
          <Input
            id="dni"
            {...register('dni')}
            placeholder="12345678"
          />
        </div>

        {/* Fecha de nacimiento */}
        <div className="space-y-2">
          <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
          <Input
            id="fecha_nacimiento"
            type="date"
            {...register('fecha_nacimiento')}
          />
        </div>

        {/* Teléfono */}
        <div className="space-y-2">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input
            id="telefono"
            {...register('telefono')}
            placeholder="+54 11 1234-5678"
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="paciente@email.com"
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Estado */}
        <div className="space-y-2">
          <Label>Estado</Label>
          <Select
            value={watch('estado')}
            onValueChange={(value) => setValue('estado', value as 'activo' | 'inactivo' | 'nuevo')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nuevo">Nuevo</SelectItem>
              <SelectItem value="activo">Activo</SelectItem>
              <SelectItem value="inactivo">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Historial Clínico */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Historial Clínico</h3>

        <div className="space-y-2">
          <Label htmlFor="antecedentes">Antecedentes</Label>
          <Textarea
            id="antecedentes"
            {...register('antecedentes')}
            placeholder="Antecedentes médicos relevantes..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="alergias">Alergias</Label>
          <Textarea
            id="alergias"
            {...register('alergias')}
            placeholder="Alergias conocidas..."
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="medicacion_actual">Medicación Actual</Label>
          <Textarea
            id="medicacion_actual"
            {...register('medicacion_actual')}
            placeholder="Medicamentos que está tomando actualmente..."
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notas_medicas">Notas Médicas</Label>
          <Textarea
            id="notas_medicas"
            {...register('notas_medicas')}
            placeholder="Notas adicionales..."
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
          ) : (
            isEditing ? 'Actualizar' : 'Crear Paciente'
          )}
        </Button>
      </div>
    </form>
  )
}
