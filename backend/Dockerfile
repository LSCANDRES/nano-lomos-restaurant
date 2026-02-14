# ==========================================
# NANLOMO Backend - Dockerfile
# ==========================================
FROM node:20-alpine

LABEL maintainer="NANLOMO Restaurant"
LABEL description="Backend API para Sistema de Gestión de Restaurante NANLOMO"

# Crear directorio de la aplicación
WORKDIR /app

# Instalar dependencias del sistema necesarias para bcrypt
RUN apk add --no-cache python3 make g++

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production && npm cache clean --force

# Copiar código fuente
COPY src/ ./src/
COPY public/ ./public/

# Crear directorio de logs
RUN mkdir -p logs

# Usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Exponer puerto
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3002/api/health || exit 1

# Comando de inicio
CMD ["node", "src/server.js"]
