from typing import List, Optional
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.api.deps import get_current_admin
from app.models.consentimiento import Consentimiento, TipoConsentimiento
from app.models.paciente import Paciente
from app.models.tratamiento import Tratamiento
from app.core.config import settings

# Configurar Cloudinary si está disponible
try:
    import cloudinary
    import cloudinary.uploader

    if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY:
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET
        )
        CLOUDINARY_CONFIGURED = True
    else:
        CLOUDINARY_CONFIGURED = False
except ImportError:
    CLOUDINARY_CONFIGURED = False

router = APIRouter()


# Schemas
class ConsentimientoBase(BaseModel):
    tipo: Optional[TipoConsentimiento] = TipoConsentimiento.TRATAMIENTO
    nombre: str
    descripcion: Optional[str] = None
    archivo_url: Optional[str] = None
    fecha_firma: Optional[date] = None
    firmado: bool = False
    fecha_vencimiento: Optional[date] = None


class ConsentimientoCreate(ConsentimientoBase):
    paciente_id: int
    tratamiento_id: Optional[int] = None


class ConsentimientoUpdate(BaseModel):
    tipo: Optional[TipoConsentimiento] = None
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    archivo_url: Optional[str] = None
    fecha_firma: Optional[date] = None
    firmado: Optional[bool] = None
    fecha_vencimiento: Optional[date] = None


class ConsentimientoResponse(ConsentimientoBase):
    id: int
    paciente_id: int
    tratamiento_id: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


