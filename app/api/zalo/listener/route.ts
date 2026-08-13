import { NextResponse } from 'next/server'
import { getZaloApi } from '@/lib/zalo-instance'
import { attachListenerToApi, messageQueue, sseClients } from '@/lib/zalo-listener-manager'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const { action } = await request.json()
    const zaloApi = getZaloApi()

    if (!zaloApi) {
      console.error('❌ zaloApi is null in listener POST')
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
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

    return NextResponse.json({ success: true, message: 'Listener status checked' })
  } catch (error: any) {
    console.error('Listener POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// SSE endpoint for real-time messages to UI
export async function GET() {
  // Ensure listener is running if zaloApi is logged in
  const zaloApi = getZaloApi()
  if (zaloApi) {
    attachListenerToApi(zaloApi)
  }

  const stream = new ReadableStream({
    start(controller) {
      const client = { controller }
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
          const index = sseClients.indexOf(client)
          if (index > -1) sseClients.splice(index, 1)
        }
      }, 15000)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
