/**
 * Run media_cache table migration
 * Usage: node scripts/run-media-cache-migration.js
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

async function runMigration() {
  // Read connection string from .env
  require('dotenv').config()
  
  const connectionString = process.env.DATABASE_URL
  
  if (!connectionString) {
    console.error('❌ ERROR: DATABASE_URL not found in .env file')
    process.exit(1)
  }
  
  console.log('🔗 Connecting to database...')
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })
  
  try {
    await client.connect()
    console.log('✅ Connected to database')
    
    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'database', 'add-media-cache.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')
    
    console.log('📝 Running migration...')
    await client.query(migrationSQL)
    
    console.log('✅ Migration completed successfully!')
    
    // Verify table was created
    const result = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'media_cache'
      ORDER BY ordinal_position
    `)
    
    if (result.rows.length > 0) {
      console.log('\n📋 Table structure:')
      result.rows.forEach(row => {
        console.log(`   ${row.column_name}: ${row.data_type}`)
      })
    }
    
    // Check indexes
    const indexResult = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'media_cache'
    `)
    
    if (indexResult.rows.length > 0) {
      console.log('\n📊 Indexes:')
      indexResult.rows.forEach(row => {
        console.log(`   ${row.indexname}`)
      })
    }
    
    console.log('\n🎉 All done! You can now use media cache with database.')
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    
    if (error.message.includes('already exists')) {
      console.log('\nℹ️  Table already exists. No action needed.')
    } else {
      process.exit(1)
    }
  } finally {
    await client.end()
  }
}

runMigration()
