import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getDashboardStats, getMyStats } from '../api/stats'
import { fmtQ } from '../utils/format'

function StatCard({ label, value, color }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
      <div style={{ fontSize: '1.75rem', fontWeight: 700, color: color || 'var(--primary)' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
        {label}
      </div>
    </div>
  )
}

function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardStats().then(setStats).finally(() => setLoading(false))
  }, [])

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Cargando estadísticas...</p>
  if (!stats) return null

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard label="Total mesas" value={stats.total_tables} />
        <StatCard label="Mesas abiertas" value={stats.open_tables} color="var(--success)" />
        <StatCard label="Jugadores" value={stats.total_players} color="var(--accent)" />
        <StatCard label="Grupos" value={stats.total_groups} color="var(--soft-purple)" />
      </div>

      {stats.ranking.length > 0 && (
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Ranking global
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '0.5rem', color: 'var(--text-muted)', fontWeight: 500 }}>#</th>
                <th style={{ textAlign: 'left', padding: '0.5rem', color: 'var(--text-muted)', fontWeight: 500 }}>Jugador</th>
                <th style={{ textAlign: 'right', padding: '0.5rem', color: 'var(--text-muted)', fontWeight: 500 }}>Mesas</th>
                <th style={{ textAlign: 'right', padding: '0.5rem', color: 'var(--text-muted)', fontWeight: 500 }}>Neto total</th>
              </tr>
            </thead>
            <tbody>
              {stats.ranking.map((p, i) => (
                <tr key={p.user_id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td style={{ padding: '0.5rem', fontWeight: 500 }}>{p.real_name}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>{p.tables_played}</td>
                  <td style={{
                    padding: '0.5rem',
                    textAlign: 'right',
                    fontWeight: 600,
                    color: p.total_net >= 0 ? 'var(--success)' : 'var(--danger)',
                  }}>
                    {p.total_net >= 0 ? '+' : ''}{fmtQ(p.total_net)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function PlayerDashboard({ user }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyStats().then(setStats).finally(() => setLoading(false))
  }, [])

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Cargando estadísticas...</p>

  return (
    <div>
      {stats && stats.tables_played > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <StatCard label="Mesas jugadas" value={stats.tables_played} />
          <StatCard
            label="Neto total"
            value={`${stats.total_net >= 0 ? '+' : ''}${fmtQ(stats.total_net)}`}
            color={stats.total_net >= 0 ? 'var(--success)' : 'var(--danger)'}
          />
          <StatCard label="Recompras totales" value={fmtQ(stats.total_rebuys)} color="var(--warning)" />
        </div>
      ) : (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Aún no has jugado en ninguna mesa cerrada.
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link to="/tables" className="btn-primary" style={{ padding: '0.6rem 1.2rem', borderRadius: 'var(--radius)', fontWeight: 500, fontSize: '0.9rem' }}>
          Ver mis mesas →
        </Link>
        <Link to="/debts" className="btn-secondary" style={{ padding: '0.6rem 1.2rem', borderRadius: 'var(--radius)', fontWeight: 500, fontSize: '0.9rem' }}>
          Mis deudas →
        </Link>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ margin: '0 0 0.2rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Bienvenido</p>
        <h1 style={{ margin: 0, color: 'var(--primary)', fontSize: '1.6rem' }}>{user.real_name}</h1>
      </div>

      {user.role === 'admin' ? <AdminDashboard /> : <PlayerDashboard user={user} />}
    </div>
  )
}
