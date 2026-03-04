from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas

router = APIRouter(
    prefix="/api/inquilinos",
    tags=["inquilinos"]
)

@router.get("", response_model=List[schemas.Inquilino])
def read_inquilinos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    inquilinos = db.query(models.Inquilino).offset(skip).limit(limit).all()
    
    # Evaluar estado activo de contratos para el frontend
    resultado = []
    for inq in inquilinos:
        inq_dict = schemas.Inquilino.model_validate(inq).model_dump()
        activo = any(c.estado == "Activo" for c in inq.contratos) if hasattr(inq, 'contratos') else False
        inq_dict['tiene_contrato_activo'] = activo
        resultado.append(inq_dict)
        
    return resultado

@router.get("/{inquilino_id}", response_model=schemas.Inquilino)
def read_inquilino(inquilino_id: int, db: Session = Depends(get_db)):
    inquilino = db.query(models.Inquilino).filter(models.Inquilino.id == inquilino_id).first()
    if inquilino is None:
        raise HTTPException(status_code=404, detail="Inquilino no encontrado")
        
    inq_dict = schemas.Inquilino.model_validate(inquilino).model_dump()
    inq_dict['tiene_contrato_activo'] = any(c.estado == "Activo" for c in inquilino.contratos)
    return inq_dict

@router.get("/{inquilino_id}/contrato_activo")
def read_inquilino_contrato_activo(inquilino_id: int, db: Session = Depends(get_db)):
    contrato = db.query(models.Contrato).filter(
        models.Contrato.inquilino_id == inquilino_id,
        models.Contrato.estado == "Activo"
    ).first()
    
    if not contrato:
        raise HTTPException(status_code=404, detail="No tiene contrato activo")
        
    return {
        "id": contrato.id,
        "inquilino_id": contrato.inquilino_id,
        "departamento_id": contrato.departamento_id,
        "fecha_inicio": contrato.fecha_inicio,
        "fecha_fin": contrato.fecha_fin,
        "monto_deposito": contrato.monto_deposito,
        "estado": contrato.estado,
        "inquilino_nombre_completo": f"{contrato.inquilino.nombre} {contrato.inquilino.apellidos}",
        "departamento_numero": contrato.departamento.numero,
        "edificio_nombre": contrato.departamento.edificio.nombre,
        "renta_mensual": contrato.departamento.renta_mensual
    }

@router.post("", response_model=schemas.Inquilino)
def create_inquilino(inquilino: schemas.InquilinoCreate, db: Session = Depends(get_db)):
    # Opcional: Validar si el correo ya existe
    if inquilino.correo:
        db_inq = db.query(models.Inquilino).filter(models.Inquilino.correo == inquilino.correo).first()
        if db_inq:
            raise HTTPException(status_code=400, detail="Correo electrónico ya registrado")
            
    db_inquilino = models.Inquilino(**inquilino.model_dump())
    db.add(db_inquilino)
    db.commit()
    db.refresh(db_inquilino)
    return db_inquilino

@router.delete("/{inquilino_id}")
def delete_inquilino(inquilino_id: int, db: Session = Depends(get_db)):
    inquilino = db.query(models.Inquilino).filter(models.Inquilino.id == inquilino_id).first()
    if not inquilino:
        raise HTTPException(status_code=404, detail="Inquilino no encontrado")
    
    db.delete(inquilino)
    db.commit()
    return {"message": "Inquilino eliminado exitosamente"}
