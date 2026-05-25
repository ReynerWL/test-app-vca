import { Car, Truck, Bus, Bike, ArrowDown, ArrowUp } from 'lucide-react'

const CLASS_CONFIG = {
  car:        { label: 'Car',        icon: Car,   color: 'var(--green)',  colorDim: 'var(--green-dim)' },
  motorcycle: { label: 'Motorcycle', icon: Bike,  color: 'var(--accent)', colorDim: 'var(--accent-dim)' },
  bus:        { label: 'Bus',        icon: Bus,   color: 'var(--orange)', colorDim: 'var(--orange-dim)' },
  truck:      { label: 'Truck',      icon: Truck, color: 'var(--red)',    colorDim: 'var(--red-dim)' },
}

export default function CountingPanel({ counts, lastEvent }) {
  const inTotal  = counts ? Object.values(counts.in  || {}).reduce((a,b) => a+b, 0) : 0
  const outTotal = counts ? Object.values(counts.out || {}).reduce((a,b) => a+b, 0) : 0

  return (
    <div style={styles.panel}>
      <div style={styles.panelHeader}>
        <span style={styles.panelTitle}>Live Counting</span>
        {lastEvent && (
          <span style={styles.lastEvent}>
            Last: {lastEvent.class} → {lastEvent.direction}
          </span>
        )}
      </div>

      {/* IN / OUT summary */}
      <div style={styles.summaryRow}>
        <SummaryChip label="ENTRY" value={inTotal}  color="var(--green)"  icon={ArrowDown} />
        <SummaryChip label="EXIT"  value={outTotal} color="var(--orange)" icon={ArrowUp} />
      </div>

      {/* Per-class breakdown */}
      <div style={styles.classList}>
        {Object.entries(CLASS_CONFIG).map(([cls, cfg]) => {
          const inCount  = counts?.in?.[cls]  ?? 0
          const outCount = counts?.out?.[cls] ?? 0
          const total    = inCount + outCount
          const Icon     = cfg.icon

          return (
            <div key={cls} style={styles.classRow}>
              <div style={{ ...styles.classIcon, background: cfg.colorDim, border: `1px solid ${cfg.color}44` }}>
                <Icon size={14} color={cfg.color} />
              </div>

              <div style={styles.classInfo}>
                <span style={styles.className}>{cfg.label}</span>
                <div style={styles.dirCounts}>
                  <span style={styles.dirIn}>↓ {inCount}</span>
                  <span style={styles.dirSep}>·</span>
                  <span style={styles.dirOut}>↑ {outCount}</span>
                </div>
              </div>

              <div style={{ ...styles.totalBadge, color: cfg.color, background: cfg.colorDim }}>
                {total}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SummaryChip({ label, value, color, icon: Icon }) {
  return (
    <div style={{ ...styles.chip, borderColor: color + '44' }}>
      <Icon size={16} color={color} />
      <div>
        <div style={{ ...styles.chipValue, color }}>{value}</div>
        <div style={styles.chipLabel}>{label}</div>
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
    gap: 12,
    animation: 'fadeUp 0.4s ease',
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  panelTitle: {
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: '0.06em',
    color: 'var(--text-1)',
    textTransform: 'uppercase',
  },
  lastEvent: {
    fontSize: 10,
    color: 'var(--text-3)',
    fontFamily: 'var(--font-mono)',
    background: 'var(--bg-card)',
    padding: '2px 6px',
    borderRadius: 4,
  },
  summaryRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
  },
  chip: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 'var(--radius)',
    background: 'var(--bg-card)',
    border: '1px solid',
  },
  chipValue: {
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
    fontSize: 22,
    lineHeight: 1,
  },
  chipLabel: {
    fontSize: 10,
    color: 'var(--text-3)',
    letterSpacing: '0.1em',
    marginTop: 2,
  },
  classList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  classRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 10px',
    borderRadius: 'var(--radius)',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    transition: 'border-color 0.2s',
  },
  classIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  classInfo: {
    flex: 1,
    minWidth: 0,
  },
  className: {
    fontWeight: 500,
    fontSize: 13,
    color: 'var(--text-1)',
    display: 'block',
  },
  dirCounts: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  dirIn: {
    fontSize: 11,
    color: 'var(--green)',
    fontFamily: 'var(--font-mono)',
  },
  dirSep: {
    fontSize: 11,
    color: 'var(--text-3)',
  },
  dirOut: {
    fontSize: 11,
    color: 'var(--orange)',
    fontFamily: 'var(--font-mono)',
  },
  totalBadge: {
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
    fontSize: 16,
    minWidth: 32,
    textAlign: 'right',
    padding: '2px 8px',
    borderRadius: 6,
  },
}
