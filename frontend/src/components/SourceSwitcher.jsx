import { useState } from 'react'

export default function SourceSwitcher({ streamMode }) {
  const [rtspUrl, setRtspUrl]   = useState('')
  const [status, setStatus]     = useState(null)  // null | 'ok' | 'error'
  const [loading, setLoading]   = useState(false)
  const [open, setOpen]         = useState(false)

  const switchToFile = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'file', path: 'assets/test_video.mp4' }),
      })
      const data = await res.json()
      setStatus(data.ok ? 'ok' : 'error')
    } catch {
      setStatus('error')
    } finally {
      setLoading(false)
      setTimeout(() => setStatus(null), 2000)
    }
  }

  const switchToRTSP = async () => {
    if (!rtspUrl.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'rtsp', url: rtspUrl.trim() }),
      })
      const data = await res.json()
      setStatus(data.ok ? 'ok' : 'error')
      if (data.ok) setOpen(false)
    } catch {
      setStatus('error')
    } finally {
      setLoading(false)
      setTimeout(() => setStatus(null), 2000)
    }
  }

  return (
    <div style={styles.wrapper}>

      {/* Tombol buka panel */}
      <button style={styles.trigger} onClick={() => setOpen(o => !o)}>
        ⚙ Source
      </button>

      {/* Panel dropdown */}
      {open && (
        <div style={styles.panel}>
          <div style={styles.panelTitle}>Video Source</div>

          {/* File */}
          <div style={styles.section}>
            <div style={styles.sectionLabel}>📁 Pre-recorded</div>
            <button
              style={styles.actionBtn}
              onClick={switchToFile}
              disabled={loading}
            >
              Use assets/test_video.mp4
            </button>
          </div>

          <div style={styles.divider} />

          {/* RTSP */}
          <div style={styles.section}>
            <div style={styles.sectionLabel}>📡 Live RTSP</div>
            <input
              style={styles.input}
              placeholder="rtsp://user:pass@192.168.1.x:554/stream"
              value={rtspUrl}
              onChange={e => setRtspUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && switchToRTSP()}
            />
            <button
              style={styles.actionBtn}
              onClick={switchToRTSP}
              disabled={loading || !rtspUrl.trim()}
            >
              {loading ? 'Switching...' : 'Connect'}
            </button>
          </div>

          {/* Status */}
          {status && (
            <div style={{ ...styles.statusMsg, color: status === 'ok' ? '#00ff88' : '#ff3d5a' }}>
              {status === 'ok' ? '✅ Source switched!' : '❌ Gagal switch source'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const styles = {
  wrapper: { position: 'relative' },
  trigger: {
    background: '#1f2535',
    border: '1px solid #2a3045',
    color: '#6b7394',
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 10,
    padding: '4px 10px',
    borderRadius: 4,
    cursor: 'pointer',
    letterSpacing: 0.5,
  },
  panel: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    background: '#111318',
    border: '1px solid #1f2535',
    borderRadius: 8,
    padding: 14,
    width: 280,
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  },
  panelTitle: {
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 11,
    fontWeight: 700,
    color: '#e8eaf0',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  section: { display: 'flex', flexDirection: 'column', gap: 6 },
  sectionLabel: {
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 10,
    color: '#6b7394',
  },
  input: {
    background: '#0a0c10',
    border: '1px solid #1f2535',
    borderRadius: 4,
    color: '#e8eaf0',
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 10,
    padding: '6px 8px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  actionBtn: {
    background: '#1f2535',
    border: '1px solid #2a3045',
    color: '#00e5ff',
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 10,
    padding: '6px 0',
    borderRadius: 4,
    cursor: 'pointer',
    width: '100%',
  },
  divider: { borderTop: '1px solid #1f2535' },
  statusMsg: {
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 10,
    textAlign: 'center',
  },
}
