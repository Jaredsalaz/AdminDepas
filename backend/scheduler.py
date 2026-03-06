from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, date
from sqlalchemy.orm import Session
from database import SessionLocal
import models
from email_service import send_email, build_rent_reminder_email

def check_and_send_rent_reminders():
    """
    Se ejecuta diariamente a las 8 AM.
    Busca todos los contratos activos cuya fecha de cobro coincide con hoy
    y envía recordatorio al inquilino si aún no ha pagado este mes.
    """
    hoy = date.today()
    print(f"[Scheduler] Verificando recordatorios de renta para: {hoy}")

    db: Session = SessionLocal()
    try:
        contratos_activos = db.query(models.Contrato).filter(
            models.Contrato.estado == "Activo"
        ).all()

        enviados = 0
        for contrato in contratos_activos:
            # El día de cobro mensual es el mismo día que inició el contrato
            dia_cobro = contrato.fecha_inicio.day

            # ¿Este mes le toca pagar hoy?
            if hoy.day != dia_cobro:
                continue

            # Verificar si ya pagó este mes (renta mensual, no depósito)
            ya_pago = db.query(models.Pago).filter(
                models.Pago.contrato_id == contrato.id,
                models.Pago.concepto == "Renta Mensual",
                models.Pago.estado == "Completado",
                # Pagos del mes y año actual
            ).filter(
                models.Pago.fecha_correspondiente >= datetime(hoy.year, hoy.month, 1)
            ).first()

            if ya_pago:
                print(f"[Scheduler] Inquilino {contrato.inquilino.nombre} ya pagó este mes, omitiendo.")
                continue

            # Verificar que el inquilino tiene correo
            inquilino = contrato.inquilino
            if not inquilino.correo:
                print(f"[Scheduler] {inquilino.nombre} no tiene correo registrado, omitiendo.")
                continue

            # Construir y enviar el correo
            depto = contrato.departamento
            edificio = depto.edificio
            html = build_rent_reminder_email(
                inquilino_nombre=f"{inquilino.nombre} {inquilino.apellidos}",
                depto_numero=depto.numero,
                edificio_nombre=edificio.nombre,
                monto_renta=float(depto.renta_mensual),
                fecha_vencimiento=hoy.strftime("%d de %B de %Y")
            )

            enviado = send_email(
                to=inquilino.correo,
                subject=f"🏠 Recordatorio de Pago - {hoy.strftime('%d/%m/%Y')} - Depto {depto.numero}",
                html_body=html
            )
            if enviado:
                enviados += 1

        print(f"[Scheduler] ✅ Recordatorios enviados hoy: {enviados}")

    except Exception as e:
        print(f"[Scheduler] ❌ Error en recordatorios: {e}")
    finally:
        db.close()


def crear_scheduler() -> BackgroundScheduler:
    """Crea y configura el scheduler de APScheduler."""
    scheduler = BackgroundScheduler(timezone="America/Mexico_City")
    
    # Ejecutar todos los días a las 8:00 AM hora de México
    scheduler.add_job(
        check_and_send_rent_reminders,
        trigger=CronTrigger(hour=8, minute=0),
        id="recordatorio_renta",
        name="Recordatorio de Renta Mensual",
        replace_existing=True
    )
    
    return scheduler
