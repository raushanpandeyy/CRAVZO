#!/bin/sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"
PG_URL="${DATABASE_URL%%\?*}"

echo "Preparing Railway archive..."
pg_restore --no-owner --no-acl --file=/tmp/railway-restore.sql /backup/railway-backup.dump
sed -i '/^SET transaction_timeout = 0;$/d' /tmp/railway-restore.sql

echo "Replacing the AWS public schema..."
psql "$PG_URL" \
  --set=ON_ERROR_STOP=1 \
  --command='DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;'

echo "Importing Railway schema and data..."
psql "$PG_URL" --set=ON_ERROR_STOP=1 --file=/tmp/railway-restore.sql

echo "Railway database import completed."
