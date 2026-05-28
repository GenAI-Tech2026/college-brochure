#!/usr/bin/env bash
# Create the local Postgres role + database for unfiltered_dev.
#
# Run AFTER `sudo apt install -y postgresql postgresql-contrib`.
# Connects to the `postgres` superuser via peer auth on the unix socket.
#
# Usage:
#   bash scripts/db-setup.sh

set -euo pipefail

DB_NAME=unfiltered_dev
ROLE="$(id -un)"

echo "[db-setup] ensuring role '${ROLE}' exists..."
sudo -u postgres psql -v ON_ERROR_STOP=1 -tAc \
  "SELECT 1 FROM pg_roles WHERE rolname = '${ROLE}'" | grep -q 1 \
  || sudo -u postgres psql -v ON_ERROR_STOP=1 -c \
       "CREATE ROLE ${ROLE} LOGIN CREATEDB;"

echo "[db-setup] ensuring database '${DB_NAME}' exists..."
sudo -u postgres psql -v ON_ERROR_STOP=1 -tAc \
  "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" | grep -q 1 \
  || sudo -u postgres createdb -O "${ROLE}" "${DB_NAME}"

echo "[db-setup] done. test connection:"
psql -d "${DB_NAME}" -c "SELECT current_user, current_database();"
