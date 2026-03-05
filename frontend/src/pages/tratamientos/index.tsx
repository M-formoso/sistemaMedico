import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, Clock, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { TratamientoForm } from '@/components/tratamientos/TratamientoForm'
import { tratamientosService } from '@/services/tratamientosService'
import { formatearMonto } from '@/utils/formatters'
import { toast } from '@/hooks/useToast'
import type { Tratamiento } from '@/types'

export default function TratamientosPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingTratamiento, setEditingTratamiento] = useState<Tratamiento | null>(null)
  const [deletingTratamiento, setDeletingTratamiento] = useState<Tratamiento | null>(null)

  const queryClient = useQueryClient()

  const { data: tratamientos, isLoading } = useQuery({
    queryKey: ['tratamientos'],
    queryFn: () => tratamientosService.obtenerTodos(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tratamientosService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tratamientos'] })
      toast({ title: 'Tratamiento eliminado', variant: 'success' })
      setDeletingTratamiento(null)
    },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Catálogo de Tratamientos</h1>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-5 w-5 mr-2" />
          Nuevo Tratamiento
        </Button>
      </div>

      {/* Grid de Tratamientos */}
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : tratamientos?.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No hay tratamientos registrados
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tratamientos?.map((tratamiento) => (
            <Card key={tratamiento.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{tratamiento.nombre}</CardTitle>
                  <Badge variant={tratamiento.activo ? 'success' : 'secondary'}>
                    {tratamiento.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {tratamiento.descripcion && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {tratamiento.descripcion}
                  </p>
                )}

                <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                  {tratamiento.precio_lista && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {formatearMonto(tratamiento.precio_lista)}
                    </span>
                  )}
                  {tratamiento.duracion_minutos && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {tratamiento.duracion_minutos} min
                    </span>
                  )}
                </div>

                {tratamiento.zona_corporal && (
                  <div className="text-sm">
                    <span className="text-gray-500">Zona:</span>{' '}
                    <span className="text-gray-700">{tratamiento.zona_corporal}</span>
                  </div>
                )}

                {tratamiento.sesiones_recomendadas && (
                  <div className="text-sm">
                    <span className="text-gray-500">Sesiones recomendadas:</span>{' '}
                    <span className="text-gray-700">{tratamiento.sesiones_recomendadas}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingTratamiento(tratamiento)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingTratamiento(tratamiento)}
                  >
                    <Trash2 className="h-4 w-4 mr-1 text-red-500" />
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog: Crear Tratamiento */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Nuevo Tratamiento</DialogTitle>
            <DialogDescription>
              Agregue un nuevo tratamiento al catálogo
            </DialogDescription>
          </DialogHeader>
          <TratamientoForm
            onSuccess={() => setIsCreateOpen(false)}
            onCancel={() => setIsCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Tratamiento */}
      <Dialog open={!!editingTratamiento} onOpenChange={() => setEditingTratamiento(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar Tratamiento</DialogTitle>
            <DialogDescription>
              Modifique los datos del tratamiento
            </DialogDescription>
          </DialogHeader>
          {editingTratamiento && (
            <TratamientoForm
              tratamiento={editingTratamiento}
              onSuccess={() => setEditingTratamiento(null)}
              onCancel={() => setEditingTratamiento(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirmar eliminación */}
      <Dialog open={!!deletingTratamiento} onOpenChange={() => setDeletingTratamiento(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Tratamiento</DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea eliminar "{deletingTratamiento?.nombre}"?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingTratamiento(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingTratamiento && deleteMutation.mutate(deletingTratamiento.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
