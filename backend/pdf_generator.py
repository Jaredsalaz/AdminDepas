import os
from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch

def generar_recibo_pdf(pago_data):
    """
    Genera un recibo en PDF estilizado usando ReportLab.
    Retorna un buffer en memoria (BytesIO) del PDF.
    """
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    # 🎨 Paleta de Colores
    PRIMARY = colors.HexColor("#166534")  # Verde Oscuro Corporativo
    TEXT_MAIN = colors.HexColor("#111827") # Gris muy oscuro
    TEXT_MUTED = colors.HexColor("#6B7280") # Gris texto secundario
    BG_MUTED = colors.HexColor("#F9FAFB") # Gris clarito fondo
    BORDER = colors.HexColor("#E5E7EB") # Gris bordes
    
    y = height - inch
    
    # === HEADER: LOGO Y DATOS ===
    # LOGO (Cuadro Negro, 4 personas abstractas minimalist)
    c.saveState()
    c.setFillColor(colors.HexColor("#1A1A1A"))
    c.roundRect(inch, y - 50, 50, 50, 8, fill=1, stroke=0)
    
    c.setFillColor(colors.white)
    # Cabecitas (4 circulitos)
    c.circle(inch + 18, y - 18, 4, fill=1, stroke=0)
    c.circle(inch + 32, y - 18, 4, fill=1, stroke=0)
    c.circle(inch + 14, y - 32, 2.5, fill=1, stroke=0)
    c.circle(inch + 36, y - 32, 2.5, fill=1, stroke=0)
    
    # Cuerpos (polígonos simples como siluetas)
    c.setLineWidth(1.5)
    c.setStrokeColor(colors.white)
    # Persona 1 / 2 Grandes
    c.bezier(inch + 18, y - 24, inch + 5, y - 28, inch + 14, y - 45, inch + 24, y - 48)
    c.bezier(inch + 32, y - 24, inch + 45, y - 28, inch + 36, y - 45, inch + 26, y - 48)
    # Persona 3 / 4 Chicas (Brazos alzados)
    c.bezier(inch + 14, y - 36, inch + 8, y - 38, inch + 14, y - 43, inch + 18, y - 43)
    c.bezier(inch + 36, y - 36, inch + 42, y - 38, inch + 36, y - 43, inch + 32, y - 43)
    c.restoreState()

    # Empresa
    c.setFont("Helvetica-Bold", 16)
    c.setFillColor(TEXT_MAIN)
    c.drawString(inch + 65, y - 20, pago_data.get('empresa_nombre', 'Empresa'))
    c.setFont("Helvetica", 10)
    c.setFillColor(TEXT_MUTED)
    c.drawString(inch + 65, y - 35, "Arrendador")
    c.drawString(inch + 65, y - 48, "Gestión Profesional de Propiedades")

    # Folio y Título "RECIBO DE PAGO"
    c.setFont("Helvetica-Bold", 20)
    c.setFillColor(PRIMARY)
    c.drawRightString(width - inch, y - 20, "RECIBO DE PAGO")
    c.setFont("Helvetica", 10)
    c.setFillColor(TEXT_MUTED)
    c.drawRightString(width - inch, y - 36, f"Folio No: #{pago_data.get('id', 0):05d}")
    c.drawRightString(width - inch, y - 48, f"Fecha de Emisión: {pago_data.get('fecha_emision', '')}")

    y -= 75
    c.setStrokeColor(BORDER)
    c.setLineWidth(1)
    c.line(inch, y, width - inch, y)

    y -= 25

    # === CAJAS DE INFORMACIÓN ===
    # Caja Inquilino
    c.setFillColor(BG_MUTED)
    c.setStrokeColor(BORDER)
    c.roundRect(inch, y - 70, (width - 2*inch)/2 - 10, 90, 6, fill=1, stroke=1)
    
    c.setFillColor(TEXT_MUTED)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(inch + 15, y + 5, "RECIBÍ DE:")
    
    c.setFillColor(TEXT_MAIN)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(inch + 15, y - 15, pago_data.get('inquilino_nombre', 'N/A'))
    c.setFont("Helvetica", 10)
    c.setFillColor(TEXT_MUTED)
    c.drawString(inch + 15, y - 35, f"Correo: {pago_data.get('inquilino_correo', 'N/D')}")
    c.drawString(inch + 15, y - 50, f"Teléfono: {pago_data.get('inquilino_telefono', 'N/D')}")

    # Caja Propiedad
    x_prop = inch + (width - 2*inch)/2 + 10
    c.setFillColor(BG_MUTED)
    c.setStrokeColor(BORDER)
    c.roundRect(x_prop, y - 70, (width - 2*inch)/2 - 10, 90, 6, fill=1, stroke=1)
    
    c.setFillColor(TEXT_MUTED)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(x_prop + 15, y + 5, "DATOS DE LA PROPIEDAD:")
    
    c.setFillColor(TEXT_MAIN)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(x_prop + 15, y - 15, pago_data.get('edificio_nombre', 'N/A'))
    c.setFont("Helvetica", 10)
    c.setFillColor(TEXT_MUTED)
    c.drawString(x_prop + 15, y - 35, f"Departamento: {pago_data.get('departamento_numero', 'N/A')}")
    c.drawString(x_prop + 15, y - 50, f"Período Cubierto: {pago_data.get('fecha_correspondiente', '')}")

    y -= 110

    # === TABLA DE CONCEPTOS ===
    # Header de la tabla
    c.setFillColor(PRIMARY)
    c.roundRect(inch, y - 20, width - 2*inch, 20, 4, fill=1, stroke=0)
    
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(inch + 10, y - 14, "CONCEPTO / DESCRIPCIÓN")
    c.drawRightString(width - inch - 200, y - 14, "PRECIO BASE")
    c.drawRightString(width - inch - 100, y - 14, "RECARGOS")
    c.drawRightString(width - inch - 10, y - 14, "IMPORTE TOTAL")

    y -= 20

    # Fila del Pago
    c.setFillColor(TEXT_MAIN)
    c.setFont("Helvetica", 11)
    y -= 25
    c.drawString(inch + 10, y, pago_data.get('concepto', 'Renta Mensual'))
    c.drawRightString(width - inch - 200, y, f"${pago_data.get('monto', 0):,.2f}")
    c.drawRightString(width - inch - 100, y, f"${pago_data.get('recargos', 0):,.2f}")
    
    total = float(pago_data.get('monto', 0)) + float(pago_data.get('recargos', 0))
    c.setFont("Helvetica-Bold", 11)
    c.drawRightString(width - inch - 10, y, f"${total:,.2f}")

    y -= 25
    c.setStrokeColor(BORDER)
    c.line(inch, y, width - inch, y)

    # === TOTALES ===
    y -= 30
    c.setFillColor(BG_MUTED)
    c.roundRect(width - inch - 250, y - 40, 250, 60, 6, fill=1, stroke=0)
    
    c.setFillColor(TEXT_MUTED)
    c.setFont("Helvetica", 10)
    c.drawRightString(width - inch - 110, y - 10, "Subtotal:")
    c.drawRightString(width - inch - 15, y - 10, f"${total:,.2f}")

    c.setFillColor(PRIMARY)
    c.setFont("Helvetica-Bold", 14)
    c.drawRightString(width - inch - 110, y - 30, "TOTAL PAGADO:")
    c.drawRightString(width - inch - 15, y - 30, f"${total:,.2f}")

    # === FIRMA Y FOOTER ===
    y = inch + 60
    c.setStrokeColor(TEXT_MAIN)
    c.setLineWidth(1)
    
    # Firma Arrendador (Izquierda)
    c.line(inch + 20, y, width/2 - 20, y)
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(TEXT_MAIN)
    c.drawCentredString(width/4 + inch/2, y - 18, pago_data.get('empresa_nombre', 'Empresa'))
    c.setFont("Helvetica", 9)
    c.setFillColor(TEXT_MUTED)
    c.drawCentredString(width/4 + inch/2, y - 32, "Arrendador")

    # Firma Inquilino (Derecha)
    c.setStrokeColor(TEXT_MAIN)
    c.line(width/2 + 20, y, width - inch - 20, y)
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(TEXT_MAIN)
    c.drawCentredString(width * 3/4 - inch/2, y - 18, pago_data.get('inquilino_nombre', 'Inquilino').upper())
    c.setFont("Helvetica", 9)
    c.setFillColor(TEXT_MUTED)
    c.drawCentredString(width * 3/4 - inch/2, y - 32, "Firma del Inquilino")

    # Texto legal
    c.setFont("Helvetica", 8)
    c.setFillColor(colors.HexColor("#9CA3AF"))
    c.drawCentredString(width/2, inch/2 + 10, "Este recibo electrónico es un comprobante válido de pago de renta/servicios.")
    c.drawCentredString(width/2, inch/2 - 2, "Consérvelo para futuras aclaraciones respecto a su cuenta.")
    c.drawCentredString(width/2, inch/2 - 14, "Generado y certificado por DepaAdmin PMS Pro Software.")

    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer
