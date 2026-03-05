import api from '@/lib/axios'
import type { Material, MaterialCreate, MaterialUpdate, MovimientoStock, MovimientoStockCreate } from '@/types'

interface ListarParams {
  skip?: number
  limit?: number
  activo?: boolean
  buscar?: string
}

export const materialesService = {
  listar: async (params: ListarParams = {}): Promise<Material[]> => {
    const { data } = await api.get('/materiales', { params })
    return data
  },

  obtenerPorId: async (id: number): Promise<Material> => {
    const { data } = await api.get(`/materiales/${id}`)
    return data
  },

  crear: async (payload: MaterialCreate): Promise<Material> => {
    const { data } = await api.post('/materiales', payload)
    return data
  },

  actualizar: async (id: number, payload: MaterialUpdate): Promise<Material> => {
    const { data } = await api.put(`/materiales/${id}`, payload)
    return data
  },

  eliminar: async (id: number): Promise<void> => {
    await api.delete(`/materiales/${id}`)
  },

  obtenerStockBajo: async (): Promise<Material[]> => {
    const { data } = await api.get('/materiales/stock-bajo')
    return data
  },

  obtenerValorTotal: async () => {
    const { data } = await api.get('/materiales/valor-total')
    return data
  },

  registrarMovimiento: async (payload: MovimientoStockCreate): Promise<MovimientoStock> => {
    const { data } = await api.post('/materiales/movimiento', payload)
    return data
  },

  obtenerMovimientos: async (id: number, skip = 0, limit = 50): Promise<MovimientoStock[]> => {
    const { data } = await api.get(`/materiales/${id}/movimientos`, {
      params: { skip, limit }
    })
    return data
  },
}
