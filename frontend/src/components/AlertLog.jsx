import { AlertTriangle, Truck } from 'lucide-react'

export default function AlertLog({ alerts }) {
  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <AlertTriangle size={14} color="var(--red)" />
        <span style={styles.title}>Truck Alerts</span>
        <span style={styles.badge}>{alerts.length}</span>
      </div>

      <div style={styles.list}>
        {alerts.length === 0 ? (
          <div style={styles.empty}>
            <Truck size={24} color="var(--text-3)" />
            <span style={styles.emptyText}>No truck crossings yet</span>
          </div>
        ) : (
          alerts.map((alert, i) => (
            <AlertItem key={i} alert={alert} isNew={i === 0} />
          ))
        )}
      </div>
    </div>
  )
}

function AlertItem({ alert, isNew }) {
  const time = new Date(alert.timestamp).toLocaleTimeString()

  return (
    <div style={{
      ...styles.item,
      borderColor: isNew ? 'var(--red)' : 'var(--border)',
      animation: isNew ? 'fadeUp 0.3s ease' : 'none',
    }}>
      {/* Captured image thumbnail */}
      {alert.image_url ? (
        <img
          src={alert.image_url}
          alt="Truck capture"
          style={styles.thumb}
          onError={e => { e.target.style.display = 'none' }}
        />
      ) : (
        <div style={styles.thumbPlaceholder}>
          <Truck size={16} color="var(--red)" />
        </div>
      )}

      <div style={styles.itemInfo}>
        <div style={styles.itemTitle}>
          🚛 Truck Detected
          <span style={{
            ...styles.dirTag,
            color: alert.direction === 'in' ? 'var(--green)' : 'var(--orange)',
            background: alert.direction === 'in' ? 'var(--green-dim)' : 'var(--orange-dim)',
          }}>
            {alert.direction?.toUpperCase()}
          </span>
        </div>
        <div style={styles.itemMeta}>
          <span style={styles.conf}>conf: {(alert.confidence * 100).toFixed(0)}%</span>
          <span style={styles.time}>{time}</span>
        </div>
      </div>
    </div>
  )
}

const styles = {
  panel: {
    background: 'var(--bg-panel)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    flexShrink: 0,
  },
  title: {
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    flex: 1,
  },
  badge: {
    background: 'var(--red-dim)',
    color: 'var(--red)',
    border: '1px solid var(--red)44',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    fontWeight: 700,
    padding: '1px 7px',
    borderRadius: 10,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    overflowY: 'auto',
    flex: 1,
    minHeight: 0,
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 100,
    color: 'var(--text-3)',
  },
  emptyText: {
    fontSize: 12,
    color: 'var(--text-3)',
  },
  item: {
    display: 'flex',
    gap: 10,
    padding: '8px 10px',
    borderRadius: 'var(--radius)',
    background: 'var(--bg-card)',
    border: '1px solid',
    transition: 'border-color 0.5s',
    flexShrink: 0,
  },
  thumb: {
    width: 52,
    height: 40,
    objectFit: 'cover',
    borderRadius: 6,
    border: '1px solid var(--border)',
    flexShrink: 0,
  },
  thumbPlaceholder: {
    width: 52,
    height: 40,
    background: 'var(--red-dim)',
    border: '1px solid var(--red)44',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    fontWeight: 600,
    fontSize: 12,
    color: 'var(--text-1)',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  dirTag: {
    fontSize: 10,
    fontWeight: 700,
    padding: '1px 6px',
    borderRadius: 4,
    letterSpacing: '0.05em',
    fontFamily: 'var(--font-mono)',
  },
  itemMeta: {
    display: 'flex',
    gap: 10,
    marginTop: 3,
  },
  conf: {
    fontSize: 11,
    color: 'var(--accent)',
    fontFamily: 'var(--font-mono)',
  },
  time: {
    fontSize: 11,
    color: 'var(--text-3)',
    fontFamily: 'var(--font-mono)',
  },
}
