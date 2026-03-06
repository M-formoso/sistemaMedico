"""
Endpoints para integraciones externas.
- Google Calendar
- WhatsApp
- Mercado Pago
"""
from typing import Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.api.deps import get_current_admin
from app.models.sesion import Sesion
from app.models.paciente import Paciente
from app.models.configuracion import Configuracion
from app.services.google_calendar import google_calendar_service
from app.services.whatsapp import whatsapp_service
from app.core.config import settings

router = APIRouter()


# ==================== GOOGLE CALENDAR ====================

class GoogleAuthRequest(BaseModel):
    redirect_uri: str


class GoogleAuthCallback(BaseModel):
    code: str
    redirect_uri: str


class CalendarEventCreate(BaseModel):
    sesion_id: int


@router.post("/google-calendar/auth-url")
def get_google_auth_url(
    data: GoogleAuthRequest,
    current_user=Depends(get_current_admin)
):
    """Obtiene la URL de autorización de Google Calendar."""
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=400,
            detail="Google Calendar no está configurado. Configura GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET."
        )

    auth_url = google_calendar_service.get_auth_url(data.redirect_uri)
    return {"auth_url": auth_url}


@router.post("/google-calendar/callback")
def google_calendar_callback(
    data: GoogleAuthCallback,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Callback para procesar la autorización de Google."""
    try:
        tokens = google_calendar_service.exchange_code(data.code, data.redirect_uri)

        # Guardar tokens en configuración
        config = db.query(Configuracion).first()
        if not config:
            config = Configuracion()
            db.add(config)

        # Guardar como JSON en un campo
        import json
        config.google_calendar_credentials = json.dumps(tokens)
        db.commit()

        return {"message": "Google Calendar conectado exitosamente"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/google-calendar/status")
def get_google_calendar_status(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Verifica si Google Calendar está conectado."""
    config = db.query(Configuracion).first()

    is_connected = False
    if config and hasattr(config, 'google_calendar_credentials') and config.google_calendar_credentials:
        is_connected = True

    return {
        "connected": is_connected,
        "configured": bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET)
    }


