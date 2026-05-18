import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
  AreaChart, Area,
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import { getDashboardStats, getMyStats, getMyHistory } from '../api/stats'
import { fmtQ } from '../utils/format'

const C = {
  positive: '#4f8a6a',
  negative: '#b3554d',
  primary:  '#2f5d62',
  accent:   '#4a6fa5',
  warning:  '#c08a3e',
  purple:   '#7b6c93',
}

/* ─── Tooltips ────────────────────────────────────────────────────────────── */
const MoneyTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const val = payload[0].value
  return (
    <div className="card" style={{ padding: '0.6rem 0.85rem', minWidth: 130, boxShadow: 'var(--shadow-md)' }}>
      <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontWeight: 700, color: val >= 0 ? C.positive : C.negative, fontSize: '1rem' }}>
        {val >= 0 ? '+' : ''}{fmtQ(val)}
      </div>
    </div>
  )
}

const PoolTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const pool = payload[0].value
  const count = payload[0].payload.table_count
  return (
    <div className="card" style={{ padding: '0.65rem 0.9rem', minWidth: 150, boxShadow: 'var(--shadow-md)' }}>
      <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>{label}</div>
      <div style={{ fontWeight: 700, color: C.primary, fontSize: '1rem' }}>{fmtQ(pool)}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.2rem' }}>
        {count} mesa{count !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

const ResultTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const { value, total_in, cash_out } = payload[0].payload
  return (
    <div className="card" style={{ padding: '0.7rem 0.9rem', minWidth: 150, boxShadow: 'var(--shadow-md)' }}>
      <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: value >= 0 ? C.positive : C.negative }}>
        {value >= 0 ? '+' : ''}{fmtQ(value)}
      </div>
      <div style={{ marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>Metido: {fmtQ(total_in)}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>Salida: {fmtQ(cash_out)}</div>
      </div>
    </div>
  )
}

/* ─── Stat card ───────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, color, icon, small }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem' }}>
      <div style={{
        width: 46, height: 46, borderRadius: 12, flexShrink: 0,
        background: (color || C.primary) + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.35rem',
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: small ? '1.2rem' : '1.6rem',
          fontWeight: 800,
          color: color || 'var(--text)',
          lineHeight: 1.1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {value}
        </div>
        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontWeight: 500 }}>
          {label}
        </div>
        {sub && <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '0.1rem' }}>{sub}</div>}
      </div>
    </div>
  )
}

/* ─── Highlight card ──────────────────────────────────────────────────────── */
function HighlightCard({ icon, label, name, value, valueColor, sub, borderColor }) {
  return (
    <div className="card" style={{ borderLeft: `4px solid ${borderColor}`, display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ fontSize: '2rem', flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </div>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name}
        </div>
        {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>{sub}</div>}
      </div>
      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: valueColor, flexShrink: 0 }}>
        {value}
      </div>
    </div>
  )
}

