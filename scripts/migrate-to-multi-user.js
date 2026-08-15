/**
 * Migration script: Convert single-user bot to multi-user bot
 * 
 * Usage: node scripts/migrate-to-multi-user.js
 */

const fs = require('fs');
const path = require('path');

const API_ROUTES_DIR = path.join(__dirname, '../app/api/zalo');

// Patterns để replace
const replacements = [
  {
    from: /import.*from '@\/lib\/zalo-instance'/g,
    to: `import { 
  getCurrentZaloApi, 
  setCurrentZaloApi, 
  getCurrentZaloUserInfo,
  setCurrentZaloUserInfo,
  loadCurrentZaloSession,
  clearCurrentZaloApi
} from '@/lib/multi-user-zalo'`
  },
  {
    from: /getZaloApi\(\)/g,
    to: 'await getCurrentZaloApi()'
  },
  {
    from: /setZaloApi\((.*?)\)/g,
    to: 'await setCurrentZaloApi($1)'
  },
  {
    from: /getZaloUserInfo\(\)/g,
    to: 'await getCurrentZaloUserInfo()'
  },
  {
    from: /setZaloUserInfo\((.*?)\)/g,
    to: 'await setCurrentZaloUserInfo($1)'
  },
];

// Files cần migrate
const filesToMigrate = [
  'login/route.ts',
  'logout/route.ts',
  'settings/route.ts',
  'messages/route.ts',
  'friends/route.ts',
  'groups/route.ts',
  'group-members/route.ts',
  'history/route.ts',
  'user-status/route.ts',
  'listener/route.ts',
  'leave-group/route.ts',
  'undo/route.ts',
  'upload-background/route.ts',
  'media-cache/route.ts',
  'stats/route.ts',
];

console.log('🔄 Starting multi-user migration...\n');

let totalFiles = 0;
let successFiles = 0;
let errorFiles = 0;

filesToMigrate.forEach(file => {
  const filePath = path.join(API_ROUTES_DIR, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Skip: ${file} (not found)`);
    return;
  }

  totalFiles++;

  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    // Apply replacements
    replacements.forEach(replacement => {
      if (content.match(replacement.from)) {
        content = content.replace(replacement.from, replacement.to);
        modified = true;
      }
    });

    if (modified) {
      // Backup original
      const backupPath = filePath + '.backup';
      fs.writeFileSync(backupPath, fs.readFileSync(filePath));
      
      // Write new content
      fs.writeFileSync(filePath, content);
      console.log(`✅ Migrated: ${file}`);
      successFiles++;
    } else {
      console.log(`⏭️  No changes: ${file}`);
      successFiles++;
    }
  } catch (error) {
    console.error(`❌ Error migrating ${file}:`, error.message);
    errorFiles++;
  }
});

console.log(`\n📊 Migration Summary:`);
console.log(`   Total files: ${totalFiles}`);
console.log(`   ✅ Success: ${successFiles}`);
console.log(`   ❌ Errors: ${errorFiles}`);

if (errorFiles === 0) {
  console.log(`\n🎉 Migration completed successfully!`);
  console.log(`\n⚠️  Backup files created with .backup extension`);
  console.log(`   To rollback: node scripts/rollback-migration.js`);
} else {
  console.log(`\n⚠️  Migration completed with errors. Please review manually.`);
}
