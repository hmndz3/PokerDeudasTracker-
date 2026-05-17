import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTable } from '../api/tables'
import { getGroups } from '../api/groups'
import { toDecimos, fmtQ } from '../utils/format'

export default function TableCreate() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [groupId, setGroupId] = useState('')
  const [buyInRaw, setBuyInRaw] = useState('')
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getGroups().then(setGroups)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const buy_in_amount = toDecimos(buyInRaw)
    if (buy_in_amount <= 0) {
      setError('El monto de buy-in debe ser mayor a 0')
      return
    }
    setLoading(true)
    try {
      const table = await createTable({ name, group_id: parseInt(groupId), buy_in_amount })
      navigate(`/tables/${table.id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear mesa')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <button className="btn-ghost" onClick={() => navigate('/tables')} style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
        ← Volver a mesas
      </button>

      <div className="page-header">
        <h1 className="page-title">Nueva mesa</h1>
      </div>

      <div className="card" style={{ padding: '1.75rem' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre de la mesa</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Viernes 17 mayo"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Grupo</label>
            <select value={groupId} onChange={e => setGroupId(e.target.value)} required>
              <option value="">Seleccionar grupo...</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Buy-in (Q) — monto fijo para todos</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={buyInRaw}
              onChange={e => setBuyInRaw(e.target.value)}
              placeholder="Ej: 50.0"
              required
            />
            {buyInRaw && toDecimos(buyInRaw) > 0 && (
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Cada jugador entra con <strong style={{ color: 'var(--primary)' }}>{fmtQ(toDecimos(buyInRaw))}</strong> y cada recompra cuesta lo mismo.
              </p>
            )}
          </div>

          {error && <div className="error-text">{error}</div>}

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
            disabled={loading}
          >
            {loading ? 'Creando mesa...' : 'Crear mesa →'}
          </button>
        </form>
      </div>
    </div>
  )
}
