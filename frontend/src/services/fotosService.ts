import api from '@/lib/axios'

export interface Foto {
  id: number
  url: string
  tipo: 'antes' | 'despues' | 'evolucion'
  zona?: string
  fecha?: string
  visible_paciente: boolean
}

export interface SubirFotoParams {
  pacienteId: number
  sesionId?: number
  tipo: 'antes' | 'despues' | 'evolucion'
  zona?: string
  file: File
}

export const fotosService = {
  obtenerPorPaciente: async (pacienteId: number, tipo?: string): Promise<Foto[]> => {
    const params = tipo ? { tipo } : {}
    const { data } = await api.get(`/fotos/paciente/${pacienteId}`, { params })
    return data
  },

  subir: async (params: SubirFotoParams): Promise<Foto> => {
    const formData = new FormData()
    formData.append('paciente_id', params.pacienteId.toString())
    formData.append('tipo', params.tipo)
    formData.append('file', params.file)

    if (params.sesionId) {
      formData.append('sesion_id', params.sesionId.toString())
    }
    if (params.zona) {
      formData.append('zona', params.zona)
    }

    const { data } = await api.post('/fotos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return data
  },

  eliminar: async (fotoId: number): Promise<void> => {
    await api.delete(`/fotos/${fotoId}`)
  },

  cambiarVisibilidad: async (fotoId: number, visible: boolean): Promise<void> => {
    await api.put(`/fotos/${fotoId}/visibilidad`, null, { params: { visible } })
  },
}
