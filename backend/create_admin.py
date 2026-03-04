from sqlalchemy.orm import Session
from database import SessionLocal
from routers.auth import get_password_hash
import models

def main():
    db = SessionLocal()
    try:
        # Check if admin already exists
        admin = db.query(models.Usuario).filter(models.Usuario.email == "admin@famesto.com").first()
        if admin:
            print("El administrador ya existe.")
            return

        hashed_pw = get_password_hash("admin123")
        new_admin = models.Usuario(
            nombre="Marisol Sánchez",
            email="admin@famesto.com",
            hashed_password=hashed_pw,
            rol="Administrador",
            activo=True
        )
        db.add(new_admin)
        db.commit()
        print("Administrador creado exitosamente. (admin@famesto.com / admin123)")
    finally:
        db.close()

if __name__ == "__main__":
    main()
