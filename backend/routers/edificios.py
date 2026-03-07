from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas
from routers.auth import get_current_user, get_empresa_id

router = APIRouter(
    prefix="/api/edificios",
    tags=["edificios"]
)

@router.get("")
def read_edificios(
    request: Request,
    page: int = 1, per_page: int = 9,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    empresa_id = get_empresa_id(request, current_user)
    query = db.query(models.Edificio)
    if empresa_id:
        query = query.filter(models.Edificio.empresa_id == empresa_id)
    
    total = query.count()
    skip = (page - 1) * per_page
    items = query.offset(skip).limit(per_page).all()
    
    # Serializar manualmente para incluir departamentos
    edificios_out = []
    for ed in items:
        edificios_out.append({
            "id": ed.id,
            "empresa_id": ed.empresa_id,
            "nombre": ed.nombre,
            "direccion": ed.direccion,
            "departamentos": [
                {
                    "id": d.id,
                    "edificio_id": d.edificio_id,
                    "numero": d.numero,
                    "renta_mensual": float(d.renta_mensual),
                    "inventario": d.inventario,
                    "estado": d.estado
                } for d in ed.departamentos
            ]
        })
    
    return {
        "items": edificios_out,
        "total": total,
        "page": page,
        "pages": (total + per_page - 1) // per_page if total > 0 else 1
    }

@router.post("", response_model=schemas.Edificio)
def create_edificio(
    edificio: schemas.EdificioCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    empresa_id = get_empresa_id(request, current_user)
    if not empresa_id:
        raise HTTPException(status_code=400, detail="Se requiere empresa_id. SuperAdmin debe enviar header X-Empresa-Id.")
    
    # Validar limite de edificios segun plan de suscripción
    empresa = db.query(models.Empresa).filter(models.Empresa.id == empresa_id).first()
    if empresa and empresa.plan and empresa.plan.limite_edificios is not None:
        total_edificios = db.query(models.Edificio).filter(models.Edificio.empresa_id == empresa_id).count()
        if total_edificios >= empresa.plan.limite_edificios:
            raise HTTPException(status_code=403, detail="PLAN_LIMIT_REACHED")

    db_edificio = models.Edificio(
        empresa_id=empresa_id,
        nombre=edificio.nombre,
        direccion=edificio.direccion
    )
    db.add(db_edificio)
    db.commit()
    db.refresh(db_edificio)
    return db_edificio

@router.get("/{edificio_id}", response_model=schemas.Edificio)
def read_edificio(
    edificio_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    empresa_id = get_empresa_id(request, current_user)
    query = db.query(models.Edificio).filter(models.Edificio.id == edificio_id)
    if empresa_id:
        query = query.filter(models.Edificio.empresa_id == empresa_id)
    edificio = query.first()
    if not edificio:
        raise HTTPException(status_code=404, detail="Edificio no encontrado")
    return edificio

@router.post("/{edificio_id}/departamentos", response_model=schemas.Departamento)
def create_departamento(
    edificio_id: int,
    depto: schemas.DepartamentoCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    empresa_id = get_empresa_id(request, current_user)
    query = db.query(models.Edificio).filter(models.Edificio.id == edificio_id)
    if empresa_id:
        query = query.filter(models.Edificio.empresa_id == empresa_id)
    edificio = query.first()
    if not edificio:
        raise HTTPException(status_code=404, detail="Edificio no encontrado")

    db_depto = models.Departamento(
        edificio_id=edificio_id,
        numero=depto.numero,
        renta_mensual=depto.renta_mensual,
        inventario=depto.inventario,
        estado=depto.estado
    )
    db.add(db_depto)
    db.commit()
    db.refresh(db_depto)
    return db_depto

@router.put("/departamentos/{depto_id}", response_model=schemas.Departamento)
def update_departamento(
    depto_id: int,
    depto_update: schemas.DepartamentoCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    empresa_id = get_empresa_id(request, current_user)
    depto = db.query(models.Departamento).filter(models.Departamento.id == depto_id).first()
    if not depto:
        raise HTTPException(status_code=404, detail="Departamento no encontrado")
    
    # Verificar que el edificio pertenece a la empresa del usuario
    if empresa_id:
        edificio = db.query(models.Edificio).filter(
            models.Edificio.id == depto.edificio_id,
            models.Edificio.empresa_id == empresa_id
        ).first()
        if not edificio:
            raise HTTPException(status_code=403, detail="No tienes permiso para modificar este departamento")
    
    # Validar que no se intente quitar el estado "Rentado" si hay un contrato activo
    if depto.estado == "Rentado" and depto_update.estado != "Rentado":
        contratos_activos = db.query(models.Contrato).filter(
            models.Contrato.departamento_id == depto_id,
            models.Contrato.estado == "Activo"
        ).first()
        if contratos_activos:
            raise HTTPException(
                status_code=400, 
                detail="No puedes cambiar el estado del departamento porque tiene un contrato activo. Finaliza el contrato primero."
            )
    
    depto.numero = depto_update.numero
    depto.renta_mensual = depto_update.renta_mensual
    depto.inventario = depto_update.inventario
    depto.estado = depto_update.estado
    db.commit()
    db.refresh(depto)
    return depto

@router.delete("/departamentos/{depto_id}")
def delete_departamento(
    depto_id: int,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    depto = db.query(models.Departamento).filter(models.Departamento.id == depto_id).first()
    if not depto:
        raise HTTPException(status_code=404, detail="Departamento no encontrado")
    
    if depto.estado == "Rentado":
        raise HTTPException(status_code=400, detail="No se puede eliminar un departamento que está actualmente rentado.")
    
    # También verificar si tiene contratos activos (por si el estado quedó desincronizado)
    contratos_activos = db.query(models.Contrato).filter(
        models.Contrato.departamento_id == depto_id,
        models.Contrato.estado == "Activo"
    ).first()
    if contratos_activos:
        raise HTTPException(status_code=400, detail="No se puede eliminar porque tiene un contrato activo asociado.")
    
    db.delete(depto)
    db.commit()
    return {"message": "Departamento eliminado"}

