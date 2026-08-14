export interface QrState {
  status: 'idle' | 'generating' | 'qr_ready' | 'scanned' | 'expired' | 'declined' | 'success' | 'error'
  qrImage: string | null
  scannedUser: { name: string; avatar: string } | null
  error: string | null
  updatedAt: number
}

const defaultState: QrState = {
  status: 'idle',
  qrImage: null,
  scannedUser: null,
  error: null,
  updatedAt: Date.now(),
}

export function getQrState(): QrState {
  if (!(globalThis as any).__zaloQrState__) {
    ;(globalThis as any).__zaloQrState__ = { ...defaultState }
  }
  return (globalThis as any).__zaloQrState__
}

export function updateQrState(updates: Partial<QrState>): QrState {
  const current = getQrState()
  const updated = { ...current, ...updates, updatedAt: Date.now() }
  ;(globalThis as any).__zaloQrState__ = updated
  return updated
}

export function resetQrState(): QrState {
  const updated = { ...defaultState, updatedAt: Date.now() }
  ;(globalThis as any).__zaloQrState__ = updated
  return updated
}