@router.get("/paciente/{paciente_id}", response_model=List[ConsentimientoResponse])
def listar_consentimientos_paciente(
    paciente_id: int,
    firmado: Optional[bool] = None,
    tipo: Optional[TipoConsentimiento] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Listar consentimientos de un paciente."""
    query = db.query(Consentimiento).filter(Consentimiento.paciente_id == paciente_id)

    if firmado is not None:
        query = query.filter(Consentimiento.firmado == firmado)
    if tipo:
        query = query.filter(Consentimiento.tipo == tipo)

    consentimientos = query.order_by(Consentimiento.created_at.desc()).offset(skip).limit(limit).all()
    return consentimientos


@router.get("/pendientes", response_model=List[ConsentimientoResponse])
def listar_consentimientos_pendientes(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Listar todos los consentimientos pendientes de firma."""
    consentimientos = db.query(Consentimiento).filter(
        Consentimiento.firmado == False
    ).order_by(Consentimiento.created_at.desc()).all()

    return consentimientos


@router.post("/", response_model=ConsentimientoResponse, status_code=status.HTTP_201_CREATED)
def crear_consentimiento(
    data: ConsentimientoCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Crear nuevo consentimiento."""
    paciente = db.query(Paciente).filter(Paciente.id == data.paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    if data.tratamiento_id:
        tratamiento = db.query(Tratamiento).filter(Tratamiento.id == data.tratamiento_id).first()
        if not tratamiento:
            raise HTTPException(status_code=404, detail="Tratamiento no encontrado")

    consentimiento = Consentimiento(
        **data.model_dump(),
        created_by=current_user.id
    )
    db.add(consentimiento)
    db.commit()
    db.refresh(consentimiento)

    return consentimiento


@router.get("/{consentimiento_id}", response_model=ConsentimientoResponse)
def obtener_consentimiento(
    consentimiento_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Obtener un consentimiento por ID."""
    consentimiento = db.query(Consentimiento).filter(Consentimiento.id == consentimiento_id).first()

    if not consentimiento:
        raise HTTPException(status_code=404, detail="Consentimiento no encontrado")

    return consentimiento


@router.put("/{consentimiento_id}", response_model=ConsentimientoResponse)
def actualizar_consentimiento(
    consentimiento_id: int,
    data: ConsentimientoUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Actualizar un consentimiento."""
    consentimiento = db.query(Consentimiento).filter(Consentimiento.id == consentimiento_id).first()

    if not consentimiento:
        raise HTTPException(status_code=404, detail="Consentimiento no encontrado")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(consentimiento, field, value)

    db.commit()
    db.refresh(consentimiento)

    return consentimiento


@router.post("/{consentimiento_id}/firmar", response_model=ConsentimientoResponse)
def firmar_consentimiento(
    consentimiento_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Marcar un consentimiento como firmado."""
    consentimiento = db.query(Consentimiento).filter(Consentimiento.id == consentimiento_id).first()

    if not consentimiento:
        raise HTTPException(status_code=404, detail="Consentimiento no encontrado")

    consentimiento.firmado = True
    consentimiento.fecha_firma = date.today()

    db.commit()
    db.refresh(consentimiento)

    return consentimiento


@router.delete("/{consentimiento_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_consentimiento(
    consentimiento_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Eliminar un consentimiento."""
    consentimiento = db.query(Consentimiento).filter(Consentimiento.id == consentimiento_id).first()

    if not consentimiento:
        raise HTTPException(status_code=404, detail="Consentimiento no encontrado")

    db.delete(consentimiento)
    db.commit()


@router.post("/{consentimiento_id}/upload", response_model=ConsentimientoResponse)
async def subir_archivo_consentimiento(
    consentimiento_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Subir archivo para un consentimiento existente."""
    consentimiento = db.query(Consentimiento).filter(Consentimiento.id == consentimiento_id).first()

    if not consentimiento:
        raise HTTPException(status_code=404, detail="Consentimiento no encontrado")

    # Subir a Cloudinary si está configurado
    if CLOUDINARY_CONFIGURED:
        try:
            contents = await file.read()
            result = cloudinary.uploader.upload(
                contents,
                folder=f"medestetica/consentimientos/{consentimiento.paciente_id}",
                resource_type="auto"  # auto detecta si es imagen o PDF
            )
            archivo_url = result["secure_url"]
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error al subir archivo a Cloudinary: {str(e)}"
            )
    else:
        # Modo desarrollo sin Cloudinary - usar base64
        import base64
        contents = await file.read()
        base64_data = base64.b64encode(contents).decode('utf-8')
        content_type = file.content_type or 'application/pdf'
        archivo_url = f"data:{content_type};base64,{base64_data}"

    consentimiento.archivo_url = archivo_url
    db.commit()
    db.refresh(consentimiento)

    return consentimiento


@router.post("/con-archivo", response_model=ConsentimientoResponse, status_code=status.HTTP_201_CREATED)
async def crear_consentimiento_con_archivo(
    paciente_id: int = Form(...),
    tipo: str = Form("tratamiento"),
    nombre: str = Form(...),
    descripcion: Optional[str] = Form(None),
    tratamiento_id: Optional[int] = Form(None),
    firmado: bool = Form(False),
    fecha_vencimiento: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Crear nuevo consentimiento con archivo adjunto opcional."""
    paciente = db.query(Paciente).filter(Paciente.id == paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    if tratamiento_id:
        tratamiento = db.query(Tratamiento).filter(Tratamiento.id == tratamiento_id).first()
        if not tratamiento:
            raise HTTPException(status_code=404, detail="Tratamiento no encontrado")

    archivo_url = None
    if file:
        if CLOUDINARY_CONFIGURED:
            try:
                contents = await file.read()
                result = cloudinary.uploader.upload(
                    contents,
                    folder=f"medestetica/consentimientos/{paciente_id}",
                    resource_type="auto"
                )
                archivo_url = result["secure_url"]
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Error al subir archivo a Cloudinary: {str(e)}"
                )
        else:
            import base64
            contents = await file.read()
            base64_data = base64.b64encode(contents).decode('utf-8')
            content_type = file.content_type or 'application/pdf'
            archivo_url = f"data:{content_type};base64,{base64_data}"

    # Parsear tipo de consentimiento
    try:
        tipo_enum = TipoConsentimiento(tipo)
    except ValueError:
        tipo_enum = TipoConsentimiento.TRATAMIENTO

    # Parsear fecha de vencimiento
    fecha_venc = None
    if fecha_vencimiento:
        try:
            fecha_venc = date.fromisoformat(fecha_vencimiento)
        except ValueError:
            pass

    consentimiento = Consentimiento(
        paciente_id=paciente_id,
        tratamiento_id=tratamiento_id,
        tipo=tipo_enum,
        nombre=nombre,
        descripcion=descripcion,
        archivo_url=archivo_url,
        firmado=firmado,
        fecha_vencimiento=fecha_venc,
        created_by=current_user.id
    )
    db.add(consentimiento)
    db.commit()
    db.refresh(consentimiento)

    return consentimiento
