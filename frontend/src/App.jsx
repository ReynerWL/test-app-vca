import { useState } from 'react'
import { useWebSocket } from './hooks/useWebSocket'
import VideoPlayer from './components/VideoPlayer'
import CountCard from './components/CountCard'
import EventLog from './components/EventLog'
import CountChart from './components/CountChart'
import TruckAlert from './components/TruckAlert'
import SourceSwitcher from './components/SourceSwitcher'

const WS_URL = `ws://${window.location.host}/ws/counting`

const VEHICLE_CONFIG = [
  { key: 'car',        label: 'Car',        icon: '🚗', color: '#00ff88' },
  { key: 'motorcycle', label: 'Motorcycle', icon: '🏍️', color: '#ffd600' },
  { key: 'bus',        label: 'Bus',        icon: '🚌', color: '#00e5ff' },
  { key: 'truck',      label: 'Truck',      icon: '🚛', color: '#ff3d5a' },
]

export default function App() {
  const { connected, counts, events } = useWebSocket(WS_URL)
  const truckEvents = events.filter(e => e.class === 'truck')

  // "mjpeg" = pre-recorded via MJPEG
  // "webrtc" = live via WebRTC
  const [streamMode, setStreamMode] = useState('mjpeg')

  return (
    <div style={styles.root}>

      {/* ── Header ── */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoAccent}>SAMTEK</span>
          <span style={styles.logoSub}> VCA — Vehicle Counting Analytics</span>
        </div>
        <div style={styles.headerRight}>
          {/* Source switcher — ganti RTSP URL saat live mode */}
          <SourceSwitcher streamMode={streamMode} />
          <div style={styles.status}>
            <span style={{ ...styles.dot, background: connected ? '#00ff88' : '#ff3d5a' }} />
            <span style={styles.statusText}>{connected ? 'CONNECTED' : 'DISCONNECTED'}</span>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <div style={styles.main}>
        <div style={styles.leftCol}>
          <VideoPlayer
            streamMode={streamMode}
            onStreamModeChange={setStreamMode}
          />
          <div style={styles.chartWrap}>
            <CountChart counts={counts} />
          </div>
        </div>

        <div style={styles.rightCol}>
          <div style={styles.cards}>
            {VEHICLE_CONFIG.map(v => (
              <CountCard
                key={v.key}
                label={v.label}
                icon={v.icon}
                counts={counts[v.key]}
                color={v.color}
              />
            ))}
          </div>
          <EventLog events={events} />
        </div>
      </div>

      <TruckAlert alerts={truckEvents} />
    </div>
  )
}

const styles = {
  root: {
    display: 'flex', flexDirection: 'column',
    height: '100vh', overflow: 'hidden',
    padding: '10px 14px', gap: 10,
    background: '#0a0c10', boxSizing: 'border-box',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: 10, borderBottom: '1px solid #1f2535', flexShrink: 0,
  },
  logo: { fontFamily: 'IBM Plex Mono, monospace', fontSize: 13 },
  logoAccent: { color: '#00e5ff', fontWeight: 700 },
  logoSub: { color: '#6b7394' },
  headerRight: { display: 'flex', alignItems: 'center', gap: 16 },
  status: { display: 'flex', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: '50%' },
  statusText: { fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#6b7394', letterSpacing: 1 },
  main: { display: 'flex', gap: 12, flex: 1, minHeight: 0, overflow: 'hidden' },
  leftCol: { display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden' },
  chartWrap: { flexShrink: 0, height: 180 },
  rightCol: { display: 'flex', flexDirection: 'column', gap: 10, width: 300, flexShrink: 0, minHeight: 0, overflow: 'hidden' },
  cards: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, flexShrink: 0 },
}
