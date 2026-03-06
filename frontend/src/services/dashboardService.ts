import api from '@/lib/axios'
import type { ResumenDia, Alertas, EstadisticasMes } from '@/types'

export interface EstadisticasAvanzadas {
  periodo: {
    inicio: string
    fin: string
  }
  sesiones: {
    total: number
    completadas: number
    canceladas: number
    no_asistio: number
  }
  tasas: {
    asistencia: number
    ausentismo: number
    cancelacion: number
  }
  top_tratamientos: Array<{
    id: number
    nombre: string
    cantidad: number
  }>
  turnos_perdidos: {
    cantidad: number
    monto_estimado: number
  }
  pacientes: {
    total: number
    nuevos_periodo: number
  }
}

export interface ListaEsperaCount {
  total: number
  por_prioridad: {
    urgentes: number
    altas: number
    normales: number
  }
}

export interface FiltrosEstadisticas {
  fecha_inicio?: string
  fecha_fin?: string
  profesional_id?: number
}

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

  obtenerEstadisticasAvanzadas: async (filtros?: FiltrosEstadisticas): Promise<EstadisticasAvanzadas> => {
    const params = new URLSearchParams()
    if (filtros?.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio)
    if (filtros?.fecha_fin) params.append('fecha_fin', filtros.fecha_fin)
    if (filtros?.profesional_id) params.append('profesional_id', String(filtros.profesional_id))

    const { data } = await api.get(`/dashboard/estadisticas-avanzadas?${params.toString()}`)
    return data
  },

  obtenerListaEsperaCount: async (): Promise<ListaEsperaCount> => {
    const { data } = await api.get('/dashboard/lista-espera-count')
    return data
  },
}
