from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
import models
from routers.auth import get_current_user, get_empresa_id
from dateutil.relativedelta import relativedelta

router = APIRouter(
    prefix="/api/cobranza",
    tags=["cobranza"]
)

@router.get("/estado_cuenta")
def get_estado_cuenta(
    request: Request,
    skip: int = 0,
    limit: int = 15,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    empresa_id = get_empresa_id(request, current_user)
    
    query = db.query(models.Contrato).filter(models.Contrato.estado == "Activo")
    if empresa_id:
        query = query.join(models.Inquilino).filter(models.Inquilino.empresa_id == empresa_id)
        
    total = query.count()
    contratos = query.offset(skip).limit(limit).all()
    hoy = datetime.utcnow().date()
    
    resultados = []
    
    for c in contratos:
        fecha_inc = c.fecha_inicio.date() if isinstance(c.fecha_inicio, datetime) else c.fecha_inicio
        delta = relativedelta(hoy, fecha_inc)
        
        # Cada vez que inicia un periodo nuevo, se espera un pago
        meses_esperados = delta.years * 12 + delta.months + 1
        
        pagos_completados = sum(1 for p in c.pagos if p.concepto == "Renta Mensual" and p.estado == "Completado")
        
        meses_adeudados = meses_esperados - pagos_completados
        
        if meses_adeudados > 0:
            estado = "Morosos"
        elif meses_adeudados == 0:
            estado = "Al corriente"
        else:
            estado = "Adelantado"
            
        renta = float(c.departamento.renta_mensual)
        monto_adeudado = max(0, meses_adeudados) * renta
        
        proximo_pago = fecha_inc + relativedelta(months=pagos_completados)
        dias_atraso = 0
        
        if meses_adeudados > 0:
            dias_atraso_calc = (hoy - proximo_pago).days
            dias_atraso = max(0, dias_atraso_calc)
        
        resultados.append({
            "contrato_id": c.id,
            "inquilino_nombre": f"{c.inquilino.nombre} {c.inquilino.apellidos}",
            "departamento_numero": c.departamento.numero,
            "edificio_nombre": c.departamento.edificio.nombre,
            "renta_mensual": renta,
            "estado": estado,
            "meses_adeudados": meses_adeudados,
            "monto_adeudado": monto_adeudado,
            "proximo_pago": proximo_pago.isoformat(),
            "dias_atraso": dias_atraso
        })
        
    return {
        "items": resultados,
        "total": total,
        "skip": skip,
        "limit": limit
    }
