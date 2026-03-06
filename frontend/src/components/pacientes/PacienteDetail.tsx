import { useQuery } from '@tanstack/react-query'
import { User, Calendar, Phone, Mail, FileText, Clock, CreditCard, FolderOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { pacientesService } from '@/services/pacientesService'
import { formatearFecha, formatearMonto } from '@/utils/formatters'
import { HistoriaClinicaTabs } from '@/components/historia-clinica/HistoriaClinicaTabs'
import type { Paciente } from '@/types'

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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Últimos Turnos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {historial?.sesiones?.length > 0 ? (
                  <div className="space-y-3">
                    {historial.sesiones.map((sesion: { id: string; fecha: string; fecha_hora?: string; zona_tratada: string; estado: string; tratamiento_nombre?: string }) => (
                      <div key={sesion.id} className="flex justify-between items-center py-3 border-b last:border-0">
                        <div>
                          <p className="font-medium">{formatearFecha(sesion.fecha_hora || sesion.fecha)}</p>
                          <p className="text-sm text-gray-500">
                            {sesion.tratamiento_nombre || sesion.zona_tratada || 'Sin especificar'}
                          </p>
                        </div>
                        <Badge variant={sesion.estado === 'realizada' ? 'success' : sesion.estado === 'cancelada' ? 'destructive' : 'info'}>
                          {sesion.estado}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Sin turnos registrados</p>
                )}
              </CardContent>
            </Card>
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
