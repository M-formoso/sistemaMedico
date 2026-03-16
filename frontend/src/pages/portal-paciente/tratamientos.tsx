import { useQuery } from '@tanstack/react-query'
import {
  Stethoscope,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Syringe,
  Package,
} from 'lucide-react'
import api from '@/lib/axios'
import { formatearFecha } from '@/utils/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface MaterialAplicado {
  nombre: string
  cantidad: number
  unidad?: string
}

interface Tratamiento {
  id: number
  fecha: string
  hora_inicio?: string
  hora_fin?: string
  tratamiento_nombre: string
  zona_corporal?: string
  estado: string
  notas?: string
  materiales_aplicados: MaterialAplicado[]
}

export default function PortalTratamientos() {
  const { data: tratamientos = [], isLoading } = useQuery({
    queryKey: ['portal', 'mis-tratamientos'],
    queryFn: async () => {
      const { data } = await api.get('/portal/mis-tratamientos')
      return data as Tratamiento[]
    },
  })

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'completada':
        return { class: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Completada' }
      case 'programada':
        return { class: 'bg-blue-100 text-blue-700', icon: Clock, label: 'Programada' }
      case 'confirmada':
        return { class: 'bg-blue-100 text-blue-700', icon: CheckCircle, label: 'Confirmada' }
      case 'cancelada':
        return { class: 'bg-red-100 text-red-700', icon: XCircle, label: 'Cancelada' }
      case 'no_asistio':
        return { class: 'bg-orange-100 text-orange-700', icon: XCircle, label: 'No asistió' }
      default:
        return { class: 'bg-gray-100 text-gray-700', icon: Clock, label: estado }
    }
  }

  const tratamientosCompletados = tratamientos.filter((t) => t.estado === 'completada')
  const tratamientosProgramados = tratamientos.filter(
    (t) => t.estado === 'programada' || t.estado === 'confirmada'
  )

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
        <h1 className="text-2xl font-bold text-gray-900">Mis Tratamientos</h1>
        <p className="text-gray-500">Historial de tratamientos y productos aplicados</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm">Realizados</p>
                <p className="text-3xl font-bold text-green-700">{tratamientosCompletados.length}</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm">Próximos</p>
                <p className="text-3xl font-bold text-blue-700">{tratamientosProgramados.length}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Sesiones</p>
                <p className="text-3xl font-bold text-gray-700">{tratamientos.length}</p>
              </div>
              <div className="bg-gray-100 rounded-full p-3">
                <Stethoscope className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de tratamientos */}
      {tratamientos.length === 0 ? (
        <Card className="shadow-md border-0">
          <CardContent className="py-16 text-center">
            <Stethoscope className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg mb-2">No tenés tratamientos registrados</p>
            <p className="text-sm text-gray-400">
              Tu historial de tratamientos aparecerá aquí
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-md border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary-600" />
              Historial de Sesiones
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {tratamientos.map((tratamiento) => {
                const badge = getEstadoBadge(tratamiento.estado)
                const BadgeIcon = badge.icon

                return (
                  <div
                    key={tratamiento.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col gap-3">
                      {/* Encabezado */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                            <Syringe className="h-6 w-6 text-primary-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{tratamiento.tratamiento_nombre}</p>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatearFecha(tratamiento.fecha)}
                              </span>
                              {tratamiento.hora_inicio && (
                                <>
                                  <span className="text-gray-300">•</span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {tratamiento.hora_inicio}
                                    {tratamiento.hora_fin && ` - ${tratamiento.hora_fin}`}
                                  </span>
                                </>
                              )}
                              {tratamiento.zona_corporal && (
                                <>
                                  <span className="text-gray-300">•</span>
                                  <span>{tratamiento.zona_corporal}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <Badge className={badge.class}>
                          <BadgeIcon className="h-3 w-3 mr-1" />
                          {badge.label}
                        </Badge>
                      </div>

                      {/* Materiales aplicados */}
                      {tratamiento.materiales_aplicados && tratamiento.materiales_aplicados.length > 0 && (
                        <div className="ml-16 bg-gray-50 rounded-lg p-3">
                          <p className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                            <Package className="h-4 w-4 text-gray-500" />
                            Productos aplicados:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {tratamiento.materiales_aplicados.map((material, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="bg-white border text-gray-700"
                              >
                                {material.nombre}
                                {material.cantidad > 0 && (
                                  <span className="ml-1 text-gray-500">
                                    ({material.cantidad} {material.unidad || 'ud.'})
                                  </span>
                                )}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notas */}
                      {tratamiento.notas && (
                        <div className="ml-16 text-sm text-gray-600 bg-blue-50 rounded-lg p-3">
                          <strong>Notas:</strong> {tratamiento.notas}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
