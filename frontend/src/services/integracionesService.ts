import api from '@/lib/axios'

export const integracionesService = {
  // Google Calendar
  getGoogleCalendarStatus: async (): Promise<{ connected: boolean; configured: boolean }> => {
    const { data } = await api.get('/integraciones/google-calendar/status')
    return data
  },

  getGoogleAuthUrl: async (redirectUri: string): Promise<{ auth_url: string }> => {
    const { data } = await api.post('/integraciones/google-calendar/auth-url', {
      redirect_uri: redirectUri,
    })
    return data
  },

  googleCalendarCallback: async (code: string, redirectUri: string): Promise<{ message: string }> => {
    const { data } = await api.post('/integraciones/google-calendar/callback', {
      code,
      redirect_uri: redirectUri,
    })
    return data
  },

  syncSesionToCalendar: async (sesionId: number): Promise<{ message: string; event_id: string; event_link?: string }> => {
    const { data } = await api.post(`/integraciones/google-calendar/sync-sesion/${sesionId}`)
    return data
  },

  // WhatsApp
  sendWhatsAppReminder: async (sesionId: number): Promise<{ message: string; message_id?: string }> => {
    const { data } = await api.post('/integraciones/whatsapp/send-reminder', {
      sesion_id: sesionId,
    })
    return data
  },

  sendBulkReminders: async (fecha: string): Promise<{ message: string; total: number; enviados: number; errores?: string[] }> => {
    const { data } = await api.post(`/integraciones/whatsapp/send-bulk-reminders?fecha=${fecha}`)
    return data
  },

  // Mercado Pago
  createMercadoPagoPreference: async (
    pacienteId: number,
    monto: number,
    descripcion: string,
    sesionId?: number
  ): Promise<{ preference_id: string; init_point: string; sandbox_init_point: string }> => {
    const { data } = await api.post('/integraciones/mercadopago/create-preference', {
      paciente_id: pacienteId,
      monto,
      descripcion,
      sesion_id: sesionId,
    })
    return data
  },
}
