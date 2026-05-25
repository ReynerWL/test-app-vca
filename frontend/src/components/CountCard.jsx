export default function CountCard({ label, icon, counts, color }) {
  const total = (counts?.in ?? 0) + (counts?.out ?? 0)

  return (
    <div style={{ ...styles.card, borderColor: color + '33' }}>
      <div style={styles.header}>
        <span style={styles.icon}>{icon}</span>
        <span style={{ ...styles.label, color }}>{label}</span>
      </div>
      <div style={{ ...styles.total, color }}>{total.toLocaleString()}</div>
      <div style={styles.breakdown}>
        <span style={styles.dir}>↑ In: <b>{counts?.in ?? 0}</b></span>
        <span style={styles.dir}>↓ Out: <b>{counts?.out ?? 0}</b></span>
      </div>
    </div>
  )
}

const styles = {
  card: {
    background: '#111318',
    border: '1px solid',
    borderRadius: 8,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    minWidth: 140,
  },
  header: { display: 'flex', alignItems: 'center', gap: 8 },
  icon: { fontSize: 20 },
  label: { fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' },
  total: { fontFamily: 'IBM Plex Mono, monospace', fontSize: 32, fontWeight: 600, lineHeight: 1 },
  breakdown: { display: 'flex', gap: 12 },
  dir: { color: '#6b7394', fontSize: 12, fontFamily: 'IBM Plex Mono, monospace' },
}
