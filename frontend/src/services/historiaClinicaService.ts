import api from '@/lib/axios'

// Evoluciones
export interface Evolucion {
  id: number
  paciente_id: number
  fecha: string
  titulo?: string
  descripcion: string
  peso?: string
  tension_arterial?: string
  created_at?: string
}

export interface EvolucionCreate {
  paciente_id: number
  fecha: string
  titulo?: string
  descripcion: string
  peso?: string
  tension_arterial?: string
}

// Estudios
export interface Estudio {
  id: number
  paciente_id: number
  nombre: string
  descripcion?: string
  indicaciones?: string
  fecha_solicitud: string
  fecha_realizacion?: string
  estado: 'pendiente' | 'solicitado' | 'realizado' | 'cancelado'
  archivo_url?: string
  created_at?: string
}

export interface EstudioCreate {
  paciente_id: number
  nombre: string
  descripcion?: string
  indicaciones?: string
  fecha_solicitud: string
  estado?: string
}

// Baterías de estudios
export interface BateriaEstudios {
  id: number
  nombre: string
  descripcion?: string
  estudios_incluidos: string[]
  activo: boolean
  created_at?: string
}

// Resultados
export interface Resultado {
  id: number
  paciente_id: number
  estudio_id?: number
  nombre: string
  descripcion?: string
  fecha: string
  archivo_url?: string
  tipo_archivo?: string
  notas?: string
  created_at?: string
}

export interface ResultadoCreate {
  paciente_id: number
  estudio_id?: number
  nombre: string
  descripcion?: string
  fecha: string
  archivo_url?: string
  tipo_archivo?: string
  notas?: string
}

// Consentimientos
export interface Consentimiento {
  id: number
  paciente_id: number
  tratamiento_id?: number
  tipo: 'tratamiento' | 'datos_personales' | 'fotografias' | 'procedimiento' | 'anestesia' | 'otro'
  nombre: string
  descripcion?: string
  archivo_url?: string
  fecha_firma?: string
  firmado: boolean
  fecha_vencimiento?: string
  created_at?: string
}

export interface ConsentimientoCreate {
  paciente_id: number
  tratamiento_id?: number
  tipo?: string
  nombre: string
  descripcion?: string
  archivo_url?: string
  firmado?: boolean
  fecha_vencimiento?: string
}

// Service
export const historiaClinicaService = {
  // Evoluciones
  listarEvoluciones: async (pacienteId: number): Promise<Evolucion[]> => {
    const { data } = await api.get(`/evoluciones/paciente/${pacienteId}`)
    return data
  },

  crearEvolucion: async (payload: EvolucionCreate): Promise<Evolucion> => {
    const { data } = await api.post('/evoluciones/', payload)
    return data
  },

  actualizarEvolucion: async (id: number, payload: Partial<EvolucionCreate>): Promise<Evolucion> => {
    const { data } = await api.put(`/evoluciones/${id}`, payload)
    return data
  },

  eliminarEvolucion: async (id: number): Promise<void> => {
    await api.delete(`/evoluciones/${id}`)
  },

  // Estudios
  listarEstudios: async (pacienteId: number, estado?: string): Promise<Estudio[]> => {
    const params = estado ? { estado } : {}
    const { data } = await api.get(`/estudios/paciente/${pacienteId}`, { params })
    return data
  },

  crearEstudio: async (payload: EstudioCreate): Promise<Estudio> => {
    const { data } = await api.post('/estudios/', payload)
    return data
  },

  crearEstudiosDesdeBateria: async (pacienteId: number, bateriaId: number, fechaSolicitud: string): Promise<Estudio[]> => {
    const { data } = await api.post(`/estudios/desde-bateria/${pacienteId}`, null, {
      params: { bateria_id: bateriaId, fecha_solicitud: fechaSolicitud }
    })
    return data
  },

  actualizarEstudio: async (id: number, payload: Partial<EstudioCreate>): Promise<Estudio> => {
    const { data } = await api.put(`/estudios/${id}`, payload)
    return data
  },

  eliminarEstudio: async (id: number): Promise<void> => {
    await api.delete(`/estudios/${id}`)
  },

  // Baterías
  listarBaterias: async (): Promise<BateriaEstudios[]> => {
    const { data } = await api.get('/estudios/baterias/')
    return data
  },

  crearBateria: async (payload: Omit<BateriaEstudios, 'id' | 'created_at'>): Promise<BateriaEstudios> => {
    const { data } = await api.post('/estudios/baterias/', payload)
    return data
  },

  // Resultados
  listarResultados: async (pacienteId: number): Promise<Resultado[]> => {
    const { data } = await api.get(`/resultados/paciente/${pacienteId}`)
    return data
  },

  crearResultado: async (payload: ResultadoCreate): Promise<Resultado> => {
    const { data } = await api.post('/resultados/', payload)
    return data
  },

  actualizarResultado: async (id: number, payload: Partial<ResultadoCreate>): Promise<Resultado> => {
    const { data } = await api.put(`/resultados/${id}`, payload)
    return data
  },

  eliminarResultado: async (id: number): Promise<void> => {
    await api.delete(`/resultados/${id}`)
  },

  // Consentimientos
  listarConsentimientos: async (pacienteId: number, firmado?: boolean): Promise<Consentimiento[]> => {
    const params: { firmado?: boolean } = {}
    if (firmado !== undefined) params.firmado = firmado
    const { data } = await api.get(`/consentimientos/paciente/${pacienteId}`, { params })
    return data
  },

  crearConsentimiento: async (payload: ConsentimientoCreate): Promise<Consentimiento> => {
    const { data } = await api.post('/consentimientos/', payload)
    return data
  },

  firmarConsentimiento: async (id: number): Promise<Consentimiento> => {
    const { data } = await api.post(`/consentimientos/${id}/firmar`)
    return data
  },

  eliminarConsentimiento: async (id: number): Promise<void> => {
    await api.delete(`/consentimientos/${id}`)
  },
}
