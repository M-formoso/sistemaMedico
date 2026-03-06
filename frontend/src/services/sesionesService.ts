import api from '@/lib/axios'
import type { Sesion, SesionCreate, SesionUpdate, MaterialUsado, EstadoSesion } from '@/types'

interface ListarParams {
  skip?: number
  limit?: number
  paciente_id?: number
  estado?: EstadoSesion
  fecha?: string
  fecha_desde?: string
  fecha_hasta?: string
  fecha_inicio?: string
  fecha_fin?: string
}

export const sesionesService = {
  listar: async (params: ListarParams = {}): Promise<Sesion[]> => {
    const { data } = await api.get('/sesiones/', { params })
    return data
  },

  obtenerPorId: async (id: number): Promise<Sesion> => {
    const { data } = await api.get(`/sesiones/${id}`)
    return data
  },

  crear: async (payload: SesionCreate): Promise<Sesion> => {
    const { data } = await api.post('/sesiones/', payload)
    return data
  },

  actualizar: async (id: number, payload: SesionUpdate): Promise<Sesion> => {
    const { data } = await api.put(`/sesiones/${id}`, payload)
    return data
  },

  eliminar: async (id: number): Promise<void> => {
    await api.delete(`/sesiones/${id}`)
  },

  cambiarEstado: async (id: number, estado: EstadoSesion): Promise<Sesion> => {
    const { data } = await api.patch(`/sesiones/${id}/estado`, { estado })
    return data
  },

  asignarMateriales: async (id: number, materiales: MaterialUsado[]): Promise<Sesion> => {
    const { data } = await api.post(`/sesiones/${id}/materiales`, { materiales })
    return data
  },

  obtenerAgendaHoy: async (): Promise<Sesion[]> => {
    const { data } = await api.get('/sesiones/agenda/hoy')
    return data
  },
}
