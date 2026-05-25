import { useState, useEffect, useRef } from 'react'

const STREAM_URL = '/stream'

export default function VideoPlayer({ streamMode, onStreamModeChange }) {
  const [error, setError]       = useState(false)
  const [rtcState, setRtcState] = useState('idle')
  const videoRef   = useRef(null)
  const pcRef      = useRef(null)
  const wrapperRef = useRef(null)  

  const [lineMode, setLineMode]     = useState(false)
  const [points, setPoints]         = useState([]) 
  const [preview, setPreview]       = useState(null) 
  const [savedLine, setSavedLine]   = useState(null)    
  const [saveStatus, setSaveStatus] = useState(null)    

  useEffect(() => {
    fetch('/api/line')
      .then(r => r.json())
      .then(data => {
        if (data.start && data.end) setSavedLine(data)
      })
      .catch(() => {})
  }, [])

  const getVideoCoords = (e) => {
    const rect = wrapperRef.current.getBoundingClientRect()
    const rx = (e.clientX - rect.left)  / rect.width
    const ry = (e.clientY - rect.top)   / rect.height
    return { x: Math.round(rx * 640), y: Math.round(ry * 360) }
  }

  const handleVideoClick = (e) => {
    if (!lineMode) return
    const coord = getVideoCoords(e)

    if (points.length === 0) {
      // Titik pertama
      setPoints([coord])
    } else {
      // Titik kedua → kirim ke backend
      const newLine = { start: points[0], end: coord }
      sendLineToBackend(newLine)
      setPoints([])
      setPreview(null)
      setLineMode(false)
    }
  }

  const handleMouseMove = (e) => {
    if (!lineMode || points.length === 0) return
    setPreview(getVideoCoords(e))
  }

  const sendLineToBackend = async (line) => {
    try {
      const res = await fetch('/api/line', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(line),
      })
      const data = await res.json()
      if (data.ok) {
        setSavedLine(line)
        setSaveStatus('ok')
      } else {
        setSaveStatus('error')
      }
    } catch {
      setSaveStatus('error')
    } finally {
      setTimeout(() => setSaveStatus(null), 2000)
    }
  }

  const resetLine = () => {
    setSavedLine(null)
    setPoints([])
    setPreview(null)
    fetch('/api/line/reset', { method: 'POST' }).catch(() => {})
  }

  // ── Konversi koordinat video → % untuk SVG overlay ──────
  // Video ditampilkan dengan object-fit: contain di dalam wrapper
  // Kita gambar SVG di atas wrapper dengan koordinat 0-640 / 0-360
  const toPercent = (val, axis) => {
    return axis === 'x'
      ? `${(val / 640) * 100}%`
      : `${(val / 360) * 100}%`
  }

  // ── WebRTC ──────────────────────────────────────────────
  const startWebRTC = async () => {
    setRtcState('connecting'); setError(false)
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null }
    try {
      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
      pcRef.current = pc
      pc.ontrack = (e) => { if (videoRef.current && e.streams[0]) videoRef.current.srcObject = e.streams[0] }
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') setRtcState('connected')
        if (['failed','closed'].includes(pc.connectionState)) { setRtcState('failed'); setError(true) }
      }
      pc.addTransceiver('video', { direction: 'recvonly' })
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      const res = await fetch('/webrtc/offer', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sdp: pc.localDescription.sdp, type: pc.localDescription.type }),
      })
      const answer = await res.json()
      if (answer.error) throw new Error(answer.error)
      await pc.setRemoteDescription(answer)
    } catch (err) { console.error(err); setRtcState('failed'); setError(true) }
  }

  const stopWebRTC = () => {
    pcRef.current?.close(); pcRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setRtcState('idle')
  }

  useEffect(() => {
    if (streamMode === 'webrtc') startWebRTC()
    else { stopWebRTC(); setError(false) }
    return () => stopWebRTC()
  }, [streamMode])

  const isWebRTC = streamMode === 'webrtc'

  return (
    <div style={styles.wrapper}>

      {/* ── Mode toggle bar ── */}
      <div style={styles.topBar}>
        <div style={styles.modeBar}>
          <button
            style={{ ...styles.modeBtn, ...(isWebRTC ? {} : styles.modeBtnActive) }}
            onClick={() => onStreamModeChange('mjpeg')}
          >📁 Pre-recorded</button>
          <button
            style={{ ...styles.modeBtn, ...(isWebRTC ? styles.modeBtnActive : {}) }}
            onClick={() => onStreamModeChange('webrtc')}
          >📡 Live (WebRTC)</button>
        </div>

        {/* ── Line drawing controls ── */}
        <div style={styles.lineControls}>
          {saveStatus && (
            <span style={{ color: saveStatus === 'ok' ? '#00ff88' : '#ff3d5a', fontSize: 10, fontFamily: 'IBM Plex Mono, monospace' }}>
              {saveStatus === 'ok' ? '✅ Line saved' : '❌ Failed'}
            </span>
          )}
          {lineMode && points.length === 0 && (
            <span style={styles.hint}>Klik titik awal garis</span>
          )}
          {lineMode && points.length === 1 && (
            <span style={styles.hint}>Klik titik akhir garis</span>
          )}
          <button
            style={{ ...styles.lineBtn, ...(lineMode ? styles.lineBtnActive : {}) }}
            onClick={() => { setLineMode(l => !l); setPoints([]); setPreview(null) }}
          >
            {lineMode ? '✕ Cancel' : '✏️ Set Line'}
          </button>
          {savedLine && (
            <button style={styles.resetBtn} onClick={resetLine}>
              🗑 Reset
            </button>
          )}
        </div>
      </div>

      {/* ── Video area ── */}
      <div
        ref={wrapperRef}
        style={{ ...styles.videoArea, cursor: lineMode ? 'crosshair' : 'default' }}
        onClick={handleVideoClick}
        onMouseMove={handleMouseMove}
      >
        {/* Video / MJPEG */}
        {!isWebRTC && !error && (
          <img src={STREAM_URL} alt="CCTV Stream" style={styles.media} onError={() => setError(true)} />
        )}
        {isWebRTC && (
          <video ref={videoRef} autoPlay playsInline muted style={styles.media} />
        )}

        {/* ── SVG Overlay — garis virtual ── */}
        <svg
          style={styles.svg}
          viewBox="0 0 640 360"
          preserveAspectRatio="none"
        >
          {/* Garis yang sudah disimpan */}
          {savedLine && (
            <g>
              <line
                x1={savedLine.start.x} y1={savedLine.start.y}
                x2={savedLine.end.x}   y2={savedLine.end.y}
                stroke="#ffd600" strokeWidth="2.5" strokeDasharray="8 4"
              />
              <circle cx={savedLine.start.x} cy={savedLine.start.y} r="5" fill="#ffd600" />
              <circle cx={savedLine.end.x}   cy={savedLine.end.y}   r="5" fill="#ffd600" />
            </g>
          )}

          {/* Titik pertama yang sudah diklik */}
          {points.length === 1 && (
            <circle cx={points[0].x} cy={points[0].y} r="5" fill="#00e5ff" />
          )}

          {/* Preview garis saat mouse bergerak */}
          {points.length === 1 && preview && (
            <g>
              <line
                x1={points[0].x} y1={points[0].y}
                x2={preview.x}   y2={preview.y}
                stroke="#00e5ff" strokeWidth="2" strokeDasharray="6 4" opacity="0.7"
              />
              <circle cx={preview.x} cy={preview.y} r="4" fill="#00e5ff" opacity="0.7" />
            </g>
          )}
        </svg>

        {/* Overlays */}
        {isWebRTC && rtcState === 'connecting' && (
          <div style={styles.overlay}>
            <div style={styles.spinner} />
            <span style={styles.overlayText}>Connecting WebRTC...</span>
          </div>
        )}
        {error && (
          <div style={styles.overlay}>
            <span style={{ fontSize: 28 }}>📡</span>
            <span style={styles.overlayText}>{isWebRTC ? 'WebRTC gagal' : 'Stream tidak tersedia'}</span>
            <button style={styles.retryBtn} onClick={() => { setError(false); if (isWebRTC) startWebRTC() }}>Retry</button>
          </div>
        )}

        {/* Badges */}
        {!error && (
          <>
            <div style={{ ...styles.badge, background: isWebRTC ? '#00e5ff' : '#ff3d5a', color: isWebRTC ? '#000' : '#fff' }}>
              {isWebRTC ? (rtcState === 'connected' ? '● WebRTC' : '○ WebRTC') : '● LIVE'}
            </div>
            <div style={styles.camLabel}>Camera 01</div>
          </>
        )}
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    display: 'flex', flexDirection: 'column',
    flex: '1 1 0', minHeight: 0,
    background: '#000', borderRadius: 8,
    border: '1px solid #1f2535', overflow: 'hidden',
  },
  topBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: '#0a0c10', borderBottom: '1px solid #1f2535',
    flexShrink: 0, padding: '0 8px 0 0',
  },
  modeBar: { display: 'flex', gap: 1 },
  modeBtn: {
    padding: '7px 14px', background: 'transparent', border: 'none',
    color: '#6b7394', fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 11, cursor: 'pointer',
  },
  modeBtnActive: { background: '#1f2535', color: '#e8eaf0' },

  lineControls: { display: 'flex', alignItems: 'center', gap: 8 },
  hint: { fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#00e5ff', animation: 'pulse 1s infinite' },
  lineBtn: {
    background: 'transparent', border: '1px solid #1f2535',
    color: '#6b7394', fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 10, padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
  },
  lineBtnActive: { borderColor: '#00e5ff', color: '#00e5ff', background: '#00e5ff11' },
  resetBtn: {
    background: 'transparent', border: '1px solid #ff3d5a33',
    color: '#ff3d5a', fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 10, padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
  },

  videoArea: {
    position: 'relative', flex: 1, minHeight: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#000', overflow: 'hidden',
  },
  media: { width: '100%', height: '100%', objectFit: 'contain', display: 'block' },

  // SVG overlay tepat di atas video, pointer-events: none agar klik tembus ke div
  svg: {
    position: 'absolute', inset: 0,
    width: '100%', height: '100%',
    pointerEvents: 'none',  // klik tetap masuk ke handleVideoClick di div
  },

  overlay: {
    position: 'absolute', inset: 0,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 12, background: 'rgba(10,12,16,0.85)',
  },
  overlayText: { fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: '#6b7394' },
  spinner: {
    width: 24, height: 24,
    border: '2px solid #1f2535', borderTop: '2px solid #00e5ff',
    borderRadius: '50%', animation: 'spin 1s linear infinite',
  },
  retryBtn: {
    background: 'transparent', border: '1px solid #1f2535',
    color: '#00e5ff', fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 11, padding: '5px 14px', borderRadius: 4, cursor: 'pointer',
  },
  badge: {
    position: 'absolute', top: 10, left: 10,
    fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, fontWeight: 700,
    padding: '2px 8px', borderRadius: 4, letterSpacing: 1,
  },
  camLabel: {
    position: 'absolute', bottom: 10, right: 10,
    background: 'rgba(0,0,0,0.55)', color: '#6b7394',
    fontFamily: 'IBM Plex Mono, monospace', fontSize: 10,
    padding: '2px 8px', borderRadius: 4,
  },
}