@router.post("/google-calendar/sync-sesion/{sesion_id}")
def sync_sesion_to_calendar(
    sesion_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Sincroniza una sesión con Google Calendar."""
    sesion = db.query(Sesion).filter(Sesion.id == sesion_id).first()
    if not sesion:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")

    config = db.query(Configuracion).first()
    if not config or not hasattr(config, 'google_calendar_credentials') or not config.google_calendar_credentials:
        raise HTTPException(status_code=400, detail="Google Calendar no está conectado")

    import json
    credentials = json.loads(config.google_calendar_credentials)

    # Construir fecha/hora
    fecha_hora_inicio = datetime.combine(sesion.fecha, sesion.hora_inicio) if sesion.hora_inicio else datetime.combine(sesion.fecha, datetime.min.time())
    duracion = sesion.duracion_minutos or 30
    fecha_hora_fin = fecha_hora_inicio + timedelta(minutes=duracion)

    # Título y descripción
    paciente_nombre = f"{sesion.paciente.nombre} {sesion.paciente.apellido}" if sesion.paciente else "Paciente"
    tratamiento_nombre = sesion.tratamiento.nombre if sesion.tratamiento else "Consulta"

    summary = f"{paciente_nombre} - {tratamiento_nombre}"
    description = f"Turno programado\nPaciente: {paciente_nombre}\nTratamiento: {tratamiento_nombre}"
    if sesion.notas:
        description += f"\nNotas: {sesion.notas}"

    try:
        # Si ya tiene event_id, actualizar; sino, crear
        if sesion.google_calendar_event_id:
            result = google_calendar_service.update_event(
                credentials,
                sesion.google_calendar_event_id,
                summary=summary,
                start_datetime=fecha_hora_inicio,
                end_datetime=fecha_hora_fin,
                description=description,
            )
        else:
            result = google_calendar_service.create_event(
                credentials,
                summary=summary,
                start_datetime=fecha_hora_inicio,
                end_datetime=fecha_hora_fin,
                description=description,
                attendee_email=sesion.paciente.email if sesion.paciente and sesion.paciente.email else None,
            )
            sesion.google_calendar_event_id = result['id']
            db.commit()

        return {
            "message": "Sesión sincronizada con Google Calendar",
            "event_id": result['id'],
            "event_link": result.get('htmlLink')
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al sincronizar: {str(e)}")


# ==================== WHATSAPP REMINDERS ====================

class SendReminderRequest(BaseModel):
    sesion_id: int


@router.post("/whatsapp/send-reminder")
async def send_whatsapp_reminder(
    data: SendReminderRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Envía recordatorio de turno por WhatsApp."""
    sesion = db.query(Sesion).filter(Sesion.id == data.sesion_id).first()
    if not sesion:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")

    if not sesion.paciente or not sesion.paciente.telefono:
        raise HTTPException(status_code=400, detail="El paciente no tiene teléfono registrado")

    paciente = sesion.paciente
    hora = sesion.hora_inicio.strftime('%H:%M') if sesion.hora_inicio else "00:00"

    mensaje = whatsapp_service.format_reminder_message(
        paciente_nombre=paciente.nombre,
        fecha=datetime.combine(sesion.fecha, datetime.min.time()),
        hora=hora,
        tratamiento=sesion.tratamiento.nombre if sesion.tratamiento else None,
    )

    result = await whatsapp_service.send_message(paciente.telefono, mensaje)

    if result['success']:
        return {
            "message": "Recordatorio enviado exitosamente",
            "message_id": result.get('message_id'),
        }
    else:
        raise HTTPException(status_code=500, detail=f"Error al enviar: {result.get('error')}")


@router.post("/whatsapp/send-bulk-reminders")
async def send_bulk_reminders(
    fecha: str = Query(..., description="Fecha de los turnos (YYYY-MM-DD)"),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Envía recordatorios a todos los turnos de una fecha específica."""
    from datetime import date as date_type

    try:
        fecha_obj = datetime.strptime(fecha, '%Y-%m-%d').date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido. Usa YYYY-MM-DD")

    sesiones = db.query(Sesion).filter(
        Sesion.fecha == fecha_obj,
        Sesion.estado.in_(['programada', 'confirmada'])
    ).all()

    if not sesiones:
        return {"message": "No hay turnos para esa fecha", "enviados": 0}

    enviados = 0
    errores = []

    for sesion in sesiones:
        if not sesion.paciente or not sesion.paciente.telefono:
            errores.append(f"Sesión {sesion.id}: Sin teléfono")
            continue

        hora = sesion.hora_inicio.strftime('%H:%M') if sesion.hora_inicio else "00:00"
        mensaje = whatsapp_service.format_reminder_message(
            paciente_nombre=sesion.paciente.nombre,
            fecha=datetime.combine(sesion.fecha, datetime.min.time()),
            hora=hora,
            tratamiento=sesion.tratamiento.nombre if sesion.tratamiento else None,
        )

        result = await whatsapp_service.send_message(sesion.paciente.telefono, mensaje)
        if result['success']:
            enviados += 1
        else:
            errores.append(f"Sesión {sesion.id}: {result.get('error')}")

    return {
        "message": f"Recordatorios procesados",
        "total": len(sesiones),
        "enviados": enviados,
        "errores": errores if errores else None
    }


# ==================== MERCADO PAGO ====================

class MercadoPagoPreference(BaseModel):
    paciente_id: int
    monto: float
    descripcion: str
    sesion_id: Optional[int] = None


@router.post("/mercadopago/create-preference")
def create_mercadopago_preference(
    data: MercadoPagoPreference,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Crea una preferencia de pago en Mercado Pago."""
    import mercadopago

    if not settings.MERCADOPAGO_ACCESS_TOKEN:
        raise HTTPException(status_code=400, detail="Mercado Pago no está configurado")

    paciente = db.query(Paciente).filter(Paciente.id == data.paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    sdk = mercadopago.SDK(settings.MERCADOPAGO_ACCESS_TOKEN)

    preference_data = {
        "items": [
            {
                "title": data.descripcion,
                "quantity": 1,
                "unit_price": data.monto,
                "currency_id": "ARS",
            }
        ],
        "payer": {
            "name": paciente.nombre,
            "surname": paciente.apellido,
            "email": paciente.email or "sin_email@medestetica.com",
        },
        "back_urls": {
            "success": f"{settings.FRONTEND_URL}/pagos/success",
            "failure": f"{settings.FRONTEND_URL}/pagos/failure",
            "pending": f"{settings.FRONTEND_URL}/pagos/pending",
        },
        "auto_return": "approved",
        "external_reference": f"paciente_{paciente.id}_sesion_{data.sesion_id or 0}",
    }

    try:
        preference_response = sdk.preference().create(preference_data)
        preference = preference_response["response"]

        return {
            "preference_id": preference["id"],
            "init_point": preference["init_point"],
            "sandbox_init_point": preference["sandbox_init_point"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al crear preferencia: {str(e)}")


@router.post("/mercadopago/webhook")
async def mercadopago_webhook(
    data: dict,
    db: Session = Depends(get_db),
):
    """Webhook para recibir notificaciones de Mercado Pago."""
    import mercadopago

    if not settings.MERCADOPAGO_ACCESS_TOKEN:
        return {"status": "not_configured"}

    # Verificar tipo de notificación
    if data.get("type") == "payment":
        payment_id = data.get("data", {}).get("id")

        if payment_id:
            sdk = mercadopago.SDK(settings.MERCADOPAGO_ACCESS_TOKEN)
            payment_response = sdk.payment().get(payment_id)
            payment = payment_response.get("response", {})

            if payment.get("status") == "approved":
                # Registrar el pago
                external_ref = payment.get("external_reference", "")
                # Parsear paciente_id y sesion_id del external_reference
                # Formato: "paciente_{id}_sesion_{id}"

                from app.models.pago import Pago, MetodoPago

                # Crear registro de pago
                nuevo_pago = Pago(
                    monto=payment.get("transaction_amount"),
                    metodo_pago=MetodoPago.MERCADOPAGO,
                    referencia_externa=str(payment_id),
                    notas=f"Pago vía Mercado Pago - ID: {payment_id}",
                )

                # Extraer paciente_id del external_reference
                if "paciente_" in external_ref:
                    try:
                        parts = external_ref.split("_")
                        paciente_idx = parts.index("paciente") + 1
                        nuevo_pago.paciente_id = int(parts[paciente_idx])

                        if "sesion" in external_ref:
                            sesion_idx = parts.index("sesion") + 1
                            sesion_id = int(parts[sesion_idx])
                            if sesion_id > 0:
                                nuevo_pago.sesion_id = sesion_id
                    except (ValueError, IndexError):
                        pass

                db.add(nuevo_pago)
                db.commit()

    return {"status": "ok"}
