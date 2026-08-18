const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')

// Load environment variables from .env file manually
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '../.env')
    const envFile = fs.readFileSync(envPath, 'utf-8')
    const lines = envFile.split('\n')
    
    for (const line of lines) {
      const trimmed = line.trim()
      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith('#')) continue
      
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim()
        process.env[key.trim()] = value
      }
    }
  } catch (error) {
    console.error('⚠️ Warning: Could not load .env file:', error.message)
  }
}

loadEnv()

async function runMigration() {
  // Use DATABASE_URL from .env
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL
  
  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL or POSTGRES_URL not found in .env file')
    console.log('💡 Make sure your .env file contains one of these:')
    console.log('   DATABASE_URL=postgresql://...')
    console.log('   POSTGRES_URL=postgresql://...')
    process.exit(1)
  }

  console.log('📊 Running AI Profiles migration...')
  console.log('🔗 Connecting to database...')

  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('neon.tech') ? { rejectUnauthorized: false } : false
  })

  try {
    const sqlPath = path.join(__dirname, '../database/add-user-ai-profiles.sql')
    const sql = fs.readFileSync(sqlPath, 'utf-8')
    
    await pool.query(sql)
    
    console.log('✅ Migration completed successfully!')
    console.log('✨ Table "user_ai_profiles" created')
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    if (error.detail) {
      console.error('📝 Details:', error.detail)
    }
    throw error
  } finally {
    await pool.end()
  }
}

runMigration()
