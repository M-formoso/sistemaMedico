import api from '@/lib/axios'
import type { Paciente, PacienteCreate, PacienteUpdate } from '@/types'

interface ListarParams {
  skip?: number
  limit?: number
  estado?: string
  buscar?: string
}

export const pacientesService = {
  listar: async (params: ListarParams = {}): Promise<Paciente[]> => {
    const { data } = await api.get('/pacientes/', { params })
    return data
  },

  obtenerPorId: async (id: number | string): Promise<Paciente> => {
    const { data } = await api.get(`/pacientes/${id}`)
    return data
  },

  crear: async (payload: PacienteCreate): Promise<Paciente> => {
    const { data } = await api.post('/pacientes/', payload)
    return data
  },

  actualizar: async (id: number | string, payload: PacienteUpdate): Promise<Paciente> => {
    const { data } = await api.put(`/pacientes/${id}`, payload)
    return data
  },

  eliminar: async (id: number | string): Promise<void> => {
    await api.delete(`/pacientes/${id}`)
  },

  obtenerHistorial: async (id: number | string) => {
    const { data } = await api.get(`/pacientes/${id}/historial`)
    return data
  },

  crearCredenciales: async (id: number | string, email: string, password: string) => {
    const { data } = await api.post(`/pacientes/${id}/credenciales`, { email, password })
    return data
  },
}
