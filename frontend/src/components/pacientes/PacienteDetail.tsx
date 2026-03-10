import { useQuery } from '@tanstack/react-query'
import { User, Calendar, Phone, Mail, FileText, Clock, CreditCard, FolderOpen, CalendarCheck, History, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { pacientesService } from '@/services/pacientesService'
import { sesionesService } from '@/services/sesionesService'
import { turnosRecurrentesService } from '@/services/turnosRecurrentesService'
import { formatearFecha, formatearMonto } from '@/utils/formatters'
import { HistoriaClinicaTabs } from '@/components/historia-clinica/HistoriaClinicaTabs'
import type { Paciente, Sesion } from '@/types'

interface PacienteDetailProps {
  pacienteId: string
}

export function PacienteDetail({ pacienteId }: PacienteDetailProps) {
  const { data: paciente, isLoading } = useQuery({
    queryKey: ['pacientes', pacienteId],
    queryFn: () => pacientesService.obtenerPorId(pacienteId),
  })

  const { data: historial } = useQuery({
    queryKey: ['pacientes', pacienteId, 'historial'],
    queryFn: () => pacientesService.obtenerHistorial(pacienteId),
  })

  // Obtener próximos turnos (sesiones programadas a partir de hoy)
  const hoy = new Date().toISOString().split('T')[0]
  const { data: proximosTurnos = [] } = useQuery({
    queryKey: ['sesiones', 'proximas', pacienteId],
    queryFn: () => sesionesService.listar({
      paciente_id: parseInt(pacienteId),
      fecha_desde: hoy,
    }),
    select: (data) => data.filter(s =>
      s.estado === 'programada' || s.estado === 'confirmada'
    ).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()),
  })

  // Obtener turnos recurrentes del paciente
  const { data: turnosRecurrentes = [] } = useQuery({
    queryKey: ['turnos-recurrentes', pacienteId],
    queryFn: () => turnosRecurrentesService.listarPorPaciente(parseInt(pacienteId)),
  })

  // Historial de turnos pasados
  const turnosPasados = historial?.sesiones?.filter((s: { fecha: string; estado: string }) =>
    s.fecha < hoy || s.estado === 'completada'
  ) || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!paciente) {
    return <div>Paciente no encontrado</div>
  }

  const estadoBadge = {
    activo: 'success',
    inactivo: 'secondary',
    nuevo: 'info',
  } as const

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
              <User className="h-8 w-8 text-primary-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">
                  {paciente.nombre} {paciente.apellido}
                </h2>
                <Badge variant={estadoBadge[paciente.estado]}>
                  {paciente.estado}
                </Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                {paciente.dni && (
                  <span>DNI: {paciente.dni}</span>
                )}
                {paciente.fecha_nacimiento && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatearFecha(paciente.fecha_nacimiento)}
                    {paciente.edad !== undefined && paciente.edad !== null && (
                      <span className="ml-1">({paciente.edad} años)</span>
                    )}
                  </span>
                )}
                {paciente.telefono && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {paciente.telefono}
                  </span>
                )}
                {paciente.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {paciente.email}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs principales */}
      <Tabs defaultValue="historia" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="historia" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Historia Clínica
          </TabsTrigger>
          <TabsTrigger value="turnos" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Turnos
          </TabsTrigger>
          <TabsTrigger value="finanzas" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Finanzas
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* Tab Historia Clínica */}
          <TabsContent value="historia">
            <div className="space-y-6">
              {/* Resumen Clínico */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Resumen Clínico
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-700">Antecedentes</h4>
                    <p className="text-gray-600 mt-1">{paciente.antecedentes || 'No registrados'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">Alergias</h4>
                    <p className="text-gray-600 mt-1">{paciente.alergias || 'No registradas'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">Medicación Actual</h4>
                    <p className="text-gray-600 mt-1">{paciente.medicacion_actual || 'No registrada'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">Notas Médicas</h4>
                    <p className="text-gray-600 mt-1">{paciente.notas_medicas || 'Sin notas'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Sub-tabs de Historia Clínica */}
              <HistoriaClinicaTabs pacienteId={parseInt(pacienteId)} />
            </div>
          </TabsContent>

          {/* Tab Turnos */}
          <TabsContent value="turnos">
            <div className="space-y-6">
              {/* Próximos Turnos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarCheck className="h-5 w-5 text-green-600" />
                    Próximos Turnos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {proximosTurnos.length > 0 ? (
                    <div className="space-y-3">
                      {proximosTurnos.map((sesion: Sesion) => (
                        <div key={sesion.id} className="flex justify-between items-center py-3 border-b last:border-0 bg-green-50/50 rounded-lg px-3 -mx-3">
                          <div>
                            <p className="font-medium text-green-800">
                              {formatearFecha(sesion.fecha)}
                              {sesion.hora_inicio && (
                                <span className="ml-2 text-green-600">
                                  {sesion.hora_inicio}
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-600">
                              {sesion.tratamiento?.nombre || 'Sin especificar'}
                            </p>
                          </div>
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            {sesion.estado === 'confirmada' ? 'Confirmado' : 'Programado'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No hay turnos próximos programados</p>
                  )}
                </CardContent>
              </Card>

              {/* Turnos Recurrentes */}
              {turnosRecurrentes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <RefreshCw className="h-5 w-5 text-blue-600" />
                      Turnos Recurrentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {turnosRecurrentes.filter(t => t.activo).map((turno) => {
                        const diasSemana: Record<string, string> = {
                          lunes: 'Lunes',
                          martes: 'Martes',
                          miercoles: 'Miércoles',
                          jueves: 'Jueves',
                          viernes: 'Viernes',
                          sabado: 'Sábado',
                        }
                        const frecuencias: Record<string, string> = {
                          semanal: 'Semanal',
                          quincenal: 'Quincenal',
                          mensual: 'Mensual',
                        }
                        return (
                          <div key={turno.id} className="flex justify-between items-center py-3 border-b last:border-0">
                            <div>
                              <p className="font-medium">
                                {diasSemana[turno.dia_semana]} - {turno.hora}
                              </p>
                              <p className="text-sm text-gray-500">
                                {turno.tratamiento_nombre || 'Sin tratamiento'} • {frecuencias[turno.frecuencia]}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-blue-600 border-blue-200">
                              {frecuencias[turno.frecuencia]}
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Historial de Turnos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-gray-500" />
                    Historial de Turnos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {turnosPasados.length > 0 ? (
                    <div className="space-y-3">
                      {turnosPasados.slice(0, 10).map((sesion: { id: string; fecha: string; fecha_hora?: string; zona_tratada: string; estado: string; tratamiento_nombre?: string }) => (
                        <div key={sesion.id} className="flex justify-between items-center py-3 border-b last:border-0">
                          <div>
                            <p className="font-medium">{formatearFecha(sesion.fecha_hora || sesion.fecha)}</p>
                            <p className="text-sm text-gray-500">
                              {sesion.tratamiento_nombre || sesion.zona_tratada || 'Sin especificar'}
                            </p>
                          </div>
                          <Badge variant={sesion.estado === 'completada' ? 'success' : sesion.estado === 'cancelada' ? 'destructive' : 'secondary'}>
                            {sesion.estado}
                          </Badge>
                        </div>
                      ))}
                      {turnosPasados.length > 10 && (
                        <p className="text-sm text-gray-400 text-center pt-2">
                          Mostrando los últimos 10 turnos de {turnosPasados.length} totales
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Sin historial de turnos</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Finanzas */}
          <TabsContent value="finanzas">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Pagos</CardTitle>
              </CardHeader>
              <CardContent>
                {historial?.pagos?.length > 0 ? (
                  <div className="space-y-3">
                    {historial.pagos.map((pago: { id: string; monto: number; created_at: string; metodo_pago: string }) => (
                      <div key={pago.id} className="flex justify-between items-center py-3 border-b last:border-0">
                        <div>
                          <p className="font-medium text-green-600">{formatearMonto(pago.monto)}</p>
                          <p className="text-sm text-gray-500">
                            {formatearFecha(pago.created_at)} - {pago.metodo_pago}
                          </p>
                        </div>
                        <Badge variant="success">Pagado</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Sin pagos registrados</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
