from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas
from routers.auth import get_current_user, require_superadmin, get_password_hash

router = APIRouter(
    prefix="/api/empresas",
    tags=["empresas"]
)

@router.get("/planes/suscripcion", response_model=List[schemas.PlanSuscripcion])
def get_planes_public(
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    return db.query(models.PlanSuscripcion).all()

@router.get("", response_model=List[schemas.Empresa])
def list_empresas(
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(require_superadmin)
):
    return db.query(models.Empresa).all()

@router.post("", response_model=schemas.Empresa)
def create_empresa(
    empresa: schemas.EmpresaCreate,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(require_superadmin)
):
    # Verificar RFC duplicado si se proporcionó
    if empresa.rfc:
        existing = db.query(models.Empresa).filter(models.Empresa.rfc == empresa.rfc).first()
        if existing:
            raise HTTPException(status_code=400, detail="Ya existe una empresa con ese RFC")

    db_empresa = models.Empresa(
        nombre=empresa.nombre,
        rfc=empresa.rfc,
        direccion=empresa.direccion,
        telefono=empresa.telefono,
        correo=empresa.correo,
        logo_url=empresa.logo_url,
    )
    db.add(db_empresa)
    db.commit()
    db.refresh(db_empresa)

    # Si se proporcionó info del admin, crear el usuario admin de la empresa
    if empresa.admin_email and empresa.admin_password:
        existing_user = db.query(models.Usuario).filter(models.Usuario.email == empresa.admin_email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="El correo del admin ya está registrado en otra empresa")
        
        admin_user = models.Usuario(
            empresa_id=db_empresa.id,
            nombre=empresa.admin_nombre or empresa.nombre,
            email=empresa.admin_email,
            hashed_password=get_password_hash(empresa.admin_password),
            rol="Administrador"
        )
        db.add(admin_user)
        db.commit()

    return db_empresa

@router.get("/{empresa_id}", response_model=schemas.Empresa)
def get_empresa(
    empresa_id: int,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(require_superadmin)
):
    empresa = db.query(models.Empresa).filter(models.Empresa.id == empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    return empresa

@router.put("/{empresa_id}", response_model=schemas.Empresa)
def update_empresa(
    empresa_id: int,
    empresa_data: schemas.EmpresaBase,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(require_superadmin)
):
    empresa = db.query(models.Empresa).filter(models.Empresa.id == empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    
    for key, value in empresa_data.model_dump().items():
        setattr(empresa, key, value)
    
    db.commit()
    db.refresh(empresa)
    return empresa

@router.delete("/{empresa_id}")
def delete_empresa(
    empresa_id: int,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(require_superadmin)
):
    empresa = db.query(models.Empresa).filter(models.Empresa.id == empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    
    empresa.activa = False
    db.commit()
    return {"message": f"Empresa '{empresa.nombre}' desactivada exitosamente"}
