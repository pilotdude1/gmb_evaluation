#!/bin/bash

# Load environment variables
source .env

# Create backup directory
BACKUP_DIR="backups"
mkdir -p $BACKUP_DIR

# Generate filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

echo "🔄 Starting database backup..."

# Create backup
docker exec sveltekit_postgres pg_dump \
  -U $DB_USER \
  -d $DB_NAME \
  --no-password \
  --clean \
  --create > $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✅ Backup completed: $BACKUP_FILE"

    # Compress backup
    gzip $BACKUP_FILE
    echo "📦 Backup compressed: ${BACKUP_FILE}.gz"

    # Keep only last 7 backups
    ls -t $BACKUP_DIR/backup_*.sql.gz | tail -n +8 | xargs -r rm
    echo "🧹 Old backups cleaned"
else
    echo "❌ Backup failed"
    exit 1
fi 