# ==========================================
# NANLOMO Frontend - Dockerfile (Multi-stage)
# ==========================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci && npm cache clean --force

# Copiar código fuente
COPY . .

# Build de producción
RUN npm run build

# Stage 2: Production con Nginx
FROM nginx:alpine

LABEL maintainer="NANLOMO Restaurant"
LABEL description="Frontend React para Sistema de Gestión de Restaurante NANLOMO"

# Copiar configuración de nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar build de React
COPY --from=builder /app/dist /usr/share/nginx/html

# Crear directorio para cache
RUN mkdir -p /var/cache/nginx && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /usr/share/nginx/html

# Exponer puerto 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1

# Comando de inicio
CMD ["nginx", "-g", "daemon off;"]
