#!/bin/bash

# Run migration SQL on production database
# Usage: ./database/run-migration.sh

echo "🚀 Running migration: Add messages & stats tables..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  echo "Please set it with: export DATABASE_URL='your_neon_connection_string'"
  exit 1
fi

# Run the SQL migration
psql "$DATABASE_URL" < database/add-messages-stats-tables.sql

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Migration completed successfully!"
  echo ""
  echo "Next steps:"
  echo "1. Verify tables: SELECT * FROM zalo_messages LIMIT 1;"
  echo "2. Update code to use database instead of JSON files"
  echo "3. Test locally before deploying"
else
  echo ""
  echo "❌ Migration failed!"
  echo "Check the error messages above."
  exit 1
fi
