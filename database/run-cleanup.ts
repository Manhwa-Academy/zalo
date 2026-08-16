/**
 * Script to run cleanup-duplicate-zalo-users.sql
 * Usage: npx tsx database/run-cleanup.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import pool from '../lib/postgres';

async function runCleanup() {
  try {
    console.log('🧹 Starting cleanup of duplicate Zalo users...\n');

    // Read SQL file
    const sqlPath = join(__dirname, 'cleanup-duplicate-zalo-users.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    // Split by semicolon to execute one statement at a time
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip empty or comment-only statements
      if (!statement || statement.match(/^--.*/)) continue;

      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        const result = await pool?.query(statement);
        
        if (result?.rows && result.rows.length > 0) {
          console.table(result.rows);
        } else {
          console.log('✅ Done\n');
        }
      } catch (error: any) {
        // Some errors are expected (e.g., no duplicates found)
        if (error.message.includes('no rows')) {
          console.log('ℹ️  No rows affected\n');
        } else {
          console.error('❌ Error:', error.message, '\n');
        }
      }
    }

    console.log('✅ Cleanup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

runCleanup();
