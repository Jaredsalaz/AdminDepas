import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

GMAIL_USER = os.getenv("GMAIL_USER", "jared.salazar65@unach.mx")
GMAIL_PASSWORD = os.getenv("GMAIL_PASSWORD", "wagy qtiz xjrb tsco")

def send_email(to: str, subject: str, html_body: str) -> bool:
    """Envía un correo HTML via Gmail SMTP. Retorna True si fue exitoso."""
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"DepaAdmin PMS <{GMAIL_USER}>"
        msg["To"] = to

        msg.attach(MIMEText(html_body, "html"))

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
    </html>
    """
