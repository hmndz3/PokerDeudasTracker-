import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getGroup, addMember, removeMember } from '../api/groups'
import { getUsers } from '../api/stats'
import { useAuth } from '../context/AuthContext'

function Avatar({ name, size = 'md' }) {
  const initial = name?.charAt(0)?.toUpperCase() || '?'
  return (
    <div className={`avatar avatar-${size}`} style={{ background: 'var(--primary-light)', color: 'var(--primary)', flexShrink: 0 }}>
      {initial}
    </div>
  )
}

/* Chip para usuario disponible (clickeable para agregar) */
function AvailableChip({ user, onAdd, adding }) {
  const isAdding = adding === user.id
  return (
    <button
      onClick={() => onAdd(user.id)}
      disabled={isAdding}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.55rem',
        padding: '0.5rem 0.85rem 0.5rem 0.5rem',
        background: isAdding ? 'var(--primary-light)' : 'var(--surface)',
        border: '1.5px solid var(--border)',
        borderRadius: '999px',
        cursor: isAdding ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        fontSize: '0.85rem',
        fontWeight: 500,
        color: 'var(--text)',
        transition: 'all 0.15s',
        opacity: isAdding ? 0.7 : 1,
      }}
      onMouseEnter={e => { if (!isAdding) { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-light)'; e.currentTarget.style.color = 'var(--primary)' } }}
      onMouseLeave={e => { if (!isAdding) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text)' } }}
    >
      <Avatar name={user.real_name} size="sm" />
      <div style={{ textAlign: 'left' }}>
        <div style={{ lineHeight: 1.2 }}>{user.real_name}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', lineHeight: 1 }}>@{user.username}</div>
      </div>
      <span style={{ marginLeft: '0.25rem', fontSize: '0.8rem', opacity: 0.6 }}>
        {isAdding ? '⏳' : '+'}
      </span>
    </button>
  )
}

/* Chip para miembro actual (con botón eliminar) */
function MemberChip({ member, onRemove, isAdmin, removing }) {
  const isRemoving = removing === member.user_id
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.6rem',
      padding: '0.55rem 0.75rem 0.55rem 0.55rem',
      background: 'var(--surface)',
      border: '1.5px solid var(--border)',
      borderRadius: '999px',
      position: 'relative',
    }}>
      <Avatar name={member.real_name} size="sm" />
      <div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.2 }}>{member.real_name}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', lineHeight: 1 }}>@{member.username}</div>
      </div>
      {isAdmin && (
        <button
          onClick={() => onRemove(member.user_id)}
          disabled={isRemoving}
          title="Quitar del grupo"
          style={{
            width: 20, height: 20, borderRadius: '50%',
            background: isRemoving ? 'var(--surface-2)' : 'var(--danger-light)',
            border: '1px solid #f0c8c6',
            color: 'var(--danger)',
            fontSize: '0.7rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: isRemoving ? 'not-allowed' : 'pointer',
            padding: 0, lineHeight: 1,
            transition: 'all 0.12s',
          }}
        >
          {isRemoving ? '…' : '×'}
        </button>
      )}
    </div>
  )
}

export default function GroupDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [group, setGroup] = useState(null)
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(null)   // user_id que se está agregando
  const [removing, setRemoving] = useState(null)
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
  const eligibleUsers = allUsers.filter(u => u.role === 'player' && !memberIds.includes(u.id) && u.is_active)

  const handleAdd = async (userId) => {
    setError('')
    setAdding(userId)
    try {
      await addMember(id, userId)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al agregar miembro')
    } finally {
      setAdding(null)
    }
  }

  const handleRemove = async (userId) => {
    if (!confirm('¿Quitar este jugador del grupo?')) return
    setRemoving(userId)
    try {
      await removeMember(id, userId)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al eliminar miembro')
    } finally {
      setRemoving(null)
    }
  }

  if (loading) return (
    <div>
      <div className="card skeleton" style={{ height: 48, marginBottom: '1rem', maxWidth: 120 }} />
      <div className="card skeleton" style={{ height: 160, marginBottom: '1rem' }} />
      <div className="card skeleton" style={{ height: 240 }} />
    </div>
  )
  if (!group) return <p style={{ color: 'var(--danger)' }}>Grupo no encontrado</p>

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <button className="btn-ghost" onClick={() => navigate('/groups')}
        style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
        ← Volver a grupos
      </button>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: '0.15rem' }}>{group.name}</h1>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {group.members.length} miembro{group.members.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Agregar miembros — solo admin */}
      {isAdmin && eligibleUsers.length > 0 && (
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>
              AGREGAR JUGADORES
            </h3>
            <span className="badge badge-neutral">{eligibleUsers.length} disponibles</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            {eligibleUsers.map(u => (
              <AvailableChip key={u.id} user={u} onAdd={handleAdd} adding={adding} />
            ))}
          </div>
          {error && (
            <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'var(--danger-light)', border: '1px solid #f0c8c6', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--danger)' }}>
              {error}
            </div>
          )}
        </div>
      )}

      {isAdmin && eligibleUsers.length === 0 && allUsers.length > 0 && (
        <div className="card" style={{ marginBottom: '1.25rem', textAlign: 'center', padding: '1.25rem', borderStyle: 'dashed' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.35rem' }}>✅</div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Todos los jugadores activos ya están en este grupo.
          </p>
        </div>
      )}

      {/* Miembros actuales */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>
            MIEMBROS ACTUALES
          </h3>
          <span className="badge badge-primary">{group.members.length}</span>
        </div>

        {group.members.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
            <p style={{ margin: 0, fontSize: '0.88rem' }}>No hay miembros aún. Agrega jugadores arriba.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            {group.members.map(m => (
              <MemberChip key={m.id} member={m} onRemove={handleRemove} isAdmin={isAdmin} removing={removing} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
