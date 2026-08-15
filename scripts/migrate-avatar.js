/**
 * Migrate old messages to add avatar placeholder
 * Usage: node scripts/migrate-avatar.js
 */

const fs = require('fs')
const path = require('path')

const MESSAGES_FILE = path.join(__dirname, '..', '.zalo-messages.json')

function migrateMessages() {
  console.log('🔍 Checking for messages file...')
  
  if (!fs.existsSync(MESSAGES_FILE)) {
    console.log('ℹ️  No messages file found. Nothing to migrate.')
    return
  }

  try {
    console.log('📖 Reading messages...')
    const data = fs.readFileSync(MESSAGES_FILE, 'utf-8')
    const messages = JSON.parse(data)
    
    if (!Array.isArray(messages)) {
      console.error('❌ Invalid messages format')
      return
    }
    
    console.log(`📊 Found ${messages.length} messages`)
    
    let migratedCount = 0
    const migrated = messages.map(msg => {
      // Skip if already has valid avatar (real Zalo URLs)
      if (msg.avatar && msg.avatar !== '' && !msg.avatar.includes('ui-avatars.com')) {
        return msg
      }
      
      // Remove UI Avatars placeholder and mark for re-fetch
      if (msg.avatar && msg.avatar.includes('ui-avatars.com')) {
        migratedCount++
        return {
          ...msg,
          avatar: '' // Clear placeholder, will be fetched on next message
        }
      }
      
      // No avatar at all
      if (!msg.avatar || msg.avatar === '') {
        migratedCount++
        return {
          ...msg,
          avatar: '' // Will use CSS fallback
        }
      }
      
      return msg
    })
    
    if (migratedCount === 0) {
      console.log('✅ All messages already have valid avatars or CSS fallback ready. No migration needed.')
      return
    }
    
    // Backup original file
    const backupFile = MESSAGES_FILE + '.backup-' + Date.now()
    fs.copyFileSync(MESSAGES_FILE, backupFile)
    console.log(`💾 Created backup: ${path.basename(backupFile)}`)
    
    // Write migrated data
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(migrated, null, 2), 'utf-8')
    console.log(`✅ Cleaned ${migratedCount} messages (removed UI Avatars placeholders)`)
    
    // Stats
    const withRealAvatar = migrated.filter(m => m.avatar && m.avatar !== '' && !m.avatar.includes('ui-avatars.com')).length
    const withoutAvatar = migrated.filter(m => !m.avatar || m.avatar === '' || m.avatar.includes('ui-avatars.com')).length
    
    console.log('\n📊 Statistics:')
    console.log(`   Messages with real Zalo avatar: ${withRealAvatar}`)
    console.log(`   Messages using CSS fallback: ${withoutAvatar}`)
    console.log(`   Total: ${migrated.length}`)
    
    console.log('\n🎉 Migration complete!')
    console.log('ℹ️  Messages without avatar will use CSS gradient fallback (no external service).')
    console.log('ℹ️  Real avatars will be fetched when new messages arrive from those users.')
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
  }
}

migrateMessages()
