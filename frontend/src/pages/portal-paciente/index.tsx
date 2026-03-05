import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import { formatearMonto, formatearFecha } from '@/utils/formatters'

export default function PortalHome() {
  const { data: historial, isLoading: loadingHistorial } = useQuery({
    queryKey: ['portal', 'mi-historial'],
    queryFn: async () => {
      const { data } = await api.get('/portal/mi-historial')
      return data
    },
  })

  const { data: sesiones, isLoading: loadingSesiones } = useQuery({
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

  return (
    <div className="space-y-6">
      {/* Bienvenida */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Mi Información</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Nombre</p>
            <p className="font-medium">{historial?.nombre}</p>
          </div>
          {historial?.fecha_nacimiento && (
            <div>
              <p className="text-sm text-gray-500">Fecha de Nacimiento</p>
              <p className="font-medium">{formatearFecha(historial.fecha_nacimiento)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Saldo Pendiente */}
      {saldo?.saldo_pendiente > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-yellow-800">
            Tenés un saldo pendiente de <strong>{formatearMonto(saldo.saldo_pendiente)}</strong>
          </p>
        </div>
      )}

      {/* Últimas Sesiones */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Mis Últimas Sesiones</h2>
        {loadingSesiones ? (
          <p className="text-gray-500">Cargando...</p>
        ) : sesiones?.length === 0 ? (
          <p className="text-gray-500">No tenés sesiones registradas.</p>
        ) : (
          <div className="space-y-3">
            {sesiones?.slice(0, 5).map((sesion: { id: string; fecha: string; zona_tratada: string; estado: string }) => (
              <div key={sesion.id} className="flex justify-between items-center py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{formatearFecha(sesion.fecha)}</p>
                  <p className="text-sm text-gray-500">{sesion.zona_tratada || 'Sin zona especificada'}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  sesion.estado === 'realizada' ? 'bg-green-100 text-green-700' :
                  sesion.estado === 'programada' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {sesion.estado}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historial Clínico */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Historial Clínico</h2>
        <div className="space-y-4">
          {historial?.antecedentes && (
            <div>
              <p className="text-sm text-gray-500">Antecedentes</p>
              <p className="text-gray-700">{historial.antecedentes}</p>
            </div>
          )}
          {historial?.alergias && (
            <div>
              <p className="text-sm text-gray-500">Alergias</p>
              <p className="text-gray-700">{historial.alergias}</p>
            </div>
          )}
          {historial?.medicacion_actual && (
            <div>
              <p className="text-sm text-gray-500">Medicación Actual</p>
              <p className="text-gray-700">{historial.medicacion_actual}</p>
            </div>
          )}
          {!historial?.antecedentes && !historial?.alergias && !historial?.medicacion_actual && (
            <p className="text-gray-500">No hay información clínica registrada.</p>
          )}
        </div>
      </div>
    </div>
  )
}
