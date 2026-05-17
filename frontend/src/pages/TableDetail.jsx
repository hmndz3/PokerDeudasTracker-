import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getTable, addPlayer, updatePlayerResult, validateTable, closeTable,
} from '../api/tables'
import { getUsers } from '../api/stats'
import { useAuth } from '../context/AuthContext'
import { fmtQ, toDecimos, fmt } from '../utils/format'

function NetBadge({ value }) {
  const color = value > 0 ? 'var(--success)' : value < 0 ? 'var(--danger)' : 'var(--text-muted)'
  return (
    <span style={{ fontWeight: 700, color }}>
      {value >= 0 ? '+' : ''}{fmtQ(value)}
    </span>
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

  // Add player form
  const [selUserId, setSelUserId] = useState('')
  const [buyIn, setBuyIn] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')

  // Edit result
  const [editing, setEditing] = useState(null) // user_id being edited
  const [editFields, setEditFields] = useState({})
  const [saving, setSaving] = useState(false)

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
  }

  useEffect(() => { load() }, [id])

  const playerIds = table?.results?.map(r => r.user_id) || []
  const eligible = allUsers.filter(u => !playerIds.includes(u.id) && u.is_active)
  const isClosed = table?.status === 'closed'

  const handleAddPlayer = async (e) => {
    e.preventDefault()
    setAddError('')
    setAdding(true)
    try {
      await addPlayer(id, { user_id: parseInt(selUserId), buy_in: toDecimos(buyIn) })
      setSelUserId('')
      setBuyIn('')
      load()
    } catch (err) {
      setAddError(err.response?.data?.detail || 'Error')
    } finally {
      setAdding(false)
    }
  }

  const startEdit = (r) => {
    setEditing(r.user_id)
    setEditFields({ rebuys: fmt(r.rebuys), cash_out: fmt(r.cash_out) })
  }

  const handleSaveEdit = async (userId) => {
    setSaving(true)
    try {
      await updatePlayerResult(id, userId, {
        rebuys: toDecimos(editFields.rebuys || '0'),
        cash_out: toDecimos(editFields.cash_out || '0'),
      })
      setEditing(null)
      load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al guardar')
    } finally {
      setSaving(false)
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
    if (!confirm('¿Cerrar esta mesa? Esta acción generará las deudas automáticamente.')) return
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

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Cargando...</p>
  if (!table) return <p style={{ color: 'var(--danger)' }}>Mesa no encontrada</p>

  return (
    <div>
      <button className="btn-secondary" onClick={() => navigate('/tables')} style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
        ← Volver
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.4rem' }}>{table.name}</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>
            {table.group_name} ·{' '}
            <span style={{ color: isClosed ? 'var(--text-muted)' : 'var(--success)', fontWeight: 500 }}>
              {isClosed ? 'Cerrada' : 'Abierta'}
            </span>
          </p>
        </div>

        {isAdmin && !isClosed && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-secondary" onClick={handleValidate}>Validar</button>
            <button className="btn-primary" onClick={handleClose} disabled={closing}>
              {closing ? 'Cerrando...' : 'Cerrar mesa'}
            </button>
          </div>
        )}
      </div>

      {/* Validation result */}
      {validation && (
        <div className="card" style={{
          marginBottom: '1.25rem',
          borderLeft: `4px solid ${validation.can_close ? 'var(--success)' : 'var(--danger)'}`,
        }}>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Total metido</span><br /><strong>{fmtQ(validation.total_in)}</strong></div>
            <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Total salido</span><br /><strong>{fmtQ(validation.total_out)}</strong></div>
            <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Diferencia</span><br /><strong style={{ color: validation.can_close ? 'var(--success)' : 'var(--danger)' }}>{fmtQ(validation.difference)}</strong></div>
            <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Estado</span><br /><strong style={{ color: validation.can_close ? 'var(--success)' : 'var(--danger)' }}>{validation.can_close ? '✓ Puede cerrarse' : '✗ No cuadra'}</strong></div>
          </div>
        </div>
      )}

      {closeError && (
        <div className="card" style={{ marginBottom: '1rem', borderLeft: '4px solid var(--danger)' }}>
          <p style={{ color: 'var(--danger)', margin: 0 }}>{closeError}</p>
        </div>
      )}

      {/* Add player (admin, open table) */}
      {isAdmin && !isClosed && (
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ marginTop: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Agregar jugador</h3>
          <form onSubmit={handleAddPlayer} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 2, minWidth: '160px', marginBottom: 0 }}>
              <label>Jugador</label>
              <select value={selUserId} onChange={e => setSelUserId(e.target.value)} required>
                <option value="">Seleccionar...</option>
                {eligible.map(u => (
                  <option key={u.id} value={u.id}>{u.real_name}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: '100px', marginBottom: 0 }}>
              <label>Buy-in (Q)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={buyIn}
                onChange={e => setBuyIn(e.target.value)}
                placeholder="0.0"
                required
              />
            </div>
            <button type="submit" className="btn-primary" disabled={adding}>
              {adding ? '...' : 'Agregar'}
            </button>
          </form>
          {addError && <div className="error-text" style={{ marginTop: '0.5rem' }}>{addError}</div>}
        </div>
      )}

      {/* Results table */}
      <div className="card">
        <h3 style={{ marginTop: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Jugadores ({table.results.length})
        </h3>

        {table.results.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>No hay jugadores aún.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Jugador', 'Buy-in', 'Recompras', 'Total metido', 'Salida', 'Resultado', isAdmin && !isClosed ? 'Acción' : null]
                    .filter(Boolean)
                    .map(h => (
                      <th key={h} style={{ textAlign: h === 'Jugador' ? 'left' : 'right', padding: '0.5rem', color: 'var(--text-muted)', fontWeight: 500 }}>{h}</th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {table.results.map(r => (
                  <tr key={r.user_id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 500 }}>{r.real_name}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>{fmtQ(r.buy_in)}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                      {editing === r.user_id ? (
                        <input
                          type="number" min="0" step="0.1"
                          value={editFields.rebuys}
                          onChange={e => setEditFields(f => ({ ...f, rebuys: e.target.value }))}
                          style={{ width: '80px', padding: '0.25rem 0.4rem', textAlign: 'right' }}
                        />
                      ) : fmtQ(r.rebuys)}
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>{fmtQ(r.total_in)}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                      {editing === r.user_id ? (
                        <input
                          type="number" min="0" step="0.1"
                          value={editFields.cash_out}
                          onChange={e => setEditFields(f => ({ ...f, cash_out: e.target.value }))}
                          style={{ width: '80px', padding: '0.25rem 0.4rem', textAlign: 'right' }}
                        />
                      ) : fmtQ(r.cash_out)}
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}><NetBadge value={r.net_result} /></td>
                    {isAdmin && !isClosed && (
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                        {editing === r.user_id ? (
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                            <button className="btn-primary" style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem' }} onClick={() => handleSaveEdit(r.user_id)} disabled={saving}>
                              {saving ? '...' : 'Guardar'}
                            </button>
                            <button className="btn-secondary" style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem' }} onClick={() => setEditing(null)}>
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button className="btn-secondary" style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem' }} onClick={() => startEdit(r)}>
                            Editar
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              {table.results.length > 0 && (
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--border)', fontWeight: 600 }}>
                    <td style={{ padding: '0.5rem' }}>Total</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>{fmtQ(table.total_in)}</td>
                    <td />
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>{fmtQ(table.total_in)}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>{fmtQ(table.total_out)}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                      <NetBadge value={table.total_out - table.total_in} />
                    </td>
                    {isAdmin && !isClosed && <td />}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
