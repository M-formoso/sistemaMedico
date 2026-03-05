// Tipos comunes
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  skip: number
  limit: number
}

// Usuario
export type RolUsuario = 'administradora' | 'paciente'

export interface User {
  id: number
  email: string
  nombre: string
  rol: RolUsuario
  paciente_id?: number
  activo: boolean
  ultimo_acceso?: string
  created_at: string
}

// Paciente
export type EstadoPaciente = 'activo' | 'inactivo' | 'nuevo'

export interface Paciente {
  id: number
  nombre: string
  apellido: string
  nombre_completo: string
  dni?: string
  fecha_nacimiento?: string
  telefono?: string
  email?: string
  direccion?: string
  antecedentes?: string
  alergias?: string
  medicacion_actual?: string
  notas_medicas?: string
  estado: EstadoPaciente
  activo: boolean
  created_at: string
  updated_at: string
}

export interface PacienteCreate {
  nombre: string
  apellido: string
  dni?: string
  fecha_nacimiento?: string
  telefono?: string
  email?: string
  direccion?: string
  antecedentes?: string
  alergias?: string
  medicacion_actual?: string
  notas_medicas?: string
  estado?: EstadoPaciente
}

export interface PacienteUpdate extends Partial<PacienteCreate> {}

// Tratamiento
export interface Tratamiento {
  id: number
  nombre: string
  descripcion?: string
  precio_lista?: number
  duracion_minutos?: number
  zona_corporal?: string
  sesiones_recomendadas?: number
  activo: boolean
  created_at: string
  updated_at: string
}

export interface TratamientoCreate {
  nombre: string
  descripcion?: string
  precio_lista?: number
  duracion_minutos?: number
  zona_corporal?: string
  sesiones_recomendadas?: number
}

export interface TratamientoUpdate extends Partial<TratamientoCreate> {
  activo?: boolean
}

// Sesión
export type EstadoSesion = 'programada' | 'confirmada' | 'en_curso' | 'completada' | 'cancelada' | 'no_asistio'

export interface SesionMaterial {
  id: number
  sesion_id: number
  material_id: number
  cantidad: number
  costo_unitario?: number
  material?: Material
}

export interface Sesion {
  id: number
  paciente_id: number
  tratamiento_id: number
  fecha: string
  hora_inicio?: string
  hora_fin?: string
  estado: EstadoSesion
  precio_cobrado?: number
  descuento_aplicado?: number
  notas?: string
  notas_internas?: string
  paciente?: Paciente
  tratamiento?: Tratamiento
  materiales?: SesionMaterial[]
  created_at: string
  updated_at: string
}

export interface SesionCreate {
  paciente_id: number
  tratamiento_id: number
  fecha: string
  hora_inicio?: string
  hora_fin?: string
  estado?: EstadoSesion
  precio_cobrado?: number
  descuento_aplicado?: number
  notas?: string
  notas_internas?: string
}

export interface SesionUpdate extends Partial<SesionCreate> {}

// Material
export type TipoMovimientoStock = 'entrada' | 'salida' | 'ajuste' | 'uso_sesion'

export interface Material {
  id: number
  nombre: string
  descripcion?: string
  codigo?: string
  unidad_medida: string
  stock_actual: number
  stock_minimo?: number
  precio_costo?: number
  proveedor?: string
  activo: boolean
  created_at: string
  updated_at: string
}

export interface MaterialCreate {
  nombre: string
  descripcion?: string
  codigo?: string
  unidad_medida: string
  stock_actual?: number
  stock_minimo?: number
  precio_costo?: number
  proveedor?: string
}

export interface MaterialUpdate extends Partial<MaterialCreate> {
  activo?: boolean
}

export interface MovimientoStock {
  id: number
  material_id: number
  tipo: TipoMovimientoStock
  cantidad: number
  stock_anterior: number
  stock_nuevo: number
  observaciones?: string
  referencia_tipo?: string
  referencia_id?: number
  created_by?: number
  created_at: string
}

export interface MovimientoStockCreate {
  material_id: number
  tipo: TipoMovimientoStock
  cantidad: number
  observaciones?: string
}

export interface MaterialUsado {
  material_id: number
  cantidad: number
}

// Pago
export type MetodoPago = 'efectivo' | 'transferencia' | 'debito' | 'credito' | 'mercadopago'

export interface Pago {
  id: number
  paciente_id: number
  sesion_id?: number
  monto: number
  metodo_pago: MetodoPago
  fecha: string
  concepto?: string
  notas?: string
  numero_recibo?: string
  paciente?: Paciente
  sesion?: Sesion
  created_at: string
  updated_at: string
}

export interface PagoCreate {
  paciente_id: number
  sesion_id?: number
  monto: number
  metodo_pago: MetodoPago
  fecha: string
  concepto?: string
  notas?: string
}

export interface PagoUpdate extends Partial<PagoCreate> {}

// Egreso
export type CategoriaEgreso = 'materiales' | 'servicios' | 'alquiler' | 'sueldos' | 'impuestos' | 'marketing' | 'mantenimiento' | 'otros'

export interface Egreso {
  id: number
  concepto: string
  monto: number
  categoria: CategoriaEgreso
  metodo_pago: MetodoPago
  fecha: string
  proveedor?: string
  numero_factura?: string
  notas?: string
  created_at: string
  updated_at: string
}

export interface EgresoCreate {
  concepto: string
  monto: number
  categoria: CategoriaEgreso
  metodo_pago: MetodoPago
  fecha: string
  proveedor?: string
  numero_factura?: string
  notas?: string
}

export interface EgresoUpdate extends Partial<EgresoCreate> {}

// Foto
export interface Foto {
  id: number
  paciente_id: number
  sesion_id?: number
  url: string
  thumbnail_url?: string
  descripcion?: string
  es_antes: boolean
  visible_portal: boolean
  created_at: string
}

// Dashboard
export interface ResumenDia {
  fecha: string
  sesiones: {
    total: number
    completadas: number
    pendientes: number
  }
  ingresos_dia: number
  pacientes_total: number
  pacientes_nuevos: number
}

export interface Alertas {
  stock_bajo: Array<{
    id: number
    nombre: string
    stock_actual: number
    stock_minimo: number
  }>
  pagos_pendientes: number
  materiales_por_vencer: Array<{
    id: number
    nombre: string
    fecha_vencimiento: string
  }>
}

export interface EstadisticasMes {
  periodo: string
  ingresos: number
  egresos: number
  balance: number
  sesiones_realizadas: number
  valor_inventario: number
}
