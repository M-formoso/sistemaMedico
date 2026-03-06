import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  DollarSign,
  BarChart3,
  FileSpreadsheet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { pagosService } from '@/services/pagosService'
import { egresosService } from '@/services/egresosService'
import { sesionesService } from '@/services/sesionesService'
import { pacientesService } from '@/services/pacientesService'
import { materialesService } from '@/services/materialesService'
import { formatearMonto } from '@/utils/formatters'
import { exportToExcel, exportMultipleSheetsToExcel } from '@/utils/exportExcel'
import { useToast } from '@/hooks/useToast'

type TipoReporte = 'financiero' | 'sesiones' | 'pacientes' | 'materiales'

export default function ReportesPage() {
  const [fechaInicio, setFechaInicio] = useState(
    format(startOfMonth(new Date()), 'yyyy-MM-dd')
  )
  const [fechaFin, setFechaFin] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  const [tipoReporte, setTipoReporte] = useState<TipoReporte>('financiero')
  const { toast } = useToast()

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

  const { data: materiales = [] } = useQuery({
    queryKey: ['materiales'],
    queryFn: () => materialesService.listar(),
  })

  // Calcular estadísticas
  const totalIngresos = pagos.reduce((sum, p) => sum + (p.monto || 0), 0)
  const totalEgresos = egresos.reduce((sum, e) => sum + (e.monto || 0), 0)
  const balance = totalIngresos - totalEgresos

  // Ingresos por método de pago
  const ingresosPorMetodo = pagos.reduce(
    (acc, p) => {
      const metodo = p.metodo_pago || 'efectivo'
      acc[metodo] = (acc[metodo] || 0) + (p.monto || 0)
      return acc
    },
    {} as Record<string, number>
  )

  // Egresos por categoría
  const egresosPorCategoria = egresos.reduce(
    (acc, e) => {
      const cat = e.categoria || 'otros'
      acc[cat] = (acc[cat] || 0) + (e.monto || 0)
      return acc
    },
    {} as Record<string, number>
  )

  // Sesiones por estado
  const sesionesPorEstado = sesiones.reduce(
    (acc, s) => {
      acc[s.estado] = (acc[s.estado] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

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

  // Funciones de exportación
  const exportarReporteFinanciero = () => {
    // Exportar múltiples hojas: Resumen, Ingresos, Egresos
    const resumenData = [
      ['Reporte Financiero'],
      [`Período: ${fechaInicio} a ${fechaFin}`],
      [],
      ['Concepto', 'Monto'],
      ['Total Ingresos', totalIngresos],
      ['Total Egresos', totalEgresos],
      ['Balance', balance],
      [],
      ['Ingresos por Método de Pago'],
      ['Método', 'Monto'],
      ...Object.entries(ingresosPorMetodo).map(([metodo, monto]) => [metodo, monto]),
      [],
      ['Egresos por Categoría'],
      ['Categoría', 'Monto'],
      ...Object.entries(egresosPorCategoria).map(([cat, monto]) => [cat, monto]),
    ]

    const ingresosData = [
      ['Detalle de Ingresos'],
      ['Fecha', 'Paciente', 'Concepto', 'Método de Pago', 'Monto'],
      ...pagos.map((p) => [
        p.fecha,
        p.paciente?.nombre_completo || '-',
        p.descripcion || '-',
        p.metodo_pago || 'efectivo',
        p.monto,
      ]),
    ]

    const egresosData = [
      ['Detalle de Egresos'],
      ['Fecha', 'Categoría', 'Descripción', 'Monto'],
      ...egresos.map((e) => [e.fecha, e.categoria || 'otros', e.descripcion || '-', e.monto]),
    ]

    exportMultipleSheetsToExcel(
      [
        { name: 'Resumen', data: resumenData },
        { name: 'Ingresos', data: ingresosData },
        { name: 'Egresos', data: egresosData },
      ],
      'reporte_financiero'
    )

    toast({ title: 'Reporte financiero exportado correctamente' })
  }

  const exportarReporteSesiones = () => {
    exportToExcel(
      sesiones,
      [
        { header: 'ID', accessor: 'id' },
        { header: 'Fecha', accessor: 'fecha' },
        { header: 'Hora Inicio', accessor: 'hora_inicio' },
        { header: 'Hora Fin', accessor: 'hora_fin' },
        {
          header: 'Paciente',
          accessor: (s) => s.paciente?.nombre_completo || '-',
        },
        {
          header: 'Tratamiento',
          accessor: (s) => s.tratamiento?.nombre || '-',
        },
        { header: 'Estado', accessor: 'estado' },
        { header: 'Notas', accessor: 'notas' },
      ],
      'reporte_sesiones'
    )

    toast({ title: 'Reporte de sesiones exportado correctamente' })
  }

  const exportarReportePacientes = () => {
    exportToExcel(
      pacientes,
      [
        { header: 'ID', accessor: 'id' },
        { header: 'Nombre', accessor: 'nombre' },
        { header: 'Apellido', accessor: 'apellido' },
        { header: 'DNI', accessor: 'dni' },
        { header: 'Teléfono', accessor: 'telefono' },
        { header: 'Email', accessor: 'email' },
        { header: 'Dirección', accessor: 'direccion' },
        { header: 'Estado', accessor: 'estado' },
        {
          header: 'Fecha Registro',
          accessor: (p) => (p.created_at ? format(new Date(p.created_at), 'dd/MM/yyyy') : '-'),
        },
      ],
      'reporte_pacientes'
    )

    toast({ title: 'Reporte de pacientes exportado correctamente' })
  }

  const exportarReporteMateriales = () => {
    const valorTotal = materiales.reduce(
      (sum, m) => sum + (m.stock_actual || 0) * (m.precio_unitario || 0),
      0
    )

    const materialesData = [
      ['Reporte de Inventario'],
      [`Fecha: ${format(new Date(), 'dd/MM/yyyy')}`],
      [],
      ['Valor Total del Inventario', valorTotal],
      [],
      [
        'Código',
        'Nombre',
        'Categoría',
        'Stock Actual',
        'Stock Mínimo',
        'Unidad',
        'Precio Unitario',
        'Valor Total',
        'Estado',
      ],
      ...materiales.map((m) => [
        m.codigo || '-',
        m.nombre,
        m.categoria || '-',
        m.stock_actual || 0,
        m.stock_minimo || 0,
        m.unidad_medida || '-',
        m.precio_unitario || 0,
        (m.stock_actual || 0) * (m.precio_unitario || 0),
        m.activo ? 'Activo' : 'Inactivo',
      ]),
    ]

    exportMultipleSheetsToExcel([{ name: 'Inventario', data: materialesData }], 'reporte_materiales')

    toast({ title: 'Reporte de materiales exportado correctamente' })
  }

  const handleExportar = () => {
    switch (tipoReporte) {
      case 'financiero':
        exportarReporteFinanciero()
        break
      case 'sesiones':
        exportarReporteSesiones()
        break
      case 'pacientes':
        exportarReportePacientes()
        break
      case 'materiales':
        exportarReporteMateriales()
        break
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-500">Análisis y estadísticas del consultorio</p>
        </div>
        <Button onClick={handleExportar} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Exportar a Excel
        </Button>
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
                    <p
                      className={`text-2xl font-bold ${balance >= 0 ? 'text-primary-600' : 'text-red-600'}`}
                    >
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

          {/* Tabla de últimos movimientos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Últimos Movimientos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">Fecha</th>
                      <th className="text-left py-2 px-2">Tipo</th>
                      <th className="text-left py-2 px-2">Descripción</th>
                      <th className="text-right py-2 px-2">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ...pagos.map((p) => ({
                        ...p,
                        tipo: 'ingreso' as const,
                        descripcion: p.descripcion || 'Pago',
                      })),
                      ...egresos.map((e) => ({
                        ...e,
                        tipo: 'egreso' as const,
                        descripcion: e.descripcion || e.categoria || 'Egreso',
                      })),
                    ]
                      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                      .slice(0, 10)
                      .map((mov, i) => (
                        <tr key={i} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-2">{mov.fecha}</td>
                          <td className="py-2 px-2">
                            <span
                              className={`px-2 py-1 rounded text-xs ${mov.tipo === 'ingreso' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                            >
                              {mov.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                            </span>
                          </td>
                          <td className="py-2 px-2">{mov.descripcion}</td>
                          <td
                            className={`py-2 px-2 text-right font-medium ${mov.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}
                          >
                            {mov.tipo === 'ingreso' ? '+' : '-'}
                            {formatearMonto(mov.monto)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
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

          {/* Tabla de sesiones recientes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sesiones Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">Fecha</th>
                      <th className="text-left py-2 px-2">Hora</th>
                      <th className="text-left py-2 px-2">Paciente</th>
                      <th className="text-left py-2 px-2">Tratamiento</th>
                      <th className="text-left py-2 px-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sesiones.slice(0, 10).map((s) => (
                      <tr key={s.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-2">{s.fecha}</td>
                        <td className="py-2 px-2">{s.hora_inicio || '-'}</td>
                        <td className="py-2 px-2">{s.paciente?.nombre_completo || '-'}</td>
                        <td className="py-2 px-2">{s.tratamiento?.nombre || '-'}</td>
                        <td className="py-2 px-2">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              s.estado === 'completada'
                                ? 'bg-green-100 text-green-700'
                                : s.estado === 'cancelada' || s.estado === 'no_asistio'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {s.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                      {pacientes.filter((p) => p.estado === 'activo').length}
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
                      {pacientes.filter((p) => p.estado === 'nuevo').length}
                    </p>
                  </div>
                  <div className="bg-blue-100 rounded-full p-3">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de pacientes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Listado de Pacientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">Nombre</th>
                      <th className="text-left py-2 px-2">DNI</th>
                      <th className="text-left py-2 px-2">Teléfono</th>
                      <th className="text-left py-2 px-2">Email</th>
                      <th className="text-left py-2 px-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pacientes.slice(0, 15).map((p) => (
                      <tr key={p.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-2 font-medium">
                          {p.nombre} {p.apellido}
                        </td>
                        <td className="py-2 px-2">{p.dni || '-'}</td>
                        <td className="py-2 px-2">{p.telefono || '-'}</td>
                        <td className="py-2 px-2">{p.email || '-'}</td>
                        <td className="py-2 px-2">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              p.estado === 'activo'
                                ? 'bg-green-100 text-green-700'
                                : p.estado === 'nuevo'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {p.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reporte de Materiales */}
      {tipoReporte === 'materiales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Productos</p>
                    <p className="text-2xl font-bold text-primary-600">{materiales.length}</p>
                  </div>
                  <div className="bg-primary-100 rounded-full p-3">
                    <Package className="h-6 w-6 text-primary-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Stock Bajo</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {materiales.filter((m) => (m.stock_actual || 0) <= (m.stock_minimo || 0)).length}
                    </p>
                  </div>
                  <div className="bg-yellow-100 rounded-full p-3">
                    <Package className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Valor del Inventario</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatearMonto(
                        materiales.reduce(
                          (sum, m) => sum + (m.stock_actual || 0) * (m.precio_unitario || 0),
                          0
                        )
                      )}
                    </p>
                  </div>
                  <div className="bg-green-100 rounded-full p-3">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de materiales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inventario de Materiales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">Código</th>
                      <th className="text-left py-2 px-2">Nombre</th>
                      <th className="text-left py-2 px-2">Categoría</th>
                      <th className="text-right py-2 px-2">Stock</th>
                      <th className="text-right py-2 px-2">Mínimo</th>
                      <th className="text-right py-2 px-2">Precio Unit.</th>
                      <th className="text-right py-2 px-2">Valor Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materiales.slice(0, 15).map((m) => {
                      const stockBajo = (m.stock_actual || 0) <= (m.stock_minimo || 0)
                      return (
                        <tr
                          key={m.id}
                          className={`border-b hover:bg-gray-50 ${stockBajo ? 'bg-yellow-50' : ''}`}
                        >
                          <td className="py-2 px-2">{m.codigo || '-'}</td>
                          <td className="py-2 px-2 font-medium">{m.nombre}</td>
                          <td className="py-2 px-2">{m.categoria || '-'}</td>
                          <td
                            className={`py-2 px-2 text-right ${stockBajo ? 'text-yellow-600 font-bold' : ''}`}
                          >
                            {m.stock_actual || 0}
                          </td>
                          <td className="py-2 px-2 text-right">{m.stock_minimo || 0}</td>
                          <td className="py-2 px-2 text-right">
                            {formatearMonto(m.precio_unitario || 0)}
                          </td>
                          <td className="py-2 px-2 text-right font-medium">
                            {formatearMonto((m.stock_actual || 0) * (m.precio_unitario || 0))}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
