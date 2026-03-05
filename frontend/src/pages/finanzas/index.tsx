import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Wallet, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PagosTab } from '@/components/finanzas/PagosTab'
import { EgresosTab } from '@/components/finanzas/EgresosTab'
import { pagosService } from '@/services/pagosService'
import { egresosService } from '@/services/egresosService'

export default function FinanzasPage() {
  const [fechaInicio, setFechaInicio] = useState(
    format(startOfMonth(new Date()), 'yyyy-MM-dd')
  )
  const [fechaFin, setFechaFin] = useState(
    format(endOfMonth(new Date()), 'yyyy-MM-dd')
  )

  const { data: pagos = [] } = useQuery({
    queryKey: ['pagos', fechaInicio, fechaFin],
    queryFn: () => pagosService.listar({ fecha_inicio: fechaInicio, fecha_fin: fechaFin }),
  })

  const { data: egresos = [] } = useQuery({
    queryKey: ['egresos', fechaInicio, fechaFin],
    queryFn: () => egresosService.listar({ fecha_inicio: fechaInicio, fecha_fin: fechaFin }),
  })

  // Calcular totales
  const totalIngresos = pagos.reduce((sum, p) => sum + (p.monto || 0), 0)
  const totalEgresos = egresos.reduce((sum, e) => sum + (e.monto || 0), 0)
  const balance = totalIngresos - totalEgresos

  // Desglose por método de pago
  const ingresosPorMetodo = pagos.reduce((acc, p) => {
    const metodo = p.metodo_pago || 'efectivo'
    acc[metodo] = (acc[metodo] || 0) + (p.monto || 0)
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finanzas</h1>
          <p className="text-gray-500">Control de ingresos y egresos</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <Input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-36"
            />
            <span className="text-gray-400">-</span>
            <Input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-36"
            />
          </div>
        </div>
      </div>

      {/* Resumen Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Ingresos */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Ingresos</p>
                <p className="text-2xl font-bold text-green-600">
                  ${totalIngresos.toLocaleString('es-AR')}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
              {pagos.length} pagos registrados
            </div>
          </CardContent>
        </Card>

        {/* Total Egresos */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Egresos</p>
                <p className="text-2xl font-bold text-red-600">
                  ${totalEgresos.toLocaleString('es-AR')}
                </p>
              </div>
              <div className="bg-red-100 rounded-full p-3">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
              {egresos.length} egresos registrados
            </div>
          </CardContent>
        </Card>

        {/* Balance */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Balance</p>
                <p className={`text-2xl font-bold ${balance >= 0 ? 'text-primary-600' : 'text-red-600'}`}>
                  ${balance.toLocaleString('es-AR')}
                </p>
              </div>
              <div className="bg-primary-100 rounded-full p-3">
                <DollarSign className="h-6 w-6 text-primary-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {format(new Date(fechaInicio), "d MMM", { locale: es })} - {format(new Date(fechaFin), "d MMM yyyy", { locale: es })}
            </div>
          </CardContent>
        </Card>

        {/* Desglose Métodos de Pago */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500 mb-3">Por método de pago</p>
            <div className="space-y-2">
              {Object.entries(ingresosPorMetodo).map(([metodo, monto]) => (
                <div key={metodo} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {metodo === 'efectivo' ? (
                      <Wallet className="h-4 w-4 text-green-500" />
                    ) : (
                      <CreditCard className="h-4 w-4 text-blue-500" />
                    )}
                    <span className="capitalize">{metodo}</span>
                  </div>
                  <span className="font-medium">${monto.toLocaleString('es-AR')}</span>
                </div>
              ))}
              {Object.keys(ingresosPorMetodo).length === 0 && (
                <p className="text-gray-400 text-center">Sin datos</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Pagos y Egresos */}
      <Tabs defaultValue="pagos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pagos" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Ingresos / Pagos
          </TabsTrigger>
          <TabsTrigger value="egresos" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Egresos / Gastos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pagos">
          <PagosTab fechaInicio={fechaInicio} fechaFin={fechaFin} />
        </TabsContent>

        <TabsContent value="egresos">
          <EgresosTab fechaInicio={fechaInicio} fechaFin={fechaFin} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
