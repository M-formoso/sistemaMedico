import api from '@/lib/axios'

export interface Profesional {
  id: number
  nombre: string
  apellido: string
  especialidad?: string
  matricula?: string
  telefono?: string
  email?: string
  direccion?: string
  duracion_turno_default: number
  color_agenda: string
  porcentaje_comision: number
  notas?: string
  activo: boolean
  created_at: string
  updated_at: string
}

export interface ProfesionalCreate {
  nombre: string
  apellido: string
  especialidad?: string
  matricula?: string
  telefono?: string
  email?: string
  direccion?: string
  duracion_turno_default?: number
  color_agenda?: string
  porcentaje_comision?: number
  notas?: string
}

export interface ProfesionalUpdate extends Partial<ProfesionalCreate> {
  activo?: boolean
}

export const profesionalesService = {
  listar: async (params?: { activo?: boolean; especialidad?: string; buscar?: string }) => {
    const response = await api.get<Profesional[]>('/profesionales/', { params })
    return response.data
  },

  listarActivos: async () => {
    const response = await api.get<Profesional[]>('/profesionales/activos')
    return response.data
  },

  listarEspecialidades: async () => {
    const response = await api.get<string[]>('/profesionales/especialidades')
    return response.data
  },

  obtenerPorId: async (id: number) => {
    const response = await api.get<Profesional>(`/profesionales/${id}`)
    return response.data
  },

  crear: async (data: ProfesionalCreate) => {
    const response = await api.post<Profesional>('/profesionales/', data)
    return response.data
  },

  actualizar: async (id: number, data: ProfesionalUpdate) => {
    const response = await api.put<Profesional>(`/profesionales/${id}`, data)
    return response.data
  },

  eliminar: async (id: number) => {
    await api.delete(`/profesionales/${id}`)
  },
}
