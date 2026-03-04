from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
from database import get_db
import models, schemas

router = APIRouter(
    prefix="/api/contratos",
    tags=["contratos"]
)

@router.get("/", response_model=List[schemas.ContratoDetalle])
def read_contratos_activos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # Útil para el formulario de registrar nuevo pago
    contratos_activos = db.query(models.Contrato).filter(models.Contrato.estado == "Activo").offset(skip).limit(limit).all()
    
    detalles = []
    for c in contratos_activos:
        detalles.append({
            "id": c.id,
            "inquilino_id": c.inquilino_id,
            "departamento_id": c.departamento_id,
            "fecha_inicio": c.fecha_inicio,
            "fecha_fin": c.fecha_fin,
            "monto_deposito": c.monto_deposito,
            "estado": c.estado,
            "inquilino_nombre_completo": f"{c.inquilino.nombre} {c.inquilino.apellidos}",
            "departamento_numero": c.departamento.numero,
            "edificio_nombre": c.departamento.edificio.nombre,
            "renta_mensual": c.departamento.renta_mensual
        })
    return detalles

@router.post("/", response_model=schemas.Contrato)
def create_contrato(contrato: schemas.ContratoCreate, db: Session = Depends(get_db)):
    # 1. Verificar Inquilino
    inquilino = db.query(models.Inquilino).filter(models.Inquilino.id == contrato.inquilino_id).first()
    if not inquilino:
        raise HTTPException(status_code=404, detail="Inquilino no encontrado")
        
    # 1.5 Verificar que el inquilino no tenga ya un contrato activo
    contrato_existente = db.query(models.Contrato).filter(
        models.Contrato.inquilino_id == contrato.inquilino_id,
        models.Contrato.estado == "Activo"
    ).first()
    
    if contrato_existente:
        raise HTTPException(status_code=400, detail="Este inquilino ya tiene un contrato activo. Finalícelo primero antes de asignarle otro.")

    # 2. Verificar Departamento
    depto = db.query(models.Departamento).filter(models.Departamento.id == contrato.departamento_id).first()
    if not depto:
        raise HTTPException(status_code=404, detail="Departamento no encontrado")
        
    if depto.estado != "Disponible":
        raise HTTPException(status_code=400, detail="El departamento no está disponible para rentar")
        
    # 3. Crear el contrato
    db_contrato = models.Contrato(**contrato.model_dump())
    db.add(db_contrato)
    
    # 4. Actualizar estado del departamento a "Rentado"
    depto.estado = "Rentado"
    
    db.commit()
    db.refresh(db_contrato)
    
    # 5. Registrar automáticamente el pago del depósito si existe
    if db_contrato.monto_deposito and db_contrato.monto_deposito > 0:
        db_pago_deposito = models.Pago(
            contrato_id=db_contrato.id,
            fecha_correspondiente=db_contrato.fecha_inicio,
            concepto="Depósito en Garantía",
            monto=db_contrato.monto_deposito,
            estado="Completado"
        )
        db.add(db_pago_deposito)
        db.commit()
        
    return db_contrato
