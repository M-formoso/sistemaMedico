import api from '@/lib/axios'
import type { ResumenDia, Alertas, EstadisticasMes } from '@/types'

export const dashboardService = {
  obtenerResumenDia: async (): Promise<ResumenDia> => {
    const { data } = await api.get('/dashboard/resumen-dia')
    return data
  },

  obtenerAlertas: async (): Promise<Alertas> => {
    const { data } = await api.get('/dashboard/alertas')
    return data
  },

  obtenerEstadisticasMes: async (): Promise<EstadisticasMes> => {
    const { data } = await api.get('/dashboard/estadisticas-mes')
    return data
  },
}
