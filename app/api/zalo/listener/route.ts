import { NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'
import { attachListenerToApi, clearStoredMessages, messageQueue, sseClients } from '@/lib/zalo-listener-manager'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const { action } = await request.json()
    const zaloApi = await getCurrentZaloApi()

    if (!zaloApi) {
      console.error('❌ zaloApi is null in listener POST - user not logged in to Zalo')
      return NextResponse.json({ error: 'Not logged in to Zalo' }, { status: 401 })
    }

    if (action === 'start') {
      console.log('🎧 Ensuring listener is attached to active zaloApi...')
      attachListenerToApi(zaloApi)
      return NextResponse.json({ success: true, message: 'Listener active' })
    }

    if (action === 'stop') {
      console.log('🛑 Stopping message listener...')
      try {
        if (zaloApi.listener) zaloApi.listener.stop()
      } catch (e) {}
      zaloApi.__listenerAttached__ = false
      return NextResponse.json({ success: true, message: 'Listener stopped' })
    }

    if (action === 'clearLogs') {
      console.log('🧹 Clearing all stored message logs...')
      clearStoredMessages()
      return NextResponse.json({ success: true, message: 'Message logs cleared' })
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

      console.log(`📡 [SSE] New client connected (ID: ${clientId}), total clients: ${sseClients.length}`)

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
            console.log(`🔌 [SSE] Client disconnected (ID: ${clientId}), remaining clients: ${sseClients.length}`)
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
          console.log(`🔌 [SSE] Client cancelled (ID: ${clientId}), remaining clients: ${sseClients.length}`)
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
