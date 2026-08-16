/**
 * Script to cleanup ALL duplicate/old data
 * - Duplicate Zalo users
 * - Old auth sessions
 * - Old login history
 * 
 * Usage: npx tsx database/cleanup-all.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import pool from '../lib/postgres';

async function runSqlFile(filename: string, description: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧹 ${description}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    const sqlPath = join(__dirname, filename);
    const sql = readFileSync(sqlPath, 'utf-8');

    // Split by semicolon and execute
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s !== '');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip empty statements
      if (!statement) continue;

      try {
        const result = await pool?.query(statement);
        
        // Show results if there are any
        if (result?.rows && result.rows.length > 0) {
          // Check if it's a SELECT statement (info/summary)
          if (statement.toLowerCase().trim().startsWith('select')) {
            const firstRow = result.rows[0];
            
            // If it's an info row, just print the message
            if (firstRow.info) {
              console.log(`\n${firstRow.info}`);
            } else {
              // Otherwise show as table
              console.table(result.rows);
            }
          }
        }
        
        successCount++;
      } catch (error: any) {
        // Some errors are OK (e.g., no rows to delete)
        if (error.message.includes('no rows') || error.code === '42P01') {
          // Ignore
        } else {
          console.error(`❌ Error: ${error.message}`);
          errorCount++;
        }
      }
    }

    console.log(`\n✅ Completed: ${successCount} successful, ${errorCount} errors\n`);
  } catch (error) {
    console.error(`❌ Failed to run ${filename}:`, error);
  }
}

async function main() {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║        🧹 CLEANUP ALL DUPLICATE/OLD DATA 🧹             ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  try {
    // 1. Cleanup duplicate Zalo users
    await runSqlFile(
      'cleanup-duplicate-zalo-users.sql',
      'Step 1: Cleanup Duplicate Zalo Users'
    );

    // 2. Cleanup old auth sessions
    await runSqlFile(
      'cleanup-auth-sessions.sql',
      'Step 2: Cleanup Old Auth Sessions'
    );

    // 3. Cleanup old login history
    await runSqlFile(
      'cleanup-login-history.sql',
      'Step 3: Cleanup Old Login History'
    );

    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║              ✅ ALL CLEANUP COMPLETED ✅                 ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  }
}

main();
