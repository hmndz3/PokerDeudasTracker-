import { useEffect, useState } from 'react'
import { getUsers, registerUser, deactivateUser, activateUser, getAllPlayerStats } from '../api/stats'
import { fmtQ } from '../utils/format'

function Avatar({ name, role, size = 'lg' }) {
  const initial = name?.charAt(0)?.toUpperCase() || '?'
  const bg = role === 'admin' ? 'var(--accent-light)' : 'var(--primary-light)'
  const color = role === 'admin' ? 'var(--accent)' : 'var(--primary)'
  const cls = `avatar avatar-${size}`
  return <div className={cls} style={{ background: bg, color }}>{initial}</div>
}

function UserCard({ u, stats, onToggle, acting }) {
  const isAdmin = u.role === 'admin'
  const netColor = stats?.total_net > 0 ? 'var(--success)' : stats?.total_net < 0 ? 'var(--danger)' : 'var(--text-muted)'

  return (
    <div className="card" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      opacity: u.is_active ? 1 : 0.55,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Top accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: isAdmin ? 'var(--accent)' : 'var(--primary)',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', paddingTop: '0.25rem' }}>
        <Avatar name={u.real_name} role={u.role} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {u.real_name}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>@{u.username}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
          <span className={`badge ${isAdmin ? 'badge-accent' : 'badge-primary'}`} style={{ fontSize: '0.7rem' }}>
            {isAdmin ? 'Admin' : 'Jugador'}
          </span>
          <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.68rem' }}>
            {u.is_active ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>

      {/* Stats (only for players) */}
      {!isAdmin && (
        <>
          <div className="divider" style={{ margin: '0' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Mesas</div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>{stats?.tables_played ?? '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Neto</div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: netColor }}>
                {stats?.tables_played
                  ? `${stats.total_net >= 0 ? '+' : ''}${fmtQ(stats.total_net)}`
                  : '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Recompras</div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>{stats?.total_rebuys ?? '—'}</div>
            </div>
          </div>
          {stats?.tables_played > 0 && (
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Mejor</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--success)' }}>+{fmtQ(stats.best_result)}</div>
              </div>
              <div style={{ width: 1, background: 'var(--border)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Peor</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--danger)' }}>{fmtQ(stats.worst_result)}</div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Action */}
      <button
        className={u.is_active ? 'btn-secondary' : 'btn-primary'}
        style={{ fontSize: '0.8rem', padding: '0.45rem', width: '100%' }}
        onClick={() => onToggle(u)}
        disabled={acting === u.id}
      >
        {acting === u.id ? '...' : u.is_active ? '🚫 Desactivar' : '✅ Activar'}
      </button>
    </div>
  )
}

export default function AdminPanel() {
  const [users, setUsers] = useState([])
  const [statsMap, setStatsMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [acting, setActing] = useState(null)

  const [form, setForm] = useState({ real_name: '', username: '', password: '', role: 'player' })
  const [formError, setFormError] = useState('')
  const [creating, setCreating] = useState(false)

  const load = async () => {
    const [usrs, allStats] = await Promise.all([getUsers(), getAllPlayerStats().catch(() => [])])
    setUsers(usrs)
    const map = {}
    allStats.forEach(s => { map[s.user_id] = s })
    setStatsMap(map)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setFormError('')
    setCreating(true)
    try {
      await registerUser(form)
      setForm({ real_name: '', username: '', password: '', role: 'player' })
      setShowForm(false)
      load()
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Error')
    } finally {
      setCreating(false)
    }
  }

  const handleToggle = async (u) => {
    setActing(u.id)
    try {
      if (u.is_active) await deactivateUser(u.id)
      else await activateUser(u.id)
      load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error')
    } finally {
      setActing(null)
    }
  }

  const admins = users.filter(u => u.role === 'admin')
  const players = users.filter(u => u.role === 'player')

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Panel de administración</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nuevo usuario'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem', maxWidth: 560 }}>
          <h3 style={{ marginTop: 0, fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 700 }}>Crear usuario</h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Nombre real</label>
                <input type="text" value={form.real_name} onChange={e => setForm(f => ({ ...f, real_name: e.target.value }))} required minLength={2} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Usuario</label>
                <input type="text" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required minLength={3} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Contraseña</label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Rol</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="player">Jugador</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            {formError && <div className="error-text" style={{ marginTop: '0.75rem' }}>{formError}</div>}
            <button type="submit" className="btn-primary" style={{ marginTop: '1rem', padding: '0.6rem 1.25rem' }} disabled={creating}>
              {creating ? 'Creando...' : 'Crear usuario'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '1rem' }}>
          {[...Array(6)].map((_, i) => <div key={i} className="card skeleton" style={{ height: 200 }} />)}
        </div>
      ) : (
        <>
          {admins.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <div className="section-label" style={{ marginBottom: '0.75rem' }}>Administradores ({admins.length})</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '1rem' }}>
                {admins.map(u => <UserCard key={u.id} u={u} stats={null} onToggle={handleToggle} acting={acting} />)}
              </div>
            </div>
          )}

          {players.length > 0 && (
            <div>
              <div className="section-label" style={{ marginBottom: '0.75rem' }}>Jugadores ({players.length})</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '1rem' }}>
                {players.map(u => (
                  <UserCard key={u.id} u={u} stats={statsMap[u.id]} onToggle={handleToggle} acting={acting} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
