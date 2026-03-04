from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from datetime import datetime
from database import get_db
import models, schemas
from pdf_generator import generar_recibo_pdf
from routers.auth import require_admin, get_current_user

router = APIRouter(
    prefix="/api/pagos",
    tags=["pagos"],
    dependencies=[Depends(require_admin)]
)

@router.get("", response_model=List[schemas.Pago])
def read_pagos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # Devuelve los pagos más recientes primero
    pagos = db.query(models.Pago).order_by(desc(models.Pago.fecha_pago)).offset(skip).limit(limit).all()
    return pagos

@router.post("", response_model=schemas.Pago)
def create_pago(pago: schemas.PagoCreate, db: Session = Depends(get_db)):
    # Verificar que el contrato existe
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
    
    # Mapeo de meses en español
    meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
    mes_nombre = meses[pago.fecha_correspondiente.month - 1]
    periodo_str = f"{mes_nombre} {pago.fecha_correspondiente.year}"
    
    pago_data = {
        "id": pago.id,
        "fecha_emision": pago.fecha_pago.strftime("%d/%m/%Y"),
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
        headers={"Content-Disposition": f"attachment; filename=Recibo_Famesto_{pago.id:04d}.pdf"}
    )
