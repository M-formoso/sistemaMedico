import api from '@/lib/axios'
import type { Egreso, EgresoCreate, EgresoUpdate, CategoriaEgreso } from '@/types'

interface ListarParams {
  skip?: number
  limit?: number
  categoria?: CategoriaEgreso
  fecha_inicio?: string
  fecha_fin?: string
}

export const egresosService = {
  listar: async (params: ListarParams = {}): Promise<Egreso[]> => {
    const { data } = await api.get('/egresos', { params })
    return data
  },

  obtenerPorId: async (id: number): Promise<Egreso> => {
    const { data } = await api.get(`/egresos/${id}`)
    return data
  },

  crear: async (payload: EgresoCreate): Promise<Egreso> => {
    const { data } = await api.post('/egresos', payload)
    return data
  },

  actualizar: async (id: number, payload: EgresoUpdate): Promise<Egreso> => {
    const { data } = await api.put(`/egresos/${id}`, payload)
    return data
  },

  eliminar: async (id: number): Promise<void> => {
    await api.delete(`/egresos/${id}`)
  },
}
