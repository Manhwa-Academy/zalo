#!/usr/bin/env node

/**
 * Run Full-Text Search Migration
 * Adds tsvector column and GIN index to zalo_messages table
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// Load .env file
require('dotenv').config()

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env')
  process.exit(1)
}

async function runMigration() {
  const client = new Client({ connectionString: DATABASE_URL })

  try {
    console.log('📡 Connecting to database...')
    await client.connect()
    console.log('✅ Connected to PostgreSQL')

    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'database', 'add-fulltext-search.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    console.log('📝 Running Full-Text Search migration...')
    await client.query(migrationSQL)

    console.log('✅ Migration completed successfully!')
    console.log('')
    console.log('🎉 Full-Text Search is now enabled!')
    console.log('   - Added search_vector column')
    console.log('   - Created GIN index')
    console.log('   - Created search function')
    console.log('   - Updated existing messages')
    console.log('')
    console.log('✅ You can now use /api/zalo/search-messages endpoint')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

runMigration()
