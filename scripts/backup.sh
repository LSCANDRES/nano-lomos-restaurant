#!/bin/bash
# ==============================================
# Script de Backup - MI_APP Database
# Ejecutar desde tu PC de desarrollo (usa SSH)
# ==============================================

# =============================================
# CONFIGURACIÓN - Modificar estos valores
# =============================================
SSH_HOST="server-root"
CONTAINER_NAME="postgres-development"
DB_NAME="MI_DB"
DB_USER="postgres"
BACKUP_DIR="/data/mi-app/backups"

# Nombre del backup con timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DB_NAME}_$TIMESTAMP.sql.gz"

echo "=========================================="
echo "  🗄️  MI_APP - Backup de Base de Datos"
echo "=========================================="
echo ""
echo "🖥️  Servidor: $SSH_HOST"
echo "🐳 Contenedor: $CONTAINER_NAME"
echo "📁 Base de datos: $DB_NAME"
echo "💾 Archivo: $BACKUP_DIR/$BACKUP_FILE"
echo ""

# Realizar backup via SSH
echo "⏳ Realizando backup..."
ssh $SSH_HOST "docker exec $CONTAINER_NAME pg_dump -U $DB_USER -d $DB_NAME | gzip > $BACKUP_DIR/$BACKUP_FILE"

if [ $? -eq 0 ]; then
    # Obtener tamaño del archivo
    SIZE=$(ssh $SSH_HOST "ls -lh $BACKUP_DIR/$BACKUP_FILE | awk '{print \$5}'")
    echo ""
    echo "✅ Backup completado exitosamente!"
    echo "📦 Tamaño: $SIZE"
    echo "📂 Ubicación: $BACKUP_DIR/$BACKUP_FILE"

    # Mostrar últimos 5 backups
    echo ""
    echo "📋 Últimos backups disponibles:"
    ssh $SSH_HOST "ls -lht $BACKUP_DIR/*.sql.gz 2>/dev/null | head -5"
else
    echo ""
    echo "❌ Error al realizar el backup"
    exit 1
fi

echo ""
echo "=========================================="
