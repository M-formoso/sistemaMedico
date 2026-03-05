import api from '@/lib/axios'
import type { Tratamiento, TratamientoCreate, TratamientoUpdate } from '@/types'

interface ListarParams {
  skip?: number
  limit?: number
  solo_activos?: boolean
}

export const tratamientosService = {
  listar: async (params: ListarParams = {}): Promise<Tratamiento[]> => {
    const { data } = await api.get('/tratamientos', { params })
    return data
  },

  obtenerPorId: async (id: number): Promise<Tratamiento> => {
    const { data } = await api.get(`/tratamientos/${id}`)
    return data
  },

  crear: async (payload: TratamientoCreate): Promise<Tratamiento> => {
    const { data } = await api.post('/tratamientos', payload)
    return data
  },

  actualizar: async (id: number, payload: TratamientoUpdate): Promise<Tratamiento> => {
    const { data } = await api.put(`/tratamientos/${id}`, payload)
    return data
  },

  eliminar: async (id: number): Promise<void> => {
    await api.delete(`/tratamientos/${id}`)
  },
}
