from database import SessionLocal
from models import Empresa, Edificio, Departamento, Usuario
from routers.auth import get_password_hash
from decimal import Decimal
import random

db = SessionLocal()

# 1. Crear empresa
empresa = Empresa(
    nombre="Inmobiliaria del Sur",
    rfc="IDS260305ABC",
    direccion="Av. Central 500, Tuxtla Gutierrez",
    telefono="961-123-4567",
    correo="contacto@inmosur.com",
)
db.add(empresa)
db.commit()
db.refresh(empresa)
print(f"Empresa creada: {empresa.nombre} (id={empresa.id})")

# 2. Crear admin
admin = Usuario(
    empresa_id=empresa.id,
    nombre="Carlos Martinez",
    email="carlos@inmosur.com",
    hashed_password=get_password_hash("admin123"),
    rol="Administrador"
)
db.add(admin)
db.commit()
print("Admin creado: carlos@inmosur.com / admin123")

# 3. Crear edificios con deptos
edificios_data = [
    {"nombre": "Residencial Monte Azul", "direccion": "Blvd. Belisario Dominguez 1234", "deptos": 6},
    {"nombre": "Torre del Valle", "direccion": "Av. 5 de Febrero 890", "deptos": 8},
    {"nombre": "Condominios La Ceiba", "direccion": "Calle Jacarandas 456, Col. Maya", "deptos": 5},
]

inventarios = [
    "Cocina integral, 2 minisplits, boiler",
    "Sin amueblar. Incluye estufa y boiler",
    "Amueblado completo: sala, comedor, recamara",
    "Semi-amueblado: cocina y 1 minisplit",
]

for e_data in edificios_data:
    edificio = Edificio(
        empresa_id=empresa.id,
        nombre=e_data["nombre"],
        direccion=e_data["direccion"]
    )
    db.add(edificio)
    db.commit()
    db.refresh(edificio)
    
    for i in range(1, e_data["deptos"] + 1):
        piso = (i - 1) // 4 + 1
        puerta = (i - 1) % 4 + 1
        renta = Decimal(random.choice([6500, 7000, 8500, 9000, 10000, 12000, 15000]))
        estado = random.choices(["Disponible", "Rentado"], weights=[40, 60])[0]
        
        depto = Departamento(
            edificio_id=edificio.id,
            numero=f"{piso}0{puerta}",
            renta_mensual=renta,
            inventario=random.choice(inventarios),
            estado=estado
        )
        db.add(depto)
    
    db.commit()
    print(f"  Edificio: {edificio.nombre} ({e_data['deptos']} deptos)")

print("--- Seed completado ---")
db.close()
