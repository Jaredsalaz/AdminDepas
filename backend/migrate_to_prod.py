import os
import sys
from sqlalchemy import create_engine, MetaData, insert, delete, text
from dotenv import load_dotenv

# Asegurar que estamos importando los modelos de DepaAdmin
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database import get_db, Base
import models

def main():
    print("🚀 Iniciando Script de Migración de Base de Datos a Producción 🚀\n")
    load_dotenv(override=True)
    
    # 1. Definir URL Local
    LOCAL_DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:Neymar18*@localhost:5432/AdminDepas")
    
    # 2. Obtener URL de Producción
    PROD_DB_URL = os.getenv("DATABASE_PUBLIC_URL", "postgresql://postgres:wwKFIxSdjsIRnGsufFoqayutybwycggX@turntable.proxy.rlwy.net:12931/railway")
    
    if not PROD_DB_URL or not PROD_DB_URL.startswith("postgres"):
        print("❌ URL inválida. Debe empezar con postgres:// o postgresql://")
        # Si Railway te da postgres:// en lugar de postgresql://, SQLAlchemy requiere postgresql
        if PROD_DB_URL.startswith("postgres://"):
            PROD_DB_URL = PROD_DB_URL.replace("postgres://", "postgresql://", 1)
            print(f"🔄 Corrigiendo URL para SQLAlchemy a: {PROD_DB_URL}")
        else:
            return

    print(f"\n🌍 URL Local: {LOCAL_DB_URL}")
    print(f"☁️  URL Prod:  {PROD_DB_URL}\n")
    
    local_engine = create_engine(LOCAL_DB_URL)
    prod_engine = create_engine(PROD_DB_URL)
    
    sorted_tables = Base.metadata.sorted_tables
    
    # 1. Limpiar TODA la estructura en Producción y recrearla
    print("🧹 Paso 1: Vaciando esquemas obsoletos en Producción...")
    try:
        with prod_engine.connect() as prod_conn:
            # Eliminar la tabla de conversiones de alembic para resetear su estado
            prod_conn.execute(text("DROP TABLE IF EXISTS alembic_version CASCADE;"))
            # Eliminar las tablas en orden inverso
            for table in reversed(sorted_tables):
                prod_conn.execute(text(f"DROP TABLE IF EXISTS {table.name} CASCADE;"))
            prod_conn.commit()
            
        print("🏗️  Paso 2: Creando estructura fresca en Producción...")
        # Al crear desde cero usando los modelos, ya se incluyen todas las columnas nuevas
        Base.metadata.create_all(bind=prod_engine)
        
        # Marcar Alembic como actualizado (stamp) para que entienda que la BD actual ya está en la última versión
        import subprocess
        env = os.environ.copy()
        env["ALEMBIC_DB_URL"] = PROD_DB_URL
        subprocess.run(["alembic", "-c", "alembic.ini", "stamp", "head"], env=env, capture_output=True)
        print("✅ Estructura sincronizada a la perfección.")
    except Exception as e:
        print(f"❌ Error al recrear estructura: {e}")
        return
        
    # 2. Migrar Datos (Copiar de Local a Prod)
    print("\n📦 Paso 3: Copiando información de Local a Producción...")
    
    try:
        with local_engine.connect() as local_conn:
            with prod_engine.connect() as prod_conn:
                trans = prod_conn.begin()
                
                try:
                    # Insertar registros en orden NORMAL (las tablas ya están vacías porque las acabamos de crear)
                    for table in sorted_tables:
                        table_name = table.name
                        print(f"➡️ Insertando datos en tabla: {table_name}...")
                        
                        # Leer registros locales
                        local_records = local_conn.execute(table.select()).fetchall()
                        
                        if not local_records:
                            print(f"   Tabla {table_name} vacía en local. Saltando.")
                            continue
                            
                        # Preparar la data
                        columns = table.columns.keys()
                        data_to_insert = [dict(zip(columns, row)) for row in local_records]
                        
                        # Insertar registros
                        prod_conn.execute(insert(table), data_to_insert)
                        
                        print(f"   ✅ {len(data_to_insert)} registros migrados a {table_name}.")
                        
                    # Si todo sale bien, confirmar los cambios
                    trans.commit()
                    print("\n🎉 ¡MIGRACIÓN DE DATOS COMPLETADA CON ÉXITO! 🎉")
                    print("Tus usuarios, inquilinos, edificios y pagos ya están en producción.")
                    
                except Exception as inner_e:
                    # Si algo falla en alguna tabla, se revierten todos los cambios en producción para no romperla
                    trans.rollback()
                    print(f"\n❌ Ocurrió un error copiando la información: {inner_e}")
                    print("⚠️  Se han revertido todos los cambios en producción por seguridad.")
    except Exception as e:
        print(f"\n❌ No se pudo establecer conexión con las bases de datos: {e}")

if __name__ == "__main__":
    main()
