import { useQuery } from '@tanstack/react-query'
import { Calendar, Clock, MapPin, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import api from '@/lib/axios'
import { formatearFecha } from '@/utils/formatters'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Sesion {
  id: string
  fecha: string
  hora_inicio?: string
  hora_fin?: string
  zona_tratada?: string
  tratamiento_id?: number
  estado: string
  notas?: string
  proxima_sesion?: string
}

export default function PortalTurnos() {
  const { data: sesiones = [], isLoading } = useQuery({
    queryKey: ['portal', 'mis-sesiones'],
    queryFn: async () => {
      const { data } = await api.get('/portal/mis-sesiones')
      return data as Sesion[]
    },
  })

  const hoy = new Date().toISOString().split('T')[0]

  const proximosTurnos = sesiones.filter(
    (s) =>
      (s.estado === 'programada' || s.estado === 'confirmada') &&
      s.fecha >= hoy
  )

  const turnosPasados = sesiones.filter(
    (s) => s.estado === 'completada' || s.fecha < hoy
  )

  const turnosCancelados = sesiones.filter(
    (s) => s.estado === 'cancelada' || s.estado === 'no_asistio'
  )

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'confirmada':
        return { class: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Confirmado' }
      case 'programada':
        return { class: 'bg-blue-100 text-blue-700', icon: Clock, label: 'Programado' }
      case 'completada':
        return { class: 'bg-gray-100 text-gray-700', icon: CheckCircle, label: 'Completada' }
      case 'cancelada':
        return { class: 'bg-red-100 text-red-700', icon: XCircle, label: 'Cancelada' }
      case 'no_asistio':
        return { class: 'bg-orange-100 text-orange-700', icon: AlertCircle, label: 'No asistió' }
      default:
        return { class: 'bg-gray-100 text-gray-700', icon: Clock, label: estado }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  const TurnoCard = ({ sesion }: { sesion: Sesion }) => {
    const badge = getEstadoBadge(sesion.estado)
    const BadgeIcon = badge.icon

    return (
      <div className="bg-white rounded-xl border shadow-sm p-5 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{formatearFecha(sesion.fecha)}</p>
              {sesion.hora_inicio && (
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {sesion.hora_inicio}
                  {sesion.hora_fin && ` - ${sesion.hora_fin}`}
                </p>
              )}
            </div>
          </div>
          <Badge className={badge.class}>
            <BadgeIcon className="h-3 w-3 mr-1" />
            {badge.label}
          </Badge>
        </div>

        <div className="space-y-2">
          {sesion.zona_tratada && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>{sesion.zona_tratada}</span>
            </div>
          )}

          {sesion.notas && (
            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 mt-3">
              {sesion.notas}
            </p>
          )}

          {sesion.proxima_sesion && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-sm text-primary-600">
                Próxima sesión sugerida: {formatearFecha(sesion.proxima_sesion)}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis Turnos</h1>
        <p className="text-gray-500">Consultá tus turnos programados y el historial de citas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm">Próximos</p>
                <p className="text-3xl font-bold text-blue-700">{proximosTurnos.length}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm">Realizados</p>
                <p className="text-3xl font-bold text-green-700">{turnosPasados.length}</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total</p>
                <p className="text-3xl font-bold text-gray-700">{sesiones.length}</p>
              </div>
              <div className="bg-gray-100 rounded-full p-3">
                <Clock className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="proximos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="proximos">
            Próximos ({proximosTurnos.length})
          </TabsTrigger>
          <TabsTrigger value="pasados">
            Historial ({turnosPasados.length})
          </TabsTrigger>
          {turnosCancelados.length > 0 && (
            <TabsTrigger value="cancelados">
              Cancelados ({turnosCancelados.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="proximos" className="space-y-4">
          {proximosTurnos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-2">No tenés turnos programados</p>
                <p className="text-sm text-gray-400">
                  Contactá al consultorio para agendar tu próxima cita
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {proximosTurnos.map((sesion) => (
                <TurnoCard key={sesion.id} sesion={sesion} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pasados" className="space-y-4">
          {turnosPasados.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No hay turnos anteriores</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {turnosPasados.map((sesion) => (
                <TurnoCard key={sesion.id} sesion={sesion} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cancelados" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {turnosCancelados.map((sesion) => (
              <TurnoCard key={sesion.id} sesion={sesion} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
