import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getGroup, addMember, removeMember } from '../api/groups'
import { getUsers } from '../api/stats'
import { useAuth } from '../context/AuthContext'

export default function GroupDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [group, setGroup] = useState(null)
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  const load = () =>
    Promise.all([
      getGroup(id),
      isAdmin ? getUsers() : Promise.resolve([]),
    ]).then(([g, users]) => {
      setGroup(g)
      setAllUsers(users)
    }).finally(() => setLoading(false))

  useEffect(() => { load() }, [id])

  const memberIds = group?.members?.map(m => m.user_id) || []
  const eligibleUsers = allUsers.filter(u => !memberIds.includes(u.id) && u.is_active)

  const handleAdd = async () => {
    if (!selectedUserId) return
    setError('')
    setAdding(true)
    try {
      await addMember(id, parseInt(selectedUserId))
      setSelectedUserId('')
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al agregar miembro')
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (userId) => {
    if (!confirm('¿Eliminar este miembro del grupo?')) return
    try {
      await removeMember(id, userId)
      load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al eliminar miembro')
    }
  }

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Cargando...</p>
  if (!group) return <p style={{ color: 'var(--danger)' }}>Grupo no encontrado</p>

  return (
    <div>
      <button className="btn-secondary" onClick={() => navigate('/groups')} style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
        ← Volver
      </button>

      <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.4rem' }}>{group.name}</h1>
      <p style={{ color: 'var(--text-muted)', marginTop: 0, fontSize: '0.85rem' }}>
        {group.members.length} miembro{group.members.length !== 1 ? 's' : ''}
      </p>

      {isAdmin && (
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ marginTop: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Agregar miembro</h3>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <select
              value={selectedUserId}
              onChange={e => setSelectedUserId(e.target.value)}
              style={{ flex: 1 }}
            >
              <option value="">Seleccionar usuario...</option>
              {eligibleUsers.map(u => (
                <option key={u.id} value={u.id}>{u.real_name} (@{u.username})</option>
              ))}
            </select>
            <button className="btn-primary" onClick={handleAdd} disabled={!selectedUserId || adding}>
              {adding ? 'Agregando...' : 'Agregar'}
            </button>
          </div>
          {error && <div className="error-text" style={{ marginTop: '0.5rem' }}>{error}</div>}
        </div>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Miembros</h3>
        {group.members.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>No hay miembros aún.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {group.members.map(m => (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <span style={{ fontWeight: 500 }}>{m.real_name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginLeft: '0.5rem' }}>@{m.username}</span>
                </div>
                {isAdmin && (
                  <button className="btn-danger" style={{ fontSize: '0.8rem', padding: '0.3rem 0.7rem' }} onClick={() => handleRemove(m.user_id)}>
                    Quitar
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
