import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, Calendar, Target, Clock, CheckCircle, Pause, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import api from '@/lib/axios'
import { formatearFecha, formatearMonto, obtenerFechaLocalISO } from '@/utils/formatters'
import { toast } from '@/hooks/useToast'

interface TratamientosTabProps {
  pacienteId: number
}

interface Tratamiento {
  id: number
  nombre: string
  descripcion?: string
  precio_lista?: number
  duracion_minutos?: number
  zona_corporal?: string
  sesiones_recomendadas?: number
}

interface TratamientoPaciente {
  id: number
  paciente_id: number
  tratamiento_id: number
  tratamiento: Tratamiento
  fecha_inicio?: string
  fecha_fin_estimada?: string
  sesiones_planificadas: number
  sesiones_realizadas: number
  estado: string
  precio_acordado?: number
  descuento_porcentaje: number
  notas?: string
  zona_especifica?: string
  color: string
  progreso_porcentaje: number
  activo: boolean
}

interface FormData {
  tratamiento_id: number | null
  fecha_inicio: string
  fecha_fin_estimada: string
  sesiones_planificadas: number
  precio_acordado: string
  descuento_porcentaje: string
  notas: string
  zona_especifica: string
  color: string
  estado?: string
}

const COLORES = [
  { value: '#6366f1', label: 'Índigo' },
  { value: '#8b5cf6', label: 'Violeta' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#ef4444', label: 'Rojo' },
  { value: '#f97316', label: 'Naranja' },
  { value: '#eab308', label: 'Amarillo' },
  { value: '#22c55e', label: 'Verde' },
  { value: '#14b8a6', label: 'Turquesa' },
  { value: '#3b82f6', label: 'Azul' },
  { value: '#64748b', label: 'Gris' },
]

const ESTADOS = [
  { value: 'activo', label: 'Activo', icon: Target, className: 'bg-blue-100 text-blue-700' },
  { value: 'en_curso', label: 'En Curso', icon: Clock, className: 'bg-yellow-100 text-yellow-700' },
  { value: 'completado', label: 'Completado', icon: CheckCircle, className: 'bg-green-100 text-green-700' },
  { value: 'pausado', label: 'Pausado', icon: Pause, className: 'bg-gray-100 text-gray-700' },
  { value: 'cancelado', label: 'Cancelado', icon: X, className: 'bg-red-100 text-red-700' },
]

export function TratamientosTab({ pacienteId }: TratamientosTabProps) {
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editando, setEditando] = useState<TratamientoPaciente | null>(null)
  const [formData, setFormData] = useState<FormData>({
    tratamiento_id: null,
    fecha_inicio: obtenerFechaLocalISO(),
    fecha_fin_estimada: '',
    sesiones_planificadas: 1,
    precio_acordado: '',
    descuento_porcentaje: '0',
    notas: '',
    zona_especifica: '',
    color: '#6366f1',
  })

  // Obtener tratamientos asignados al paciente
  const { data: tratamientosPaciente = [], isLoading } = useQuery({
    queryKey: ['tratamientos-paciente', pacienteId],
    queryFn: async () => {
      const { data } = await api.get(`/tratamientos-paciente/paciente/${pacienteId}`)
      return data as TratamientoPaciente[]
    },
  })

  // Obtener catálogo de tratamientos disponibles
  const { data: catalogoTratamientos = [] } = useQuery({
    queryKey: ['tratamientos'],
    queryFn: async () => {
      const { data } = await api.get('/tratamientos')
      return data as Tratamiento[]
    },
  })

  const crearMutation = useMutation({
    mutationFn: async (data: Partial<FormData> & { paciente_id: number }) => {
      const { data: response } = await api.post('/tratamientos-paciente', data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tratamientos-paciente', pacienteId] })
      toast({ title: 'Tratamiento asignado correctamente' })
      cerrarDialog()
    },
    onError: () => {
      toast({ title: 'Error al asignar el tratamiento', variant: 'destructive' })
    },
  })

  const actualizarMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<FormData> }) => {
      const { data: response } = await api.put(`/tratamientos-paciente/${id}`, data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tratamientos-paciente', pacienteId] })
      toast({ title: 'Tratamiento actualizado correctamente' })
      cerrarDialog()
    },
    onError: () => {
      toast({ title: 'Error al actualizar el tratamiento', variant: 'destructive' })
    },
  })

  const eliminarMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/tratamientos-paciente/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tratamientos-paciente', pacienteId] })
      toast({ title: 'Tratamiento eliminado correctamente' })
    },
    onError: () => {
      toast({ title: 'Error al eliminar el tratamiento', variant: 'destructive' })
    },
  })

  const abrirNuevo = () => {
    setEditando(null)
    setFormData({
      tratamiento_id: null,
      fecha_inicio: obtenerFechaLocalISO(),
      fecha_fin_estimada: '',
      sesiones_planificadas: 1,
      precio_acordado: '',
      descuento_porcentaje: '0',
      notas: '',
      zona_especifica: '',
      color: '#6366f1',
    })
    setIsDialogOpen(true)
  }

  const abrirEditar = (tp: TratamientoPaciente) => {
    setEditando(tp)
    setFormData({
      tratamiento_id: tp.tratamiento_id,
      fecha_inicio: tp.fecha_inicio || '',
      fecha_fin_estimada: tp.fecha_fin_estimada || '',
      sesiones_planificadas: tp.sesiones_planificadas,
      precio_acordado: tp.precio_acordado?.toString() || '',
      descuento_porcentaje: tp.descuento_porcentaje.toString(),
      notas: tp.notas || '',
      zona_especifica: tp.zona_especifica || '',
      color: tp.color,
      estado: tp.estado,
    })
    setIsDialogOpen(true)
  }

  const cerrarDialog = () => {
    setIsDialogOpen(false)
    setEditando(null)
  }

  const handleTratamientoChange = (tratamientoId: string) => {
    const tratamiento = catalogoTratamientos.find(t => t.id === parseInt(tratamientoId))
    if (tratamiento) {
      setFormData({
        ...formData,
        tratamiento_id: tratamiento.id,
        sesiones_planificadas: tratamiento.sesiones_recomendadas || 1,
        precio_acordado: tratamiento.precio_lista?.toString() || '',
        zona_especifica: tratamiento.zona_corporal || '',
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.tratamiento_id) {
      toast({ title: 'Selecciona un tratamiento', variant: 'destructive' })
      return
    }

    const payload = {
      tratamiento_id: formData.tratamiento_id,
      fecha_inicio: formData.fecha_inicio || null,
      fecha_fin_estimada: formData.fecha_fin_estimada || null,
      sesiones_planificadas: formData.sesiones_planificadas,
      precio_acordado: formData.precio_acordado ? parseFloat(formData.precio_acordado) : null,
      descuento_porcentaje: parseFloat(formData.descuento_porcentaje) || 0,
      notas: formData.notas || null,
      zona_especifica: formData.zona_especifica || null,
      color: formData.color,
      ...(editando && formData.estado ? { estado: formData.estado } : {}),
    }

    if (editando) {
      actualizarMutation.mutate({ id: editando.id, data: payload })
    } else {
      crearMutation.mutate({ ...payload, paciente_id: pacienteId })
    }
  }

  const getEstadoInfo = (estado: string) => {
    return ESTADOS.find(e => e.value === estado) || ESTADOS[0]
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Tratamientos del Paciente</h3>
        <Button onClick={abrirNuevo}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Tratamiento
        </Button>
      </div>

      {tratamientosPaciente.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No hay tratamientos asignados. Haz clic en "Nuevo Tratamiento" para agregar uno.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tratamientosPaciente.map((tp) => {
            const estadoInfo = getEstadoInfo(tp.estado)
            const EstadoIcon = estadoInfo.icon

            return (
              <Card
                key={tp.id}
                className="relative overflow-hidden"
                style={{ borderLeftColor: tp.color, borderLeftWidth: 4 }}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tp.color }}
                      />
                      <CardTitle className="text-base">
                        {tp.tratamiento?.nombre || 'Tratamiento'}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={estadoInfo.className}>
                        <EstadoIcon className="h-3 w-3 mr-1" />
                        {estadoInfo.label}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => abrirEditar(tp)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('¿Eliminar este tratamiento del paciente?')) {
                            eliminarMutation.mutate(tp.id)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Progreso */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Progreso</span>
                      <span className="font-medium">
                        {tp.sesiones_realizadas} / {tp.sesiones_planificadas} sesiones
                      </span>
                    </div>
                    <Progress value={tp.progreso_porcentaje} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round(tp.progreso_porcentaje)}% completado
                    </p>
                  </div>

                  {/* Info */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {tp.fecha_inicio && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar className="h-3 w-3" />
                        Inicio: {formatearFecha(tp.fecha_inicio)}
                      </div>
                    )}
                    {tp.zona_especifica && (
                      <div className="text-gray-600">
                        Zona: {tp.zona_especifica}
                      </div>
                    )}
                    {tp.precio_acordado && (
                      <div className="text-gray-600">
                        Precio: {formatearMonto(tp.precio_acordado)}
                        {tp.descuento_porcentaje > 0 && (
                          <span className="text-green-600 ml-1">
                            (-{tp.descuento_porcentaje}%)
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Notas */}
                  {tp.notas && (
                    <p className="text-sm text-gray-500 bg-gray-50 rounded p-2">
                      {tp.notas}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog para crear/editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editando ? 'Editar Tratamiento' : 'Asignar Nuevo Tratamiento'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Selector de tratamiento */}
            <div>
              <Label>Tipo de Tratamiento *</Label>
              <Select
                value={formData.tratamiento_id?.toString() || ''}
                onValueChange={handleTratamientoChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tratamiento..." />
                </SelectTrigger>
                <SelectContent>
                  {catalogoTratamientos.map((t) => (
                    <SelectItem key={t.id} value={t.id.toString()}>
                      {t.nombre}
                      {t.precio_lista && ` - ${formatearMonto(t.precio_lista)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fecha Inicio</Label>
                <Input
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                />
              </div>
              <div>
                <Label>Fecha Fin Estimada</Label>
                <Input
                  type="date"
                  value={formData.fecha_fin_estimada}
                  onChange={(e) => setFormData({ ...formData, fecha_fin_estimada: e.target.value })}
                />
              </div>
            </div>

            {/* Sesiones y precio */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Sesiones Planificadas</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.sesiones_planificadas}
                  onChange={(e) => setFormData({ ...formData, sesiones_planificadas: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label>Precio Acordado</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.precio_acordado}
                  onChange={(e) => setFormData({ ...formData, precio_acordado: e.target.value })}
                  placeholder="Precio del tratamiento"
                />
              </div>
            </div>

            {/* Descuento y zona */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Descuento (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.descuento_porcentaje}
                  onChange={(e) => setFormData({ ...formData, descuento_porcentaje: e.target.value })}
                />
              </div>
              <div>
                <Label>Zona Específica</Label>
                <Input
                  value={formData.zona_especifica}
                  onChange={(e) => setFormData({ ...formData, zona_especifica: e.target.value })}
                  placeholder="Ej: Rostro, piernas..."
                />
              </div>
            </div>

            {/* Estado (solo edición) */}
            {editando && (
              <div>
                <Label>Estado</Label>
                <Select
                  value={formData.estado}
                  onValueChange={(value) => setFormData({ ...formData, estado: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS.map((e) => (
                      <SelectItem key={e.value} value={e.value}>
                        {e.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Color */}
            <div>
              <Label>Color de identificación</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {COLORES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.color === c.value ? 'border-gray-900 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c.value }}
                    onClick={() => setFormData({ ...formData, color: c.value })}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* Notas */}
            <div>
              <Label>Notas</Label>
              <Textarea
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                placeholder="Notas adicionales sobre el tratamiento..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={cerrarDialog}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={crearMutation.isPending || actualizarMutation.isPending}
              >
                {crearMutation.isPending || actualizarMutation.isPending
                  ? 'Guardando...'
                  : editando
                  ? 'Actualizar'
                  : 'Asignar Tratamiento'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
