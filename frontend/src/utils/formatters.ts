/**
 * Formateo de valores según estándar argentino
 */

export const formatearMonto = (monto: number, moneda: 'ARS' | 'USD' = 'ARS'): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: moneda,
  }).format(monto)
}

export const formatearFecha = (fecha: Date | string): string => {
  return new Intl.DateTimeFormat('es-AR').format(new Date(fecha))
}

export const formatearFechaHora = (fecha: Date | string): string => {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(fecha))
}

export const formatearNumero = (numero: number): string => {
  return new Intl.NumberFormat('es-AR').format(numero)
}

export const formatearPorcentaje = (valor: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(valor / 100)
}
