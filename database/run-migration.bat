@echo off
REM Run migration SQL on production database
REM Usage: database\run-migration.bat

echo 🚀 Running migration: Add messages ^& stats tables...
echo.

REM Check if DATABASE_URL is set
if "%DATABASE_URL%"=="" (
  echo ❌ ERROR: DATABASE_URL environment variable is not set
  echo Please set it with: set DATABASE_URL=your_neon_connection_string
  exit /b 1
)

REM Run the SQL migration using psql (requires PostgreSQL client)
psql "%DATABASE_URL%" < database\add-messages-stats-tables.sql

if %ERRORLEVEL% EQU 0 (
  echo.
  echo ✅ Migration completed successfully!
  echo.
  echo Next steps:
  echo 1. Verify tables: SELECT * FROM zalo_messages LIMIT 1;
  echo 2. Update code to use database instead of JSON files
  echo 3. Test locally before deploying
) else (
  echo.
  echo ❌ Migration failed!
  echo Check the error messages above.
  exit /b 1
)
