import { useEffect, useState, useRef } from 'react'

export default function TruckAlert({ alerts }) {
  const [visible, setVisible] = useState(false)
  const [current, setCurrent] = useState(null)
  const prevLen = useRef(0)
  const timerRef = useRef(null)

  useEffect(() => {
    // Trigger hanya saat ada alert BARU masuk
    if (alerts.length > prevLen.current && alerts.length > 0) {
      setCurrent(alerts[0])
      setVisible(true)

      // Auto-hide setelah 6 detik
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setVisible(false), 6000)
    }
    prevLen.current = alerts.length
  }, [alerts])

  if (!visible || !current) return null

  return (
    <div style={styles.toast}>
      {/* Progress bar auto-hide */}
      <div style={styles.progressBar}>
        <div style={styles.progress} />
      </div>

      <div style={styles.header}>
        <span style={styles.icon}>🚛</span>
        <span style={styles.title}>Truck Detected!</span>
        <button style={styles.close} onClick={() => setVisible(false)}>✕</button>
      </div>

      <div style={styles.body}>
        <Row label="Confidence" value={`${(current.confidence * 100).toFixed(1)}%`} highlight />
        <Row label="Direction"  value={current.direction?.toUpperCase()} />
        <Row label="Time"       value={new Date(current.timestamp).toLocaleTimeString()} />
        {current.capture && <Row label="📸 Capture" value="Image saved" color="#00e5ff" />}
      </div>
    </div>
  )
}

function Row({ label, value, highlight, color }) {
  return (
    <div style={rowStyles.row}>
      <span style={rowStyles.label}>{label}</span>
      <span style={{ ...rowStyles.value, color: color || (highlight ? '#ff3d5a' : '#e8eaf0') }}>
        {value}
      </span>
    </div>
  )
}

const rowStyles = {
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#6b7394' },
  value: { fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, fontWeight: 700 },
}

const styles = {
  toast: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    background: '#181c24',
    border: '1px solid #ff3d5a',
    borderRadius: 8,
    width: 260,
    zIndex: 9999,
    boxShadow: '0 8px 32px rgba(255,61,90,0.25)',
    overflow: 'hidden',
    animation: 'slideUp 0.3s ease',
  },
  progressBar: {
    height: 2,
    background: '#1f2535',
    width: '100%',
  },
  progress: {
    height: '100%',
    background: '#ff3d5a',
    width: '100%',
    animation: 'shrink 6s linear forwards',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 14px 8px',
  },
  icon: { fontSize: 18 },
  title: {
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 12,
    fontWeight: 700,
    color: '#ff3d5a',
    flex: 1,
  },
  close: {
    background: 'none',
    border: 'none',
    color: '#6b7394',
    cursor: 'pointer',
    fontSize: 13,
    lineHeight: 1,
    padding: 0,
  },
  body: {
    padding: '0 14px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
}
