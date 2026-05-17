import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import { getDashboardStats, getMyStats, getMyHistory } from '../api/stats'
import { fmtQ, fmt } from '../utils/format'

const COLORS = {
  positive: '#4f8a6a',
  negative: '#b3554d',
  primary: '#2f5d62',
  accent: '#4a6fa5',
}

function StatBigCard({ label, value, sub, color, icon }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem' }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.4rem', flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '1.7rem', fontWeight: 800, color: color || 'var(--text)', lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontWeight: 500 }}>
          {label}
        </div>
        {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: '0.1rem' }}>{sub}</div>}
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const val = payload[0].value
  return (
    <div className="card" style={{ padding: '0.6rem 0.85rem', minWidth: 120 }}>
      <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.2rem' }}>{label}</div>
      <div style={{ fontWeight: 700, color: val >= 0 ? COLORS.positive : COLORS.negative, fontSize: '0.88rem' }}>
        {val >= 0 ? '+' : ''}{fmtQ(val)}
      </div>
    </div>
  )
}

function RankingChart({ ranking }) {
  if (!ranking?.length) return null
  const data = ranking.map(p => ({ name: p.real_name, value: p.total_net }))

  return (
    <div className="card" style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>
          🏆 Ranking global
        </h2>
        <span className="badge badge-neutral">{ranking.length} jugadores</span>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(160, data.length * 44)}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 60, top: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
          <XAxis
            type="number"
            tickFormatter={v => `Q${(v / 10).toFixed(0)}`}
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={90}
            tick={{ fontSize: 12, fill: 'var(--text)', fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--surface-2)' }} />
          <ReferenceLine x={0} stroke="var(--border)" strokeWidth={2} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={28}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.value >= 0 ? COLORS.positive : COLORS.negative} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardStats().then(setStats).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card skeleton" style={{ height: 80 }} />
      ))}
    </div>
  )
  if (!stats) return null

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatBigCard icon="🃏" label="Total mesas" value={stats.total_tables} color={COLORS.primary} />
        <StatBigCard icon="🟢" label="Mesas abiertas" value={stats.open_tables} color={COLORS.positive} sub="en juego" />
        <StatBigCard icon="👥" label="Jugadores activos" value={stats.total_players} color={COLORS.accent} />
        <StatBigCard icon="🏠" label="Grupos" value={stats.total_groups} color="#7b6c93" />
      </div>

      {stats.top_winner && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <div className="card" style={{ borderLeft: '4px solid var(--success)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '2rem' }}>🥇</div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mayor ganador</div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{stats.top_winner.real_name}</div>
              <div style={{ color: 'var(--success)', fontWeight: 700 }}>+{fmtQ(stats.top_winner.total_net)}</div>
            </div>
          </div>
          <div className="card" style={{ borderLeft: '4px solid var(--danger)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '2rem' }}>💸</div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mayor perdedor</div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{stats.top_loser.real_name}</div>
              <div style={{ color: 'var(--danger)', fontWeight: 700 }}>{fmtQ(stats.top_loser.total_net)}</div>
            </div>
          </div>
        </div>
      )}

      <RankingChart ranking={stats.ranking} />
    </div>
  )
}

function PlayerHistoryChart({ history }) {
  if (!history?.length) return null
  const data = history.map((h, i) => ({
    name: h.table_name.length > 12 ? h.table_name.slice(0, 12) + '…' : h.table_name,
    value: h.net_result,
  }))

  return (
    <div className="card" style={{ marginBottom: '1.25rem' }}>
      <h2 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 700 }}>📈 Resultados por mesa</h2>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ left: 0, right: 10, top: 4, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={v => `Q${(v / 10).toFixed(0)}`}
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--surface-2)' }} />
          <ReferenceLine y={0} stroke="var(--border)" strokeWidth={2} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.value >= 0 ? COLORS.positive : COLORS.negative} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function PlayerDashboard({ user }) {
  const [stats, setStats] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getMyStats(), getMyHistory()])
      .then(([s, h]) => { setStats(s); setHistory(h) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
      {[...Array(3)].map((_, i) => <div key={i} className="card skeleton" style={{ height: 80 }} />)}
    </div>
  )

  const netColor = stats?.total_net > 0 ? COLORS.positive : stats?.total_net < 0 ? COLORS.negative : 'var(--text-muted)'

  return (
    <div>
      {stats && stats.tables_played > 0 ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
            <StatBigCard icon="🃏" label="Mesas jugadas" value={stats.tables_played} color={COLORS.primary} />
            <StatBigCard
              icon={stats.total_net >= 0 ? '📈' : '📉'}
              label="Neto total"
              value={`${stats.total_net >= 0 ? '+' : ''}${fmtQ(stats.total_net)}`}
              color={netColor}
            />
            <StatBigCard icon="🔄" label="Recompras" value={stats.total_rebuys} color={COLORS.accent} sub="total de recompras" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className="card" style={{ display: 'flex', gap: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Mejor mesa</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: COLORS.positive }}>+{fmtQ(stats.best_result)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Peor mesa</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: COLORS.negative }}>{fmtQ(stats.worst_result)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Promedio</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: netColor }}>{stats.avg_net >= 0 ? '+' : ''}{fmtQ(stats.avg_net)}</div>
              </div>
            </div>
            <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Link to="/tables" className="btn-primary" style={{ flex: 1, textAlign: 'center', borderRadius: 'var(--radius)', padding: '0.7rem', display: 'block', textDecoration: 'none', fontWeight: 600, fontSize: '0.88rem' }}>
                Ver mesas →
              </Link>
              <Link to="/debts" className="btn-secondary" style={{ flex: 1, textAlign: 'center', borderRadius: 'var(--radius)', padding: '0.7rem', display: 'block', textDecoration: 'none', fontWeight: 600, fontSize: '0.88rem' }}>
                Mis deudas →
              </Link>
            </div>
          </div>

          <PlayerHistoryChart history={history} />
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem', borderStyle: 'dashed' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎲</div>
          <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text)' }}>Todavía no hay mesas</h3>
          <p style={{ color: 'var(--text-muted)', margin: '0 0 1.25rem', fontSize: '0.9rem' }}>
            Cuando el admin cierre tu primera mesa, verás tus estadísticas aquí.
          </p>
          <Link to="/tables" className="btn-primary" style={{ borderRadius: 'var(--radius)', padding: '0.65rem 1.25rem', display: 'inline-block', textDecoration: 'none', fontWeight: 600 }}>
            Ver mesas activas
          </Link>
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ margin: '0 0 0.15rem', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Bienvenido
        </p>
        <h1 style={{ margin: 0, color: 'var(--text)', fontSize: '1.7rem', fontWeight: 800 }}>{user.real_name}</h1>
      </div>

      {user.role === 'admin' ? <AdminDashboard /> : <PlayerDashboard user={user} />}
    </div>
  )
}
