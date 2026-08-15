#!/bin/bash

# ============================================
# Migration Script for Auth Sessions
# ============================================
# Purpose: Apply auth sessions schema to PostgreSQL database
# Usage: ./migrate-auth-sessions.sh
# ============================================

set -e

echo "🚀 Starting auth sessions migration..."

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
else
  echo "❌ .env file not found!"
  exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not set in .env!"
  exit 1
fi

echo "✅ Found DATABASE_URL"
echo "📋 Applying auth sessions schema..."

# Apply SQL schema
psql "$DATABASE_URL" -f database/auth-sessions-schema.sql

if [ $? -eq 0 ]; then
  echo "✅ Migration completed successfully!"
  echo ""
  echo "📝 Next steps:"
  echo "  1. Install dependencies: npm install"
  echo "  2. Create first admin user: npm run create-admin"
  echo "  3. Start server: npm run dev"
  echo "  4. Login at http://localhost:3000"
  echo ""
  echo "🔒 SECURITY NOTE:"
  echo "  - Use strong password for admin user"
  echo "  - Enable HTTPS in production"
  echo "  - Change default credentials if you used test data"
else
  echo "❌ Migration failed!"
  exit 1
fi
