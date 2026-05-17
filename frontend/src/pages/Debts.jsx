import { useEffect, useState } from 'react'
import { getDebts, confirmPayment, confirmReceived, rejectPayment } from '../api/debts'
import { useAuth } from '../context/AuthContext'
import { fmtQ, STATUS_LABEL, STATUS_COLOR } from '../utils/format'

export default function Debts() {
  const { user } = useAuth()
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(null)
  const isAdmin = user?.role === 'admin'

  const load = () => getDebts().then(setDebts).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const act = async (fn, id) => {
    setActing(id)
    try { await fn(id); load() }
    catch (err) { alert(err.response?.data?.detail || 'Error') }
    finally { setActing(null) }
  }

  const pending = debts.filter(d => d.status !== 'completed')
  const completed = debts.filter(d => d.status === 'completed')

  const DebtCard = ({ d }) => {
    const iAmPayer = d.payer_id === user.id
    const iAmReceiver = d.receiver_id === user.id

    return (
      <div className="card" style={{ marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>
              {d.payer_name} → {d.receiver_name}
              <span style={{ fontWeight: 700, color: 'var(--primary)', marginLeft: '0.75rem' }}>
                {fmtQ(d.amount)}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mesa: {d.table_name}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{
              background: STATUS_COLOR[d.status] + '22',
              color: STATUS_COLOR[d.status],
              borderRadius: '999px',
              padding: '0.2rem 0.75rem',
              fontSize: '0.78rem',
              fontWeight: 500,
            }}>
              {STATUS_LABEL[d.status] ?? d.status}
            </span>

            {/* Actions */}
            {iAmPayer && d.status === 'pending' && (
              <button
                className="btn-primary"
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem' }}
                disabled={acting === d.id}
                onClick={() => act(confirmPayment, d.id)}
              >
                Ya pagué
              </button>
            )}
            {iAmReceiver && d.status === 'payer_confirmed' && (
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  className="btn-primary"
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem', background: 'var(--success)' }}
                  disabled={acting === d.id}
                  onClick={() => act(confirmReceived, d.id)}
                >
                  Recibido ✓
                </button>
                <button
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem' }}
                  disabled={acting === d.id}
                  onClick={() => act(rejectPayment, d.id)}
                >
                  Rechazar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Cargando...</p>

  return (
    <div>
      <h1 style={{ margin: '0 0 1.25rem', fontSize: '1.4rem' }}>
        {isAdmin ? 'Todas las deudas' : 'Mis deudas'}
      </h1>

      {debts.length === 0 ? (
        <div className="card"><p style={{ color: 'var(--text-muted)', margin: 0 }}>No hay deudas.</p></div>
      ) : (
        <>
          {pending.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Pendientes ({pending.length})
              </h2>
              {pending.map(d => <DebtCard key={d.id} d={d} />)}
            </div>
          )}
          {completed.length > 0 && (
            <div>
              <h2 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Completadas ({completed.length})
              </h2>
              {completed.map(d => <DebtCard key={d.id} d={d} />)}
            </div>
          )}
        </>
      )}
    </div>
  )
}
