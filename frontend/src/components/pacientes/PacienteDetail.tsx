import { useQuery } from '@tanstack/react-query'
import { User, Calendar, Phone, Mail, FileText, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { pacientesService } from '@/services/pacientesService'
import { formatearFecha, formatearMonto } from '@/utils/formatters'
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Historial Clínico */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Historial Clínico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {paciente.antecedentes && (
              <div>
                <h4 className="font-medium text-gray-700">Antecedentes</h4>
                <p className="text-gray-600 mt-1">{paciente.antecedentes}</p>
              </div>
            )}
            {paciente.alergias && (
              <div>
                <h4 className="font-medium text-gray-700">Alergias</h4>
                <p className="text-gray-600 mt-1">{paciente.alergias}</p>
              </div>
            )}
            {paciente.medicacion_actual && (
              <div>
                <h4 className="font-medium text-gray-700">Medicación Actual</h4>
                <p className="text-gray-600 mt-1">{paciente.medicacion_actual}</p>
              </div>
            )}
            {paciente.notas_medicas && (
              <div>
                <h4 className="font-medium text-gray-700">Notas Médicas</h4>
                <p className="text-gray-600 mt-1">{paciente.notas_medicas}</p>
              </div>
            )}
            {!paciente.antecedentes && !paciente.alergias && !paciente.medicacion_actual && !paciente.notas_medicas && (
              <p className="text-gray-500">Sin información clínica registrada</p>
            )}
          </CardContent>
        </Card>

        {/* Últimas Sesiones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Últimas Sesiones
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historial?.sesiones?.length > 0 ? (
              <div className="space-y-3">
                {historial.sesiones.slice(0, 5).map((sesion: { id: string; fecha: string; zona_tratada: string; estado: string }) => (
                  <div key={sesion.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{formatearFecha(sesion.fecha)}</p>
                      <p className="text-sm text-gray-500">{sesion.zona_tratada || 'Sin zona'}</p>
                    </div>
                    <Badge variant={sesion.estado === 'realizada' ? 'success' : 'info'}>
                      {sesion.estado}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Sin sesiones registradas</p>
            )}
          </CardContent>
        </Card>

        {/* Pagos */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de Pagos</CardTitle>
          </CardHeader>
          <CardContent>
            {historial?.pagos?.length > 0 ? (
              <div className="space-y-3">
                {historial.pagos.slice(0, 5).map((pago: { id: string; monto: number; created_at: string; estado: string; metodo_pago: string }) => (
                  <div key={pago.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{formatearMonto(pago.monto)}</p>
                      <p className="text-sm text-gray-500">
                        {formatearFecha(pago.created_at)} - {pago.metodo_pago}
                      </p>
                    </div>
                    <Badge variant={pago.estado === 'pagado' ? 'success' : 'warning'}>
                      {pago.estado}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Sin pagos registrados</p>
            )}
          </CardContent>
        </Card>

        {/* Fotos */}
        <Card>
          <CardHeader>
            <CardTitle>Galería de Fotos</CardTitle>
          </CardHeader>
          <CardContent>
            {historial?.fotos?.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {historial.fotos.slice(0, 6).map((foto: { id: string; url: string; tipo: string }) => (
                  <div key={foto.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img src={foto.url} alt={foto.tipo} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Sin fotos registradas</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
