import { useQuery } from '@tanstack/react-query'
import { Camera, Calendar, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { pacientesService } from '@/services/pacientesService'
import { formatearFecha } from '@/utils/formatters'
import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface FotosTabProps {
  pacienteId: number
}

interface Foto {
  id: number
  url: string
  tipo: string
  descripcion?: string
  fecha?: string
  created_at?: string
}

export function FotosTab({ pacienteId }: FotosTabProps) {
  const [fotoAmpliada, setFotoAmpliada] = useState<Foto | null>(null)

  const { data: historial, isLoading } = useQuery({
    queryKey: ['pacientes', pacienteId, 'historial'],
    queryFn: () => pacientesService.obtenerHistorial(pacienteId),
  })

  const fotos: Foto[] = historial?.fotos || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
      </div>
    )
  }

  // Agrupar por tipo
  const fotosPorTipo: Record<string, Foto[]> = {}
  fotos.forEach((foto) => {
    const tipo = foto.tipo || 'otros'
    if (!fotosPorTipo[tipo]) {
      fotosPorTipo[tipo] = []
    }
    fotosPorTipo[tipo].push(foto)
  })

  const tipoLabels: Record<string, string> = {
    antes: 'Antes del Tratamiento',
    despues: 'Después del Tratamiento',
    durante: 'Durante el Tratamiento',
    seguimiento: 'Seguimiento',
    otros: 'Otras Fotos',
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Galería de Fotos</h3>
        <p className="text-sm text-gray-500">
          Las fotos se pueden agregar desde la sección de Sesiones/Turnos
        </p>
      </div>

      {fotos.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            <Camera className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p>No hay fotos registradas para este paciente.</p>
            <p className="text-sm mt-1">
              Las fotos se agregan desde la vista de sesiones/turnos.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(fotosPorTipo).map(([tipo, fotosDelTipo]) => (
            <div key={tipo}>
              <h4 className="font-medium text-gray-700 mb-3">
                {tipoLabels[tipo] || tipo}
                <Badge variant="secondary" className="ml-2">
                  {fotosDelTipo.length}
                </Badge>
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {fotosDelTipo.map((foto) => (
                  <Card
                    key={foto.id}
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setFotoAmpliada(foto)}
                  >
                    <div className="aspect-square relative">
                      <img
                        src={foto.url}
                        alt={foto.descripcion || foto.tipo}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                        <Eye className="h-8 w-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    {(foto.fecha || foto.created_at) && (
                      <CardContent className="p-2">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {formatearFecha(foto.fecha || foto.created_at!)}
                        </div>
                        {foto.descripcion && (
                          <p className="text-xs text-gray-600 mt-1 truncate">
                            {foto.descripcion}
                          </p>
                        )}
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comparación Antes/Después */}
      {fotosPorTipo['antes']?.length > 0 && fotosPorTipo['despues']?.length > 0 && (
        <div className="mt-8">
          <h4 className="font-medium text-gray-700 mb-3">Comparación Antes / Después</h4>
          <div className="grid grid-cols-2 gap-4">
            <Card className="overflow-hidden">
              <div className="bg-gray-100 px-3 py-1 text-center text-sm font-medium">
                ANTES
              </div>
              <div className="aspect-square">
                <img
                  src={fotosPorTipo['antes'][0].url}
                  alt="Antes"
                  className="w-full h-full object-cover"
                />
              </div>
            </Card>
            <Card className="overflow-hidden">
              <div className="bg-primary-100 px-3 py-1 text-center text-sm font-medium text-primary-700">
                DESPUÉS
              </div>
              <div className="aspect-square">
                <img
                  src={fotosPorTipo['despues'][0].url}
                  alt="Después"
                  className="w-full h-full object-cover"
                />
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Dialog para foto ampliada */}
      <Dialog open={!!fotoAmpliada} onOpenChange={() => setFotoAmpliada(null)}>
        <DialogContent className="max-w-4xl p-0">
          {fotoAmpliada && (
            <div>
              <img
                src={fotoAmpliada.url}
                alt={fotoAmpliada.descripcion || fotoAmpliada.tipo}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              <div className="p-4 bg-white">
                <div className="flex items-center justify-between">
                  <Badge>{fotoAmpliada.tipo}</Badge>
                  {(fotoAmpliada.fecha || fotoAmpliada.created_at) && (
                    <span className="text-sm text-gray-500">
                      {formatearFecha(fotoAmpliada.fecha || fotoAmpliada.created_at!)}
                    </span>
                  )}
                </div>
                {fotoAmpliada.descripcion && (
                  <p className="mt-2 text-gray-600">{fotoAmpliada.descripcion}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
