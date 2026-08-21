import { NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'
import { attachListenerToApi, clearStoredMessages, messageQueue, sseClients } from '@/lib/zalo-listener-manager'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    let action = ''
    try {
      const body = await request.json()
      action = body?.action || ''
    } catch {
      // Empty or malformed body - treat as status check
      action = ''
    }
    
    const zaloApi = await getCurrentZaloApi()

    if (!zaloApi) {
      console.error('❌ zaloApi is null in listener POST - user not logged in to Zalo')
      return NextResponse.json({ error: 'Not logged in to Zalo' }, { status: 401 })
    }

    if (action === 'start') {
      attachListenerToApi(zaloApi)
      return NextResponse.json({ success: true, message: 'Listener active' })
    }

    if (action === 'stop') {
      try {
        if (zaloApi.listener) zaloApi.listener.stop()
      } catch (e) {}
      zaloApi.__listenerAttached__ = false
      return NextResponse.json({ success: true, message: 'Listener stopped' })
    }

    if (action === 'clearLogs') {
      // Clear in-memory cache
      clearStoredMessages()
      
      // Clear database - delete all messages for ALL sessions of same Zalo user
      try {
        const { getCurrentUserId } = await import('@/lib/multi-user-zalo')
        const { getAllSessionsForZaloUser } = await import('@/lib/sync-sessions')
        const userId = await getCurrentUserId()
        
        if (userId) {
          const pool = (await import('@/lib/postgres')).default
          if (pool) {
            // Get Zalo user ID from current session
            const sessionResult = await pool.query(
              `SELECT user_info FROM zalo_sessions WHERE user_id = $1`,
              [userId]
            )
            
            let zaloUserId: string | null = null
            if (sessionResult.rows.length > 0) {
              const userInfo = sessionResult.rows[0].user_info
              zaloUserId = userInfo?.userId || null
            }
            
            if (zaloUserId) {
              // Get all sessions for this Zalo user
              const sessionUserIds = await getAllSessionsForZaloUser(zaloUserId)
              
              if (sessionUserIds.length > 0) {
                // Delete from ALL sessions
                const result = await pool.query(
                  'DELETE FROM zalo_messages WHERE user_id = ANY($1)', 
                  [sessionUserIds]
                )
                console.log(`✅ [Listener] Deleted ${result.rowCount} messages from ${sessionUserIds.length} sessions for Zalo user:`, zaloUserId)
              } else {
                // Fallback: delete from current session only
                const result = await pool.query('DELETE FROM zalo_messages WHERE user_id = $1', [userId])
                console.log(`✅ [Listener] Deleted ${result.rowCount} messages from current session:`, userId)
              }
            } else {
              // Fallback: delete from current session only
              const result = await pool.query('DELETE FROM zalo_messages WHERE user_id = $1', [userId])
              console.log(`✅ [Listener] Deleted ${result.rowCount} messages from current session:`, userId)
            }
          }
        }
      } catch (error: any) {
        console.error('❌ [Listener] Failed to delete messages from database:', error)
      }
      
      return NextResponse.json({ success: true, message: 'Message logs cleared from memory and database (all sessions)' })
    }

    return NextResponse.json({ success: true, message: 'Listener status checked' })
  } catch (error: any) {
    console.error('Listener POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// SSE endpoint for real-time messages to UI
export async function GET() {
  // Ensure listener is running if zaloApi is logged in
  const zaloApi = await getCurrentZaloApi()
  if (zaloApi) {
    attachListenerToApi(zaloApi)
  }

  // 🆕 Get Zalo user ID for this client
  const zaloUserId = zaloApi && typeof zaloApi.getOwnId === 'function' 
    ? String(zaloApi.getOwnId()) 
    : undefined
  
  console.log(`🔌 [SSE] New client connecting (zaloUserId: ${zaloUserId || 'none'})`)

  let clientId: number | null = null

  const stream = new ReadableStream({
    start(controller) {
      clientId = Date.now()
      const client = { id: clientId, controller, zaloUserId }
      sseClients.push(client)
      
      console.log(`✅ [SSE] Client ${clientId} registered (zaloUserId: ${zaloUserId || 'none'})`)

      // Send initial connection message
      controller.enqueue('data: {"type":"connected"}\n\n')

      // 🔒 FILTER: Only send messages for this zaloUserId
      // For now, send all messages (DB filtering will handle proper isolation)
      messageQueue.forEach((msg) => {
        try {
          controller.enqueue(`data: ${JSON.stringify(msg)}\n\n`)
        } catch (e) {}
      })

      // Keepalive ping
      const interval = setInterval(() => {
        try {
          controller.enqueue(': keepalive\n\n')
        } catch (e) {
          clearInterval(interval)
          const index = sseClients.findIndex(c => c.id === clientId)
          if (index > -1) {
            sseClients.splice(index, 1)
            console.log(`🔌 [SSE] Client ${clientId} disconnected (zaloUserId: ${zaloUserId || 'none'})`)
          }
        }
      }, 15000)
    },
    cancel() {
      // Clean up when client disconnects
      if (clientId !== null) {
        const index = sseClients.findIndex(c => c.id === clientId)
        if (index > -1) {
          sseClients.splice(index, 1)
          console.log(`🔌 [SSE] Client ${clientId} cancelled (zaloUserId: ${zaloUserId || 'none'})`)
        }
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
