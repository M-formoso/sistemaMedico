import { useQuery } from '@tanstack/react-query'
import {
  FileCheck,
  Calendar,
  Download,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Eye,
} from 'lucide-react'
import api from '@/lib/axios'
import { formatearFecha } from '@/utils/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Consentimiento {
  id: number
  nombre: string
  tipo: string
  descripcion?: string
  archivo_url?: string
  fecha_firma?: string
  firmado: boolean
  fecha_vencimiento?: string
  created_at: string
}

export default function PortalConsentimientos() {
  const { data: consentimientos = [], isLoading } = useQuery({
    queryKey: ['portal', 'mis-consentimientos'],
    queryFn: async () => {
      const { data } = await api.get('/portal/mis-consentimientos')
      return data as Consentimiento[]
    },
  })

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'tratamiento':
        return 'Tratamiento'
      case 'datos_personales':
        return 'Datos Personales'
      case 'fotografias':
        return 'Fotografías'
      case 'anestesia':
        return 'Anestesia'
      case 'procedimiento':
        return 'Procedimiento'
      default:
        return tipo
    }
  }

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'tratamiento':
        return 'bg-blue-100 text-blue-700'
      case 'datos_personales':
        return 'bg-purple-100 text-purple-700'
      case 'fotografias':
        return 'bg-green-100 text-green-700'
      case 'anestesia':
        return 'bg-orange-100 text-orange-700'
      case 'procedimiento':
        return 'bg-pink-100 text-pink-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const isVencido = (fechaVencimiento?: string) => {
    if (!fechaVencimiento) return false
    return new Date(fechaVencimiento) < new Date()
  }

  const consentimientosFirmados = consentimientos.filter((c) => c.firmado)
  const consentimientosPendientes = consentimientos.filter((c) => !c.firmado)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis Consentimientos</h1>
        <p className="text-gray-500">Documentos y autorizaciones firmadas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm">Firmados</p>
                <p className="text-3xl font-bold text-green-700">{consentimientosFirmados.length}</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm">Pendientes</p>
                <p className="text-3xl font-bold text-yellow-700">{consentimientosPendientes.length}</p>
              </div>
              <div className="bg-yellow-100 rounded-full p-3">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total</p>
                <p className="text-3xl font-bold text-gray-700">{consentimientos.length}</p>
              </div>
              <div className="bg-gray-100 rounded-full p-3">
                <FileCheck className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerta de pendientes */}
      {consentimientosPendientes.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">Tenés consentimientos pendientes de firma</p>
            <p className="text-yellow-700 text-sm">
              Por favor, consultá en recepción para firmar los documentos pendientes.
            </p>
          </div>
        </div>
      )}

      {/* Lista de consentimientos */}
      {consentimientos.length === 0 ? (
        <Card className="shadow-md border-0">
          <CardContent className="py-16 text-center">
            <FileCheck className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg mb-2">No tenés consentimientos registrados</p>
            <p className="text-sm text-gray-400">
              Los documentos y autorizaciones aparecerán aquí
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-md border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary-600" />
              Documentos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {consentimientos.map((consentimiento) => (
                <div
                  key={consentimiento.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-4">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        consentimiento.firmado ? 'bg-green-100' : 'bg-yellow-100'
                      }`}>
                        {consentimiento.firmado ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : (
                          <Clock className="h-6 w-6 text-yellow-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{consentimiento.nombre}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge className={getTipoBadge(consentimiento.tipo)}>
                            {getTipoLabel(consentimiento.tipo)}
                          </Badge>
                          {consentimiento.firmado ? (
                            <span className="text-sm text-green-600 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Firmado {consentimiento.fecha_firma && `el ${formatearFecha(consentimiento.fecha_firma)}`}
                            </span>
                          ) : (
                            <span className="text-sm text-yellow-600 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Pendiente de firma
                            </span>
                          )}
                        </div>
                        {consentimiento.descripcion && (
                          <p className="text-sm text-gray-500 mt-2">{consentimiento.descripcion}</p>
                        )}
                        {consentimiento.fecha_vencimiento && (
                          <p className={`text-sm mt-1 flex items-center gap-1 ${
                            isVencido(consentimiento.fecha_vencimiento) ? 'text-red-600' : 'text-gray-500'
                          }`}>
                            <Calendar className="h-3 w-3" />
                            {isVencido(consentimiento.fecha_vencimiento) ? 'Vencido el' : 'Vence el'}{' '}
                            {formatearFecha(consentimiento.fecha_vencimiento)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-16 sm:ml-0">
                      {consentimiento.archivo_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(consentimiento.archivo_url, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver documento
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
