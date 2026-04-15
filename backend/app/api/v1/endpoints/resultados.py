from typing import List, Optional
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel, field_serializer

from app.db.session import get_db
from app.api.deps import require_modulo
from app.models.resultado import Resultado
from app.models.paciente import Paciente
from app.models.estudio import Estudio
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
class ResultadoBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    fecha: date
    archivo_url: Optional[str] = None
    tipo_archivo: Optional[str] = None
    notas: Optional[str] = None


class ResultadoCreate(ResultadoBase):
    paciente_id: int
    estudio_id: Optional[int] = None


class ResultadoUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    fecha: Optional[date] = None
    archivo_url: Optional[str] = None
    tipo_archivo: Optional[str] = None
    notas: Optional[str] = None


class ResultadoResponse(ResultadoBase):
    id: int
    paciente_id: int
    estudio_id: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

    @field_serializer('created_at')
    def serialize_created_at(self, value: Optional[datetime]) -> Optional[str]:
        if value:
            return value.isoformat()
        return None

    @field_serializer('fecha')
    def serialize_fecha(self, value: date) -> str:
        return value.isoformat()


@router.get("/paciente/{paciente_id}", response_model=List[ResultadoResponse])
def listar_resultados_paciente(
    paciente_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user=Depends(require_modulo('historia_clinica'))
):
    """Listar resultados de un paciente."""
    resultados = db.query(Resultado).filter(
        Resultado.paciente_id == paciente_id
    ).order_by(Resultado.fecha.desc()).offset(skip).limit(limit).all()

    return resultados


@router.get("/estudio/{estudio_id}", response_model=List[ResultadoResponse])
def listar_resultados_estudio(
    estudio_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_modulo('historia_clinica'))
):
    """Listar resultados de un estudio específico."""
    resultados = db.query(Resultado).filter(
        Resultado.estudio_id == estudio_id
    ).order_by(Resultado.fecha.desc()).all()

    return resultados


@router.post("/", response_model=ResultadoResponse, status_code=status.HTTP_201_CREATED)
def crear_resultado(
    data: ResultadoCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_modulo('historia_clinica'))
):
    """Crear nuevo resultado."""
    paciente = db.query(Paciente).filter(Paciente.id == data.paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    if data.estudio_id:
        estudio = db.query(Estudio).filter(Estudio.id == data.estudio_id).first()
        if not estudio:
            raise HTTPException(status_code=404, detail="Estudio no encontrado")

    resultado = Resultado(
        **data.model_dump(),
        created_by=current_user.id
    )
    db.add(resultado)
    db.commit()
    db.refresh(resultado)

    return resultado


@router.get("/{resultado_id}", response_model=ResultadoResponse)
def obtener_resultado(
    resultado_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_modulo('historia_clinica'))
):
    """Obtener un resultado por ID."""
    resultado = db.query(Resultado).filter(Resultado.id == resultado_id).first()

    if not resultado:
        raise HTTPException(status_code=404, detail="Resultado no encontrado")

    return resultado


@router.put("/{resultado_id}", response_model=ResultadoResponse)
def actualizar_resultado(
    resultado_id: int,
    data: ResultadoUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_modulo('historia_clinica'))
):
    """Actualizar un resultado."""
    resultado = db.query(Resultado).filter(Resultado.id == resultado_id).first()

    if not resultado:
        raise HTTPException(status_code=404, detail="Resultado no encontrado")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(resultado, field, value)

    db.commit()
    db.refresh(resultado)

    return resultado


@router.delete("/{resultado_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_resultado(
    resultado_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_modulo('historia_clinica'))
):
    """Eliminar un resultado."""
    resultado = db.query(Resultado).filter(Resultado.id == resultado_id).first()

    if not resultado:
        raise HTTPException(status_code=404, detail="Resultado no encontrado")

    db.delete(resultado)
    db.commit()
    return None


@router.post("/con-archivo", response_model=ResultadoResponse, status_code=status.HTTP_201_CREATED)
async def crear_resultado_con_archivo(
    paciente_id: int = Form(...),
    nombre: str = Form(...),
    descripcion: Optional[str] = Form(None),
    fecha: str = Form(...),
    notas: Optional[str] = Form(None),
    estudio_id: Optional[int] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_modulo('historia_clinica'))
):
    """Crear nuevo resultado con archivo adjunto opcional."""
    paciente = db.query(Paciente).filter(Paciente.id == paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    if estudio_id:
        estudio = db.query(Estudio).filter(Estudio.id == estudio_id).first()
        if not estudio:
            raise HTTPException(status_code=404, detail="Estudio no encontrado")

    archivo_url = None
    tipo_archivo = None
    if file:
        tipo_archivo = file.content_type
        if CLOUDINARY_CONFIGURED:
            try:
                contents = await file.read()
                result = cloudinary.uploader.upload(
                    contents,
                    folder=f"medestetica/resultados/{paciente_id}",
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

    # Parsear fecha
    try:
        fecha_parsed = date.fromisoformat(fecha)
    except ValueError:
        fecha_parsed = date.today()

    resultado = Resultado(
        paciente_id=paciente_id,
        estudio_id=estudio_id,
        nombre=nombre,
        descripcion=descripcion,
        fecha=fecha_parsed,
        archivo_url=archivo_url,
        tipo_archivo=tipo_archivo,
        notas=notas,
        created_by=current_user.id
    )
    db.add(resultado)
    db.commit()
    db.refresh(resultado)

    return resultado


@router.post("/{resultado_id}/upload", response_model=ResultadoResponse)
async def subir_archivo_resultado(
    resultado_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_modulo('historia_clinica'))
):
    """Subir archivo para un resultado existente."""
    resultado = db.query(Resultado).filter(Resultado.id == resultado_id).first()

    if not resultado:
        raise HTTPException(status_code=404, detail="Resultado no encontrado")

    tipo_archivo = file.content_type
    if CLOUDINARY_CONFIGURED:
        try:
            contents = await file.read()
            result = cloudinary.uploader.upload(
                contents,
                folder=f"medestetica/resultados/{resultado.paciente_id}",
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

    resultado.archivo_url = archivo_url
    resultado.tipo_archivo = tipo_archivo
    db.commit()
    db.refresh(resultado)

    return resultado
