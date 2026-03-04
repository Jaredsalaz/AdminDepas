# DepaAdmin - Property Management System

Sistema integral de gestión de departamentos. Construido con FastAPI (Backend) y React (Frontend), con miras a una App en Flutter (Portal del Inquilino).

## Backend (FastAPI)

### Setup Inicial
1. Crear entorno virtual: `python -m venv venv`
2. Activar entorno virtual (Windows): `.\venv\Scripts\activate`
3. Instalar dependencias: `pip install -r requirements.txt`

### Base de Datos y Migraciones (Alembic)
1. Para inicializar (por primera vez): `alembic init alembic`
2. Crear una migración tras modificar `models.py`: `alembic revision --autogenerate -m "descripcion"`
3. Aplicar migraciones: `alembic upgrade head`

### Ejecutar el servidor
```bash
uvicorn main:app --reload
```
