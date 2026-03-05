import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Calendar, Clock, User, Filter, Search } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SesionForm } from '@/components/sesiones/SesionForm'
import { SesionDetail } from '@/components/sesiones/SesionDetail'
import { sesionesService } from '@/services/sesionesService'
import type { Sesion, EstadoSesion } from '@/types'

const estadoColors: Record<EstadoSesion, string> = {
  programada: 'bg-blue-100 text-blue-800',
  confirmada: 'bg-green-100 text-green-800',
  en_curso: 'bg-yellow-100 text-yellow-800',
  completada: 'bg-gray-100 text-gray-800',
  cancelada: 'bg-red-100 text-red-800',
  no_asistio: 'bg-orange-100 text-orange-800',
}

const estadoLabels: Record<EstadoSesion, string> = {
  programada: 'Programada',
  confirmada: 'Confirmada',
  en_curso: 'En Curso',
  completada: 'Completada',
  cancelada: 'Cancelada',
  no_asistio: 'No Asistió',
}

export default function SesionesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [estadoFilter, setEstadoFilter] = useState<EstadoSesion | 'todos'>('todos')
  const [fechaFilter, setFechaFilter] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [isCreating, setIsCreating] = useState(false)
  const [selectedSesion, setSelectedSesion] = useState<Sesion | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const { data: sesiones = [], isLoading } = useQuery({
    queryKey: ['sesiones', fechaFilter, estadoFilter],
    queryFn: () => sesionesService.listar({
      fecha: fechaFilter,
      estado: estadoFilter !== 'todos' ? estadoFilter : undefined,
    }),
  })

  const filteredSesiones = sesiones.filter((sesion) => {
    if (!searchTerm) return true
    const pacienteNombre = sesion.paciente?.nombre_completo || ''
    const tratamientoNombre = sesion.tratamiento?.nombre || ''
    return (
      pacienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tratamientoNombre.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const handleView = (sesion: Sesion) => {
    setSelectedSesion(sesion)
    setIsViewing(true)
  }

  const handleEdit = (sesion: Sesion) => {
    setSelectedSesion(sesion)
    setIsEditing(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sesiones</h1>
          <p className="text-gray-500">Gestiona las sesiones de tratamiento</p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Sesión
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar paciente o tratamiento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro por fecha */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="date"
                value={fechaFilter}
                onChange={(e) => setFechaFilter(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro por estado */}
            <Select
              value={estadoFilter}
              onValueChange={(value) => setEstadoFilter(value as EstadoSesion | 'todos')}
            >
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="programada">Programada</SelectItem>
                <SelectItem value="confirmada">Confirmada</SelectItem>
                <SelectItem value="en_curso">En Curso</SelectItem>
                <SelectItem value="completada">Completada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
                <SelectItem value="no_asistio">No Asistió</SelectItem>
              </SelectContent>
            </Select>

            {/* Resumen */}
            <div className="flex items-center justify-end gap-2 text-sm text-gray-500">
              <span>{filteredSesiones.length} sesiones</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Sesiones */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredSesiones.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No hay sesiones</h3>
            <p className="text-gray-500 mt-1">
              No se encontraron sesiones para la fecha seleccionada.
            </p>
            <Button className="mt-4" onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Programar Sesión
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredSesiones.map((sesion) => (
            <Card
              key={sesion.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleView(sesion)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Info Principal */}
                  <div className="flex items-start gap-4">
                    <div className="bg-primary-100 rounded-full p-3">
                      <Clock className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {sesion.hora_inicio && format(new Date(`2000-01-01T${sesion.hora_inicio}`), 'HH:mm')}
                          {sesion.hora_fin && ` - ${format(new Date(`2000-01-01T${sesion.hora_fin}`), 'HH:mm')}`}
                        </h3>
                        <Badge className={estadoColors[sesion.estado]}>
                          {estadoLabels[sesion.estado]}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mt-1">
                        {sesion.tratamiento?.nombre || 'Sin tratamiento'}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                        <User className="h-4 w-4" />
                        <span>{sesion.paciente?.nombre_completo || 'Paciente no especificado'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Precio y Acciones */}
                  <div className="flex items-center gap-4">
                    {sesion.precio_cobrado && (
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Precio</p>
                        <p className="font-semibold text-gray-900">
                          ${sesion.precio_cobrado.toLocaleString('es-AR')}
                        </p>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(sesion)
                      }}
                    >
                      Editar
                    </Button>
                  </div>
                </div>

                {/* Notas */}
                {sesion.notas && (
                  <div className="mt-3 pt-3 border-t text-sm text-gray-500">
                    {sesion.notas}
                  </div>
                )}

                {/* Materiales utilizados */}
                {sesion.materiales && sesion.materiales.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-gray-500 mb-2">Materiales utilizados:</p>
                    <div className="flex flex-wrap gap-2">
                      {sesion.materiales.map((mat) => (
                        <Badge key={mat.id} variant="secondary">
                          {mat.material?.nombre} x{mat.cantidad}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog: Crear Sesión */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Sesión</DialogTitle>
          </DialogHeader>
          <SesionForm
            onSuccess={() => setIsCreating(false)}
            onCancel={() => setIsCreating(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog: Ver Sesión */}
      <Dialog open={isViewing} onOpenChange={setIsViewing}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Sesión</DialogTitle>
          </DialogHeader>
          {selectedSesion && (
            <SesionDetail
              sesion={selectedSesion}
              onEdit={() => {
                setIsViewing(false)
                setIsEditing(true)
              }}
              onClose={() => setIsViewing(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Sesión */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Sesión</DialogTitle>
          </DialogHeader>
          {selectedSesion && (
            <SesionForm
              sesion={selectedSesion}
              onSuccess={() => {
                setIsEditing(false)
                setSelectedSesion(null)
              }}
              onCancel={() => {
                setIsEditing(false)
                setSelectedSesion(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
