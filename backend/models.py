from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Numeric, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    rol = Column(String, default="Administrador") # Administrador, Asistente
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)

class Edificio(Base):
    __tablename__ = "edificios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True, nullable=False)
    direccion = Column(String, nullable=False)
    
    departamentos = relationship("Departamento", back_populates="edificio", cascade="all, delete-orphan")

class Departamento(Base):
    __tablename__ = "departamentos"

    id = Column(Integer, primary_key=True, index=True)
    edificio_id = Column(Integer, ForeignKey("edificios.id"), nullable=False)
    numero = Column(String, nullable=False)
    renta_mensual = Column(Numeric(10, 2), nullable=False)
    inventario = Column(Text)  # Describe qué incluye (e.g. Refrigerador, microondas)
    estado = Column(String, default="Disponible") # Disponible, Rentado, Mantenimiento
    
    edificio = relationship("Edificio", back_populates="departamentos")
    contratos = relationship("Contrato", back_populates="departamento")
    tickets = relationship("TicketMantenimiento", back_populates="departamento")

class Inquilino(Base):
    __tablename__ = "inquilinos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    apellidos = Column(String, nullable=False)
    correo = Column(String, unique=True, index=True)
    telefono = Column(String)
    datos_aval = Column(Text)  # Información del aval/fiador
    
    contratos = relationship("Contrato", back_populates="inquilino")

class Contrato(Base):
    __tablename__ = "contratos"

    id = Column(Integer, primary_key=True, index=True)
    inquilino_id = Column(Integer, ForeignKey("inquilinos.id"), nullable=False)
    departamento_id = Column(Integer, ForeignKey("departamentos.id"), nullable=False)
    fecha_inicio = Column(DateTime, nullable=False)
    fecha_fin = Column(DateTime, nullable=False)
    monto_deposito = Column(Numeric(10, 2))
    estado = Column(String, default="Activo") # Activo, Finalizado
    pdf_url = Column(String) # Ruta donde se guardará el contrato escaneado/digital
    
    inquilino = relationship("Inquilino", back_populates="contratos")
    departamento = relationship("Departamento", back_populates="contratos")
    pagos = relationship("Pago", back_populates="contrato")

class Pago(Base):
    __tablename__ = "pagos"

    id = Column(Integer, primary_key=True, index=True)
    contrato_id = Column(Integer, ForeignKey("contratos.id"), nullable=False)
    fecha_pago = Column(DateTime, default=datetime.utcnow)
    fecha_correspondiente = Column(DateTime, nullable=False) # Mes y año que cubre
    concepto = Column(String, default="Renta Mensual") # Renta Mensual, Depósito en Garantía, Multa
    monto = Column(Numeric(10, 2), nullable=False)
    recargos = Column(Numeric(10, 2), default=0)
    estado = Column(String, default="Completado") # Completado, Pendiente, Atrasado
    recibo_pdf_url = Column(String)
    
    contrato = relationship("Contrato", back_populates="pagos")

class TicketMantenimiento(Base):
    __tablename__ = "tickets_mantenimiento"

    id = Column(Integer, primary_key=True, index=True)
    departamento_id = Column(Integer, ForeignKey("departamentos.id"), nullable=False)
    descripcion = Column(Text, nullable=False)
    estado = Column(String, default="Pendiente") # Pendiente, En Reparacion, Resuelto
    costo_reparacion = Column(Numeric(10, 2), default=0)
    fecha_reporte = Column(DateTime, default=datetime.utcnow)
    
    departamento = relationship("Departamento", back_populates="tickets")
