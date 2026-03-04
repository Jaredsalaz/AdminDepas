# Etapa 1: Build de React con Vite
FROM node:20-slim AS builder

WORKDIR /app

# Copiar dependencias primero para aprovechar cache
COPY package*.json ./
RUN npm install

# Copiar el resto del código
COPY . .

# La variable de entorno se inyecta en tiempo de build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Construir la app
RUN npm run build

# Etapa 2: Servir con Nginx
FROM nginx:alpine

# Copiar la app construida al servidor web
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuración de Nginx para React Router (redirigir todas las rutas al index.html)
RUN echo 'server { \
    listen 80; \
    location / { \
    root /usr/share/nginx/html; \
    index index.html; \
    try_files $uri $uri/ /index.html; \
    } \
    }' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
