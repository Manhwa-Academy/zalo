@echo off
REM ============================================
REM Production Deployment Setup Script (Windows)
REM ============================================
REM This script automates the setup process for production deployment
REM Usage: scripts\deploy-setup.bat
REM ============================================

echo.
echo 🚀 Starting production deployment setup...
echo.

REM Load environment variables from .env
if not exist .env (
    echo ❌ .env file not found!
    echo Please create .env with DATABASE_URL and other settings
    exit /b 1
)

REM Load .env variables
for /f "tokens=1,2 delims==" %%a in ('type .env ^| findstr /v "^#"') do (
    set "%%a=%%b"
)

if "%DATABASE_URL%"=="" (
    echo ❌ DATABASE_URL not set in .env!
    exit /b 1
)

echo ✅ DATABASE_URL found
echo.

REM Step 1: Install dependencies
echo 📦 Installing dependencies...
call npm install
echo ✅ Dependencies installed
echo.

REM Step 2: Run migrations
echo 🗄️  Running database migrations...
psql "%DATABASE_URL%" -f database/auth-sessions-schema.sql
echo ✅ Migrations completed
echo.

REM Step 3: Create admin user
echo 👤 Creating admin user...

REM Check if admin credentials are set
if "%ADMIN_USERNAME%"=="" (
    set ADMIN_USERNAME=admin
)

if "%ADMIN_PASSWORD%"=="" (
    echo ❌ ADMIN_PASSWORD not set in environment!
    echo.
    echo Please set ADMIN_PASSWORD in .env file:
    echo   ADMIN_PASSWORD=your-secure-password
    exit /b 1
)

if "%ADMIN_EMAIL%"=="" (
    set ADMIN_EMAIL=admin@example.com
)

if "%ADMIN_DISPLAY_NAME%"=="" (
    set ADMIN_DISPLAY_NAME=Administrator
)

REM Run non-interactive user creation
call npx tsx database/create-user-cli.ts

echo.
echo ✅ Admin user created/updated
echo.

REM Step 4: Build application
echo 🔨 Building application...
call npm run build
echo ✅ Build completed
echo.

REM Summary
echo ═══════════════════════════════════════
echo ✅ DEPLOYMENT SETUP COMPLETED!
echo ═══════════════════════════════════════
echo.
echo 📋 Next Steps:
echo   1. Start the server: npm start
echo   2. Login at your domain with:
echo      Username: %ADMIN_USERNAME%
echo      Password: [the one you set in ADMIN_PASSWORD]
echo.
echo 🔒 Security Reminders:
echo   - Change ADMIN_PASSWORD after first login
echo   - Enable HTTPS/TLS in production
echo   - Set NODE_ENV=production
echo   - Restrict database access
echo   - Setup firewall rules
echo.

pause
