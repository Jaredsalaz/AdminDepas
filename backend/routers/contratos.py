from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List
from database import get_db
import models, schemas
from routers.auth import get_current_user, get_empresa_id
from contract_pdf import generar_contrato_pdf

router = APIRouter(
    prefix="/api/contratos",
    tags=["contratos"]
)

@router.get("", response_model=List[schemas.ContratoDetalle])
def read_contratos_activos(
    request: Request,
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    empresa_id = get_empresa_id(request, current_user)
    query = db.query(models.Contrato).filter(models.Contrato.estado == "Activo")
    
    if empresa_id:
        query = query.join(models.Inquilino).filter(
            models.Inquilino.empresa_id == empresa_id
        )
    
    contratos_activos = query.offset(skip).limit(limit).all()
    
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

@router.post("", response_model=schemas.Contrato)
def create_contrato(
    contrato: schemas.ContratoCreate,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
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

# ====== NOTIFICACIONES — Contratos por vencer ======
# (DEBE ir ANTES de las rutas /{contrato_id} para evitar conflicto de path matching)

@router.get("/notificaciones/vencimientos")
def get_contratos_por_vencer(
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    """
    Retorna contratos activos que vencen en los próximos 3 días.
    Se usa para la campanita de notificaciones.
    """
    empresa_id = get_empresa_id(request, current_user)
    hoy = datetime.utcnow().date()
    limite = hoy + timedelta(days=3)

    query = db.query(models.Contrato).filter(
        models.Contrato.estado == "Activo"
    )

    if empresa_id:
        query = query.join(models.Inquilino).filter(
            models.Inquilino.empresa_id == empresa_id
        )

    contratos = query.all()

    notificaciones = []
    for c in contratos:
        fecha_fin = c.fecha_fin.date() if hasattr(c.fecha_fin, 'date') else c.fecha_fin
        dias_restantes = (fecha_fin - hoy).days

        if dias_restantes <= 3:
            notificaciones.append({
                "tipo": "vencimiento_contrato",
                "contrato_id": c.id,
                "inquilino_nombre": f"{c.inquilino.nombre} {c.inquilino.apellidos}",
                "departamento": f"Depa {c.departamento.numero}",
                "edificio": c.departamento.edificio.nombre,
                "fecha_vencimiento": str(fecha_fin),
                "dias_restantes": dias_restantes,
                "mensaje": f"El contrato de {c.inquilino.nombre} {c.inquilino.apellidos} "
                          f"(Depa {c.departamento.numero}, {c.departamento.edificio.nombre}) "
                          f"{'vence hoy' if dias_restantes == 0 else f'vence en {dias_restantes} día(s)' if dias_restantes > 0 else 'ya venció'}"
            })

    return sorted(notificaciones, key=lambda x: x["dias_restantes"])


# ====== FINALIZAR CONTRATO (Normal — devuelve depósito) ======

@router.post("/{contrato_id}/finalizar")
def finalizar_contrato(
    contrato_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    empresa_id = get_empresa_id(request, current_user)
    contrato = db.query(models.Contrato).filter(models.Contrato.id == contrato_id).first()
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")
    
    if contrato.estado != "Activo":
        raise HTTPException(status_code=400, detail="Este contrato ya fue finalizado")

    # Verificar permisos por empresa
    if empresa_id:
        inquilino = contrato.inquilino
        if inquilino.empresa_id != empresa_id:
            raise HTTPException(status_code=403, detail="No tienes permiso")

    # 1. Finalizar contrato
    contrato.estado = "Finalizado"
    contrato.motivo_terminacion = "Finalización Normal"
    contrato.fecha_terminacion = datetime.utcnow()

    # 2. Liberar departamento a Mantenimiento
    depto = contrato.departamento
    depto.estado = "Mantenimiento"

    # 3. Crear pago de devolución de depósito (si hay depósito)
    pago_devolucion = None
    if contrato.monto_deposito and contrato.monto_deposito > 0:
        pago_devolucion = models.Pago(
            contrato_id=contrato.id,
            fecha_correspondiente=datetime.utcnow(),
            concepto="Devolución Depósito de Garantía",
            monto=contrato.monto_deposito,
            estado="Completado"
        )
        db.add(pago_devolucion)

    db.commit()

    return {
        "message": "Contrato finalizado exitosamente. Depósito devuelto al inquilino.",
        "contrato_id": contrato.id,
        "deposito_devuelto": float(contrato.monto_deposito or 0)
    }


# ====== INCUMPLIMIENTO DE CONTRATO (Sin devolución de depósito) ======

@router.post("/{contrato_id}/incumplimiento")
def incumplimiento_contrato(
    contrato_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    empresa_id = get_empresa_id(request, current_user)
    contrato = db.query(models.Contrato).filter(models.Contrato.id == contrato_id).first()
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")
    
    if contrato.estado != "Activo":
        raise HTTPException(status_code=400, detail="Este contrato ya fue finalizado")

    if empresa_id:
        inquilino = contrato.inquilino
        if inquilino.empresa_id != empresa_id:
            raise HTTPException(status_code=403, detail="No tienes permiso")

    # 1. Finalizar por incumplimiento
    contrato.estado = "Finalizado"
    contrato.motivo_terminacion = "Incumplimiento"
    contrato.fecha_terminacion = datetime.utcnow()

    # 2. Liberar departamento a Mantenimiento
    depto = contrato.departamento
    depto.estado = "Mantenimiento"

    # 3. NO se devuelve el depósito
    db.commit()

    return {
        "message": "Contrato terminado por incumplimiento. El depósito de garantía ha sido retenido.",
        "contrato_id": contrato.id,
        "deposito_retenido": float(contrato.monto_deposito or 0)
    }


# ====== DESCARGAR PDF DEL CONTRATO ======

@router.get("/{contrato_id}/pdf")
def descargar_contrato_pdf(
    contrato_id: int,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    contrato = db.query(models.Contrato).filter(models.Contrato.id == contrato_id).first()
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")

    inquilino = contrato.inquilino
    depto = contrato.departamento
    edificio = depto.edificio

    meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
             "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
    
    def format_date(dt):
        return f"{dt.day} de {meses[dt.month - 1]} de {dt.year}"

    # Obtener empresa del edificio
    empresa = edificio.empresa

    contrato_data = {
        "contrato_id": contrato.id,
        "empresa_nombre": empresa.nombre,
        "inquilino_nombre": inquilino.nombre,
        "inquilino_apellidos": inquilino.apellidos,
        "departamento_numero": depto.numero,
        "edificio_nombre": edificio.nombre,
        "edificio_direccion": edificio.direccion,
        "renta_mensual": float(depto.renta_mensual),
        "monto_deposito": float(contrato.monto_deposito or 0),
        "fecha_inicio": format_date(contrato.fecha_inicio),
        "fecha_fin": format_date(contrato.fecha_fin),
    }

    pdf_buffer = generar_contrato_pdf(contrato_data)

    nombre_archivo = f"Contrato_{contrato.id:04d}_{inquilino.apellidos}.pdf"
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={nombre_archivo}"}
    )
