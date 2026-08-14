/**
 * Next.js Instrumentation Hook
 * This file is automatically loaded by Next.js when the server starts.
 * It triggers the auto-boot process to restore Zalo session & listener.
 * 
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🔧 [Instrumentation] Server starting, triggering auto-boot...')
    const { startAutoBoot } = await import('./lib/auto-boot')
    startAutoBoot()
  }
}
