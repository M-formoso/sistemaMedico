import { useQuery } from '@tanstack/react-query'
import {
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Heart,
  Pill,
  AlertCircle,
  Activity,
  Stethoscope,
  ClipboardList,
} from 'lucide-react'
import api from '@/lib/axios'
import { formatearFecha } from '@/utils/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface HistorialClinico {
  id: number
  nombre: string
  apellido: string
  email: string
  telefono: string
  fecha_nacimiento?: string
  direccion?: string
  antecedentes?: string
  alergias?: string
  medicacion_actual?: string
  notas_medicas?: string
  tratamientos?: Array<{
    id: number
    tipo_tratamiento_nombre: string
    fecha_inicio: string
    estado: string
    sesiones_realizadas: number
    total_sesiones: number
  }>
}

export default function PortalHistorial() {
  const { data: historial, isLoading } = useQuery({
    queryKey: ['portal', 'mi-historial'],
    queryFn: async () => {
      const { data } = await api.get('/portal/mi-historial')
      return data as HistorialClinico
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'en_curso':
        return 'bg-blue-100 text-blue-700'
      case 'completado':
        return 'bg-green-100 text-green-700'
      case 'cancelado':
        return 'bg-red-100 text-red-700'
      case 'pausado':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'en_curso':
        return 'En curso'
      case 'completado':
        return 'Completado'
      case 'cancelado':
        return 'Cancelado'
      case 'pausado':
        return 'Pausado'
      default:
        return estado
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi Historial Clínico</h1>
        <p className="text-gray-500">Consultá tu información médica y tratamientos</p>
      </div>

      {/* Datos Personales */}
      <Card className="shadow-md border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-primary-600" />
            Datos Personales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nombre completo</p>
                  <p className="font-medium text-gray-900">
                    {historial?.nombre} {historial?.apellido}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{historial?.email || '-'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Teléfono</p>
                  <p className="font-medium text-gray-900">{historial?.telefono || '-'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha de nacimiento</p>
                  <p className="font-medium text-gray-900">
                    {historial?.fecha_nacimiento
                      ? formatearFecha(historial.fecha_nacimiento)
                      : '-'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Dirección</p>
                  <p className="font-medium text-gray-900">{historial?.direccion || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información Médica */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-md border-0 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-red-800 mb-1">Alergias</p>
                <p className="text-sm text-red-700">
                  {historial?.alergias || 'Sin alergias registradas'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-0 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Pill className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-blue-800 mb-1">Medicación Actual</p>
                <p className="text-sm text-blue-700">
                  {historial?.medicacion_actual || 'Sin medicación registrada'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-0 bg-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Heart className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-purple-800 mb-1">Antecedentes</p>
                <p className="text-sm text-purple-700 line-clamp-3">
                  {historial?.antecedentes || 'Sin antecedentes registrados'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notas Médicas */}
      {historial?.notas_medicas && (
        <Card className="shadow-md border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary-600" />
              Notas Médicas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-wrap">{historial.notas_medicas}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mis Tratamientos */}
      <Card className="shadow-md border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary-600" />
            Mis Tratamientos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!historial?.tratamientos || historial.tratamientos.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No tenés tratamientos registrados aún</p>
            </div>
          ) : (
            <div className="space-y-4">
              {historial.tratamientos.map((tratamiento) => (
                <div
                  key={tratamiento.id}
                  className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <Stethoscope className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {tratamiento.tipo_tratamiento_nombre}
                        </p>
                        <p className="text-sm text-gray-500">
                          Iniciado el {formatearFecha(tratamiento.fecha_inicio)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 ml-16 md:ml-0">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary-600">
                          {tratamiento.sesiones_realizadas}
                        </p>
                        <p className="text-xs text-gray-500">
                          de {tratamiento.total_sesiones} sesiones
                        </p>
                      </div>
                      <Badge className={getEstadoBadge(tratamiento.estado)}>
                        {getEstadoLabel(tratamiento.estado)}
                      </Badge>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4 ml-16">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            (tratamiento.sesiones_realizadas / tratamiento.total_sesiones) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round(
                        (tratamiento.sesiones_realizadas / tratamiento.total_sesiones) * 100
                      )}
                      % completado
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
