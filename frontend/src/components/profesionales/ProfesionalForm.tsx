import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Profesional, ProfesionalCreate } from '@/services/profesionalesService'

const profesionalSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellido: z.string().min(1, 'El apellido es requerido'),
  especialidad: z.string().optional(),
  matricula: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  direccion: z.string().optional(),
  duracion_turno_default: z.number().min(5).max(240).default(30),
  color_agenda: z.string().default('#E91E63'),
  porcentaje_comision: z.number().min(0).max(100).default(0),
  notas: z.string().optional(),
})

type ProfesionalFormData = z.infer<typeof profesionalSchema>

interface ProfesionalFormProps {
  profesional?: Profesional | null
  onSubmit: (data: ProfesionalCreate) => void
  isLoading?: boolean
}

export function ProfesionalForm({ profesional, onSubmit, isLoading }: ProfesionalFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfesionalFormData>({
    resolver: zodResolver(profesionalSchema),
    defaultValues: {
      nombre: profesional?.nombre || '',
      apellido: profesional?.apellido || '',
      especialidad: profesional?.especialidad || '',
      matricula: profesional?.matricula || '',
      telefono: profesional?.telefono || '',
      email: profesional?.email || '',
      direccion: profesional?.direccion || '',
      duracion_turno_default: profesional?.duracion_turno_default || 30,
      color_agenda: profesional?.color_agenda || '#E91E63',
      porcentaje_comision: profesional?.porcentaje_comision || 0,
      notas: profesional?.notas || '',
    },
  })

  const onFormSubmit = (data: ProfesionalFormData) => {
    onSubmit({
      ...data,
      email: data.email || undefined,
    } as ProfesionalCreate)
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre *</Label>
          <Input id="nombre" {...register('nombre')} />
          {errors.nombre && (
            <p className="text-sm text-destructive">{errors.nombre.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="apellido">Apellido *</Label>
          <Input id="apellido" {...register('apellido')} />
          {errors.apellido && (
            <p className="text-sm text-destructive">{errors.apellido.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="especialidad">Especialidad</Label>
          <Input id="especialidad" {...register('especialidad')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="matricula">Matrícula</Label>
          <Input id="matricula" {...register('matricula')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input id="telefono" {...register('telefono')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register('email')} />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="direccion">Dirección</Label>
        <Input id="direccion" {...register('direccion')} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duracion_turno_default">Duración turno (min)</Label>
          <Input
            id="duracion_turno_default"
            type="number"
            {...register('duracion_turno_default', { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="color_agenda">Color agenda</Label>
          <Input id="color_agenda" type="color" {...register('color_agenda')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="porcentaje_comision">Comisión (%)</Label>
          <Input
            id="porcentaje_comision"
            type="number"
            step="0.01"
            {...register('porcentaje_comision', { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notas">Notas</Label>
        <Textarea id="notas" rows={3} {...register('notas')} />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Guardando...' : profesional ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  )
}
