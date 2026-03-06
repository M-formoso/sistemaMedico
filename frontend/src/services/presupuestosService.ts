import api from '@/lib/axios'

export interface ItemPresupuesto {
  descripcion: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export interface Presupuesto {
  id: number
  paciente_id: number
  numero: string
  fecha: string
  valido_hasta?: string
  items: ItemPresupuesto[]
  subtotal: number
  descuento_porcentaje?: number
  descuento_monto?: number
  total: number
  notas?: string
  condiciones?: string
  estado: 'borrador' | 'enviado' | 'aprobado' | 'rechazado' | 'vencido'
  fecha_respuesta?: string
  created_at?: string
}

export interface PresupuestoCreate {
  paciente_id: number
  fecha: string
  valido_hasta?: string
  items: ItemPresupuesto[]
  subtotal: number
  descuento_porcentaje?: number
  descuento_monto?: number
  total: number
  notas?: string
  condiciones?: string
  estado?: string
}

export const presupuestosService = {
  listar: async (params?: { estado?: string; desde?: string; hasta?: string }): Promise<Presupuesto[]> => {
    const { data } = await api.get('/presupuestos/', { params })
    return data
  },

  listarPorPaciente: async (pacienteId: number, estado?: string): Promise<Presupuesto[]> => {
    const params = estado ? { estado } : {}
    const { data } = await api.get(`/presupuestos/paciente/${pacienteId}`, { params })
    return data
  },

  obtenerPorId: async (id: number): Promise<Presupuesto> => {
    const { data } = await api.get(`/presupuestos/${id}`)
    return data
  },

  obtenerPorNumero: async (numero: string): Promise<Presupuesto> => {
    const { data } = await api.get(`/presupuestos/numero/${numero}`)
    return data
  },

  crear: async (payload: PresupuestoCreate): Promise<Presupuesto> => {
    const { data } = await api.post('/presupuestos/', payload)
    return data
  },

  actualizar: async (id: number, payload: Partial<PresupuestoCreate>): Promise<Presupuesto> => {
    const { data } = await api.put(`/presupuestos/${id}`, payload)
    return data
  },

  enviar: async (id: number): Promise<Presupuesto> => {
    const { data } = await api.post(`/presupuestos/${id}/enviar`)
    return data
  },

  aprobar: async (id: number): Promise<Presupuesto> => {
    const { data } = await api.post(`/presupuestos/${id}/aprobar`)
    return data
  },

  rechazar: async (id: number): Promise<Presupuesto> => {
    const { data } = await api.post(`/presupuestos/${id}/rechazar`)
    return data
  },

  eliminar: async (id: number): Promise<void> => {
    await api.delete(`/presupuestos/${id}`)
  },
}
