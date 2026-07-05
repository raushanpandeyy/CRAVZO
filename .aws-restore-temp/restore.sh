#!/bin/sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"

echo "Preparing Railway archive..."
pg_restore \
  --no-owner \
  --no-acl \
  --file=/tmp/railway-restore.sql \
  /backup/railway-backup.dump

# PostgreSQL 18 emits this setting, but the AWS target currently runs PostgreSQL 16.
sed -i '/^SET transaction_timeout = 0;$/d' /tmp/railway-restore.sql

echo "Replacing the AWS public schema..."
psql "$DATABASE_URL" \
  --set=ON_ERROR_STOP=1 \
  --command='DROP SCHEMA public CASCADE;'

echo "Importing Railway schema and data..."
psql "$DATABASE_URL" \
  --set=ON_ERROR_STOP=1 \
  --file=/tmp/railway-restore.sql

echo "Railway database import completed."
