@echo off
REM ============================================
REM Migration Script for Auth Sessions (Windows)
REM ============================================
REM Purpose: Apply auth sessions schema to PostgreSQL database
REM Usage: migrate-auth-sessions.bat
REM ============================================

echo.
echo 🚀 Starting auth sessions migration...
echo.

REM Check if .env file exists
if not exist .env (
    echo ❌ .env file not found!
    exit /b 1
)

REM Load DATABASE_URL from .env
for /f "tokens=1,2 delims==" %%a in ('type .env ^| findstr /v "^#"') do (
    if "%%a"=="DATABASE_URL" set DATABASE_URL=%%b
)

if "%DATABASE_URL%"=="" (
    echo ❌ DATABASE_URL not set in .env!
    exit /b 1
)

echo ✅ Found DATABASE_URL
echo 📋 Applying auth sessions schema...
echo.

REM Apply SQL schema using psql
psql "%DATABASE_URL%" -f database/auth-sessions-schema.sql

if %errorlevel% equ 0 (
    echo.
    echo ✅ Migration completed successfully!
    echo.
    echo 📝 Next steps:
    echo   1. Install dependencies: npm install
    echo   2. Create first admin user: npm run create-admin
    echo   3. Start server: npm run dev
    echo   4. Login at http://localhost:3000
    echo.
    echo 🔒 SECURITY NOTE:
    echo   - Use strong password for admin user
    echo   - Enable HTTPS in production
    echo   - Change default credentials if you used test data
    echo.
) else (
    echo ❌ Migration failed!
    exit /b 1
)

pause
