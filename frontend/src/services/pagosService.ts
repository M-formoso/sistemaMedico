import api from '@/lib/axios'
import type { Pago, PagoCreate, PagoUpdate } from '@/types'

interface ListarParams {
  skip?: number
  limit?: number
  paciente_id?: number
  fecha_inicio?: string
  fecha_fin?: string
}

export const pagosService = {
  listar: async (params: ListarParams = {}): Promise<Pago[]> => {
    const { data } = await api.get('/pagos', { params })
    return data
  },

  obtenerPorId: async (id: number): Promise<Pago> => {
    const { data } = await api.get(`/pagos/${id}`)
    return data
  },

  crear: async (payload: PagoCreate): Promise<Pago> => {
    const { data } = await api.post('/pagos', payload)
    return data
  },

  actualizar: async (id: number, payload: PagoUpdate): Promise<Pago> => {
    const { data } = await api.put(`/pagos/${id}`, payload)
    return data
  },

  eliminar: async (id: number): Promise<void> => {
    await api.delete(`/pagos/${id}`)
  },

  generarRecibo: async (id: number) => {
    const { data } = await api.get(`/pagos/${id}/recibo`)
    return data
  },
}
