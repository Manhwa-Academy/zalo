import path from 'path'
import fs from 'fs'

/**
 * Centralized data directory for all persistent files.
 * On Railway with a mounted volume, use /data.
 * Otherwise, fall back to process.cwd() (local development).
 */
function resolveDataDir(): string {
  // Railway persistent volume mount point
  const railwayDataDir = process.env.DATA_DIR || '/data'

  if (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID) {
    // Running on Railway — use mounted volume
    try {
      if (!fs.existsSync(railwayDataDir)) {
        fs.mkdirSync(railwayDataDir, { recursive: true })
      }
      console.log(`📁 Using Railway data dir: ${railwayDataDir}`)
      return railwayDataDir
    } catch (e) {
      console.warn(`⚠️ Cannot use ${railwayDataDir}, falling back to cwd`)
    }
  }

  // Local development — use project root
  return process.cwd()
}

export const DATA_DIR = resolveDataDir()

/** Get the full path for a data file (e.g., '.zalo-session.json') */
export function dataFilePath(filename: string): string {
  return path.join(DATA_DIR, filename)
}
