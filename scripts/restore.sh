#!/bin/bash
# ==============================================
# Script de Restauración - MI_APP Database
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

echo "=========================================="
echo "  🔄 MI_APP - Restaurar Base de Datos"
echo "=========================================="
echo ""
echo "🖥️  Servidor: $SSH_HOST"
echo ""

# Obtener lista de backups del servidor
BACKUP_LIST=$(ssh $SSH_HOST "ls -t $BACKUP_DIR/*.sql.gz 2>/dev/null")

if [ -z "$BACKUP_LIST" ]; then
    echo "❌ No se encontraron backups en $BACKUP_DIR"
    exit 1
fi

# Convertir a array
mapfile -t BACKUPS <<< "$BACKUP_LIST"

# Mostrar opciones
echo "📋 Backups disponibles:"
echo ""

for i in "${!BACKUPS[@]}"; do
    FILENAME=$(basename "${BACKUPS[$i]}")
    SIZE=$(ssh $SSH_HOST "ls -lh '${BACKUPS[$i]}' | awk '{print \$5}'")

    NUM=$((i + 1))
    echo "  [$NUM] $FILENAME ($SIZE)"
done

echo ""
echo "  [0] ❌ Cancelar y salir"
echo ""

# Solicitar selección
read -p "👉 Selecciona una opción (0-${#BACKUPS[@]}): " SELECTION

# Validar selección
if [ "$SELECTION" == "0" ]; then
    echo ""
    echo "🚫 Operación cancelada."
    exit 0
fi

if ! [[ "$SELECTION" =~ ^[0-9]+$ ]] || [ "$SELECTION" -lt 1 ] || [ "$SELECTION" -gt "${#BACKUPS[@]}" ]; then
    echo ""
    echo "❌ Opción inválida. Debe ser un número entre 0 y ${#BACKUPS[@]}"
    exit 1
fi

# Obtener archivo seleccionado
INDEX=$((SELECTION - 1))
SELECTED_BACKUP="${BACKUPS[$INDEX]}"
SELECTED_FILENAME=$(basename "$SELECTED_BACKUP")

echo ""
echo "📦 Backup seleccionado: $SELECTED_FILENAME"
echo ""

# Confirmar restauración
echo "⚠️  ADVERTENCIA: Esta operación eliminará TODOS los datos actuales"
echo "   de la base de datos '$DB_NAME' y los reemplazará con el backup."
echo ""
read -p "¿Estás seguro de continuar? (escribe 'SI' para confirmar): " CONFIRM

if [ "$CONFIRM" != "SI" ]; then
    echo ""
    echo "🚫 Operación cancelada."
    exit 0
fi

echo ""
echo "⏳ Restaurando base de datos..."

# 1. Cerrar conexiones activas
echo "  1/4 Cerrando conexiones activas..."
ssh $SSH_HOST "docker exec $CONTAINER_NAME psql -U $DB_USER -d postgres -c \"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME';\""

# 2. Eliminar base de datos
echo "  2/4 Eliminando base de datos..."
ssh $SSH_HOST "docker exec $CONTAINER_NAME psql -U $DB_USER -d postgres -c \"DROP DATABASE IF EXISTS $DB_NAME;\""

# 3. Crear base de datos vacía
echo "  3/4 Creando base de datos vacía..."
ssh $SSH_HOST "docker exec $CONTAINER_NAME psql -U $DB_USER -d postgres -c \"CREATE DATABASE $DB_NAME;\""

# 4. Restaurar desde backup
echo "  4/4 Restaurando desde backup..."
ssh $SSH_HOST "gunzip -c $SELECTED_BACKUP | docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Restauración completada exitosamente!"
else
    echo ""
    echo "❌ Error durante la restauración"
    exit 1
fi

echo ""
echo "=========================================="
