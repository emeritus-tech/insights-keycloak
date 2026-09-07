#!/usr/bin/env bash
# fix-mysql-collation.sh
#
# Converts all Keycloak MySQL tables to utf8mb4_0900_ai_ci.
# Required when upgrading Keycloak on a DB originally created with the old
# utf8/utf8mb3 charset, where collation mismatches block Liquibase migrations.
#
# Usage:
#   ./scripts/fix-mysql-collation.sh [OPTIONS]
#
# Options (all have defaults):
#   -h HOST      MySQL host       (default: 127.0.0.1)
#   -P PORT      MySQL port       (default: 3306)
#   -u USER      MySQL username   (default: root)
#   -p PASSWORD  MySQL password   (default: empty)
#   -d DATABASE  Keycloak DB name (default: keycloak)

set -euo pipefail

# --- Defaults ---
DB_HOST="127.0.0.1"
DB_PORT="3306"
DB_USER="root"
DB_PASS=""
DB_NAME="keycloak"

# --- Parse args ---
while getopts "h:P:u:p:d:" opt; do
  case $opt in
    h) DB_HOST="$OPTARG" ;;
    P) DB_PORT="$OPTARG" ;;
    u) DB_USER="$OPTARG" ;;
    p) DB_PASS="$OPTARG" ;;
    d) DB_NAME="$OPTARG" ;;
    *) echo "Unknown option: -$OPTARG"; exit 1 ;;
  esac
done

# Build mysql auth args
MYSQL_ARGS="-h $DB_HOST -P $DB_PORT -u $DB_USER"
if [ -n "$DB_PASS" ]; then
  MYSQL_ARGS="$MYSQL_ARGS -p$DB_PASS"
fi

mysql_cmd() {
  mysql $MYSQL_ARGS "$@"
}

echo "==> Connecting to MySQL at $DB_HOST:$DB_PORT as $DB_USER, database: $DB_NAME"

# --- Check connection ---
mysql_cmd -e "SELECT 1;" "$DB_NAME" > /dev/null 2>&1 || {
  echo "ERROR: Cannot connect to MySQL. Check your credentials and host."
  exit 1
}

echo "==> Generating ALTER TABLE statements for all tables in '$DB_NAME'..."

# Write to a temp SQL file
TMPFILE=$(mktemp /tmp/kc_collation_fix.XXXXXX.sql)
trap 'rm -f "$TMPFILE"' EXIT

echo "SET FOREIGN_KEY_CHECKS=0;" > "$TMPFILE"

mysql_cmd -sN -e "
  SELECT CONCAT('ALTER TABLE \`', TABLE_NAME, '\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;')
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA='$DB_NAME' AND TABLE_TYPE='BASE TABLE';
" >> "$TMPFILE"

echo "SET FOREIGN_KEY_CHECKS=1;" >> "$TMPFILE"

TABLE_COUNT=$(grep -c "ALTER TABLE" "$TMPFILE" || true)
echo "==> Found $TABLE_COUNT tables to convert."

if [ "$TABLE_COUNT" -eq 0 ]; then
  echo "WARNING: No tables found. Is the database name '$DB_NAME' correct?"
  exit 1
fi

echo "==> Running collation conversion (this is safe, all data is preserved)..."
mysql_cmd "$DB_NAME" < "$TMPFILE"

echo "==> Cleaning up any failed Liquibase changeset records..."
mysql_cmd -e "
  DELETE FROM \`$DB_NAME\`.DATABASECHANGELOG
  WHERE ID = '26.6.0-org-group-relationship'
    AND FILENAME = 'META-INF/jpa-changelog-26.6.0.xml';
" 2>/dev/null || true

echo "==> Verifying collation on a sample table (GROUP_ATTRIBUTE)..."
mysql_cmd -e "
  SELECT TABLE_NAME, TABLE_COLLATION
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA='$DB_NAME' AND TABLE_NAME='GROUP_ATTRIBUTE';
"

echo "==> Done. You can now restart Keycloak."
