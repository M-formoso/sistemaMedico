# Schemas
from app.schemas.auth import Token, TokenPayload, LoginRequest
from app.schemas.paciente import (
    PacienteBase, PacienteCreate, PacienteUpdate, PacienteResponse,
    PacienteList, PacienteBrief, CrearCredencialesPaciente
)
from app.schemas.tratamiento import (
    TratamientoBase, TratamientoCreate, TratamientoUpdate,
    TratamientoResponse, TratamientoBrief
)
from app.schemas.material import (
    MaterialBase, MaterialCreate, MaterialUpdate, MaterialResponse,
    MaterialBrief, MovimientoStockBase, MovimientoStockCreate,
    MovimientoStockResponse, IngresoStock, AjusteStock, ValorInventario,
    TipoMovimiento
)
from app.schemas.sesion import (
    SesionBase, SesionCreate, SesionUpdate, SesionResponse,
    SesionMaterialResponse, SesionMaterialWithMaterial,
    MaterialUsado, AsignarMaterial, CambiarEstado,
    PacienteMinimal, TratamientoMinimal, MaterialMinimal
)
from app.schemas.pago import (
    PagoBase, PagoCreate, PagoUpdate, PagoResponse,
    PagoConPaciente, ResumenFinanciero
)
from app.schemas.egreso import (
    EgresoBase, EgresoCreate, EgresoUpdate, EgresoResponse,
    EgresosPorCategoria
)
