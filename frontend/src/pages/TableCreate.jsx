import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTable } from '../api/tables'
import { getGroups } from '../api/groups'

export default function TableCreate() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [groupId, setGroupId] = useState('')
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getGroups().then(setGroups)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const table = await createTable({ name, group_id: parseInt(groupId) })
      navigate(`/tables/${table.id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear mesa')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button className="btn-secondary" onClick={() => navigate('/tables')} style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
        ← Volver
      </button>

      <h1 style={{ margin: '0 0 1.25rem', fontSize: '1.4rem' }}>Nueva mesa</h1>

      <div className="card" style={{ maxWidth: '480px' }}>
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

          {error && <div className="error-text">{error}</div>}

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Creando...' : 'Crear mesa'}
          </button>
        </form>
      </div>
    </div>
  )
}
