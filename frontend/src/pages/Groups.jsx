import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getGroups, createGroup } from '../api/groups'

export default function Groups() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  const load = () => getGroups().then(setGroups).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setCreating(true)
    try {
      await createGroup({ name })
      setName('')
      setShowForm(false)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear grupo')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text)' }}>Grupos</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nuevo grupo'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <form onSubmit={handleCreate} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label>Nombre del grupo</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej: Viernes poker"
                required
                autoFocus
              />
            </div>
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? 'Creando...' : 'Crear'}
            </button>
          </form>
          {error && <div className="error-text" style={{ marginTop: '0.5rem' }}>{error}</div>}
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Cargando...</p>
      ) : groups.length === 0 ? (
        <div className="card">
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>No hay grupos creados.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {groups.map(g => (
            <Link
              key={g.id}
              to={`/groups/${g.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'box-shadow 0.15s' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '0.2rem' }}>{g.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {g.member_count} miembro{g.member_count !== 1 ? 's' : ''}
                  </div>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>›</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
