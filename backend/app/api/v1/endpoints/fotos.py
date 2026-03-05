from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_admin
from app.models.foto import Foto, TipoFoto

router = APIRouter()


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def subir_foto(
    paciente_id: UUID = Form(...),
    sesion_id: UUID = Form(None),
    tipo: TipoFoto = Form(TipoFoto.EVOLUCION),
    zona: str = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Subir foto a Cloudinary.
    TODO: Implementar integración con Cloudinary.
    """
    # TODO: Implementar subida a Cloudinary
    # import cloudinary.uploader
    # result = cloudinary.uploader.upload(file.file)
    # url = result["secure_url"]
    # public_id = result["public_id"]

    # Placeholder para desarrollo
    url = f"https://placeholder.com/{paciente_id}/{file.filename}"
    public_id = f"{paciente_id}_{file.filename}"

    from datetime import date
    foto = Foto(
        paciente_id=paciente_id,
        sesion_id=sesion_id,
        url=url,
        public_id=public_id,
        tipo=tipo,
        zona=zona,
        fecha=date.today(),
    )
    db.add(foto)
    db.commit()
    db.refresh(foto)

    return {"id": foto.id, "url": foto.url}


@router.get("/paciente/{paciente_id}")
def obtener_fotos_paciente(
    paciente_id: UUID,
    tipo: TipoFoto = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Obtener fotos de un paciente."""
    query = db.query(Foto).filter(Foto.paciente_id == paciente_id)
    if tipo:
        query = query.filter(Foto.tipo == tipo)
    return query.order_by(Foto.fecha.desc()).all()


@router.delete("/{foto_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_foto(
    foto_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Eliminar foto."""
    foto = db.query(Foto).filter(Foto.id == foto_id).first()
    if not foto:
        raise HTTPException(status_code=404, detail="Foto no encontrada")

    # TODO: Eliminar de Cloudinary
    # import cloudinary.uploader
    # cloudinary.uploader.destroy(foto.public_id)

    db.delete(foto)
    db.commit()


@router.put("/{foto_id}/visibilidad")
def cambiar_visibilidad(
    foto_id: UUID,
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
