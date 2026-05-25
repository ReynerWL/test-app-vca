import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const COLORS = {
  car: '#00ff88',
  motorcycle: '#ffd600',
  bus: '#00e5ff',
  truck: '#ff3d5a',
}

export default function CountChart({ counts }) {
  const data = Object.entries(counts).map(([cls, dirs]) => ({
    name: cls,
    in: dirs.in ?? 0,
    out: dirs.out ?? 0,
    total: (dirs.in ?? 0) + (dirs.out ?? 0),
  }))

  return (
    <div style={styles.wrapper}>
      <div style={styles.title}>Total Kendaraan per Jenis</div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fill: '#6b7394', fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' }} />
          <YAxis tick={{ fill: '#6b7394', fontSize: 10 }} />
          <Tooltip
            contentStyle={{ background: '#181c24', border: '1px solid #1f2535', borderRadius: 6, fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}
            cursor={{ fill: '#ffffff08' }}
          />
          <Bar dataKey="in" name="Masuk" radius={[3, 3, 0, 0]}>
            {data.map((entry) => <Cell key={entry.name} fill={COLORS[entry.name] ?? '#6b7394'} />)}
          </Bar>
          <Bar dataKey="out" name="Keluar" radius={[3, 3, 0, 0]} fill="#ffffff18">
            {data.map((entry) => <Cell key={entry.name} fill={(COLORS[entry.name] ?? '#6b7394') + '66'} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

const styles = {
  wrapper: {
    background: '#111318',
    border: '1px solid #1f2535',
    borderRadius: 8,
    padding: '16px',
  },
  title: { fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#6b7394', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },
}
