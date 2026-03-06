import { useQuery } from '@tanstack/react-query'
import {
  CreditCard,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Receipt,
  Wallet,
} from 'lucide-react'
import api from '@/lib/axios'
import { formatearMonto, formatearFecha } from '@/utils/formatters'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Pago {
  id: number
  fecha: string
  monto: number
  metodo_pago: string
  concepto?: string
  tratamiento_nombre?: string
  estado: 'pagado' | 'pendiente' | 'parcial'
}

interface Saldo {
  total_pagado: number
  saldo_pendiente: number
  total_tratamientos: number
}

export default function PortalPagos() {
  const { data: pagos = [], isLoading: loadingPagos } = useQuery({
    queryKey: ['portal', 'mis-pagos'],
    queryFn: async () => {
      const { data } = await api.get('/portal/mis-pagos')
      return data as Pago[]
    },
  })

  const { data: saldo, isLoading: loadingSaldo } = useQuery({
    queryKey: ['portal', 'mi-saldo'],
    queryFn: async () => {
      const { data } = await api.get('/portal/mi-saldo')
      return data as Saldo
    },
  })

  const getMetodoPagoIcon = (metodo: string) => {
    switch (metodo?.toLowerCase()) {
      case 'efectivo':
        return Wallet
      case 'tarjeta':
      case 'tarjeta_credito':
      case 'tarjeta_debito':
        return CreditCard
      case 'transferencia':
        return TrendingUp
      default:
        return DollarSign
    }
  }

  const getMetodoPagoLabel = (metodo: string) => {
    switch (metodo?.toLowerCase()) {
      case 'efectivo':
        return 'Efectivo'
      case 'tarjeta':
      case 'tarjeta_credito':
        return 'Tarjeta de Crédito'
      case 'tarjeta_debito':
        return 'Tarjeta de Débito'
      case 'transferencia':
        return 'Transferencia'
      default:
        return metodo || 'No especificado'
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pagado':
        return { class: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Pagado' }
      case 'pendiente':
        return { class: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Pendiente' }
      case 'parcial':
        return { class: 'bg-blue-100 text-blue-700', icon: AlertCircle, label: 'Parcial' }
      default:
        return { class: 'bg-gray-100 text-gray-700', icon: Clock, label: estado }
    }
  }

  const pagosPagados = pagos.filter((p) => p.estado === 'pagado')
  const pagosPendientes = pagos.filter((p) => p.estado === 'pendiente' || p.estado === 'parcial')

  if (loadingPagos || loadingSaldo) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis Pagos</h1>
        <p className="text-gray-500">Historial de pagos y saldo de cuenta</p>
      </div>

      {/* Resumen de Saldo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg shadow-green-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Pagado</p>
                <p className="text-3xl font-bold">{formatearMonto(saldo?.total_pagado || 0)}</p>
              </div>
              <div className="bg-white/20 rounded-full p-3">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`border-0 shadow-lg ${
            (saldo?.saldo_pendiente || 0) > 0
              ? 'bg-gradient-to-br from-yellow-500 to-orange-500 text-white shadow-yellow-500/30'
              : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700'
          }`}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${(saldo?.saldo_pendiente || 0) > 0 ? 'text-yellow-100' : 'text-gray-500'}`}>
                  Saldo Pendiente
                </p>
                <p className="text-3xl font-bold">{formatearMonto(saldo?.saldo_pendiente || 0)}</p>
              </div>
              <div className={`rounded-full p-3 ${(saldo?.saldo_pendiente || 0) > 0 ? 'bg-white/20' : 'bg-gray-300'}`}>
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white border-0 shadow-lg shadow-primary-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-100 text-sm">Total Tratamientos</p>
                <p className="text-3xl font-bold">{formatearMonto(saldo?.total_tratamientos || 0)}</p>
              </div>
              <div className="bg-white/20 rounded-full p-3">
                <Receipt className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerta de saldo pendiente */}
      {(saldo?.saldo_pendiente || 0) > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">Tenés un saldo pendiente</p>
            <p className="text-yellow-700 text-sm">
              Tu saldo pendiente es de <strong>{formatearMonto(saldo?.saldo_pendiente || 0)}</strong>.
              Consultá en recepción para regularizar tu situación.
            </p>
          </div>
        </div>
      )}

      {/* Historial de Pagos */}
      <Tabs defaultValue="todos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="todos">Todos ({pagos.length})</TabsTrigger>
          <TabsTrigger value="pagados">Pagados ({pagosPagados.length})</TabsTrigger>
          {pagosPendientes.length > 0 && (
            <TabsTrigger value="pendientes">Pendientes ({pagosPendientes.length})</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="todos" className="space-y-4">
          <PagosLista pagos={pagos} getEstadoBadge={getEstadoBadge} getMetodoPagoIcon={getMetodoPagoIcon} getMetodoPagoLabel={getMetodoPagoLabel} />
        </TabsContent>

        <TabsContent value="pagados" className="space-y-4">
          <PagosLista pagos={pagosPagados} getEstadoBadge={getEstadoBadge} getMetodoPagoIcon={getMetodoPagoIcon} getMetodoPagoLabel={getMetodoPagoLabel} />
        </TabsContent>

        <TabsContent value="pendientes" className="space-y-4">
          <PagosLista pagos={pagosPendientes} getEstadoBadge={getEstadoBadge} getMetodoPagoIcon={getMetodoPagoIcon} getMetodoPagoLabel={getMetodoPagoLabel} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface PagosListaProps {
  pagos: Pago[]
  getEstadoBadge: (estado: string) => { class: string; icon: React.ComponentType<{ className?: string }>; label: string }
  getMetodoPagoIcon: (metodo: string) => React.ComponentType<{ className?: string }>
  getMetodoPagoLabel: (metodo: string) => string
}

function PagosLista({ pagos, getEstadoBadge, getMetodoPagoIcon, getMetodoPagoLabel }: PagosListaProps) {
  if (pagos.length === 0) {
    return (
      <Card className="shadow-md border-0">
        <CardContent className="py-12 text-center">
          <CreditCard className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No hay pagos registrados</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-md border-0">
      <CardContent className="p-0">
        <div className="divide-y">
          {pagos.map((pago) => {
            const MetodoIcon = getMetodoPagoIcon(pago.metodo_pago)
            const badge = getEstadoBadge(pago.estado)
            const BadgeIcon = badge.icon

            return (
              <div key={pago.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <MetodoIcon className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {pago.concepto || pago.tratamiento_nombre || 'Pago'}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {formatearFecha(pago.fecha)}
                        <span className="text-gray-300">•</span>
                        {getMetodoPagoLabel(pago.metodo_pago)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 ml-16 sm:ml-0">
                    <p className="text-xl font-bold text-gray-900">{formatearMonto(pago.monto)}</p>
                    <Badge className={badge.class}>
                      <BadgeIcon className="h-3 w-3 mr-1" />
                      {badge.label}
                    </Badge>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
