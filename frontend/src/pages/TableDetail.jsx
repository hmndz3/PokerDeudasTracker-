import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getTable, addPlayer, updatePlayerResult, validateTable, closeTable,
} from '../api/tables'
import { getUsers } from '../api/stats'
import { useAuth } from '../context/AuthContext'
import { fmtQ, toDecimos } from '../utils/format'

function Avatar({ name, size = 'md' }) {
  const initial = name?.charAt(0)?.toUpperCase() || '?'
  const cls = size === 'sm' ? 'avatar avatar-sm' : size === 'lg' ? 'avatar avatar-lg' : 'avatar'
  return <div className={cls}>{initial}</div>
}

function NetResult({ value }) {
  const cls = value > 0 ? 'net-positive' : value < 0 ? 'net-negative' : 'net-zero'
  return (
    <span className={cls}>
      {value > 0 ? '+' : ''}{fmtQ(value)}
    </span>
  )
}

function Counter({ value, onChange, min = 0, disabled }) {
  return (
    <div className="counter">
      <button type="button" onClick={() => onChange(value - 1)} disabled={disabled || value <= min}>−</button>
      <span>{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} disabled={disabled}>+</button>
    </div>
  )
}

function PlayerCard({ result, buyInAmount, isAdmin, isClosed, onSave, onRemove }) {
  const [editing, setEditing] = useState(false)
  const [rebuys, setRebuys] = useState(result.rebuys)
  const [cashOutRaw, setCashOutRaw] = useState((result.cash_out / 10).toFixed(1))
  const [saving, setSaving] = useState(false)

  const displayTotalIn = buyInAmount * (1 + rebuys)
  const displayNet = toDecimos(cashOutRaw) - displayTotalIn

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(result.user_id, { rebuys, cash_out: toDecimos(cashOutRaw) })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setRebuys(result.rebuys)
    setCashOutRaw((result.cash_out / 10).toFixed(1))
    setEditing(false)
  }

  return (
    <div className="card" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      borderTop: `3px solid ${result.net_result > 0 ? 'var(--success)' : result.net_result < 0 ? 'var(--danger)' : 'var(--border)'}`,
      transition: 'box-shadow 0.15s',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Avatar name={result.real_name} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{result.real_name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{result.username}</div>
          </div>
        </div>
        {!isClosed && isAdmin && !editing && (
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button className="btn-icon" onClick={() => setEditing(true)} title="Editar">✏️</button>
            <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => onRemove(result.user_id)} title="Quitar">×</button>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
        <div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
            Buy-in
          </div>
          <div style={{ fontWeight: 600, color: 'var(--text)' }}>{fmtQ(result.buy_in)}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>fijo</div>
        </div>

        <div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
            Recompras
          </div>
          {editing ? (
            <Counter value={rebuys} onChange={setRebuys} min={0} />
          ) : (
            <>
              <div style={{ fontWeight: 600 }}>{result.rebuys}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>{fmtQ(result.rebuys * result.buy_in)} extra</div>
            </>
          )}
        </div>

        <div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
            Total metido
          </div>
          <div style={{ fontWeight: 600 }}>
            {editing ? fmtQ(displayTotalIn) : fmtQ(result.total_in)}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>{editing ? `${1 + rebuys} buy-ins` : `${1 + result.rebuys} buy-ins`}</div>
        </div>
      </div>

      <div className="divider" style={{ margin: '0' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
            Salida (Q)
          </div>
          {editing ? (
            <input
              type="number"
              min="0"
              step="0.1"
              value={cashOutRaw}
              onChange={e => setCashOutRaw(e.target.value)}
              style={{ padding: '0.35rem 0.6rem', fontSize: '0.9rem' }}
            />
          ) : (
            <div style={{ fontWeight: 600, fontSize: '1rem' }}>{fmtQ(result.cash_out)}</div>
          )}
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
            Resultado
          </div>
          <div style={{ fontSize: '1.15rem' }}>
            {editing
              ? <NetResult value={displayNet} />
              : <NetResult value={result.net_result} />
            }
          </div>
        </div>
      </div>

      {editing && (
        <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.25rem' }}>
          <button className="btn-primary" style={{ flex: 1, padding: '0.5rem' }} onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : '✓ Guardar'}
          </button>
          <button className="btn-secondary" style={{ padding: '0.5rem 0.85rem' }} onClick={handleCancel}>
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}

export default function TableDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [table, setTable] = useState(null)
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [validation, setValidation] = useState(null)
  const [closing, setClosing] = useState(false)
  const [closeError, setCloseError] = useState('')

  const load = async () => {
    const [t, users] = await Promise.all([
      getTable(id),
      isAdmin ? getUsers() : Promise.resolve([]),
    ])
    setTable(t)
    setAllUsers(users)
    setLoading(false)
    setValidation(null)
  }

  useEffect(() => { load() }, [id])

  const playerIds = table?.results?.map(r => r.user_id) || []
  const eligible = allUsers.filter(u => !playerIds.includes(u.id) && u.is_active)
  const isClosed = table?.status === 'closed'

  const handleAddPlayer = async (userId) => {
    try {
      await addPlayer(id, { user_id: userId })
      load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al agregar jugador')
    }
  }

  const handleSave = async (userId, data) => {
    try {
      await updatePlayerResult(id, userId, data)
      load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al guardar')
    }
  }

  const handleRemove = async (userId) => {
    if (!confirm('¿Quitar este jugador de la mesa?')) return
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/tables/${id}/players/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      load()
    } catch (err) {
      alert('Error al quitar jugador')
    }
  }

  const handleValidate = async () => {
    try {
      const v = await validateTable(id)
      setValidation(v)
    } catch (err) {
      alert(err.response?.data?.detail || 'Error')
    }
  }

  const handleClose = async () => {
    if (!confirm('¿Cerrar la mesa? Esto generará las deudas automáticamente.')) return
    setCloseError('')
    setClosing(true)
    try {
      await closeTable(id)
      load()
    } catch (err) {
      setCloseError(err.response?.data?.detail || 'Error al cerrar')
    } finally {
      setClosing(false)
    }
  }

  if (loading) return (
    <div>
      <div className="card skeleton" style={{ height: 80, marginBottom: '1rem' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {[...Array(3)].map((_, i) => <div key={i} className="card skeleton" style={{ height: 200 }} />)}
      </div>
    </div>
  )
  if (!table) return <p style={{ color: 'var(--danger)' }}>Mesa no encontrada</p>

  const winners = table.results.filter(r => r.net_result > 0).sort((a, b) => b.net_result - a.net_result)
  const losers = table.results.filter(r => r.net_result < 0).sort((a, b) => a.net_result - b.net_result)

  return (
    <div>
      <button className="btn-ghost" onClick={() => navigate('/tables')} style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
        ← Volver a mesas
      </button>

      {/* Table header */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>{table.name}</h1>
              <span className={`badge ${isClosed ? 'badge-neutral' : 'badge-success'}`}>
                {isClosed ? '🔒 Cerrada' : '🟢 Abierta'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>👥 {table.group_name}</span>
              <span style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>🃏 {table.results.length} jugadores</span>
              <span className="badge badge-primary" style={{ fontSize: '0.78rem' }}>
                Buy-in: {fmtQ(table.buy_in_amount)} c/u
              </span>
            </div>
          </div>

          {isAdmin && !isClosed && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn-secondary" onClick={handleValidate}>📊 Validar</button>
              <button className="btn-primary" onClick={handleClose} disabled={closing}>
                {closing ? 'Cerrando...' : '🔒 Cerrar mesa'}
              </button>
            </div>
          )}
        </div>

        {/* Totals row */}
        {table.results.length > 0 && (
          <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total metido</div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{fmtQ(table.total_in)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total salido</div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{fmtQ(table.total_out)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Diferencia</div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: table.total_out - table.total_in === 0 ? 'var(--success)' : 'var(--danger)' }}>
                {fmtQ(table.total_out - table.total_in)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Validation result */}
      {validation && (
        <div className="card" style={{
          marginBottom: '1.25rem',
          borderLeft: `4px solid ${validation.can_close ? 'var(--success)' : 'var(--danger)'}`,
          background: validation.can_close ? 'var(--success-light)' : 'var(--danger-light)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>{validation.can_close ? '✅' : '❌'}</span>
            <div>
              <div style={{ fontWeight: 700, color: validation.can_close ? 'var(--success)' : 'var(--danger)' }}>
                {validation.can_close ? 'La mesa puede cerrarse' : 'No cuadra aún'}
              </div>
              {!validation.can_close && (
                <div style={{ fontSize: '0.83rem', color: 'var(--danger)', marginTop: '0.15rem' }}>
                  Diferencia: {fmtQ(validation.difference)} — ajusta las salidas antes de cerrar
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {closeError && (
        <div className="card" style={{ marginBottom: '1rem', borderLeft: '4px solid var(--danger)', background: 'var(--danger-light)' }}>
          <p style={{ color: 'var(--danger)', margin: 0, fontSize: '0.88rem' }}>❌ {closeError}</p>
        </div>
      )}

      {/* Add player section (admin, open table) */}
      {isAdmin && !isClosed && eligible.length > 0 && (
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div className="section-label">Agregar jugadores</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {eligible.map(u => (
              <button
                key={u.id}
                className="player-chip"
                onClick={() => handleAddPlayer(u.id)}
              >
                <div className="avatar avatar-sm">{u.real_name.charAt(0).toUpperCase()}</div>
                {u.real_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Players grid */}
      {table.results.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem', borderStyle: 'dashed' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>No hay jugadores aún. Agrega jugadores arriba.</p>
        </div>
      ) : (
        <>
          <div className="section-label" style={{ marginBottom: '0.75rem' }}>
            Jugadores ({table.results.length})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {table.results.map(r => (
              <PlayerCard
                key={r.user_id}
                result={r}
                buyInAmount={table.buy_in_amount}
                isAdmin={isAdmin}
                isClosed={isClosed}
                onSave={handleSave}
                onRemove={handleRemove}
              />
            ))}
          </div>

          {/* Summary after close */}
          {isClosed && (
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <div className="section-label" style={{ marginBottom: '0.75rem' }}>Resumen de resultados</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                {winners.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 700, marginBottom: '0.5rem' }}>🏆 Ganadores</div>
                    {winners.map(r => (
                      <div key={r.user_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{r.real_name}</span>
                        <span style={{ fontWeight: 700, color: 'var(--success)' }}>+{fmtQ(r.net_result)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {losers.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 700, marginBottom: '0.5rem' }}>💸 Perdedores</div>
                    {losers.map(r => (
                      <div key={r.user_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{r.real_name}</span>
                        <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{fmtQ(r.net_result)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
