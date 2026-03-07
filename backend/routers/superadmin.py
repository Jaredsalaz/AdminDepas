from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models
import schemas
from routers.auth import get_current_user, get_password_hash

router = APIRouter(
    prefix="/api/superadmin",
    tags=["superadmin"]
)

# Dependency to check if user is SuperAdmin
def check_is_superadmin(current_user: models.Usuario = Depends(get_current_user)):
    if current_user.empresa_id is not None or current_user.rol.lower() != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren privilegios de SuperAdmin para acceder a este recurso"
        )
    return current_user

# --- PLANES DE SUSCRIPCIÓN ---
@router.get("/planes", response_model=List[schemas.PlanSuscripcion])
def get_planes(
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(check_is_superadmin)
):
    return db.query(models.PlanSuscripcion).all()

@router.post("/planes", response_model=schemas.PlanSuscripcion)
def create_plan(
    plan: schemas.PlanSuscripcionCreate,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(check_is_superadmin)
):
    existing = db.query(models.PlanSuscripcion).filter(models.PlanSuscripcion.nombre == plan.nombre).first()
    if existing:
        raise HTTPException(status_code=400, detail="El plan ya existe")
    db_plan = models.PlanSuscripcion(**plan.model_dump())
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan

@router.put("/planes/{plan_id}", response_model=schemas.PlanSuscripcion)
def update_plan(
    plan_id: int,
    plan_data: schemas.PlanSuscripcionBase,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(check_is_superadmin)
):
    db_plan = db.query(models.PlanSuscripcion).filter(models.PlanSuscripcion.id == plan_id).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    
    for key, value in plan_data.model_dump(exclude_unset=True).items():
        setattr(db_plan, key, value)
    
    db.commit()
    db.refresh(db_plan)
    return db_plan

# --- TIPOS DE PAGO ---
@router.get("/tipos-pago", response_model=List[schemas.TipoPago])
def get_tipos_pago(
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(check_is_superadmin)
):
    return db.query(models.TipoPago).all()

@router.post("/tipos-pago", response_model=schemas.TipoPago)
def create_tipo_pago(
    tipo: schemas.TipoPagoCreate,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(check_is_superadmin)
):
    existing = db.query(models.TipoPago).filter(models.TipoPago.nombre == tipo.nombre).first()
    if existing:
        raise HTTPException(status_code=400, detail="El tipo de pago ya existe")
    db_tipo = models.TipoPago(**tipo.model_dump())
    db.add(db_tipo)
    db.commit()
    db.refresh(db_tipo)
    return db_tipo

@router.put("/tipos-pago/{tipo_id}", response_model=schemas.TipoPago)
def update_tipo_pago(
    tipo_id: int,
    tipo_data: schemas.TipoPagoBase,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(check_is_superadmin)
):
    db_tipo = db.query(models.TipoPago).filter(models.TipoPago.id == tipo_id).first()
    if not db_tipo:
        raise HTTPException(status_code=404, detail="Tipo de pago no encontrado")
    
    for key, value in tipo_data.model_dump(exclude_unset=True).items():
        setattr(db_tipo, key, value)
    
    db.commit()
    db.refresh(db_tipo)
    return db_tipo

# --- GESTIÓN DE EMPRESAS (SaaS) ---
@router.get("/empresas", response_model=List[schemas.Empresa])
def get_all_empresas(
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(check_is_superadmin)
):
    # Returning all companies with their associated plan to manage them as a SaaS
    return db.query(models.Empresa).all()

@router.post("/empresas", response_model=schemas.Empresa)
def create_empresa_saas(
    empresa: schemas.EmpresaCreate,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(check_is_superadmin)
):
    # Verificar RFC o correo
    if empresa.rfc:
        existing = db.query(models.Empresa).filter(models.Empresa.rfc == empresa.rfc).first()
        if existing:
            raise HTTPException(status_code=400, detail="El RFC ya está registrado en otra empresa")
            
    # Crear Empresa
    db_empresa = models.Empresa(
        nombre=empresa.nombre,
        rfc=empresa.rfc,
        direccion=empresa.direccion,
        telefono=empresa.telefono,
        correo=empresa.correo,
        logo_url=empresa.logo_url,
        plan_id=empresa.plan_id,
        estado_suscripcion=empresa.estado_suscripcion,
        fecha_vencimiento=empresa.fecha_vencimiento
    )
    db.add(db_empresa)
    db.commit()
    db.refresh(db_empresa)
    
    # Crear Administrador Inicial si se proporcionaron datos
    if empresa.admin_email and empresa.admin_password and empresa.admin_nombre:
        admin_email_lower = empresa.admin_email.lower()
        # Verificar correo de admin
        exist_user = db.query(models.Usuario).filter(models.Usuario.email == admin_email_lower).first()
        if exist_user:
            raise HTTPException(status_code=400, detail="El correo del administrador inicial ya está registrado en otro usuario")
            
        hashed_password = get_password_hash(empresa.admin_password)
        db_user = models.Usuario(
            empresa_id=db_empresa.id,
            nombre=empresa.admin_nombre,
            email=admin_email_lower,
            hashed_password=hashed_password,
            rol="Administrador"
        )
        db.add(db_user)
        db.commit()
    
    return db_empresa

