# Usar una imagen oficial de Python como base
FROM python:3.12-slim

# Evitar que Python escriba archivos .pyc en el disco
ENV PYTHONDONTWRITEBYTECODE 1
# Evitar que Python haga buffer de stdout y stderr
ENV PYTHONUNBUFFERED 1

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar el archivo de dependencias desde la carpeta backend
COPY backend/requirements.txt /app/

# Instalar dependencias del sistema y de Python
RUN apt-get update \
    && apt-get install -y gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/* \
    && pip install --no-cache-dir -r requirements.txt \
    && pip install gunicorn uvicorn

# Copiar el resto del código del backend al contenedor
COPY backend/ /app/

# Iniciar Migraciones y luego el Servidor
CMD ["sh", "-c", "set -e && python -m alembic upgrade head && gunicorn -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:${PORT:-8080}"]
