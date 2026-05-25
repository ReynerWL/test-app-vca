export default function EventLog({ events }) {
  const classColor = { car: '#00ff88', motorcycle: '#ffd600', bus: '#00e5ff', truck: '#ff3d5a' }
  const classIcon  = { car: '🚗', motorcycle: '🏍️', bus: '🚌', truck: '🚛' }

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <span style={styles.title}>Live Events</span>
        <span style={styles.badge}>{events.length}</span>
      </div>
      <div style={styles.list}>
        {events.length === 0 && (
          <div style={styles.empty}>Menunggu kendaraan...</div>
        )}
        {events.map((e, i) => (
          <div key={i} style={{ ...styles.item, borderLeftColor: classColor[e.class] ?? '#6b7394' }}>
            <div style={styles.top}>
              <span>{classIcon[e.class] ?? '🚘'}</span>
              <span style={{ ...styles.cls, color: classColor[e.class] }}>{e.class}</span>
              <span style={styles.dir}>{e.direction === 'in' ? '↑ IN' : '↓ OUT'}</span>
              {e.class === 'truck' && <span style={styles.alert}>📸</span>}
            </div>
            <div style={styles.meta}>
              <span>conf: {(e.confidence * 100).toFixed(1)}%</span>
              <span>{new Date(e.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    background: '#111318',
    border: '1px solid #1f2535',
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    flex: 1,          // isi sisa ruang
    minHeight: 0,     // izinkan shrink
    overflow: 'hidden',
  },
  header: {
    padding: '10px 14px',
    borderBottom: '1px solid #1f2535',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
  },
  title: { fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#6b7394' },
  badge: { background: '#1f2535', borderRadius: 10, padding: '1px 8px', fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', color: '#00e5ff' },
  list: { overflow: 'auto', flex: 1, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 5 },
  empty: { color: '#6b7394', fontSize: 11, textAlign: 'center', padding: '20px 0', fontFamily: 'IBM Plex Mono, monospace' },
  item: {
    background: '#181c24',
    borderLeft: '3px solid',
    borderRadius: 4,
    padding: '7px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    flexShrink: 0,
  },
  top: { display: 'flex', alignItems: 'center', gap: 6 },
  cls: { fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', flex: 1 },
  dir: { fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', color: '#6b7394' },
  alert: { fontSize: 12 },
  meta: { display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#6b7394', fontFamily: 'IBM Plex Mono, monospace' },
}
