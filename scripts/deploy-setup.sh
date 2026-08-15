#!/bin/bash

# ============================================
# Production Deployment Setup Script
# ============================================
# This script automates the setup process for production deployment
# Usage: ./scripts/deploy-setup.sh
# ============================================

set -e

echo "🚀 Starting production deployment setup..."
echo ""

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
  echo "✅ Loaded .env file"
else
  echo "❌ .env file not found!"
  echo "Please create .env with DATABASE_URL and other settings"
  exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not set in .env!"
  exit 1
fi

echo "✅ DATABASE_URL found"
echo ""

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Step 2: Run migrations
echo "🗄️  Running database migrations..."
psql "$DATABASE_URL" -f database/auth-sessions-schema.sql
echo "✅ Migrations completed"
echo ""

# Step 3: Create admin user
echo "👤 Creating admin user..."

# Check if admin credentials are in environment variables
if [ -z "$ADMIN_USERNAME" ]; then
  export ADMIN_USERNAME="admin"
fi

if [ -z "$ADMIN_PASSWORD" ]; then
  echo "❌ ADMIN_PASSWORD not set in environment!"
  echo ""
  echo "Please set ADMIN_PASSWORD in your environment:"
  echo "  export ADMIN_PASSWORD='your-secure-password'"
  echo "Or add to .env file:"
  echo "  ADMIN_PASSWORD=your-secure-password"
  exit 1
fi

if [ -z "$ADMIN_EMAIL" ]; then
  export ADMIN_EMAIL="admin@example.com"
fi

if [ -z "$ADMIN_DISPLAY_NAME" ]; then
  export ADMIN_DISPLAY_NAME="Administrator"
fi

# Run non-interactive user creation
npx tsx database/create-user-cli.ts

echo ""
echo "✅ Admin user created/updated"
echo ""

# Step 4: Build application
echo "🔨 Building application..."
npm run build
echo "✅ Build completed"
echo ""

# Summary
echo "═══════════════════════════════════════"
echo "✅ DEPLOYMENT SETUP COMPLETED!"
echo "═══════════════════════════════════════"
echo ""
echo "📋 Next Steps:"
echo "  1. Start the server: npm start"
echo "  2. Login at your domain with:"
echo "     Username: $ADMIN_USERNAME"
echo "     Password: [the one you set in ADMIN_PASSWORD]"
echo ""
echo "🔒 Security Reminders:"
echo "  - Change ADMIN_PASSWORD after first login"
echo "  - Enable HTTPS/TLS in production"
echo "  - Set NODE_ENV=production"
echo "  - Restrict database access"
echo "  - Setup firewall rules"
echo ""
