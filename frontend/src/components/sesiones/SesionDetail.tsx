import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, Clock, User, Stethoscope, DollarSign, Package, FileText, Edit, CheckCircle, XCircle } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { sesionesService } from '@/services/sesionesService'
import { toast } from '@/hooks/useToast'
import type { Sesion, EstadoSesion } from '@/types'

const estadoColors: Record<EstadoSesion, string> = {
  programada: 'bg-blue-100 text-blue-800',
  confirmada: 'bg-green-100 text-green-800',
  en_curso: 'bg-yellow-100 text-yellow-800',
  completada: 'bg-gray-100 text-gray-800',
  cancelada: 'bg-red-100 text-red-800',
  no_asistio: 'bg-orange-100 text-orange-800',
}

const estadoLabels: Record<EstadoSesion, string> = {
  programada: 'Programada',
  confirmada: 'Confirmada',
  en_curso: 'En Curso',
  completada: 'Completada',
  cancelada: 'Cancelada',
  no_asistio: 'No Asistió',
}

interface SesionDetailProps {
  sesion: Sesion
  onEdit?: () => void
  onClose?: () => void
}

export function SesionDetail({ sesion, onEdit, onClose }: SesionDetailProps) {
  const queryClient = useQueryClient()

  const cambiarEstadoMutation = useMutation({
    mutationFn: (nuevoEstado: EstadoSesion) =>
      sesionesService.cambiarEstado(sesion.id, nuevoEstado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sesiones'] })
      toast({
        title: 'Estado actualizado',
        variant: 'success',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "EEEE d 'de' MMMM, yyyy", { locale: es })
  }

  const formatTime = (timeStr: string) => {
    return format(new Date(`2000-01-01T${timeStr}`), 'HH:mm')
  }

  const calcularPrecioFinal = () => {
    if (!sesion.precio_cobrado) return 0
    const descuento = sesion.descuento_aplicado || 0
    return sesion.precio_cobrado * (1 - descuento / 100)
  }

  return (
    <div className="space-y-6">
      {/* Header con estado */}
      <div className="flex items-center justify-between">
        <Badge className={`${estadoColors[sesion.estado]} text-sm px-3 py-1`}>
          {estadoLabels[sesion.estado]}
        </Badge>
        <div className="flex gap-2">
          {sesion.estado === 'programada' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => cambiarEstadoMutation.mutate('confirmada')}
              disabled={cambiarEstadoMutation.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Confirmar
            </Button>
          )}
          {sesion.estado === 'confirmada' && (
            <Button
              size="sm"
              onClick={() => cambiarEstadoMutation.mutate('en_curso')}
              disabled={cambiarEstadoMutation.isPending}
            >
              Iniciar Sesión
            </Button>
          )}
          {sesion.estado === 'en_curso' && (
            <Button
              size="sm"
              onClick={() => cambiarEstadoMutation.mutate('completada')}
              disabled={cambiarEstadoMutation.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Completar
            </Button>
          )}
          {(sesion.estado === 'programada' || sesion.estado === 'confirmada') && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => cambiarEstadoMutation.mutate('cancelada')}
              disabled={cambiarEstadoMutation.isPending}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Info Principal */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Información de la Sesión
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary-100 rounded-full p-2">
                <Calendar className="h-4 w-4 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Fecha</p>
                <p className="font-medium">{formatDate(sesion.fecha)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-primary-100 rounded-full p-2">
                <Clock className="h-4 w-4 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Horario</p>
                <p className="font-medium">
                  {sesion.hora_inicio && formatTime(sesion.hora_inicio)}
                  {sesion.hora_fin && ` - ${formatTime(sesion.hora_fin)}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-primary-100 rounded-full p-2">
                <User className="h-4 w-4 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Paciente</p>
                <p className="font-medium">{sesion.paciente?.nombre_completo || 'No especificado'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-primary-100 rounded-full p-2">
                <Stethoscope className="h-4 w-4 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Tratamiento</p>
                <p className="font-medium">{sesion.tratamiento?.nombre || 'No especificado'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información Financiera */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Información Financiera
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Precio de Lista</span>
              <span className="font-medium">
                ${sesion.precio_cobrado?.toLocaleString('es-AR') || '0'}
              </span>
            </div>

            {sesion.descuento_aplicado && sesion.descuento_aplicado > 0 && (
              <div className="flex justify-between items-center text-green-600">
                <span>Descuento ({sesion.descuento_aplicado}%)</span>
                <span>
                  -${((sesion.precio_cobrado || 0) * sesion.descuento_aplicado / 100).toLocaleString('es-AR')}
                </span>
              </div>
            )}

            <div className="border-t pt-3 flex justify-between items-center">
              <span className="font-semibold">Total</span>
              <span className="text-lg font-bold text-primary-600">
                ${calcularPrecioFinal().toLocaleString('es-AR')}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Materiales Utilizados */}
      {sesion.materiales && sesion.materiales.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Materiales Utilizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sesion.materiales.map((mat) => (
                <div key={mat.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">{mat.material?.nombre}</p>
                    <p className="text-sm text-gray-500">
                      Cantidad: {mat.cantidad} {mat.material?.unidad_medida}
                    </p>
                  </div>
                  {mat.costo_unitario && (
                    <div className="text-right">
                      <p className="font-medium">
                        ${(mat.cantidad * mat.costo_unitario).toLocaleString('es-AR')}
                      </p>
                      <p className="text-sm text-gray-500">
                        ${mat.costo_unitario.toLocaleString('es-AR')} c/u
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notas */}
      {(sesion.notas || sesion.notas_internas) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sesion.notas && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Notas Generales</p>
                <p className="text-gray-700">{sesion.notas}</p>
              </div>
            )}
            {sesion.notas_internas && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Notas Internas (solo admin)
                </p>
                <p className="text-gray-700 bg-yellow-50 p-3 rounded-md border border-yellow-200">
                  {sesion.notas_internas}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Acciones */}
      <div className="flex justify-end gap-3">
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        )}
        {onEdit && (
          <Button onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Editar Sesión
          </Button>
        )}
      </div>
    </div>
  )
}
