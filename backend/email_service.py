import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
import os
from dotenv import load_dotenv

load_dotenv()

GMAIL_USER = os.getenv("GMAIL_USER", "jared.salazar65@unach.mx")
GMAIL_PASSWORD = os.getenv("GMAIL_PASSWORD", "wagy qtiz xjrb tsco")

def send_email(to: str, subject: str, html_body: str, attachment: bytes = None, attachment_name: str = None) -> bool:
    """Envía un correo HTML via Gmail SMTP con adjunto opcional. Retorna True si fue exitoso."""
    try:
        msg = MIMEMultipart("mixed")
        msg["Subject"] = subject
        msg["From"] = f"DepaAdmin PMS <{GMAIL_USER}>"
        msg["To"] = to

        # Añadir el cuerpo HTML
        msg_body = MIMEMultipart("alternative")
        msg_body.attach(MIMEText(html_body, "html"))
        msg.attach(msg_body)

        # Añadir el PDF adjunto si existe
        if attachment and attachment_name:
            part = MIMEApplication(attachment, Name=attachment_name)
            part['Content-Disposition'] = f'attachment; filename="{attachment_name}"'
            msg.attach(part)

        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.ehlo()
            server.starttls()
            server.login(GMAIL_USER, GMAIL_PASSWORD)
            server.sendmail(GMAIL_USER, to, msg.as_string())

        print(f"✅ Email enviado a {to}: {subject}")
        return True
    except Exception as e:
        print(f"❌ Error enviando email a {to}: {e}")
        return False


def build_rent_reminder_email(
    inquilino_nombre: str,
    depto_numero: str,
    edificio_nombre: str,
    monto_renta: float,
    fecha_vencimiento: str
) -> str:
    """Genera el HTML del correo de recordatorio de renta."""
    monto_recargo = round(monto_renta * 0.10, 2)
    return f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: auto; background: white; border-radius: 10px; overflow: hidden; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }}
            .header h1 {{ color: white; margin: 0; font-size: 24px; }}
            .header p {{ color: rgba(255,255,255,0.8); margin: 5px 0 0; }}
            .body {{ padding: 30px; }}
            .alert-box {{ background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }}
            .info-table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
            .info-table td {{ padding: 10px; border-bottom: 1px solid #eee; }}
            .info-table td:first-child {{ color: #666; font-weight: bold; width: 40%; }}
            .amount {{ font-size: 28px; font-weight: bold; color: #667eea; text-align: center; padding: 20px; }}
            .footer {{ background: #f8f9fa; padding: 20px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏠 Recordatorio de Pago</h1>
                <p>DepaAdmin Property Management</p>
            </div>
            <div class="body">
                <p>Hola <strong>{inquilino_nombre}</strong>,</p>
                <p>Te recordamos que <strong>hoy es la fecha de pago</strong> de tu renta correspondiente 
                al mes en curso.</p>

                <table class="info-table">
                    <tr><td>Departamento</td><td><strong>{depto_numero}</strong></td></tr>
                    <tr><td>Edificio</td><td><strong>{edificio_nombre}</strong></td></tr>
                    <tr><td>Fecha de vencimiento</td><td><strong>{fecha_vencimiento}</strong></td></tr>
                </table>

                <div class="amount">💵 ${monto_renta:,.2f} MXN</div>

                <div class="alert-box">
                    ⚠️ <strong>Importante:</strong> Si el pago no se realiza dentro de los próximos 
                    <strong>5 días</strong>, se aplicará un recargo del <strong>10%</strong> 
                    (${monto_recargo:,.2f} MXN adicionales).
                </div>

                <p>Por favor comunícate con tu administrador para realizar el pago a tiempo.</p>
                <p>¡Gracias por tu puntualidad!</p>
            </div>
            <div class="footer">
                Este es un mensaje automático de DepaAdmin PMS. No respondas a este correo.
            </div>
        </div>
    </body>
        </div>
    </body>
    </html>
    """

def build_payment_receipt_email(
    empresa_nombre: str,
    inquilino_nombre: str,
    depto_numero: str,
    edificio_nombre: str,
    monto_total: float,
    fecha_pago: str,
    concepto: str
) -> str:
    """Genera el HTML del correo de comprobante de pago."""
    return f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f3f4f6; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }}
            .header {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; color: white; }}
            .header h1 {{ margin: 0; font-size: 26px; }}
            .header p {{ color: rgba(255,255,255,0.9); margin: 5px 0 0; font-size: 14px; }}
            .body {{ padding: 30px; color: #374151; line-height: 1.6; }}
            .success-icon {{ background: #ecfdf5; color: #10b981; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 30px; margin: 0 auto 20px auto; }}
            .greeting {{ font-size: 18px; font-weight: 600; color: #111827; }}
            .info-card {{ background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }}
            .info-row {{ display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px dashed #e5e7eb; padding-bottom: 10px; }}
            .info-row:last-child {{ margin-bottom: 0; border-bottom: none; padding-bottom: 0; }}
            .info-label {{ color: #6b7280; font-size: 14px; }}
            .info-value {{ font-weight: 600; color: #111827; font-size: 14px; text-align: right; }}
            .amount-total {{ font-size: 28px; font-weight: 800; color: #10b981; text-align: center; margin: 20px 0; }}
            .footer {{ background: #f8f9fa; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #f3f4f6; }}
            .footer p {{ margin: 5px 0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ ¡Pago Recibido Exitosamente!</h1>
                <p>{empresa_nombre}</p>
            </div>
            <div class="body">
                <div style="text-align: center; font-size: 40px; margin-bottom: 15px;">🎉</div>
                <p class="greeting">Hola {inquilino_nombre},</p>
                <p>Te confirmamos que hemos procesado tu pago correctamente. A continuación, encontrarás los detalles de tu transacción:</p>

                <div class="info-card">
                    <div class="info-row">
                        <span class="info-label">Concepto</span>
                        <span class="info-value">{concepto}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Propiedad</span>
                        <span class="info-value">Depa {depto_numero} - {edificio_nombre}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Fecha de Pago</span>
                        <span class="info-value">{fecha_pago}</span>
                    </div>
                </div>

                <div class="amount-total">${monto_total:,.2f} USD</div>

                <p style="text-align: center; font-size: 14px; color: #4b5563;">
                    Adjunto a este correo encontrarás el comprobante en formato PDF.<br/>
                    <strong>¡Gracias por tu pago puntual!</strong>
                </p>
            </div>
            <div class="footer">
                <p>Este es un mensaje automático generado por DepaAdmin PMS.</p>
                <p>Si tienes alguna duda sobre este cargo, por favor comunícate con la administración.</p>
            </div>
        </div>
    </body>
    </html>
    """
