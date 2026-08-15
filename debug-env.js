require('dotenv').config();

console.log('🔍 Environment Variables Check:\n');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ SET' : '❌ NOT SET');
console.log('AUTH_USERNAME:', process.env.AUTH_USERNAME || 'not set');
console.log('ADMIN_USERNAME:', process.env.ADMIN_USERNAME || 'not set');
console.log('\n📋 Which auth system will be used:');

if (process.env.DATABASE_URL) {
  console.log('✅ Database Auth (NEW) - Sessions tracked in PostgreSQL');
} else {
  console.log('⚠️ Simple Auth (OLD) - Fallback, no sessions tracking');
}
