/**
 * Rollback migration script
 * 
 * Usage: node scripts/rollback-migration.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const API_ROUTES_DIR = path.join(__dirname, '../app/api/zalo');

console.log('🔄 Rolling back migration...\n');

// Find all .backup files
const backupFiles = glob.sync(`${API_ROUTES_DIR}/**/*.backup`);

let totalFiles = backupFiles.length;
let successFiles = 0;

backupFiles.forEach(backupPath => {
  const originalPath = backupPath.replace('.backup', '');
  
  try {
    fs.copyFileSync(backupPath, originalPath);
    fs.unlinkSync(backupPath);
    console.log(`✅ Restored: ${path.relative(API_ROUTES_DIR, originalPath)}`);
    successFiles++;
  } catch (error) {
    console.error(`❌ Error restoring ${originalPath}:`, error.message);
  }
});

console.log(`\n📊 Rollback Summary:`);
console.log(`   Total files: ${totalFiles}`);
console.log(`   ✅ Restored: ${successFiles}`);

if (successFiles === totalFiles) {
  console.log(`\n🎉 Rollback completed successfully!`);
} else {
  console.log(`\n⚠️  Rollback completed with errors.`);
}