/* ─── Ranking chart ───────────────────────────────────────────────────────── */
function RankingChart({ ranking }) {
  if (!ranking?.length) return null
  const data = ranking.map(p => ({ name: p.real_name, value: p.total_net, tables: p.tables_played }))
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>🏆 Ranking global</h2>
        <span className="badge badge-neutral">{ranking.length} jugadores</span>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(140, data.length * 46)}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 72, top: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
          <XAxis type="number" tickFormatter={v => `Q${(v / 10).toFixed(0)}`}
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={92}
            tick={{ fontSize: 12, fill: 'var(--text)', fontWeight: 500 }} axisLine={false} tickLine={false} />
          <Tooltip content={<MoneyTooltip />} cursor={{ fill: 'var(--surface-2)' }} />
          <ReferenceLine x={0} stroke="var(--border)" strokeWidth={2} />
          <Bar dataKey="value" radius={[0, 5, 5, 0]} maxBarSize={26}
            label={{ position: 'right', formatter: v => (v >= 0 ? '+' : '') + fmtQ(v), fontSize: 11, fill: 'var(--text-muted)', fontWeight: 600 }}>
            {data.map((e, i) => <Cell key={i} fill={e.value >= 0 ? C.positive : C.negative} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ─── Time series ─────────────────────────────────────────────────────────── */
function TimeSeriesChart({ tablesByDay }) {
  if (!tablesByDay?.length) return null
  const data = tablesByDay.map(d => ({
    date: new Date(d.date + 'T12:00:00').toLocaleDateString('es-GT', { day: '2-digit', month: 'short' }),
    total_pool: d.total_pool,
    table_count: d.table_count,
  }))

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>📅 Actividad por día</h2>
          <p style={{ margin: '0.1rem 0 0', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Dinero total jugado por fecha de cierre de mesa
          </p>
        </div>
        <span className="badge badge-neutral">{tablesByDay.length} día{tablesByDay.length !== 1 ? 's' : ''}</span>
      </div>
      <ResponsiveContainer width="100%" height={210}>
        <AreaChart data={data} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="poolGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={C.primary} stopOpacity={0.22} />
              <stop offset="95%" stopColor={C.primary} stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={v => `Q${(v / 10).toFixed(0)}`}
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={60} />
          <Tooltip content={<PoolTooltip />} cursor={{ stroke: C.primary, strokeWidth: 1, strokeDasharray: '4 2' }} />
          <Area type="monotone" dataKey="total_pool"
            stroke={C.primary} strokeWidth={2.5} fill="url(#poolGrad)"
            dot={{ r: 4, fill: C.primary, stroke: 'white', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: C.primary, stroke: 'white', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ─── Admin dashboard ─────────────────────────────────────────────────────── */
function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { getDashboardStats().then(setStats).finally(() => setLoading(false)) }, [])

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[...Array(4)].map((_, i) => <div key={i} className="card skeleton" style={{ height: 80 }} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {[...Array(3)].map((_, i) => <div key={i} className="card skeleton" style={{ height: 80 }} />)}
      </div>
      <div className="card skeleton" style={{ height: 240 }} />
      <div className="card skeleton" style={{ height: 200 }} />
    </div>
  )
  if (!stats) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Fila 1: conteos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <StatCard icon="🃏" label="Total mesas"       value={stats.total_tables}  color={C.primary} />
        <StatCard icon="🟢" label="Mesas abiertas"    value={stats.open_tables}   color={C.positive} sub="en juego ahora" />
        <StatCard icon="👥" label="Jugadores activos"  value={stats.total_players} color={C.accent} />
        <StatCard icon="🏠" label="Grupos"             value={stats.total_groups}  color={C.purple} />
      </div>

      {/* Fila 2: dinero */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <StatCard icon="💰" label="Dinero total jugado" small
          value={fmtQ(stats.total_money_played)} color={C.positive}
          sub="suma de todos los buy-ins" />
        <StatCard icon="🔄" label="Recompras totales"
          value={stats.total_rebuys} color={C.warning}
          sub="en todas las mesas cerradas" />
        {stats.biggest_table ? (
          <StatCard icon="🎰" label="Mesa más grande" small
            value={fmtQ(stats.biggest_table.total_pool)} color={C.accent}
            sub={`${stats.biggest_table.name} · ${stats.biggest_table.player_count} jugadores`} />
        ) : (
          <StatCard icon="🎰" label="Mesa más grande" value="—" color={C.accent} />
        )}
      </div>

      {/* Fila 3: destacados */}
      {(stats.top_winner || stats.top_loser || stats.most_active) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {stats.top_winner && (
            <HighlightCard icon="🥇" label="Mayor ganador" borderColor="var(--success)"
              name={stats.top_winner.real_name}
              value={`+${fmtQ(stats.top_winner.total_net)}`} valueColor="var(--success)"
              sub={`${stats.top_winner.tables_played} mesas · promedio ${fmtQ(stats.top_winner.avg_net)}`} />
          )}
          {stats.top_loser && (
            <HighlightCard icon="💸" label="Mayor perdedor" borderColor="var(--danger)"
              name={stats.top_loser.real_name}
              value={fmtQ(stats.top_loser.total_net)} valueColor="var(--danger)"
              sub={`Peor: ${fmtQ(stats.top_loser.worst_result)} · promedio ${fmtQ(stats.top_loser.avg_net)}`} />
          )}
          {stats.most_active && (
            <HighlightCard icon="🎲" label="Más activo" borderColor="var(--accent)"
              name={stats.most_active.real_name}
              value={`${stats.most_active.tables_played} mesas`} valueColor="var(--accent)"
              sub={`Neto total: ${stats.most_active.total_net >= 0 ? '+' : ''}${fmtQ(stats.most_active.total_net)}`} />
          )}
        </div>
      )}

      {/* Gráfica de tiempo */}
      <TimeSeriesChart tablesByDay={stats.tables_by_day} />

      {/* Ranking */}
      <RankingChart ranking={stats.ranking} />
    </div>
  )
}

/* ─── Player history chart ────────────────────────────────────────────────── */
function PlayerHistoryChart({ history }) {
  if (!history?.length) return null
  const data = history.map(h => ({
    name: h.table_name.length > 14 ? h.table_name.slice(0, 14) + '…' : h.table_name,
    value: h.net_result,
    total_in: h.total_in,
    cash_out: h.cash_out,
  }))

  return (
    <div className="card">
      <h2 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 700 }}>📈 Resultados por mesa</h2>
      <ResponsiveContainer width="100%" height={210}>
        <BarChart data={data} margin={{ left: 0, right: 10, top: 4, bottom: 28 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            axisLine={false} tickLine={false} angle={-20} textAnchor="end" />
          <YAxis tickFormatter={v => `Q${(v / 10).toFixed(0)}`}
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
          <Tooltip content={<ResultTooltip />} cursor={{ fill: 'var(--surface-2)' }} />
          <ReferenceLine y={0} stroke="var(--border)" strokeWidth={2} />
          <Bar dataKey="value" radius={[5, 5, 0, 0]} maxBarSize={44}>
            {data.map((e, i) => <Cell key={i} fill={e.value >= 0 ? C.positive : C.negative} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ─── Player dashboard ────────────────────────────────────────────────────── */
function PlayerDashboard() {
  const [stats, setStats] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getMyStats(), getMyHistory()])
      .then(([s, h]) => { setStats(s); setHistory(h) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {[...Array(3)].map((_, i) => <div key={i} className="card skeleton" style={{ height: 80 }} />)}
      </div>
      <div className="card skeleton" style={{ height: 210 }} />
    </div>
  )

  const netColor = stats?.total_net > 0 ? C.positive : stats?.total_net < 0 ? C.negative : 'var(--text-muted)'

  if (!stats || stats.tables_played === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2.5rem', borderStyle: 'dashed' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎲</div>
        <h3 style={{ margin: '0 0 0.5rem' }}>Todavía no hay mesas</h3>
        <p style={{ color: 'var(--text-muted)', margin: '0 0 1.25rem', fontSize: '0.9rem' }}>
          Cuando el admin cierre tu primera mesa, verás tus estadísticas aquí.
        </p>
        <Link to="/tables" className="btn-primary" style={{ borderRadius: 'var(--radius)', padding: '0.65rem 1.25rem', display: 'inline-block', textDecoration: 'none', fontWeight: 600 }}>
          Ver mesas activas
        </Link>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <StatCard icon="🃏" label="Mesas jugadas" value={stats.tables_played} color={C.primary} />
        <StatCard icon={stats.total_net >= 0 ? '📈' : '📉'} label="Neto total" small
          value={`${stats.total_net >= 0 ? '+' : ''}${fmtQ(stats.total_net)}`} color={netColor} />
        <StatCard icon="🔄" label="Recompras" value={stats.total_rebuys} color={C.accent} sub="total" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="card">
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
            Récords personales
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {[
              { label: 'Mejor', value: `+${fmtQ(stats.best_result)}`, color: C.positive },
              { label: 'Peor',  value: fmtQ(stats.worst_result),       color: C.negative },
              { label: 'Prom.', value: `${stats.avg_net >= 0 ? '+' : ''}${fmtQ(stats.avg_net)}`, color: netColor },
            ].map((r, i) => (
              <div key={i}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase' }}>{r.label}</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: r.color }}>{r.value}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link to="/tables" className="btn-primary" style={{ flex: 1, textAlign: 'center', borderRadius: 'var(--radius)', padding: '0.7rem', display: 'block', textDecoration: 'none', fontWeight: 600, fontSize: '0.88rem' }}>
            Ver mesas →
          </Link>
          <Link to="/debts" className="btn-secondary" style={{ flex: 1, textAlign: 'center', borderRadius: 'var(--radius)', padding: '0.7rem', display: 'block', textDecoration: 'none', fontWeight: 600, fontSize: '0.88rem' }}>
            Mis deudas →
          </Link>
        </div>
      </div>

      <PlayerHistoryChart history={history} />
    </div>
  )
}

/* ─── Root ────────────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const { user } = useAuth()
  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ margin: '0 0 0.1rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Bienvenido
        </p>
        <h1 style={{ margin: 0, fontSize: '1.7rem', fontWeight: 800 }}>{user.real_name}</h1>
      </div>
      {user.role === 'admin' ? <AdminDashboard /> : <PlayerDashboard />}
    </div>
  )
}
