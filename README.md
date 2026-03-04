# AdminDepas - Property Management System

**AdminDepas** es un sistema integral para la gestión de edificios, departamentos y rentas, diseñado para facilitar la administración diaria, el seguimiento de mantenimientos y la visualización del flujo financiero de los inmuebles. 

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

## Características Principales

*   **Dashboard Financiero y Mapeo:** Visualización del flujo de caja, ingresos, gastos y ocupación en diferentes propiedades.
*   **Gestión de Propiedades:** Control de edificios y departamentos con estados (Disponible, Rentado, Mantenimiento).
*   **Gestión de Inquilinos:** Registro del estado e información de los arrendatarios.
*   **Módulo de Mantenimiento Kanban:** Seguimiento visual y arrastrable de tickets (Pendiente, En Reparación, Resuelto), costos de reparación y estados del inmueble afectado.
*   **Configuración y Acceso Seguro:** Perfiles de administrador para invitar a nuevos integrantes del equipo y gestionar niveles de acceso.
*   **Generación de Recibos de Pagos:** Generación automatizada de recibos en formato PDF.

## Roles y Permisos (RBAC)

El sistema soporta distintos tipos de usuario. Las vistas y acciones destructivas están protegidas.
1. **Administrador:** Acceso completo. Puede visualizar finanzas, ver costos de reparación, gestionar otros cuentas, eliminar inquilinos/propiedades, ver datos fiscales.
2. **Asistente:** Rol limitado. Creado para trabajo operativo en tickets de mantenimiento y altas, pero se le ocultan módulos y datos sensibles, así como acciones destructivas (borrado).

## 🛠 Arquitectura

El proyecto está separado en dos servicios principales:

*   **`frontend/`**: React + Vite, TailwindCSS y Framer Motion para la interfaz gráfica. Contextos personalizados para verificar permisos en tiempo real en función de los JWT Tokens del backend.
*   **`backend/`**: FastAPI (Python) manejando peticiones asíncronamente con una base de datos soportada con SQLAlchemy, Pydantic para validación y Alembic para el versionado de tablas e información.

## 🚀 Setup e Instalación Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/Jaredsalaz/AdminDepas.git
cd AdminDepas
```

### 2. Backend (FastAPI)
1. Entrar al directorio `backend`:
   ```bash
   cd backend
   ```
2. Crear un entorno virtual de Python y activarlo:
   ```bash
   python -m venv venv
   # En Windows:
   .\venv\Scripts\activate
   # En Unix/macOS:
   source venv/bin/activate
   ```
3. Instalar librerías/dependencias:
   ```bash
   pip install -r requirements.txt
   ```
4. Actualizar la base de datos (Aplicar Migraciones de Alembic):
   ```bash
   alembic upgrade head
   ```
5. *(Opcional)* Seed de datos iniciales + crear Admin por defecto:
   ```bash
   python seed.py
   python create_admin.py
   ```
6. Inicializar el Servidor (con recarga por defecto):
   ```bash
   uvicorn main:app --reload --port 5000
   ```
El backend correrá en `http://localhost:5000`. Su documentación interactiva Swagger estará en `http://localhost:5000/docs`.

### 3. Frontend (React + Vite)
En una nueva terminal, regresar a la raíz del repositorio.
1. Entrar al directorio `frontend`:
   ```bash
   cd frontend
   ```
2. Instalar los paquetes Node:
   ```bash
   npm install
   ```
3. Levantar el proyecto en entorno de desarrollo:
   ```bash
   npm run dev
   ```
El proyecto cargará en `http://localhost:5173`. 

---
Desarrollado para administrar condominios habitacionales y comerciales del modo más eficiente.
