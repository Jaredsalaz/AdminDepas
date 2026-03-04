# Etapa 1: Build de React con Vite
FROM node:20-slim AS builder

WORKDIR /app

# Copiar dependencias desde la subcarpeta frontend (el build context es la raíz del repo)
COPY frontend/package*.json ./
RUN npm install

# Copiar el resto del código del frontend
COPY frontend/ .

# La variable de entorno se inyecta en tiempo de build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Construir la app
RUN npm run build

# Etapa 2: Servir con Nginx
FROM nginx:alpine

# Copiar la app construida al servidor web
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuración de Nginx para React Router
RUN printf 'server {\n    listen 80;\n    location / {\n        root /usr/share/nginx/html;\n        index index.html;\n        try_files $uri $uri/ /index.html;\n    }\n}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
