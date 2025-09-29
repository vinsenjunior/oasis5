#!/bin/sh

# Rest of your script...
mkdir -p /data
if [ ! -f /data/custom.db ]; then
  echo "Copying initial database to persistent volume..."
  cp /app/db/custom.db /data/custom.db
fi
export DB_PATH="/data/custom.db"
next start