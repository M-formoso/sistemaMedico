import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Calendar,
  CreditCard,
  FileText,
  Image,
  Clock,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  User,
  Heart,
  Pill,
  Activity,
} from 'lucide-react'
import api from '@/lib/axios'
import { formatearMonto, formatearFecha } from '@/utils/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/authStore'

export default function PortalHome() {
  const { user } = useAuthStore()

  const { data: historial, isLoading: loadingHistorial } = useQuery({
    queryKey: ['portal', 'mi-historial'],
    queryFn: async () => {
      const { data } = await api.get('/portal/mi-historial')
      return data
    },
  })

  const { data: sesiones = [], isLoading: loadingSesiones } = useQuery({
    queryKey: ['portal', 'mis-sesiones'],
    queryFn: async () => {
      const { data } = await api.get('/portal/mis-sesiones')
      return data
    },
  })

  const { data: saldo } = useQuery({
    queryKey: ['portal', 'mi-saldo'],
    queryFn: async () => {
      const { data } = await api.get('/portal/mi-saldo')
      return data
    },
  })

  if (loadingHistorial) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  const proximasSesiones = sesiones.filter(
    (s: { estado: string }) => s.estado === 'programada' || s.estado === 'confirmada'
  )

  const quickActions = [
    {
      title: 'Mis Turnos',
      description: 'Ver y gestionar mis citas',
      icon: Calendar,
      href: '/portal/turnos',
      color: 'bg-blue-500',
    },
    {
      title: 'Historial Clínico',
      description: 'Consultar mi información médica',
      icon: FileText,
      href: '/portal/historial',
      color: 'bg-green-500',
    },
    {
      title: 'Mis Fotos',
      description: 'Ver mis fotos de tratamientos',
      icon: Image,
      href: '/portal/fotos',
      color: 'bg-purple-500',
    },
    {
      title: 'Pagos',
      description: 'Ver historial de pagos',
      icon: CreditCard,
      href: '/portal/pagos',
      color: 'bg-orange-500',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 md:p-8 text-white shadow-xl shadow-primary-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              ¡Hola, {historial?.nombre?.split(' ')[0] || user?.nombre}!
            </h1>
            <p className="text-primary-100">
              Bienvenido/a a tu portal de paciente. Aquí podés gestionar tus turnos, ver tu
              historial clínico y mucho más.
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <User className="h-10 w-10 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Alert: Saldo Pendiente */}
      {saldo?.saldo_pendiente > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">Tenés un saldo pendiente</p>
            <p className="text-yellow-700 text-sm">
              Saldo: <strong>{formatearMonto(saldo.saldo_pendiente)}</strong>. Consultá en recepción
              para regularizar tu situación.
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link key={action.title} to={action.href}>
            <Card className="h-full hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer border-0 shadow-md">
              <CardContent className="pt-6">
                <div
                  className={`h-12 w-12 rounded-xl ${action.color} flex items-center justify-center mb-4 shadow-lg`}
                >
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">{action.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{action.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Próximos Turnos */}
        <Card className="lg:col-span-2 shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary-600" />
              Próximos Turnos
            </CardTitle>
            <Link to="/portal/turnos">
              <Button variant="ghost" size="sm">
                Ver todos
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loadingSesiones ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
              </div>
            ) : proximasSesiones.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 mb-4">No tenés turnos programados</p>
                <p className="text-sm text-gray-400">
                  Contactá al consultorio para agendar tu próxima cita
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {proximasSesiones.slice(0, 3).map(
                  (sesion: {
                    id: string
                    fecha: string
                    hora_inicio?: string
                    zona_tratada: string
                    estado: string
                  }) => (
                    <div
                      key={sesion.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-primary-100 flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {formatearFecha(sesion.fecha)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {sesion.zona_tratada || 'Tratamiento estético'}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={
                          sesion.estado === 'confirmada'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }
                      >
                        {sesion.estado === 'confirmada' ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Confirmado
                          </>
                        ) : (
                          'Programado'
                        )}
                      </Badge>
                    </div>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumen de Salud */}
        <Card className="shadow-md border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary-600" />
              Mi Información
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {historial?.alergias && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                <div className="flex items-center gap-2 text-red-700 mb-1">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium text-sm">Alergias</span>
                </div>
                <p className="text-sm text-red-600">{historial.alergias}</p>
              </div>
            )}

            {historial?.medicacion_actual && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 text-blue-700 mb-1">
                  <Pill className="h-4 w-4" />
                  <span className="font-medium text-sm">Medicación Actual</span>
                </div>
                <p className="text-sm text-blue-600">{historial.medicacion_actual}</p>
              </div>
            )}

            {historial?.antecedentes && (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-2 text-gray-700 mb-1">
                  <Heart className="h-4 w-4" />
                  <span className="font-medium text-sm">Antecedentes</span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-3">{historial.antecedentes}</p>
              </div>
            )}

            {!historial?.alergias && !historial?.medicacion_actual && !historial?.antecedentes && (
              <div className="text-center py-4">
                <Heart className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">
                  No hay información clínica registrada aún.
                </p>
              </div>
            )}

            <Link to="/portal/historial">
              <Button variant="outline" className="w-full mt-2">
                Ver historial completo
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Últimas Sesiones Realizadas */}
      <Card className="shadow-md border-0">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary-600" />
            Últimas Sesiones Realizadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingSesiones ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Fecha</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      Tratamiento
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {sesiones
                    .filter((s: { estado: string }) => s.estado === 'completada')
                    .slice(0, 5)
                    .map((sesion: { id: string; fecha: string; zona_tratada: string; estado: string }) => (
                      <tr key={sesion.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm">{formatearFecha(sesion.fecha)}</td>
                        <td className="py-3 px-4 text-sm">{sesion.zona_tratada || '-'}</td>
                        <td className="py-3 px-4">
                          <Badge className="bg-green-100 text-green-700">Completada</Badge>
                        </td>
                      </tr>
                    ))}
                  {sesiones.filter((s: { estado: string }) => s.estado === 'completada').length ===
                    0 && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-gray-500">
                        No hay sesiones realizadas aún
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
