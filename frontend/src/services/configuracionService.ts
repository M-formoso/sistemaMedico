import api from '@/lib/axios'

export interface Configuracion {
  id: number
  clave: string
  valor?: string
  descripcion?: string
  tipo: string
  created_at: string
  updated_at: string
}

export interface HorarioAtencion {
  id: number
  dia_semana: number
  hora_inicio: string
  hora_fin: string
  activo: boolean
  created_at: string
  updated_at: string
}

export interface ListaEspera {
  id: number
  paciente_id: number
  tratamiento_id?: number
  profesional_id?: number
  fecha_preferida?: string
  notas?: string
  prioridad: number
  atendido: boolean
  created_at: string
  updated_at: string
}

export const configuracionService = {
  // Configuraciones
  listar: async () => {
    const response = await api.get<Configuracion[]>('/configuracion/')
    return response.data
  },

  obtener: async (clave: string) => {
    const response = await api.get<Configuracion>(`/configuracion/${clave}`)
    return response.data
  },

  crear: async (data: { clave: string; valor?: string; descripcion?: string; tipo?: string }) => {
    const response = await api.post<Configuracion>('/configuracion/', data)
    return response.data
  },

  actualizar: async (clave: string, data: { valor?: string; descripcion?: string }) => {
    const response = await api.put<Configuracion>(`/configuracion/${clave}`, data)
    return response.data
  },

  // Horarios
  listarHorarios: async () => {
    const response = await api.get<HorarioAtencion[]>('/configuracion/horarios/')
    return response.data
  },

  crearHorario: async (data: { dia_semana: number; hora_inicio: string; hora_fin: string }) => {
    const response = await api.post<HorarioAtencion>('/configuracion/horarios/', data)
    return response.data
  },

  actualizarHorario: async (id: number, data: Partial<HorarioAtencion>) => {
    const response = await api.put<HorarioAtencion>(`/configuracion/horarios/${id}`, data)
    return response.data
  },

  eliminarHorario: async (id: number) => {
    await api.delete(`/configuracion/horarios/${id}`)
  },

  // Lista de espera
  listarListaEspera: async (params?: { atendido?: boolean }) => {
    const response = await api.get<ListaEspera[]>('/configuracion/lista-espera/', { params })
    return response.data
  },

  contarListaEspera: async () => {
    const response = await api.get<{ count: number }>('/configuracion/lista-espera/count')
    return response.data
  },

  agregarListaEspera: async (data: {
    paciente_id: number
    tratamiento_id?: number
    profesional_id?: number
    fecha_preferida?: string
    notas?: string
    prioridad?: number
  }) => {
    const response = await api.post<ListaEspera>('/configuracion/lista-espera/', data)
    return response.data
  },

  actualizarListaEspera: async (id: number, data: Partial<ListaEspera>) => {
    const response = await api.put<ListaEspera>(`/configuracion/lista-espera/${id}`, data)
    return response.data
  },

  eliminarListaEspera: async (id: number) => {
    await api.delete(`/configuracion/lista-espera/${id}`)
  },
}
