from typing import List, Optional
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.api.deps import get_current_admin
from app.models.foto import Foto, TipoFoto
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


class FotoResponse(BaseModel):
    id: int
    url: str
    tipo: str
    zona: Optional[str] = None
    fecha: Optional[date] = None
    visible_paciente: bool

    class Config:
        from_attributes = True


@router.post("/upload", status_code=status.HTTP_201_CREATED, response_model=FotoResponse)
async def subir_foto(
    paciente_id: int = Form(...),
    sesion_id: Optional[int] = Form(None),
    tipo: str = Form("evolucion"),
    zona: Optional[str] = Form(None),
    descripcion: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Subir foto a Cloudinary.
    """
    # Validar tipo
    try:
        tipo_foto = TipoFoto(tipo)
    except ValueError:
        tipo_foto = TipoFoto.EVOLUCION

    # Subir a Cloudinary si está configurado
    if CLOUDINARY_CONFIGURED:
        try:
            # Leer contenido del archivo
            contents = await file.read()

            # Subir a Cloudinary
            result = cloudinary.uploader.upload(
                contents,
                folder=f"medestetica/pacientes/{paciente_id}",
                resource_type="image"
            )
            url = result["secure_url"]
            public_id = result["public_id"]
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error al subir imagen a Cloudinary: {str(e)}"
            )
    else:
        # Modo desarrollo sin Cloudinary - usar base64 o placeholder
        import base64
        contents = await file.read()
        base64_data = base64.b64encode(contents).decode('utf-8')
        content_type = file.content_type or 'image/jpeg'
        url = f"data:{content_type};base64,{base64_data}"
        public_id = f"local_{paciente_id}_{file.filename}"

    foto = Foto(
        paciente_id=paciente_id,
        sesion_id=sesion_id,
        url=url,
        public_id=public_id,
        tipo=tipo_foto,
        zona=zona,
        fecha=date.today(),
        visible_paciente=False
    )
    db.add(foto)
    db.commit()
    db.refresh(foto)

    return FotoResponse(
        id=foto.id,
        url=foto.url,
        tipo=foto.tipo.value,
        zona=foto.zona,
        fecha=foto.fecha,
        visible_paciente=foto.visible_paciente
    )


@router.get("/paciente/{paciente_id}", response_model=List[FotoResponse])
def obtener_fotos_paciente(
    paciente_id: int,
    tipo: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Obtener fotos de un paciente."""
    query = db.query(Foto).filter(Foto.paciente_id == paciente_id)
    if tipo:
        try:
            tipo_foto = TipoFoto(tipo)
            query = query.filter(Foto.tipo == tipo_foto)
        except ValueError:
            pass

    fotos = query.order_by(Foto.fecha.desc()).all()
    return [
        FotoResponse(
            id=f.id,
            url=f.url,
            tipo=f.tipo.value if f.tipo else "evolucion",
            zona=f.zona,
            fecha=f.fecha,
            visible_paciente=f.visible_paciente
        )
        for f in fotos
    ]


@router.delete("/{foto_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_foto(
    foto_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Eliminar foto."""
    foto = db.query(Foto).filter(Foto.id == foto_id).first()
    if not foto:
        raise HTTPException(status_code=404, detail="Foto no encontrada")

    # Eliminar de Cloudinary si está configurado
    if CLOUDINARY_CONFIGURED and foto.public_id and not foto.public_id.startswith("local_"):
        try:
            cloudinary.uploader.destroy(foto.public_id)
        except Exception:
            pass  # Ignorar errores de Cloudinary al eliminar

    db.delete(foto)
    db.commit()


@router.put("/{foto_id}/visibilidad")
def cambiar_visibilidad(
    foto_id: int,
    visible: bool,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Cambiar visibilidad de foto para el paciente."""
    foto = db.query(Foto).filter(Foto.id == foto_id).first()
    if not foto:
        raise HTTPException(status_code=404, detail="Foto no encontrada")

    foto.visible_paciente = visible
    db.commit()

    return {"message": "Visibilidad actualizada"}
