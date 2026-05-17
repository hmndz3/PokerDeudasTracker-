import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getTables } from '../api/tables'
import { useAuth } from '../context/AuthContext'

const STATUS_BADGE = {
  open: { label: 'Abierta', color: 'var(--success)', bg: '#edf7f2' },
  closed: { label: 'Cerrada', color: 'var(--text-muted)', bg: 'var(--surface-2)' },
}

export default function Tables() {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    getTables().then(setTables).finally(() => setLoading(false))
  }, [])

  const open = tables.filter(t => t.status === 'open')
  const closed = tables.filter(t => t.status === 'closed')

  const TableRow = ({ t }) => {
    const badge = STATUS_BADGE[t.status] || STATUS_BADGE.open
    return (
      <Link to={`/tables/${t.id}`} style={{ textDecoration: 'none' }}>
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: '0.6rem' }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>{t.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {t.group_name} · {t.player_count} jugador{t.player_count !== 1 ? 'es' : ''}
              {t.closed_at && ` · Cerrada ${new Date(t.closed_at).toLocaleDateString('es-GT')}`}
            </div>
          </div>
          <span style={{
            background: badge.bg,
            color: badge.color,
            borderRadius: '999px',
            padding: '0.2rem 0.75rem',
            fontSize: '0.78rem',
            fontWeight: 500,
          }}>
            {badge.label}
          </span>
        </div>
      </Link>
    )
  }

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Cargando...</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem' }}>Mesas</h1>
        {isAdmin && (
          <button className="btn-primary" onClick={() => navigate('/tables/new')}>
            + Nueva mesa
          </button>
        )}
      </div>

      {tables.length === 0 ? (
        <div className="card">
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>No hay mesas aún.</p>
        </div>
      ) : (
        <>
          {open.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Abiertas
              </h2>
              {open.map(t => <TableRow key={t.id} t={t} />)}
            </div>
          )}
          {closed.length > 0 && (
            <div>
              <h2 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Cerradas
              </h2>
              {closed.map(t => <TableRow key={t.id} t={t} />)}
            </div>
          )}
        </>
      )}
    </div>
  )
}
