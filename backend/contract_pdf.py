from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from textwrap import wrap


def generar_contrato_pdf(contrato_data):
    """
    Genera un contrato de arrendamiento en PDF con cláusulas legales.
    contrato_data debe incluir: inquilino_nombre, inquilino_apellidos,
    departamento_numero, edificio_nombre, edificio_direccion,
    renta_mensual, monto_deposito, fecha_inicio, fecha_fin, contrato_id
    """
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    PRIMARY = colors.HexColor("#166534")
    TEXT_MAIN = colors.HexColor("#111827")
    TEXT_MUTED = colors.HexColor("#6B7280")
    BORDER = colors.HexColor("#E5E7EB")

    empresa_nombre = contrato_data.get('empresa_nombre', 'Empresa')
    inquilino = f"{contrato_data['inquilino_nombre']} {contrato_data['inquilino_apellidos']}"
    depto = contrato_data['departamento_numero']
    edificio = contrato_data['edificio_nombre']
    direccion = contrato_data.get('edificio_direccion', 'Dirección del inmueble')
    renta = contrato_data['renta_mensual']
    deposito = contrato_data.get('monto_deposito', 0) or 0
    fecha_inicio = contrato_data['fecha_inicio']
    fecha_fin = contrato_data['fecha_fin']
    contrato_id = contrato_data.get('contrato_id', 0)

    def format_money(val):
        return f"${float(val):,.2f} MXN"

    def draw_text_block(c, text, x, y, max_width, font="Helvetica", size=10, leading=14, color=TEXT_MAIN):
        c.setFont(font, size)
        c.setFillColor(color)
        lines = []
        for paragraph in text.split('\n'):
            if paragraph.strip():
                wrapped = wrap(paragraph.strip(), width=int(max_width / (size * 0.52)))
                lines.extend(wrapped)
            else:
                lines.append('')
        for line in lines:
            if y < inch:
                c.showPage()
                y = height - inch
                c.setFont(font, size)
                c.setFillColor(color)
            c.drawString(x, y, line)
            y -= leading
        return y

    y = height - inch

    # === HEADER ===
    c.setFillColor(PRIMARY)
    c.roundRect(inch, y - 50, width - 2 * inch, 55, 6, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 18)
    c.drawCentredString(width / 2, y - 22, "CONTRATO DE ARRENDAMIENTO")
    c.setFont("Helvetica", 10)
    c.drawCentredString(width / 2, y - 40, f"Folio: CONT-{contrato_id:05d}")

    y -= 80

    # === DATOS DE LAS PARTES ===
    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(PRIMARY)
    c.drawString(inch, y, "DATOS DEL CONTRATO")
    y -= 5
    c.setStrokeColor(PRIMARY)
    c.setLineWidth(2)
    c.line(inch, y, width - inch, y)
    y -= 20

    datos = [
        ("Arrendador:", f"{empresa_nombre} / Representante Legal"),
        ("Arrendatario:", inquilino),
        ("Inmueble:", f"Departamento {depto} — {edificio}"),
        ("Ubicación:", direccion),
        ("Vigencia:", f"{fecha_inicio} al {fecha_fin}"),
        ("Renta Mensual:", format_money(renta)),
        ("Depósito en Garantía:", format_money(deposito)),
    ]

    for label, value in datos:
        c.setFont("Helvetica-Bold", 10)
        c.setFillColor(TEXT_MUTED)
        c.drawString(inch + 10, y, label)
        c.setFont("Helvetica", 10)
        c.setFillColor(TEXT_MAIN)
        c.drawString(inch + 160, y, value)
        y -= 18

    y -= 15

    # === CLÁUSULAS ===
    clausulas = [
        ("PRIMERA. — OBJETO DEL CONTRATO",
         f"El ARRENDADOR concede al ARRENDATARIO el uso y goce temporal del inmueble ubicado en {direccion}, "
         f"específicamente el Departamento {depto} del edificio \"{edificio}\", para uso exclusivamente habitacional. "
         f"El inmueble se entrega en las condiciones actuales que el ARRENDATARIO declara conocer y aceptar."),

        ("SEGUNDA. — VIGENCIA",
         f"El presente contrato tendrá una vigencia del {fecha_inicio} al {fecha_fin}. "
         f"Al término de la vigencia, el ARRENDATARIO deberá desocupar el inmueble y entregarlo en las mismas condiciones "
         f"en que lo recibió, salvo el desgaste natural por el uso normal."),

        ("TERCERA. — RENTA",
         f"El ARRENDATARIO se obliga a pagar al ARRENDADOR la cantidad de {format_money(renta)} (pesos moneda nacional) "
         f"de manera mensual y anticipada, dentro de los primeros 5 días naturales de cada mes. "
         f"El incumplimiento en el pago oportuno generará un recargo moratorio del 5% mensual sobre el monto adeudado."),

        ("CUARTA. — DEPÓSITO EN GARANTÍA",
         f"Al momento de la firma del presente contrato, el ARRENDATARIO entrega al ARRENDADOR la cantidad de "
         f"{format_money(deposito)} como depósito en garantía, el cual será devuelto al término del contrato, "
         f"previa verificación del estado del inmueble e inventario. En caso de daños al inmueble o incumplimiento "
         f"del contrato, el ARRENDADOR podrá retener parcial o totalmente dicho depósito."),

        ("QUINTA. — OBLIGACIONES DEL ARRENDATARIO",
         "El ARRENDATARIO se obliga a: a) Utilizar el inmueble exclusivamente para uso habitacional; "
         "b) No subarrendar ni ceder total o parcialmente el inmueble sin consentimiento por escrito del ARRENDADOR; "
         "c) Mantener el inmueble en buen estado de conservación y limpieza; "
         "d) Cubrir los gastos de servicios de luz, agua, gas, internet y demás servicios que utilice; "
         "e) Permitir la inspección del inmueble por parte del ARRENDADOR con previo aviso de 24 horas; "
         "f) Notificar de inmediato cualquier daño o desperfecto que requiera reparación."),

        ("SEXTA. — OBLIGACIONES DEL ARRENDADOR",
         "El ARRENDADOR se obliga a: a) Entregar el inmueble en condiciones de habitabilidad; "
         "b) Realizar las reparaciones mayores necesarias que no sean derivadas del mal uso del ARRENDATARIO; "
         "c) Respetar la privacidad del ARRENDATARIO durante la vigencia del contrato; "
         "d) Emitir recibos de pago por cada renta mensual recibida."),

        ("SÉPTIMA. — RESCISIÓN ANTICIPADA",
         "Cualquiera de las partes podrá dar por terminado anticipadamente el presente contrato, "
         "notificando a la otra parte con al menos 30 días naturales de anticipación. "
         "En caso de rescisión anticipada por parte del ARRENDATARIO sin causa justificada, éste perderá "
         "el depósito en garantía. En caso de rescisión por parte del ARRENDADOR sin causa justificada, "
         "éste deberá devolver el depósito en garantía íntegro más una indemnización equivalente a un mes de renta."),

        ("OCTAVA. — INCUMPLIMIENTO",
         "En caso de incumplimiento de cualquier cláusula del presente contrato por parte del ARRENDATARIO, "
         "el ARRENDADOR podrá rescindir el contrato de pleno derecho, reteniendo el depósito de garantía, "
         "y el ARRENDATARIO deberá desocupar el inmueble en un plazo no mayor a 15 días naturales. "
         "Lo anterior sin perjuicio de las acciones legales que correspondan."),

        ("NOVENA. — JURISDICCIÓN",
         "Para todo lo relativo a la interpretación y cumplimiento del presente contrato, "
         "las partes se someten expresamente a la jurisdicción de los tribunales competentes de la ciudad "
         "donde se ubica el inmueble, renunciando a cualquier otro fuero que por razón de sus domicilios "
         "presentes o futuros pudiera corresponderles."),

        ("DÉCIMA. — DISPOSICIONES GENERALES",
         "El presente contrato constituye el acuerdo íntegro entre las partes y deja sin efecto cualquier "
         "negociación, acuerdo o convenio anterior, verbal o escrito. Cualquier modificación al presente "
         "contrato deberá hacerse por escrito y firmada por ambas partes. Este contrato se firma por duplicado, "
         "quedando un ejemplar en poder de cada una de las partes."),
    ]

    for titulo, texto in clausulas:
        if y < inch + 60:
            c.showPage()
            y = height - inch

        c.setFont("Helvetica-Bold", 10)
        c.setFillColor(PRIMARY)
        c.drawString(inch, y, titulo)
        y -= 16

        y = draw_text_block(c, texto, inch + 10, y, width - 2 * inch - 20)
        y -= 12

    # === FIRMAS ===
    if y < inch + 120:
        c.showPage()
        y = height - inch

    y -= 30
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(PRIMARY)
    c.drawCentredString(width / 2, y, "FIRMAS DE CONFORMIDAD")
    y -= 10
    c.setStrokeColor(PRIMARY)
    c.line(inch + 50, y, width - inch - 50, y)

    y -= 60

    # Firma Arrendador
    c.setStrokeColor(TEXT_MAIN)
    c.setLineWidth(1)
    c.line(inch + 20, y, width / 2 - 30, y)
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(TEXT_MAIN)
    c.drawCentredString(width / 4 + inch / 4, y - 16, "EL ARRENDADOR")
    c.setFont("Helvetica", 9)
    c.setFillColor(TEXT_MUTED)
    c.drawCentredString(width / 4 + inch / 4, y - 30, f"{empresa_nombre} / Representante Legal")

    # Firma Arrendatario
    c.line(width / 2 + 30, y, width - inch - 20, y)
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(TEXT_MAIN)
    c.drawCentredString(width * 3 / 4 - inch / 4, y - 16, "EL ARRENDATARIO")
    c.setFont("Helvetica", 9)
    c.setFillColor(TEXT_MUTED)
    c.drawCentredString(width * 3 / 4 - inch / 4, y - 30, inquilino.upper())

    # Footer legal
    c.setFont("Helvetica", 7)
    c.setFillColor(colors.HexColor("#9CA3AF"))
    c.drawCentredString(width / 2, inch / 2 + 5,
                        "Este documento es un contrato legalmente vinculante. Ambas partes declaran haber leído y aceptado todas las cláusulas.")
    c.drawCentredString(width / 2, inch / 2 - 7,
                        "Documento generado electrónicamente por DepaAdmin PMS — Sistema de Gestión de Propiedades.")

    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer
