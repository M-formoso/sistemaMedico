import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, Calendar, FileText, CheckCircle, Clock, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { historiaClinicaService, Estudio, EstudioCreate, BateriaEstudios } from '@/services/historiaClinicaService'
import { formatearFecha } from '@/utils/formatters'
import { toast } from '@/components/ui/toast'

interface EstudiosTabProps {
  pacienteId: number
}

const estadoConfig = {
  pendiente: { label: 'Pendiente', variant: 'secondary' as const, icon: Clock },
  solicitado: { label: 'Solicitado', variant: 'info' as const, icon: FileText },
  realizado: { label: 'Realizado', variant: 'success' as const, icon: CheckCircle },
  cancelado: { label: 'Cancelado', variant: 'destructive' as const, icon: X },
}

export function EstudiosTab({ pacienteId }: EstudiosTabProps) {
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isBateriaDialogOpen, setIsBateriaDialogOpen] = useState(false)
  const [editando, setEditando] = useState<Estudio | null>(null)
  const [formData, setFormData] = useState<Partial<EstudioCreate>>({
    nombre: '',
    descripcion: '',
    indicaciones: '',
    fecha_solicitud: new Date().toISOString().split('T')[0],
    estado: 'pendiente',
  })
  const [bateriaSeleccionada, setBateriaSeleccionada] = useState<number | null>(null)

  const { data: estudios = [], isLoading } = useQuery({
    queryKey: ['estudios', pacienteId],
    queryFn: () => historiaClinicaService.listarEstudios(pacienteId),
  })

  const { data: baterias = [] } = useQuery({
    queryKey: ['baterias'],
    queryFn: () => historiaClinicaService.listarBaterias(),
  })

  const crearMutation = useMutation({
    mutationFn: (data: EstudioCreate) => historiaClinicaService.crearEstudio(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estudios', pacienteId] })
      toast({ title: 'Estudio creado correctamente' })
      cerrarDialog()
    },
    onError: () => {
      toast({ title: 'Error al crear el estudio', variant: 'destructive' })
    },
  })

  const crearDesdeBateriaMutation = useMutation({
    mutationFn: ({ bateriaId, fecha }: { bateriaId: number; fecha: string }) =>
      historiaClinicaService.crearEstudiosDesdeBateria(pacienteId, bateriaId, fecha),
    onSuccess: (estudios) => {
      queryClient.invalidateQueries({ queryKey: ['estudios', pacienteId] })
      toast({ title: `Se crearon ${estudios.length} estudios desde la batería` })
      setIsBateriaDialogOpen(false)
    },
    onError: () => {
      toast({ title: 'Error al crear estudios desde batería', variant: 'destructive' })
    },
  })

  const actualizarMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<EstudioCreate> }) =>
      historiaClinicaService.actualizarEstudio(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estudios', pacienteId] })
      toast({ title: 'Estudio actualizado correctamente' })
      cerrarDialog()
    },
    onError: () => {
      toast({ title: 'Error al actualizar el estudio', variant: 'destructive' })
    },
  })

  const eliminarMutation = useMutation({
    mutationFn: (id: number) => historiaClinicaService.eliminarEstudio(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estudios', pacienteId] })
      toast({ title: 'Estudio eliminado correctamente' })
    },
    onError: () => {
      toast({ title: 'Error al eliminar el estudio', variant: 'destructive' })
    },
  })

  const abrirNueva = () => {
    setEditando(null)
    setFormData({
      nombre: '',
      descripcion: '',
      indicaciones: '',
      fecha_solicitud: new Date().toISOString().split('T')[0],
      estado: 'pendiente',
    })
    setIsDialogOpen(true)
  }

  const abrirEditar = (estudio: Estudio) => {
    setEditando(estudio)
    setFormData({
      nombre: estudio.nombre,
      descripcion: estudio.descripcion || '',
      indicaciones: estudio.indicaciones || '',
      fecha_solicitud: estudio.fecha_solicitud,
      estado: estudio.estado,
    })
    setIsDialogOpen(true)
  }

  const cerrarDialog = () => {
    setIsDialogOpen(false)
    setEditando(null)
    setFormData({})
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombre) {
      toast({ title: 'El nombre es requerido', variant: 'destructive' })
      return
    }

    if (editando) {
      actualizarMutation.mutate({ id: editando.id, data: formData })
    } else {
      crearMutation.mutate({
        paciente_id: pacienteId,
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        indicaciones: formData.indicaciones,
        fecha_solicitud: formData.fecha_solicitud || new Date().toISOString().split('T')[0],
        estado: formData.estado,
      })
    }
  }

  const handleCrearDesdeBateria = () => {
    if (!bateriaSeleccionada) {
      toast({ title: 'Selecciona una batería', variant: 'destructive' })
      return
    }
    crearDesdeBateriaMutation.mutate({
      bateriaId: bateriaSeleccionada,
      fecha: new Date().toISOString().split('T')[0],
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
      </div>
    )
  }

  // Agrupar por estado
  const pendientes = estudios.filter((e) => e.estado === 'pendiente' || e.estado === 'solicitado')
  const realizados = estudios.filter((e) => e.estado === 'realizado')

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Estudios y Prácticas</h3>
        <div className="flex gap-2">
          {baterias.length > 0 && (
            <Button variant="outline" onClick={() => setIsBateriaDialogOpen(true)}>
              <FileText className="h-4 w-4 mr-2" />
              Desde Batería
            </Button>
          )}
          <Button onClick={abrirNueva}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Estudio
          </Button>
        </div>
      </div>

      {estudios.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No hay estudios registrados. Haz clic en "Nuevo Estudio" para agregar uno.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {pendientes.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Pendientes / En Proceso</h4>
              <div className="space-y-3">
                {pendientes.map((estudio) => (
                  <EstudioCard
                    key={estudio.id}
                    estudio={estudio}
                    onEditar={() => abrirEditar(estudio)}
                    onEliminar={() => {
                      if (confirm('¿Eliminar este estudio?')) {
                        eliminarMutation.mutate(estudio.id)
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {realizados.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Realizados</h4>
              <div className="space-y-3">
                {realizados.map((estudio) => (
                  <EstudioCard
                    key={estudio.id}
                    estudio={estudio}
                    onEditar={() => abrirEditar(estudio)}
                    onEliminar={() => {
                      if (confirm('¿Eliminar este estudio?')) {
                        eliminarMutation.mutate(estudio.id)
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialog para crear/editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Estudio' : 'Nuevo Estudio'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nombre del Estudio *</Label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Hemograma completo"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fecha Solicitud</Label>
                <Input
                  type="date"
                  value={formData.fecha_solicitud}
                  onChange={(e) => setFormData({ ...formData, fecha_solicitud: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Estado</Label>
                <Select
                  value={formData.estado}
                  onValueChange={(value) => setFormData({ ...formData, estado: value as Estudio['estado'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="solicitado">Solicitado</SelectItem>
                    <SelectItem value="realizado">Realizado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Descripción (opcional)</Label>
              <Textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción del estudio..."
                rows={2}
              />
            </div>

            <div>
              <Label>Indicaciones (opcional)</Label>
              <Textarea
                value={formData.indicaciones}
                onChange={(e) => setFormData({ ...formData, indicaciones: e.target.value })}
                placeholder="Indicaciones para el paciente..."
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={cerrarDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={crearMutation.isPending || actualizarMutation.isPending}>
                {crearMutation.isPending || actualizarMutation.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para batería */}
      <Dialog open={isBateriaDialogOpen} onOpenChange={setIsBateriaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Estudios desde Batería</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Seleccionar Batería</Label>
              <Select
                value={bateriaSeleccionada?.toString()}
                onValueChange={(value) => setBateriaSeleccionada(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una batería" />
                </SelectTrigger>
                <SelectContent>
                  {baterias.map((bateria) => (
                    <SelectItem key={bateria.id} value={bateria.id.toString()}>
                      {bateria.nombre} ({bateria.estudios_incluidos.length} estudios)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {bateriaSeleccionada && (
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm font-medium mb-2">Estudios incluidos:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {baterias
                    .find((b) => b.id === bateriaSeleccionada)
                    ?.estudios_incluidos.map((estudio, idx) => (
                      <li key={idx}>• {estudio}</li>
                    ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsBateriaDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCrearDesdeBateria} disabled={crearDesdeBateriaMutation.isPending}>
                {crearDesdeBateriaMutation.isPending ? 'Creando...' : 'Crear Estudios'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EstudioCard({
  estudio,
  onEditar,
  onEliminar,
}: {
  estudio: Estudio
  onEditar: () => void
  onEliminar: () => void
}) {
  const config = estadoConfig[estudio.estado]
  const Icon = config.icon

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{estudio.nombre}</h4>
              <Badge variant={config.variant}>
                <Icon className="h-3 w-3 mr-1" />
                {config.label}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <Calendar className="h-4 w-4" />
              Solicitado: {formatearFecha(estudio.fecha_solicitud)}
              {estudio.fecha_realizacion && (
                <span className="ml-2">• Realizado: {formatearFecha(estudio.fecha_realizacion)}</span>
              )}
            </div>
            {estudio.indicaciones && (
              <p className="text-sm text-gray-600 mt-2">{estudio.indicaciones}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onEditar}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onEliminar}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
