import api from '@/lib/axios'

export type RolUsuario = 'administradora' | 'empleado' | 'paciente'

export interface Usuario {
  id: number
  email: string
  nombre: string
  rol: RolUsuario
  paciente_id?: number
  paciente_nombre?: string
  permisos_modulos?: string[]
  activo: boolean
  ultimo_acceso?: string
  created_at: string
  updated_at: string
}

export interface UsuarioCreate {
  email: string
  password: string
  nombre: string
  rol: RolUsuario
  paciente_id?: number
  permisos_modulos?: string[]
}

export interface UsuarioUpdate {
  email?: string
  nombre?: string
  rol?: RolUsuario
  paciente_id?: number
  permisos_modulos?: string[]
  activo?: boolean
}

export interface ModuloInfo {
  modulos: Record<string, string>
  default: string[]
}

export interface ModulosDisponibles {
  paciente: ModuloInfo
  empleado: ModuloInfo
}

interface ListarParams {
  skip?: number
  limit?: number
  rol?: string
  activo?: boolean
  buscar?: string
}

export const usuariosService = {
  listar: async (params: ListarParams = {}): Promise<Usuario[]> => {
    const { data } = await api.get('/usuarios/', { params })
    return data
  },

  obtenerPorId: async (id: number | string): Promise<Usuario> => {
    const { data } = await api.get(`/usuarios/${id}`)
    return data
  },

  crear: async (payload: UsuarioCreate): Promise<Usuario> => {
    const { data } = await api.post('/usuarios/', payload)
    return data
  },

  actualizar: async (id: number | string, payload: UsuarioUpdate): Promise<Usuario> => {
    const { data } = await api.put(`/usuarios/${id}`, payload)
    return data
  },

  resetearPassword: async (id: number | string, password: string): Promise<void> => {
    await api.put(`/usuarios/${id}/reset-password`, { password })
  },

  eliminar: async (id: number | string): Promise<void> => {
    await api.delete(`/usuarios/${id}`)
  },

  obtenerModulosDisponibles: async (): Promise<ModulosDisponibles> => {
    const { data } = await api.get('/usuarios/modulos-disponibles')
    return data
  },
}
