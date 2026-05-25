import { useEffect, useRef, useState, useCallback } from 'react'

export function useWebSocket(url) {
  const ws = useRef(null)
  const [connected, setConnected] = useState(false)
  const [counts, setCounts] = useState({
    car: { in: 0, out: 0 },
    motorcycle: { in: 0, out: 0 },
    bus: { in: 0, out: 0 },
    truck: { in: 0, out: 0 },
  })
  const [events, setEvents] = useState([])  // crossing events live

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return

    ws.current = new WebSocket(url)

    ws.current.onopen = () => {
      setConnected(true)
      console.log('✅ WebSocket connected')
    }

    ws.current.onclose = () => {
      setConnected(false)
      console.log('❌ WebSocket disconnected, reconnecting...')
      setTimeout(connect, 3000)
    }

    ws.current.onerror = (e) => {
      console.error('WS error:', e)
    }

    ws.current.onmessage = (e) => {
      const msg = JSON.parse(e.data)

      if (msg.type === 'count_update') {
        setCounts(prev => ({ ...prev, ...msg.data }))
      }

      if (msg.type === 'crossing') {
        setEvents(prev => [msg.data, ...prev].slice(0, 20))  // keep last 20
      }
    }
  }, [url])

  useEffect(() => {
    connect()
    // Ping setiap 30s agar koneksi tidak timeout
    const ping = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send('ping')
      }
    }, 30000)
    return () => {
      clearInterval(ping)
      ws.current?.close()
    }
  }, [connect])

  return { connected, counts, events }
}
