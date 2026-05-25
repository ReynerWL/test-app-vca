import { Activity, Wifi, WifiOff } from 'lucide-react'

export default function Header({ connected }) {
  return (
    <header style={styles.header}>
      <div style={styles.logo}>
        <div style={styles.logoMark}>
          <Activity size={16} color="var(--accent)" />
        </div>
        <div>
          <div style={styles.logoTitle}>SAMTEK VCA</div>
          <div style={styles.logoSub}>Vehicle Counting Analytics</div>
        </div>
      </div>

      <div style={styles.right}>
        {/* Live indicator */}
        <div style={styles.liveChip}>
          <span style={{
            ...styles.liveDot,
            background: connected ? 'var(--green)' : 'var(--red)',
            boxShadow: connected ? '0 0 6px var(--green)' : '0 0 6px var(--red)',
          }} />
          {connected ? 'LIVE' : 'OFFLINE'}
        </div>

        {/* WebSocket status */}
        <div style={styles.wsStatus}>
          {connected
            ? <Wifi size={14} color="var(--green)" />
            : <WifiOff size={14} color="var(--red)" />
          }
          <span style={{ color: connected ? 'var(--green)' : 'var(--red)', fontSize: 12 }}>
            {connected ? 'WebSocket Connected' : 'WebSocket Disconnected'}
          </span>
        </div>
      </div>
    </header>
  )
}

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-panel)',
    flexShrink: 0,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logoMark: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: 'var(--accent-dim)',
    border: '1px solid var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTitle: {
    fontWeight: 700,
    fontSize: 15,
    letterSpacing: '0.08em',
    color: 'var(--text-1)',
    fontFamily: 'var(--font-mono)',
  },
  logoSub: {
    fontSize: 11,
    color: 'var(--text-3)',
    letterSpacing: '0.04em',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  liveChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    borderRadius: 20,
    border: '1px solid var(--border-lit)',
    background: 'var(--bg-card)',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.1em',
    color: 'var(--text-2)',
    fontFamily: 'var(--font-mono)',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    animation: 'blink 1.4s ease infinite',
  },
  wsStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
}
