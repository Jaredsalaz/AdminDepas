from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas
from routers.auth import get_current_user, get_empresa_id

router = APIRouter(
    prefix="/api/inquilinos",
    tags=["inquilinos"]
)

@router.get("", response_model=List[schemas.Inquilino])
def read_inquilinos(
    request: Request,
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    empresa_id = get_empresa_id(request, current_user)
    query = db.query(models.Inquilino)
    if empresa_id:
        query = query.filter(models.Inquilino.empresa_id == empresa_id)
    
    inquilinos = query.offset(skip).limit(limit).all()
    
    result = []
    for inq in inquilinos:
        tiene_contrato = any(c.estado == "Activo" for c in inq.contratos)
        inq_dict = {
            "id": inq.id,
            "empresa_id": inq.empresa_id,
            "nombre": inq.nombre,
            "apellidos": inq.apellidos,
            "correo": inq.correo,
            "telefono": inq.telefono,
            "datos_aval": inq.datos_aval,
            "tiene_contrato_activo": tiene_contrato
        }
        result.append(inq_dict)
    return result

@router.get("/{inquilino_id}", response_model=schemas.Inquilino)
def read_inquilino(
    inquilino_id: int,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    inquilino = db.query(models.Inquilino).filter(models.Inquilino.id == inquilino_id).first()
    if not inquilino:
        raise HTTPException(status_code=404, detail="Inquilino no encontrado")
    return inquilino

@router.get("/{inquilino_id}/contrato_activo")
def get_contrato_activo(
    inquilino_id: int,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    contrato = db.query(models.Contrato).filter(
        models.Contrato.inquilino_id == inquilino_id,
        models.Contrato.estado == "Activo"
    ).first()
    
    if not contrato:
        raise HTTPException(status_code=404, detail="No se encontró contrato activo")
    
    return {
        "id": contrato.id,
        "departamento_numero": contrato.departamento.numero,
        "edificio_nombre": contrato.departamento.edificio.nombre,
        "fecha_inicio": contrato.fecha_inicio,
        "fecha_fin": contrato.fecha_fin,
        "monto_deposito": contrato.monto_deposito,
        "renta_mensual": contrato.departamento.renta_mensual,
        "estado": contrato.estado
    }

@router.post("", response_model=schemas.Inquilino)
def create_inquilino(
    inquilino: schemas.InquilinoCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    empresa_id = get_empresa_id(request, current_user)
    if not empresa_id:
        raise HTTPException(status_code=400, detail="Se requiere empresa_id")
    
    if inquilino.correo:
        existing = db.query(models.Inquilino).filter(models.Inquilino.correo == inquilino.correo).first()
        if existing:
            raise HTTPException(status_code=400, detail="Ya existe un inquilino con ese correo")
    
    db_inquilino = models.Inquilino(
        empresa_id=empresa_id,
        **inquilino.model_dump()
    )
    db.add(db_inquilino)
    db.commit()
    db.refresh(db_inquilino)
    return db_inquilino

@router.delete("/{inquilino_id}")
def delete_inquilino(
    inquilino_id: int,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    inquilino = db.query(models.Inquilino).filter(models.Inquilino.id == inquilino_id).first()
    if not inquilino:
        raise HTTPException(status_code=404, detail="Inquilino no encontrado")
    
    contratos_activos = [c for c in inquilino.contratos if c.estado == "Activo"]
    if contratos_activos:
        raise HTTPException(status_code=400, detail="No se puede eliminar un inquilino con contrato activo")
    
    db.delete(inquilino)
    db.commit()
    return {"message": "Inquilino eliminado exitosamente"}
