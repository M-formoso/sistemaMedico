import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { FileText, Download, Calendar, TrendingUp, TrendingDown, Users, Package, DollarSign, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { pagosService } from '@/services/pagosService'
import { egresosService } from '@/services/egresosService'
import { sesionesService } from '@/services/sesionesService'
import { pacientesService } from '@/services/pacientesService'
import { formatearMonto } from '@/utils/formatters'

type TipoReporte = 'financiero' | 'sesiones' | 'pacientes' | 'materiales'

export default function ReportesPage() {
  const [fechaInicio, setFechaInicio] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [fechaFin, setFechaFin] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  const [tipoReporte, setTipoReporte] = useState<TipoReporte>('financiero')

  // Datos para reportes
  const { data: pagos = [] } = useQuery({
    queryKey: ['pagos', fechaInicio, fechaFin],
    queryFn: () => pagosService.listar({ fecha_inicio: fechaInicio, fecha_fin: fechaFin }),
  })

  const { data: egresos = [] } = useQuery({
    queryKey: ['egresos', fechaInicio, fechaFin],
    queryFn: () => egresosService.listar({ fecha_inicio: fechaInicio, fecha_fin: fechaFin }),
  })

  const { data: sesiones = [] } = useQuery({
    queryKey: ['sesiones', 'reporte', fechaInicio, fechaFin],
    queryFn: () => sesionesService.listar({}),
  })

  const { data: pacientes = [] } = useQuery({
    queryKey: ['pacientes'],
    queryFn: () => pacientesService.listar(),
  })

  // Calcular estadísticas
  const totalIngresos = pagos.reduce((sum, p) => sum + (p.monto || 0), 0)
  const totalEgresos = egresos.reduce((sum, e) => sum + (e.monto || 0), 0)
  const balance = totalIngresos - totalEgresos

  // Ingresos por método de pago
  const ingresosPorMetodo = pagos.reduce((acc, p) => {
    const metodo = p.metodo_pago || 'efectivo'
    acc[metodo] = (acc[metodo] || 0) + (p.monto || 0)
    return acc
  }, {} as Record<string, number>)

  // Egresos por categoría
  const egresosPorCategoria = egresos.reduce((acc, e) => {
    const cat = e.categoria || 'otros'
    acc[cat] = (acc[cat] || 0) + (e.monto || 0)
    return acc
  }, {} as Record<string, number>)

  // Sesiones por estado
  const sesionesPorEstado = sesiones.reduce((acc, s) => {
    acc[s.estado] = (acc[s.estado] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Funciones de presets de fechas
  const setMesActual = () => {
    setFechaInicio(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
    setFechaFin(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  }

  const setMesAnterior = () => {
    const mesAnterior = subMonths(new Date(), 1)
    setFechaInicio(format(startOfMonth(mesAnterior), 'yyyy-MM-dd'))
    setFechaFin(format(endOfMonth(mesAnterior), 'yyyy-MM-dd'))
  }

  const setUltimos3Meses = () => {
    setFechaInicio(format(startOfMonth(subMonths(new Date(), 2)), 'yyyy-MM-dd'))
    setFechaFin(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-500">Análisis y estadísticas del consultorio</p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Tipo de Reporte */}
            <Select value={tipoReporte} onValueChange={(v) => setTipoReporte(v as TipoReporte)}>
              <SelectTrigger>
                <BarChart3 className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="financiero">Reporte Financiero</SelectItem>
                <SelectItem value="sesiones">Reporte de Sesiones</SelectItem>
                <SelectItem value="pacientes">Reporte de Pacientes</SelectItem>
                <SelectItem value="materiales">Reporte de Materiales</SelectItem>
              </SelectContent>
            </Select>

            {/* Fecha Inicio */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Fecha Fin */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Presets */}
            <div className="flex gap-2 md:col-span-2">
              <Button variant="outline" size="sm" onClick={setMesActual}>
                Este mes
              </Button>
              <Button variant="outline" size="sm" onClick={setMesAnterior}>
                Mes anterior
              </Button>
              <Button variant="outline" size="sm" onClick={setUltimos3Meses}>
                Últimos 3 meses
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reporte Financiero */}
      {tipoReporte === 'financiero' && (
        <div className="space-y-6">
          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Ingresos</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatearMonto(totalIngresos)}
                    </p>
                  </div>
                  <div className="bg-green-100 rounded-full p-3">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Egresos</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatearMonto(totalEgresos)}
                    </p>
                  </div>
                  <div className="bg-red-100 rounded-full p-3">
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Balance</p>
                    <p className={`text-2xl font-bold ${balance >= 0 ? 'text-primary-600' : 'text-red-600'}`}>
                      {formatearMonto(balance)}
                    </p>
                  </div>
                  <div className="bg-primary-100 rounded-full p-3">
                    <DollarSign className="h-6 w-6 text-primary-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Desglose */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ingresos por Método */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ingresos por Método de Pago</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(ingresosPorMetodo).length === 0 ? (
                  <p className="text-gray-400 text-center py-4">Sin datos en el período</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(ingresosPorMetodo).map(([metodo, monto]) => (
                      <div key={metodo} className="flex items-center justify-between">
                        <span className="capitalize text-gray-600">{metodo}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${(monto / totalIngresos) * 100}%` }}
                            />
                          </div>
                          <span className="font-medium w-24 text-right">
                            {formatearMonto(monto)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Egresos por Categoría */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Egresos por Categoría</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(egresosPorCategoria).length === 0 ? (
                  <p className="text-gray-400 text-center py-4">Sin datos en el período</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(egresosPorCategoria).map(([categoria, monto]) => (
                      <div key={categoria} className="flex items-center justify-between">
                        <span className="capitalize text-gray-600">{categoria}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-red-500 h-2 rounded-full"
                              style={{ width: `${(monto / totalEgresos) * 100}%` }}
                            />
                          </div>
                          <span className="font-medium w-24 text-right">
                            {formatearMonto(monto)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Reporte de Sesiones */}
      {tipoReporte === 'sesiones' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-primary-600">{sesiones.length}</p>
                <p className="text-sm text-gray-500">Total Sesiones</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-green-600">
                  {sesionesPorEstado['completada'] || 0}
                </p>
                <p className="text-sm text-gray-500">Completadas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-yellow-600">
                  {(sesionesPorEstado['programada'] || 0) + (sesionesPorEstado['confirmada'] || 0)}
                </p>
                <p className="text-sm text-gray-500">Pendientes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-red-600">
                  {(sesionesPorEstado['cancelada'] || 0) + (sesionesPorEstado['no_asistio'] || 0)}
                </p>
                <p className="text-sm text-gray-500">Canceladas/No asistió</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sesiones por Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(sesionesPorEstado).map(([estado, cantidad]) => (
                  <div key={estado} className="flex items-center justify-between">
                    <span className="capitalize text-gray-600">{estado.replace('_', ' ')}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-48 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-500 h-2 rounded-full"
                          style={{ width: `${(cantidad / sesiones.length) * 100}%` }}
                        />
                      </div>
                      <span className="font-medium w-12 text-right">{cantidad}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reporte de Pacientes */}
      {tipoReporte === 'pacientes' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Pacientes</p>
                    <p className="text-2xl font-bold text-primary-600">{pacientes.length}</p>
                  </div>
                  <div className="bg-primary-100 rounded-full p-3">
                    <Users className="h-6 w-6 text-primary-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Activos</p>
                    <p className="text-2xl font-bold text-green-600">
                      {pacientes.filter(p => p.estado === 'activo').length}
                    </p>
                  </div>
                  <div className="bg-green-100 rounded-full p-3">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Nuevos</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {pacientes.filter(p => p.estado === 'nuevo').length}
                    </p>
                  </div>
                  <div className="bg-blue-100 rounded-full p-3">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Reporte de Materiales (placeholder) */}
      {tipoReporte === 'materiales' && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Valor del Inventario</p>
                <p className="text-2xl font-bold text-primary-600">Consultar en Materiales</p>
              </div>
              <div className="bg-primary-100 rounded-full p-3">
                <Package className="h-6 w-6 text-primary-600" />
              </div>
            </div>
            <p className="text-gray-500 mt-4">
              Para un reporte detallado de materiales, visite la sección de Materiales e Inventario.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
