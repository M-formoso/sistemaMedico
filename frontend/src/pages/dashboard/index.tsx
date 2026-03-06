import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Calendar,
  DollarSign,
  Package,
  AlertTriangle,
  Users,
  Clock,
  TrendingUp,
  ArrowRight,
  UserX,
  XCircle,
  CheckCircle,
  ListOrdered,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { dashboardService } from '@/services/dashboardService'
import { sesionesService } from '@/services/sesionesService'
import { profesionalesService } from '@/services/profesionalesService'
import { formatearMonto } from '@/utils/formatters'
import type { EstadoSesion } from '@/types'

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

export default function Dashboard() {
  const navigate = useNavigate()
  const hoy = format(new Date(), 'yyyy-MM-dd')

  // Filtros para estadísticas avanzadas
  const [fechaInicio, setFechaInicio] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [fechaFin, setFechaFin] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  const [profesionalId, setProfesionalId] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)

  const { data: resumen, isLoading: loadingResumen } = useQuery({
    queryKey: ['dashboard', 'resumen-dia'],
    queryFn: () => dashboardService.obtenerResumenDia(),
  })

  const { data: alertas, isLoading: loadingAlertas } = useQuery({
    queryKey: ['dashboard', 'alertas'],
    queryFn: () => dashboardService.obtenerAlertas(),
  })

  const { data: estadisticas, isLoading: loadingEstadisticas } = useQuery({
    queryKey: ['dashboard', 'estadisticas-mes'],
    queryFn: () => dashboardService.obtenerEstadisticasMes(),
  })

  const { data: estadisticasAvanzadas } = useQuery({
    queryKey: ['dashboard', 'estadisticas-avanzadas', fechaInicio, fechaFin, profesionalId],
    queryFn: () =>
      dashboardService.obtenerEstadisticasAvanzadas({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        profesional_id: profesionalId ? parseInt(profesionalId) : undefined,
      }),
  })

  const { data: listaEsperaCount } = useQuery({
    queryKey: ['dashboard', 'lista-espera-count'],
    queryFn: () => dashboardService.obtenerListaEsperaCount(),
  })

  const { data: sesionesHoy = [] } = useQuery({
    queryKey: ['sesiones', hoy],
    queryFn: () => sesionesService.listar({ fecha: hoy }),
  })

  const { data: profesionales = [] } = useQuery({
    queryKey: ['profesionales', 'activos'],
    queryFn: () => profesionalesService.listarActivos(),
  })

  const isLoading = loadingResumen || loadingAlertas || loadingEstadisticas

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  const sesionesActivas = sesionesHoy.filter((s) =>
    ['programada', 'confirmada', 'en_curso'].includes(s.estado)
  )
  const totalAlerts = (alertas?.stock_bajo?.length || 0) + (alertas?.pagos_pendientes || 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">
            {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button onClick={() => navigate('/sesiones')}>
            <Calendar className="h-4 w-4 mr-2" />
            Ver Agenda
          </Button>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-sm text-gray-500">Desde</label>
                <Input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-gray-500">Hasta</label>
                <Input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-gray-500">Profesional</label>
                <Select value={profesionalId} onValueChange={setProfesionalId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    {profesionales.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.nombre} {p.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFechaInicio(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
                    setFechaFin(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
                    setProfesionalId('')
                  }}
                >
                  Limpiar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/sesiones')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Sesiones Hoy</p>
                <p className="text-2xl font-bold text-gray-900">
                  {resumen?.sesiones?.total || sesionesHoy.length}
                </p>
              </div>
              <div className="bg-primary-100 rounded-full p-3">
                <Calendar className="h-6 w-6 text-primary-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">{sesionesActivas.length} pendientes</div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/pacientes')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pacientes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {estadisticasAvanzadas?.pacientes?.total || 0}
                </p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-green-600">
              +{estadisticasAvanzadas?.pacientes?.nuevos_periodo || 0} en el período
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/finanzas')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Ingresos del Mes</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatearMonto(estadisticas?.ingresos || 0)}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Balance: {formatearMonto(estadisticas?.balance || 0)}
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer hover:shadow-md transition-shadow ${
            totalAlerts > 0 ? 'border-yellow-300' : ''
          }`}
          onClick={() => navigate('/materiales')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Alertas</p>
                <p
                  className={`text-2xl font-bold ${
                    totalAlerts > 0 ? 'text-yellow-600' : 'text-gray-900'
                  }`}
                >
                  {totalAlerts}
                </p>
              </div>
              <div
                className={`${totalAlerts > 0 ? 'bg-yellow-100' : 'bg-gray-100'} rounded-full p-3`}
              >
                <AlertTriangle
                  className={`h-6 w-6 ${totalAlerts > 0 ? 'text-yellow-600' : 'text-gray-400'}`}
                />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {alertas?.stock_bajo?.length || 0} materiales bajo stock
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas Avanzadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tasa de Asistencia */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tasa Asistencia</p>
                <p className="text-2xl font-bold text-green-600">
                  {estadisticasAvanzadas?.tasas?.asistencia || 0}%
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {estadisticasAvanzadas?.sesiones?.completadas || 0} completadas
            </div>
          </CardContent>
        </Card>

        {/* Ausentismo */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Ausentismo</p>
                <p className="text-2xl font-bold text-orange-600">
                  {estadisticasAvanzadas?.tasas?.ausentismo || 0}%
                </p>
              </div>
              <div className="bg-orange-100 rounded-full p-3">
                <UserX className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {estadisticasAvanzadas?.sesiones?.no_asistio || 0} no asistieron
            </div>
          </CardContent>
        </Card>

        {/* Cancelaciones */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Cancelaciones</p>
                <p className="text-2xl font-bold text-red-600">
                  {estadisticasAvanzadas?.tasas?.cancelacion || 0}%
                </p>
              </div>
              <div className="bg-red-100 rounded-full p-3">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {estadisticasAvanzadas?.sesiones?.canceladas || 0} canceladas
            </div>
          </CardContent>
        </Card>

        {/* Lista de Espera */}
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/configuracion')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Lista de Espera</p>
                <p className="text-2xl font-bold text-purple-600">
                  {listaEsperaCount?.total || 0}
                </p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <ListOrdered className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {listaEsperaCount?.por_prioridad?.urgentes || 0} urgentes
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sesiones del Día */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Sesiones de Hoy
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/sesiones')}>
                Ver todas
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {sesionesHoy.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No hay sesiones programadas para hoy</p>
                <Button className="mt-4" onClick={() => navigate('/sesiones')}>
                  Programar Sesión
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {sesionesHoy.slice(0, 5).map((sesion) => (
                  <div
                    key={sesion.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                    onClick={() => navigate('/sesiones')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-center bg-white rounded-lg px-2 py-1 border">
                        <p className="text-xs text-gray-500">
                          {sesion.hora_inicio &&
                            format(new Date(`2000-01-01T${sesion.hora_inicio}`), 'HH:mm')}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {sesion.paciente?.nombre_completo || 'Sin paciente'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {sesion.tratamiento?.nombre || 'Sin tratamiento'}
                        </p>
                      </div>
                    </div>
                    <Badge className={estadoColors[sesion.estado]}>
                      {estadoLabels[sesion.estado]}
                    </Badge>
                  </div>
                ))}
                {sesionesHoy.length > 5 && (
                  <p className="text-center text-sm text-gray-500 pt-2">
                    +{sesionesHoy.length - 5} sesiones más
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Panel Lateral */}
        <div className="space-y-6">
          {/* Top 5 Tratamientos */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Top Tratamientos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {estadisticasAvanzadas?.top_tratamientos &&
              estadisticasAvanzadas.top_tratamientos.length > 0 ? (
                <div className="space-y-3">
                  {estadisticasAvanzadas.top_tratamientos.map((t, index) => (
                    <div key={t.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-primary-600">#{index + 1}</span>
                        <span className="text-sm text-gray-700">{t.nombre}</span>
                      </div>
                      <Badge variant="outline">{t.cantidad}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">Sin datos en el período</p>
              )}
            </CardContent>
          </Card>

          {/* Turnos Perdidos */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-red-800">
                <XCircle className="h-4 w-4" />
                Turnos Perdidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-2">
                <p className="text-3xl font-bold text-red-600">
                  {estadisticasAvanzadas?.turnos_perdidos?.cantidad || 0}
                </p>
                <p className="text-sm text-red-700 mt-1">turnos no realizados</p>
                <p className="text-lg font-semibold text-red-800 mt-2">
                  {formatearMonto(estadisticasAvanzadas?.turnos_perdidos?.monto_estimado || 0)}
                </p>
                <p className="text-xs text-red-600">estimado perdido</p>
              </div>
            </CardContent>
          </Card>

          {/* Alertas de Stock */}
          {alertas?.stock_bajo && alertas.stock_bajo.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="h-4 w-4" />
                  Stock Bajo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {alertas.stock_bajo
                    .slice(0, 5)
                    .map(
                      (m: {
                        id: number
                        nombre: string
                        stock_actual: number
                        stock_minimo: number
                      }) => (
                        <li key={m.id} className="flex justify-between text-sm">
                          <span className="text-yellow-800">{m.nombre}</span>
                          <span className="font-medium text-yellow-900">
                            {m.stock_actual}/{m.stock_minimo}
                          </span>
                        </li>
                      )
                    )}
                </ul>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3 border-yellow-300 text-yellow-800 hover:bg-yellow-100"
                  onClick={() => navigate('/materiales')}
                >
                  Ver Inventario
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Balance del Mes */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Balance del Mes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Ingresos</span>
                  <span className="font-semibold text-green-600">
                    {formatearMonto(estadisticas?.ingresos || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Egresos</span>
                  <span className="font-semibold text-red-600">
                    {formatearMonto(estadisticas?.egresos || 0)}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="font-medium">Balance</span>
                  <span
                    className={`text-lg font-bold ${
                      (estadisticas?.balance || 0) >= 0 ? 'text-primary-600' : 'text-red-600'
                    }`}
                  >
                    {formatearMonto(estadisticas?.balance || 0)}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4"
                onClick={() => navigate('/finanzas')}
              >
                Ver Finanzas
              </Button>
            </CardContent>
          </Card>

          {/* Inventario */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Inventario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-3xl font-bold text-primary-600">
                  {formatearMonto(estadisticas?.valor_inventario || 0)}
                </p>
                <p className="text-sm text-gray-500 mt-1">Valor total en stock</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => navigate('/materiales')}
              >
                Ver Materiales
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
