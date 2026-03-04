from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from decimal import Decimal

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
    fecha_correspondiente: datetime  # Qué mes está pagando
    concepto: str = "Renta Mensual" # Renta Mensual, Depósito en Garantía
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

# Esquema para devolver un Ticket con información de su departamento y edificio
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

class UsuarioOut(UsuarioBase):
    id: int
    fecha_creacion: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
