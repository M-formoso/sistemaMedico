import api from '@/lib/axios'

export type DiaSemana = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado'
export type FrecuenciaTurno = 'semanal' | 'quincenal' | 'mensual'

export interface TurnoRecurrente {
  id: number
  paciente_id: number
  tratamiento_id?: number
  profesional_id?: number
  dia_semana: DiaSemana
  hora: string
  duracion_minutos: number
  frecuencia: FrecuenciaTurno
  fecha_inicio: string
  fecha_fin?: string
  activo: boolean
  notas?: string
  created_at?: string
  paciente_nombre?: string
  tratamiento_nombre?: string
  profesional_nombre?: string
}

export interface TurnoRecurrenteCreate {
  paciente_id: number
  tratamiento_id?: number
  profesional_id?: number
  dia_semana: DiaSemana
  hora: string
  duracion_minutos?: number
  frecuencia?: FrecuenciaTurno
  fecha_inicio: string
  fecha_fin?: string
  activo?: boolean
  notas?: string
}

export const turnosRecurrentesService = {
  listar: async (params?: { activo?: boolean; dia_semana?: DiaSemana; profesional_id?: number }): Promise<TurnoRecurrente[]> => {
    const { data } = await api.get('/turnos-recurrentes/', { params })
    return data
  },

  listarPorPaciente: async (pacienteId: number, activo?: boolean): Promise<TurnoRecurrente[]> => {
    const params = activo !== undefined ? { activo } : {}
    const { data } = await api.get(`/turnos-recurrentes/paciente/${pacienteId}`, { params })
    return data
  },

  obtenerPorId: async (id: number): Promise<TurnoRecurrente> => {
    const { data } = await api.get(`/turnos-recurrentes/${id}`)
    return data
  },

  crear: async (payload: TurnoRecurrenteCreate): Promise<TurnoRecurrente> => {
    const { data } = await api.post('/turnos-recurrentes/', payload)
    return data
  },

  actualizar: async (id: number, payload: Partial<TurnoRecurrenteCreate>): Promise<TurnoRecurrente> => {
    const { data } = await api.put(`/turnos-recurrentes/${id}`, payload)
    return data
  },

  desactivar: async (id: number): Promise<TurnoRecurrente> => {
    const { data } = await api.post(`/turnos-recurrentes/${id}/desactivar`)
    return data
  },

  eliminar: async (id: number): Promise<void> => {
    await api.delete(`/turnos-recurrentes/${id}`)
  },

  generarSesiones: async (id: number, semanas: number = 4): Promise<{ mensaje: string; sesiones: { fecha: string; hora: string }[] }> => {
    const { data } = await api.post(`/turnos-recurrentes/${id}/generar-sesiones`, null, {
      params: { semanas }
    })
    return data
  },
}
