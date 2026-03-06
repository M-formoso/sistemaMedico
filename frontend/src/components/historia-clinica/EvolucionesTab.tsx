import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, Calendar, Weight, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { historiaClinicaService, Evolucion, EvolucionCreate } from '@/services/historiaClinicaService'
import { formatearFecha } from '@/utils/formatters'
import { toast } from '@/hooks/useToast'

interface EvolucionesTabProps {
  pacienteId: number
}

export function EvolucionesTab({ pacienteId }: EvolucionesTabProps) {
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editando, setEditando] = useState<Evolucion | null>(null)
  const [formData, setFormData] = useState<Partial<EvolucionCreate>>({
    fecha: new Date().toISOString().split('T')[0],
    titulo: '',
    descripcion: '',
    peso: '',
    tension_arterial: '',
  })

  const { data: evoluciones = [], isLoading } = useQuery({
    queryKey: ['evoluciones', pacienteId],
    queryFn: () => historiaClinicaService.listarEvoluciones(pacienteId),
  })

  const crearMutation = useMutation({
    mutationFn: (data: EvolucionCreate) => historiaClinicaService.crearEvolucion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evoluciones', pacienteId] })
      toast({ title: 'Evolución creada correctamente' })
      cerrarDialog()
    },
    onError: () => {
      toast({ title: 'Error al crear la evolución', variant: 'destructive' })
    },
  })

  const actualizarMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<EvolucionCreate> }) =>
      historiaClinicaService.actualizarEvolucion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evoluciones', pacienteId] })
      toast({ title: 'Evolución actualizada correctamente' })
      cerrarDialog()
    },
    onError: () => {
      toast({ title: 'Error al actualizar la evolución', variant: 'destructive' })
    },
  })

  const eliminarMutation = useMutation({
    mutationFn: (id: number) => historiaClinicaService.eliminarEvolucion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evoluciones', pacienteId] })
      toast({ title: 'Evolución eliminada correctamente' })
    },
    onError: () => {
      toast({ title: 'Error al eliminar la evolución', variant: 'destructive' })
    },
  })

  const abrirNueva = () => {
    setEditando(null)
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      titulo: '',
      descripcion: '',
      peso: '',
      tension_arterial: '',
    })
    setIsDialogOpen(true)
  }

  const abrirEditar = (evolucion: Evolucion) => {
    setEditando(evolucion)
    setFormData({
      fecha: evolucion.fecha,
      titulo: evolucion.titulo || '',
      descripcion: evolucion.descripcion,
      peso: evolucion.peso || '',
      tension_arterial: evolucion.tension_arterial || '',
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
    if (!formData.descripcion) {
      toast({ title: 'La descripción es requerida', variant: 'destructive' })
      return
    }

    if (editando) {
      actualizarMutation.mutate({ id: editando.id, data: formData })
    } else {
      crearMutation.mutate({
        paciente_id: pacienteId,
        fecha: formData.fecha || new Date().toISOString().split('T')[0],
        descripcion: formData.descripcion,
        titulo: formData.titulo,
        peso: formData.peso,
        tension_arterial: formData.tension_arterial,
      })
    }
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
        <h3 className="text-lg font-medium">Evoluciones del Paciente</h3>
        <Button onClick={abrirNueva}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Evolución
        </Button>
      </div>

      {evoluciones.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No hay evoluciones registradas. Haz clic en "Nueva Evolución" para agregar una.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {evoluciones.map((evolucion) => (
            <Card key={evolucion.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">
                      {evolucion.titulo || 'Evolución'}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <Calendar className="h-4 w-4" />
                      {formatearFecha(evolucion.fecha)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => abrirEditar(evolucion)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('¿Eliminar esta evolución?')) {
                          eliminarMutation.mutate(evolucion.id)
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{evolucion.descripcion}</p>
                {(evolucion.peso || evolucion.tension_arterial) && (
                  <div className="flex gap-4 mt-3 text-sm text-gray-500">
                    {evolucion.peso && (
                      <span className="flex items-center gap-1">
                        <Weight className="h-4 w-4" />
                        Peso: {evolucion.peso}
                      </span>
                    )}
                    {evolucion.tension_arterial && (
                      <span className="flex items-center gap-1">
                        <Activity className="h-4 w-4" />
                        TA: {evolucion.tension_arterial}
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para crear/editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Evolución' : 'Nueva Evolución'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Título (opcional)</Label>
                <Input
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Ej: Control mensual"
                />
              </div>
            </div>

            <div>
              <Label>Descripción *</Label>
              <Textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción de la evolución..."
                rows={6}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Peso (opcional)</Label>
                <Input
                  value={formData.peso}
                  onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                  placeholder="Ej: 65kg"
                />
              </div>
              <div>
                <Label>Tensión Arterial (opcional)</Label>
                <Input
                  value={formData.tension_arterial}
                  onChange={(e) => setFormData({ ...formData, tension_arterial: e.target.value })}
                  placeholder="Ej: 120/80"
                />
              </div>
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
    </div>
  )
}
