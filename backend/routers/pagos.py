from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, or_
from typing import List, Optional
from datetime import datetime
from database import get_db
import models, schemas
from pdf_generator import generar_recibo_pdf
from routers.auth import require_admin, get_current_user, get_empresa_id

router = APIRouter(
    prefix="/api/pagos",
    tags=["pagos"],
    dependencies=[Depends(require_admin)]
)

@router.get("", response_model=schemas.PaginatedPagos)
def read_pagos(
    request: Request,
    skip: int = 0, limit: int = 15,
    search: Optional[str] = None,
    fecha_inicio: Optional[datetime] = None,
    fecha_fin: Optional[datetime] = None,
    concepto: Optional[str] = None,
    edificio_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    empresa_id = get_empresa_id(request, current_user)
    query = db.query(models.Pago)
    
    # Unir Contrato y Inquilino siempre, ya que los necesitamos para la búsqueda de Inquilino
    query = query.join(models.Contrato).join(models.Inquilino)
    
    if empresa_id:
        # Filtrar pagos por empresa a través de contrato → inquilino
        query = query.filter(models.Inquilino.empresa_id == empresa_id)
        
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                models.Inquilino.nombre.ilike(search_filter),
                models.Inquilino.apellidos.ilike(search_filter)
            )
        )
        
    if fecha_inicio:
        query = query.filter(models.Pago.fecha_pago >= fecha_inicio)
        
    if fecha_fin:
        query = query.filter(models.Pago.fecha_pago <= fecha_fin)
        
    if concepto:
        query = query.filter(models.Pago.concepto == concepto)
        
    if edificio_id:
        query = query.join(models.Departamento, models.Contrato.departamento_id == models.Departamento.id).filter(
            models.Departamento.edificio_id == edificio_id
        )
        
    total = query.count()
    pagos = query.order_by(desc(models.Pago.fecha_pago)).offset(skip).limit(limit).all()
    
    return {
        "items": pagos,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.post("", response_model=schemas.Pago)
def create_pago(pago: schemas.PagoCreate, db: Session = Depends(get_db)):
    contrato = db.query(models.Contrato).filter(models.Contrato.id == pago.contrato_id).first()
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")
        
    db_pago = models.Pago(**pago.model_dump())
    db.add(db_pago)
    db.commit()
    db.refresh(db_pago)
    return db_pago

@router.get("/{pago_id}/recibo")
def descargar_recibo(pago_id: int, db: Session = Depends(get_db)):
    pago = db.query(models.Pago).filter(models.Pago.id == pago_id).first()
    if not pago:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
        
    contrato = pago.contrato
    inquilino = contrato.inquilino
    depto = contrato.departamento
    edificio = depto.edificio
    empresa = edificio.empresa
    
    meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
    mes_nombre = meses[pago.fecha_correspondiente.month - 1]
    periodo_str = f"{mes_nombre} {pago.fecha_correspondiente.year}"
    
    pago_data = {
        "id": pago.id,
        "fecha_emision": pago.fecha_pago.strftime("%d/%m/%Y"),
        "empresa_nombre": empresa.nombre,
        "inquilino_nombre": f"{inquilino.nombre} {inquilino.apellidos}",
        "inquilino_correo": inquilino.correo,
        "inquilino_telefono": inquilino.telefono,
        "edificio_nombre": edificio.nombre,
        "departamento_numero": depto.numero,
        "fecha_correspondiente": periodo_str,
        "concepto": pago.concepto if hasattr(pago, 'concepto') else 'Renta Mensual',
        "monto": float(pago.monto),
        "recargos": float(pago.recargos) if pago.recargos else 0.0
    }
    
    pdf_buffer = generar_recibo_pdf(pago_data)
    
    return StreamingResponse(
        pdf_buffer, 
        media_type="application/pdf", 
        headers={"Content-Disposition": f"attachment; filename=Recibo_{pago.id:04d}.pdf"}
    )
