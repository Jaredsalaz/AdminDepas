import random
from datetime import datetime, timedelta
from database import SessionLocal
from models import Edificio, Departamento, Inquilino, Contrato, TicketMantenimiento
from decimal import Decimal

# Nombres falsos para la inyección de datos
EDIFICIOS_MOCK = [
    {"nombre": "Torre Esmeralda", "direccion": "Av. Paseo de los Leones 123, Cumbres"},
    {"nombre": "Edificio Los Alpes", "direccion": "Calle Madero 456, Centro"},
    {"nombre": "Condominios del Lago", "direccion": "Blvd. Miguel Alemán 789, Linda Vista"},
    {"nombre": "Villas San Pedro", "direccion": "Calzada del Valle 101, San Pedro"},
    {"nombre": "Residencial Las Puertas", "direccion": "Carretera Nacional Km 265"},
    {"nombre": "Torre Cúspide", "direccion": "Av. Lázaro Cárdenas 555, Valle Oriente"},
]

INVENTARIOS = [
    "Refrigerador Mabe, Microondas LG, 2 Camas Matrimoniales, Comedor 4 sillas.",
    "Centro de lavado, Cocina integral, 1 Cama King Size, Sofá cama.",
    "Sin amueblar. Incluye boiler y 2 minisplits.",
    "Completamente amueblado. TV 50', Comedor 6 sillas, 3 Camas individuales.",
]

def seed_database():
    db = SessionLocal()
    
    # Revisar si ya hay datos para no duplicar
    if db.query(Edificio).first():
        print("La base de datos ya contiene información. Abortando seed para evitar duplicados.")
        db.close()
        return

    print("Iniciando inyección de datos (Seed)...")

    edificios_db = []
    # 1. Crear Edificios
    for e_data in EDIFICIOS_MOCK:
        edificio = Edificio(nombre=e_data["nombre"], direccion=e_data["direccion"])
        db.add(edificio)
        edificios_db.append(edificio)
    
    db.commit()

    # 2. Crear Departamentos para cada edificio (entre 4 y 10 depas por edificio)
    departamentos_db = []
    for edificio in edificios_db:
        num_depas = random.randint(4, 10)
        for i in range(1, num_depas + 1):
            piso = (i // 4) + 1
            num_puerta = i % 4 if i % 4 != 0 else 4
            numero_depa = f"{piso}0{num_puerta}"
            
            estado = random.choices(
                ["Disponible", "Rentado", "Mantenimiento"], 
                weights=[30, 60, 10], k=1
            )[0]

            renta = Decimal(random.randint(8000, 25000))
            
            depa = Departamento(
                edificio_id=edificio.id,
                numero=numero_depa,
                renta_mensual=renta,
                inventario=random.choice(INVENTARIOS),
                estado=estado
            )
            db.add(depa)
            departamentos_db.append(depa)
    
    db.commit()

    # 3. Crear unos cuantos Tickets de Mantenimiento aleatorios
    problemas = ["Fuga de agua", "Humedad en pared sur", "Falla eléctrica en cocina", "Aire acondicionado no enfría", "Cambio de chapa"]
    
    for _ in range(8):  # Crear 8 tickets al azar
        depa_random = random.choice(departamentos_db)
        estado_ticket = random.choices(["Pendiente", "En Reparacion", "Resuelto"], weights=[50, 30, 20], k=1)[0]
        costo = Decimal(random.randint(500, 3500)) if estado_ticket != "Pendiente" else Decimal(0)
        
        ticket = TicketMantenimiento(
            departamento_id=depa_random.id,
            descripcion=random.choice(problemas),
            estado=estado_ticket,
            costo_reparacion=costo,
            fecha_reporte=datetime.utcnow() - timedelta(days=random.randint(1, 15))
        )
        db.add(ticket)

    db.commit()
    print("Seed completado exitosamente. Se crearon:")
    print(f"- {len(edificios_db)} Edificios")
    print(f"- {len(departamentos_db)} Departamentos")
    print(f"- 8 Tickets de Mantenimiento")

    db.close()

if __name__ == "__main__":
    seed_database()
