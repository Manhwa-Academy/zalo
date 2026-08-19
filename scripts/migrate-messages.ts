/**
 * Migration script to create messages table
 * Run: npx tsx scripts/migrate-messages.ts
 */

import pool from '../lib/postgres'
import fs from 'fs'
import path from 'path'

async function runMigration() {
  console.log('🚀 Starting migration...')
  
  try {
    // Read SQL file
    const sqlPath = path.join(__dirname, '../database/messages-schema.sql')
    const sql = fs.readFileSync(sqlPath, 'utf-8')
    
    console.log('📄 SQL file loaded:', sqlPath)
    
    if (!pool) {
      throw new Error('Database pool not available')
    }
    
    // Execute migration
    await pool.query(sql)
    
    console.log('✅ Migration completed successfully!')
    console.log('✅ Table "messages" has been created')
    
    // Verify table exists
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'messages'
    `)
    
    if (result.rows.length > 0) {
      console.log('✅ Verified: Table "messages" exists in database')
    } else {
      console.warn('⚠️  Warning: Could not verify table creation')
    }
    
    process.exit(0)
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message)
    console.error('Details:', error)
    process.exit(1)
  }
}

runMigration()
