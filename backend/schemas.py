from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from decimal import Decimal

# --- EMPRESAS ---
class EmpresaBase(BaseModel):
    nombre: str
    rfc: Optional[str] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    correo: Optional[str] = None
    logo_url: Optional[str] = None

class EmpresaCreate(EmpresaBase):
    # Opcionalmente crear con un admin inicial
    admin_nombre: Optional[str] = None
    admin_email: Optional[str] = None
    admin_password: Optional[str] = None

class Empresa(EmpresaBase):
    id: int
    activa: bool = True
    fecha_creacion: datetime

    class Config:
        from_attributes = True

# --- DEPARTAMENTOS ---
class DepartamentoBase(BaseModel):
    numero: str
    renta_mensual: Decimal
    inventario: Optional[str] = None
    estado: str = "Disponible"

class DepartamentoCreate(DepartamentoBase):
    pass

class Departamento(DepartamentoBase):
    id: int
    edificio_id: int

    class Config:
        from_attributes = True

# --- INQUILINOS ---
class InquilinoBase(BaseModel):
    nombre: str
    apellidos: str
    correo: Optional[str] = None
    telefono: Optional[str] = None
    datos_aval: Optional[str] = None

class InquilinoCreate(InquilinoBase):
    pass

class Inquilino(InquilinoBase):
    id: int
    empresa_id: int
    tiene_contrato_activo: bool = False
    
    class Config:
        from_attributes = True

# --- EDIFICIOS ---
class EdificioBase(BaseModel):
    nombre: str
    direccion: str

class EdificioCreate(EdificioBase):
    pass

class Edificio(EdificioBase):
    id: int
    empresa_id: int
    departamentos: List[Departamento] = []

    class Config:
        from_attributes = True

# --- CONTRATOS ---
class ContratoBase(BaseModel):
    inquilino_id: int
    departamento_id: int
    fecha_inicio: datetime
    fecha_fin: datetime
    monto_deposito: Optional[Decimal] = None
    estado: str = "Activo"

class ContratoCreate(ContratoBase):
    pass

class Contrato(ContratoBase):
    id: int

    class Config:
        from_attributes = True

class ContratoDetalle(Contrato):
    inquilino_nombre_completo: str
    departamento_numero: str
    edificio_nombre: str
    renta_mensual: Decimal

# --- PAGOS ---
class PagoBase(BaseModel):
    contrato_id: int
    fecha_correspondiente: datetime
    concepto: str = "Renta Mensual"
    monto: Decimal
    recargos: Optional[Decimal] = Decimal('0.00')
    estado: str = "Completado"

class PagoCreate(PagoBase):
    pass

class Pago(PagoBase):
    id: int
    fecha_pago: datetime
    recibo_pdf_url: Optional[str] = None

    class Config:
        from_attributes = True

class PaginatedPagos(BaseModel):
    items: List[Pago]
    total: int
    skip: int
    limit: int

# --- TICKETS MANTENIMIENTO ---
class TicketMantenimientoBase(BaseModel):
    descripcion: str
    estado: str = "Pendiente"
    costo_reparacion: Decimal = Decimal('0.00')

class TicketMantenimientoCreate(TicketMantenimientoBase):
    departamento_id: int

class TicketMantenimiento(TicketMantenimientoBase):
    id: int
    departamento_id: int
    fecha_reporte: datetime
    
    class Config:
        from_attributes = True

class TicketDetalle(TicketMantenimiento):
    departamento_numero: str
    edificio_nombre: str

# --- USUARIOS Y AUTH ---
class UsuarioBase(BaseModel):
    nombre: str
    email: str
    rol: str = "Administrador"
    activo: bool = True

class UsuarioCreate(UsuarioBase):
    password: str
    empresa_id: Optional[int] = None

class UsuarioOut(UsuarioBase):
    id: int
    empresa_id: Optional[int] = None
    empresa_nombre: Optional[str] = None
    fecha_creacion: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
