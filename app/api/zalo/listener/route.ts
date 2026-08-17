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
      
      // Clear database - delete all messages for current user
      try {
        const { getCurrentUserId } = await import('@/lib/multi-user-zalo')
        const userId = await getCurrentUserId()
        
        if (userId) {
          const pool = (await import('@/lib/postgres')).default
          if (pool) {
            await pool.query('DELETE FROM zalo_messages WHERE user_id = $1', [userId])
            console.log('✅ [Listener] Deleted all messages from database for user:', userId)
          }
        }
      } catch (error: any) {
        console.error('❌ [Listener] Failed to delete messages from database:', error)
      }
      
      return NextResponse.json({ success: true, message: 'Message logs cleared from memory and database' })
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

  let clientId: number | null = null

  const stream = new ReadableStream({
    start(controller) {
      clientId = Date.now()
      const client = { id: clientId, controller }
      sseClients.push(client)

      // Send initial connection message
      controller.enqueue('data: {"type":"connected"}\n\n')

      // Send any queued messages
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