@router.put("/empresas/{empresa_id}", response_model=schemas.Empresa)
def update_empresa_saas(
    empresa_id: int,
    empresa_data: schemas.EmpresaCreate,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(check_is_superadmin)
):
    db_emp = db.query(models.Empresa).filter(models.Empresa.id == empresa_id).first()
    if not db_emp:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
        
    if empresa_data.rfc and empresa_data.rfc != db_emp.rfc:
        existing = db.query(models.Empresa).filter(models.Empresa.rfc == empresa_data.rfc).first()
        if existing:
            raise HTTPException(status_code=400, detail="El RFC ya está registrado en otra empresa")

    db_emp.nombre = empresa_data.nombre
    db_emp.rfc = empresa_data.rfc
    db_emp.direccion = empresa_data.direccion
    db_emp.telefono = empresa_data.telefono
    db_emp.correo = empresa_data.correo
    db_emp.logo_url = empresa_data.logo_url
    
    db.commit()
    db.refresh(db_emp)
    return db_emp

class PasswordResetPayload(schemas.BaseModel):
    user_id: int
    new_password: str

@router.post("/empresas/{empresa_id}/reset-password")
def reset_admin_password(
    empresa_id: int,
    payload: PasswordResetPayload,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(check_is_superadmin)
):
    # Verify the user belongs to the company
    user = db.query(models.Usuario).filter(models.Usuario.id == payload.user_id, models.Usuario.empresa_id == empresa_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado o no pertenece a la empresa especificada")
        
    hashed_password = get_password_hash(payload.new_password)
    user.hashed_password = hashed_password
    db.commit()
    return {"message": f"Contraseña actualizada para {user.email}"}

@router.put("/empresas/{empresa_id}/suscripcion", response_model=schemas.Empresa)
def update_empresa_suscripcion(
    empresa_id: int,
    data: dict,  # Expecting: plan_id, estado_suscripcion, fecha_vencimiento
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(check_is_superadmin)
):
    db_emp = db.query(models.Empresa).filter(models.Empresa.id == empresa_id).first()
    if not db_emp:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    
    if "plan_id" in data:
        db_emp.plan_id = data["plan_id"]
    if "estado_suscripcion" in data:
        db_emp.estado_suscripcion = data["estado_suscripcion"]
    if "fecha_vencimiento" in data:
        db_emp.fecha_vencimiento = data["fecha_vencimiento"]
        
    db.commit()
    db.refresh(db_emp)
    return db_emp

# --- DASHBOARD METRICS ---
@router.get("/dashboard-metrics")
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(check_is_superadmin)
):
    import datetime
    
    total_empresas = db.query(models.Empresa).count()
    empresas_activas = db.query(models.Empresa).filter(models.Empresa.estado_suscripcion == "Activa").count()
    
    # Calculate MRR (Monthly Recurring Revenue) based on active companies and their plans
    # Note: SQLite might need some mapping if numeric types aren't fully supported without float casting. 
    # But usually simple operations work.
    activas = db.query(models.Empresa).filter(models.Empresa.estado_suscripcion == "Activa").all()
    mrr = sum((emp.plan.precio_mensual for emp in activas if emp.plan), 0)
    
    # Próximos vencimientos (en los próximos 30 días)
    hoy = datetime.datetime.utcnow()
    treinta_dias = hoy + datetime.timedelta(days=30)
    proximos_vence = db.query(models.Empresa).filter(
        models.Empresa.fecha_vencimiento >= hoy,
        models.Empresa.fecha_vencimiento <= treinta_dias
    ).all()
    
    return {
        "total_empresas": total_empresas,
        "empresas_activas": empresas_activas,
        "mrr": float(mrr),
        "alertas_vencimiento": [
            {
                "empresa_nombre": emp.nombre,
                "fecha_vencimiento": emp.fecha_vencimiento
            } for emp in proximos_vence
        ]
    }
