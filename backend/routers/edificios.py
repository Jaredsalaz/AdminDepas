from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas

router = APIRouter(
    prefix="/api/edificios",
    tags=["edificios"]
)

@router.get("/", response_model=List[schemas.Edificio])
def read_edificios(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    edificios = db.query(models.Edificio).offset(skip).limit(limit).all()
    return edificios

@router.post("/", response_model=schemas.Edificio)
def create_edificio(edificio: schemas.EdificioCreate, db: Session = Depends(get_db)):
    db_edificio = models.Edificio(nombre=edificio.nombre, direccion=edificio.direccion)
    db.add(db_edificio)
    db.commit()
    db.refresh(db_edificio)
    return db_edificio

@router.get("/{edificio_id}", response_model=schemas.Edificio)
def read_edificio(edificio_id: int, db: Session = Depends(get_db)):
    edificio = db.query(models.Edificio).filter(models.Edificio.id == edificio_id).first()
    if edificio is None:
        raise HTTPException(status_code=404, detail="Edificio no encontrado")
    return edificio

# --- DEPARTAMENTOS ---

@router.post("/{edificio_id}/departamentos", response_model=schemas.Departamento)
def create_departamento(edificio_id: int, depto: schemas.DepartamentoCreate, db: Session = Depends(get_db)):
    # Verificar que el edificio exista
    edificio = db.query(models.Edificio).filter(models.Edificio.id == edificio_id).first()
    if not edificio:
        raise HTTPException(status_code=404, detail="Edificio no encontrado")
        
    db_depto = models.Departamento(**depto.model_dump(), edificio_id=edificio_id)
    db.add(db_depto)
    db.commit()
    db.refresh(db_depto)
    return db_depto

@router.delete("/departamentos/{depto_id}")
def delete_departamento(depto_id: int, db: Session = Depends(get_db)):
    db_depto = db.query(models.Departamento).filter(models.Departamento.id == depto_id).first()
    if not db_depto:
        raise HTTPException(status_code=404, detail="Departamento no encontrado")
        
    db.delete(db_depto)
    db.commit()
    return {"message": "Departamento eliminado exitosamente"}
