import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Calendar, Clock, User, Filter, Search, List, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SesionForm } from '@/components/sesiones/SesionForm'
import { SesionDetail } from '@/components/sesiones/SesionDetail'
import { sesionesService } from '@/services/sesionesService'
import type { Sesion, EstadoSesion } from '@/types'
import { cn } from '@/lib/utils'

const estadoColors: Record<EstadoSesion, string> = {
  programada: 'bg-blue-100 text-blue-800',
  confirmada: 'bg-green-100 text-green-800',
  en_curso: 'bg-yellow-100 text-yellow-800',
  completada: 'bg-gray-100 text-gray-800',
  cancelada: 'bg-red-100 text-red-800',
  no_asistio: 'bg-orange-100 text-orange-800',
}

const estadoDotColors: Record<EstadoSesion, string> = {
  programada: 'bg-blue-500',
  confirmada: 'bg-green-500',
  en_curso: 'bg-yellow-500',
  completada: 'bg-gray-500',
  cancelada: 'bg-red-500',
  no_asistio: 'bg-orange-500',
}

const estadoLabels: Record<EstadoSesion, string> = {
  programada: 'Programada',
  confirmada: 'Confirmada',
  en_curso: 'En Curso',
  completada: 'Completada',
  cancelada: 'Cancelada',
  no_asistio: 'No Asistió',
}

type ViewMode = 'list' | 'calendar'

export default function SesionesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [estadoFilter, setEstadoFilter] = useState<EstadoSesion | 'todos'>('todos')
  const [fechaFilter, setFechaFilter] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [selectedSesion, setSelectedSesion] = useState<Sesion | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Para vista de lista, buscar por fecha específica
  const { data: sesiones = [], isLoading } = useQuery({
    queryKey: ['sesiones', fechaFilter, estadoFilter],
    queryFn: () => sesionesService.listar({
      fecha: fechaFilter,
      estado: estadoFilter !== 'todos' ? estadoFilter : undefined,
    }),
    enabled: viewMode === 'list',
  })

  // Para vista de calendario, buscar todas las sesiones del mes
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)

  const { data: sesionesMes = [], isLoading: isLoadingMes } = useQuery({
    queryKey: ['sesiones-mes', format(monthStart, 'yyyy-MM-dd'), format(monthEnd, 'yyyy-MM-dd')],
    queryFn: () => sesionesService.listar({
      fecha_desde: format(monthStart, 'yyyy-MM-dd'),
      fecha_hasta: format(monthEnd, 'yyyy-MM-dd'),
    }),
    enabled: viewMode === 'calendar',
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

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setFechaFilter(format(date, 'yyyy-MM-dd'))
    setViewMode('list')
  }

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const handleToday = () => {
    setCurrentMonth(new Date())
    setFechaFilter(format(new Date(), 'yyyy-MM-dd'))
  }

  // Generar días del calendario
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Agrupar sesiones por fecha
  const sesionesPorFecha = sesionesMes.reduce((acc, sesion) => {
    const fecha = sesion.fecha
    if (!acc[fecha]) {
      acc[fecha] = []
    }
    acc[fecha].push(sesion)
    return acc
  }, {} as Record<string, Sesion[]>)

  const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda / Turnos</h1>
          <p className="text-gray-500">Gestiona los turnos de tratamiento</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle Vista */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <List className="h-4 w-4" />
              Lista
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                viewMode === 'calendar'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <CalendarDays className="h-4 w-4" />
              Calendario
            </button>
          </div>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Turno
          </Button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <>
          {/* Filtros - Vista Lista */}
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
                  <span>{filteredSesiones.length} turnos</span>
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
                <h3 className="text-lg font-medium text-gray-900">No hay turnos</h3>
                <p className="text-gray-500 mt-1">
                  No se encontraron turnos para la fecha seleccionada.
                </p>
                <Button className="mt-4" onClick={() => setIsCreating(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Programar Turno
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
        </>
      ) : (
        /* Vista Calendario */
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            {/* Header del calendario */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {format(currentMonth, 'MMMM yyyy', { locale: es })}
                </h2>
                <Button variant="outline" size="sm" onClick={handleToday}>
                  Hoy
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Leyenda de estados */}
            <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
              <span className="text-gray-500">Estados:</span>
              {Object.entries(estadoLabels).map(([estado, label]) => (
                <div key={estado} className="flex items-center gap-1.5">
                  <div className={cn('w-2.5 h-2.5 rounded-full', estadoDotColors[estado as EstadoSesion])} />
                  <span className="text-gray-600">{label}</span>
                </div>
              ))}
            </div>

            {isLoadingMes ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <>
                {/* Días de la semana */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {diasSemana.map((dia) => (
                    <div
                      key={dia}
                      className="text-center text-sm font-semibold text-gray-500 py-2"
                    >
                      {dia}
                    </div>
                  ))}
                </div>

                {/* Días del calendario */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day) => {
                    const fechaStr = format(day, 'yyyy-MM-dd')
                    const sesionesDelDia = sesionesPorFecha[fechaStr] || []
                    const isCurrentMonth = isSameMonth(day, currentMonth)
                    const isSelected = selectedDate && isSameDay(day, selectedDate)
                    const isTodayDate = isToday(day)

                    return (
                      <div
                        key={day.toISOString()}
                        onClick={() => handleDateClick(day)}
                        className={cn(
                          'min-h-[100px] p-2 border rounded-lg cursor-pointer transition-all hover:bg-gray-50',
                          !isCurrentMonth && 'bg-gray-50 opacity-50',
                          isSelected && 'ring-2 ring-primary-500 bg-primary-50',
                          isTodayDate && 'border-primary-500 border-2'
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={cn(
                              'text-sm font-medium',
                              !isCurrentMonth && 'text-gray-400',
                              isTodayDate && 'text-primary-600 font-bold'
                            )}
                          >
                            {format(day, 'd')}
                          </span>
                          {sesionesDelDia.length > 0 && (
                            <span className="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full">
                              {sesionesDelDia.length}
                            </span>
                          )}
                        </div>

                        {/* Sesiones del día */}
                        <div className="space-y-1">
                          {sesionesDelDia.slice(0, 3).map((sesion) => (
                            <div
                              key={sesion.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleView(sesion)
                              }}
                              className={cn(
                                'text-xs p-1 rounded truncate cursor-pointer hover:opacity-80',
                                estadoColors[sesion.estado]
                              )}
                              title={`${sesion.hora_inicio || ''} - ${sesion.paciente?.nombre_completo || 'Sin paciente'}`}
                            >
                              <span className="font-medium">{sesion.hora_inicio?.slice(0, 5)}</span>
                              {' '}
                              <span className="hidden sm:inline">
                                {sesion.paciente?.nombre_completo?.split(' ')[0] || ''}
                              </span>
                            </div>
                          ))}
                          {sesionesDelDia.length > 3 && (
                            <div className="text-xs text-gray-500 text-center">
                              +{sesionesDelDia.length - 3} más
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog: Crear Turno */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Turno</DialogTitle>
          </DialogHeader>
          <SesionForm
            onSuccess={() => setIsCreating(false)}
            onCancel={() => setIsCreating(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog: Ver Turno */}
      <Dialog open={isViewing} onOpenChange={setIsViewing}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Turno</DialogTitle>
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

      {/* Dialog: Editar Turno */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Turno</DialogTitle>
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
