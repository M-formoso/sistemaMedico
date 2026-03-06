"""
Servicio de integración con Google Calendar.
Permite sincronizar turnos con el calendario de Google.
"""
import os
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import json

# Importación condicional de las librerías de Google
try:
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    from google_auth_oauthlib.flow import Flow
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
    GOOGLE_LIBS_AVAILABLE = True
except ImportError:
    GOOGLE_LIBS_AVAILABLE = False
    Credentials = None
    Request = None
    Flow = None
    build = None
    HttpError = Exception

from app.core.config import settings


SCOPES = ['https://www.googleapis.com/auth/calendar']


class GoogleCalendarService:
    """Servicio para interactuar con Google Calendar API."""

    def __init__(self, credentials_json: Optional[str] = None):
        self.credentials: Optional[Credentials] = None
        self.service = None
        self.credentials_json = credentials_json

    def _check_google_libs(self):
        """Verifica que las librerías de Google estén disponibles."""
        if not GOOGLE_LIBS_AVAILABLE:
            raise Exception(
                "Las librerías de Google no están instaladas. "
                "Ejecuta: pip install google-auth google-auth-oauthlib google-api-python-client"
            )

    def get_auth_url(self, redirect_uri: str) -> str:
        """Genera URL para autorización OAuth2."""
        self._check_google_libs()
        client_config = {
            "web": {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uris": [redirect_uri],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        }

        flow = Flow.from_client_config(
            client_config,
            scopes=SCOPES,
            redirect_uri=redirect_uri
        )

        auth_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent'
        )

        return auth_url

    def exchange_code(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        """Intercambia código de autorización por tokens."""
        self._check_google_libs()
        client_config = {
            "web": {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uris": [redirect_uri],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        }

        flow = Flow.from_client_config(
            client_config,
            scopes=SCOPES,
            redirect_uri=redirect_uri
        )

        flow.fetch_token(code=code)
        credentials = flow.credentials

        return {
            "token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "token_uri": credentials.token_uri,
            "client_id": credentials.client_id,
            "client_secret": credentials.client_secret,
            "scopes": credentials.scopes,
        }

    def _get_service(self, credentials_dict: Dict[str, Any]):
        """Obtiene el servicio de Calendar con las credenciales dadas."""
        self._check_google_libs()
        credentials = Credentials(
            token=credentials_dict.get("token"),
            refresh_token=credentials_dict.get("refresh_token"),
            token_uri=credentials_dict.get("token_uri") or "https://oauth2.googleapis.com/token",
            client_id=credentials_dict.get("client_id") or settings.GOOGLE_CLIENT_ID,
            client_secret=credentials_dict.get("client_secret") or settings.GOOGLE_CLIENT_SECRET,
            scopes=credentials_dict.get("scopes") or SCOPES,
        )

        # Refrescar si expiró
        if credentials.expired and credentials.refresh_token:
            credentials.refresh(Request())

        return build('calendar', 'v3', credentials=credentials)

    def create_event(
        self,
        credentials_dict: Dict[str, Any],
        summary: str,
        start_datetime: datetime,
        end_datetime: datetime,
        description: Optional[str] = None,
        location: Optional[str] = None,
        attendee_email: Optional[str] = None,
        calendar_id: str = 'primary',
    ) -> Dict[str, Any]:
        """
        Crea un evento en Google Calendar.

        Args:
            credentials_dict: Credenciales OAuth2 del usuario
            summary: Título del evento
            start_datetime: Fecha/hora de inicio
            end_datetime: Fecha/hora de fin
            description: Descripción opcional
            location: Ubicación opcional
            attendee_email: Email del participante (paciente)
            calendar_id: ID del calendario (default: primary)

        Returns:
            Diccionario con información del evento creado
        """
        service = self._get_service(credentials_dict)

        event = {
            'summary': summary,
            'start': {
                'dateTime': start_datetime.isoformat(),
                'timeZone': 'America/Argentina/Buenos_Aires',
            },
            'end': {
                'dateTime': end_datetime.isoformat(),
                'timeZone': 'America/Argentina/Buenos_Aires',
            },
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'email', 'minutes': 24 * 60},  # 24 horas antes
                    {'method': 'popup', 'minutes': 60},  # 1 hora antes
                ],
            },
        }

        if description:
            event['description'] = description

        if location:
            event['location'] = location

        if attendee_email:
            event['attendees'] = [{'email': attendee_email}]

        try:
            created_event = service.events().insert(
                calendarId=calendar_id,
                body=event,
                sendUpdates='all' if attendee_email else 'none'
            ).execute()

            return {
                'id': created_event['id'],
                'htmlLink': created_event.get('htmlLink'),
                'summary': created_event.get('summary'),
                'start': created_event.get('start'),
                'end': created_event.get('end'),
            }
        except HttpError as e:
            raise Exception(f"Error al crear evento en Google Calendar: {str(e)}")

    def update_event(
        self,
        credentials_dict: Dict[str, Any],
        event_id: str,
        summary: Optional[str] = None,
        start_datetime: Optional[datetime] = None,
        end_datetime: Optional[datetime] = None,
        description: Optional[str] = None,
        calendar_id: str = 'primary',
    ) -> Dict[str, Any]:
        """Actualiza un evento existente."""
        service = self._get_service(credentials_dict)

        try:
            # Obtener evento actual
            event = service.events().get(
                calendarId=calendar_id,
                eventId=event_id
            ).execute()

            # Actualizar campos
            if summary:
                event['summary'] = summary
            if start_datetime:
                event['start'] = {
                    'dateTime': start_datetime.isoformat(),
                    'timeZone': 'America/Argentina/Buenos_Aires',
                }
            if end_datetime:
                event['end'] = {
                    'dateTime': end_datetime.isoformat(),
                    'timeZone': 'America/Argentina/Buenos_Aires',
                }
            if description is not None:
                event['description'] = description

            updated_event = service.events().update(
                calendarId=calendar_id,
                eventId=event_id,
                body=event
            ).execute()

            return {
                'id': updated_event['id'],
                'htmlLink': updated_event.get('htmlLink'),
                'updated': updated_event.get('updated'),
            }
        except HttpError as e:
            raise Exception(f"Error al actualizar evento: {str(e)}")

    def delete_event(
        self,
        credentials_dict: Dict[str, Any],
        event_id: str,
        calendar_id: str = 'primary',
    ) -> bool:
        """Elimina un evento del calendario."""
        service = self._get_service(credentials_dict)

        try:
            service.events().delete(
                calendarId=calendar_id,
                eventId=event_id
            ).execute()
            return True
        except HttpError as e:
            if e.resp.status == 404:
                return True  # Ya estaba eliminado
            raise Exception(f"Error al eliminar evento: {str(e)}")

    def list_events(
        self,
        credentials_dict: Dict[str, Any],
        time_min: Optional[datetime] = None,
        time_max: Optional[datetime] = None,
        max_results: int = 50,
        calendar_id: str = 'primary',
    ) -> list:
        """Lista eventos del calendario."""
        service = self._get_service(credentials_dict)

        if not time_min:
            time_min = datetime.utcnow()
        if not time_max:
            time_max = time_min + timedelta(days=30)

        try:
            events_result = service.events().list(
                calendarId=calendar_id,
                timeMin=time_min.isoformat() + 'Z',
                timeMax=time_max.isoformat() + 'Z',
                maxResults=max_results,
                singleEvents=True,
                orderBy='startTime'
            ).execute()

            return events_result.get('items', [])
        except HttpError as e:
            raise Exception(f"Error al listar eventos: {str(e)}")


# Instancia global del servicio
google_calendar_service = GoogleCalendarService()
