"""
Servicio de recordatorios por WhatsApp.
Utiliza la API de WhatsApp Business (a través de proveedores como Twilio o la API oficial).
"""
import os
from datetime import datetime, timedelta
from typing import Optional
import httpx
from app.core.config import settings


class WhatsAppService:
    """
    Servicio para enviar mensajes de WhatsApp.
    Puede configurarse para usar Twilio, Meta WhatsApp Business API, o similar.
    """

    def __init__(self):
        self.provider = getattr(settings, 'WHATSAPP_PROVIDER', 'twilio')  # 'twilio' o 'meta'
        self.api_url = getattr(settings, 'WHATSAPP_API_URL', '')
        self.account_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', '')
        self.auth_token = getattr(settings, 'TWILIO_AUTH_TOKEN', '')
        self.from_number = getattr(settings, 'WHATSAPP_FROM_NUMBER', '')

    async def send_message(
        self,
        to_number: str,
        message: str,
    ) -> dict:
        """
        Envía un mensaje de WhatsApp.

        Args:
            to_number: Número de teléfono destino (con código de país, ej: +5491112345678)
            message: Contenido del mensaje

        Returns:
            Diccionario con el resultado del envío
        """
        # Normalizar número
        to_number = self._normalize_phone(to_number)

        if self.provider == 'twilio':
            return await self._send_via_twilio(to_number, message)
        elif self.provider == 'meta':
            return await self._send_via_meta(to_number, message)
        else:
            # Mock para desarrollo
            return await self._mock_send(to_number, message)

    def _normalize_phone(self, phone: str) -> str:
        """Normaliza el número de teléfono al formato internacional."""
        # Remover espacios y guiones
        phone = phone.replace(' ', '').replace('-', '')

        # Si no tiene código de país, asumir Argentina
        if not phone.startswith('+'):
            if phone.startswith('0'):
                phone = phone[1:]  # Remover 0 inicial
            phone = '+54' + phone

        return phone

    async def _send_via_twilio(self, to_number: str, message: str) -> dict:
        """Envía mensaje usando Twilio."""
        url = f"https://api.twilio.com/2010-04-01/Accounts/{self.account_sid}/Messages.json"

        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                auth=(self.account_sid, self.auth_token),
                data={
                    'From': f'whatsapp:{self.from_number}',
                    'To': f'whatsapp:{to_number}',
                    'Body': message,
                }
            )

            if response.status_code in [200, 201]:
                data = response.json()
                return {
                    'success': True,
                    'message_id': data.get('sid'),
                    'status': data.get('status'),
                }
            else:
                return {
                    'success': False,
                    'error': response.text,
                }

    async def _send_via_meta(self, to_number: str, message: str) -> dict:
        """Envía mensaje usando Meta WhatsApp Business API."""
        # Remover el + del número para Meta
        phone_number = to_number.replace('+', '')

        headers = {
            'Authorization': f'Bearer {self.auth_token}',
            'Content-Type': 'application/json',
        }

        payload = {
            'messaging_product': 'whatsapp',
            'to': phone_number,
            'type': 'text',
            'text': {'body': message}
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.api_url,
                headers=headers,
                json=payload
            )

            if response.status_code in [200, 201]:
                data = response.json()
                return {
                    'success': True,
                    'message_id': data.get('messages', [{}])[0].get('id'),
                }
            else:
                return {
                    'success': False,
                    'error': response.text,
                }

    async def _mock_send(self, to_number: str, message: str) -> dict:
        """Mock para desarrollo/testing."""
        print(f"[MOCK WhatsApp] To: {to_number}")
        print(f"[MOCK WhatsApp] Message: {message}")
        return {
            'success': True,
            'message_id': 'mock_' + str(datetime.now().timestamp()),
            'mock': True,
        }

    def format_reminder_message(
        self,
        paciente_nombre: str,
        fecha: datetime,
        hora: str,
        tratamiento: Optional[str] = None,
        clinica_nombre: str = "MedEstética",
        clinica_direccion: Optional[str] = None,
    ) -> str:
        """
        Formatea un mensaje de recordatorio de turno.

        Args:
            paciente_nombre: Nombre del paciente
            fecha: Fecha del turno
            hora: Hora del turno (formato HH:MM)
            tratamiento: Nombre del tratamiento (opcional)
            clinica_nombre: Nombre de la clínica
            clinica_direccion: Dirección de la clínica

        Returns:
            Mensaje formateado
        """
        fecha_str = fecha.strftime('%A %d de %B').capitalize()

        mensaje = f"""¡Hola {paciente_nombre}! 👋

Te recordamos que tenés turno en *{clinica_nombre}*:

📅 *Fecha:* {fecha_str}
🕐 *Hora:* {hora} hs"""

        if tratamiento:
            mensaje += f"\n💆 *Tratamiento:* {tratamiento}"

        if clinica_direccion:
            mensaje += f"\n📍 *Dirección:* {clinica_direccion}"

        mensaje += """

Por favor, confirmá tu asistencia respondiendo a este mensaje.

_Si necesitás reprogramar, comunicate con nosotros con anticipación._

¡Te esperamos! ✨"""

        return mensaje

    def format_confirmation_message(
        self,
        paciente_nombre: str,
        fecha: datetime,
        hora: str,
        tratamiento: Optional[str] = None,
    ) -> str:
        """Formatea mensaje de confirmación de turno."""
        fecha_str = fecha.strftime('%d/%m/%Y')

        mensaje = f"""¡Hola {paciente_nombre}! ✅

Tu turno ha sido *confirmado*:

📅 Fecha: {fecha_str}
🕐 Hora: {hora} hs"""

        if tratamiento:
            mensaje += f"\n💆 Tratamiento: {tratamiento}"

        mensaje += "\n\n¡Te esperamos!"

        return mensaje

    def format_cancellation_message(
        self,
        paciente_nombre: str,
        fecha: datetime,
        hora: str,
    ) -> str:
        """Formatea mensaje de cancelación de turno."""
        fecha_str = fecha.strftime('%d/%m/%Y')

        return f"""Hola {paciente_nombre},

Te informamos que tu turno del {fecha_str} a las {hora} hs ha sido *cancelado*.

Si querés reprogramar, no dudes en contactarnos.

Saludos,
MedEstética"""


# Instancia global
whatsapp_service = WhatsAppService()
