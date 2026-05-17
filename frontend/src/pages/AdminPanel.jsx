import { useEffect, useState } from 'react'
import { getUsers, registerUser, deactivateUser, activateUser } from '../api/stats'

export default function AdminPanel() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [acting, setActing] = useState(null)

  const [form, setForm] = useState({ real_name: '', username: '', password: '', role: 'player' })
  const [formError, setFormError] = useState('')
  const [creating, setCreating] = useState(false)

  const load = () => getUsers().then(setUsers).finally(() => setLoading(false))
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

  const toggleActive = async (u) => {
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

  const UserRow = ({ u }) => (
    <tr style={{ borderBottom: '1px solid var(--border)', opacity: u.is_active ? 1 : 0.5 }}>
      <td style={{ padding: '0.55rem 0.85rem', fontWeight: 500 }}>{u.real_name}</td>
      <td style={{ padding: '0.55rem 0.85rem', color: 'var(--text-muted)' }}>@{u.username}</td>
      <td style={{ padding: '0.55rem 0.85rem' }}>
        <span style={{
          background: u.role === 'admin' ? 'var(--accent)' : 'var(--surface-2)',
          color: u.role === 'admin' ? 'white' : 'var(--text-muted)',
          borderRadius: '999px',
          padding: '0.15rem 0.6rem',
          fontSize: '0.75rem',
        }}>
          {u.role === 'admin' ? 'Admin' : 'Jugador'}
        </span>
      </td>
      <td style={{ padding: '0.55rem 0.85rem' }}>
        <span style={{ color: u.is_active ? 'var(--success)' : 'var(--danger)', fontSize: '0.82rem' }}>
          {u.is_active ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      <td style={{ padding: '0.55rem 0.85rem', textAlign: 'right' }}>
        <button
          className={u.is_active ? 'btn-secondary' : 'btn-primary'}
          style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem' }}
          onClick={() => toggleActive(u)}
          disabled={acting === u.id}
        >
          {acting === u.id ? '...' : u.is_active ? 'Desactivar' : 'Activar'}
        </button>
      </td>
    </tr>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem' }}>Panel de administración</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nuevo usuario'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ marginTop: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Crear usuario</h3>
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
            <button type="submit" className="btn-primary" style={{ marginTop: '0.75rem' }} disabled={creating}>
              {creating ? 'Creando...' : 'Crear usuario'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Cargando...</p>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                {['Nombre', 'Usuario', 'Rol', 'Estado', ''].map(h => (
                  <th key={h} style={{ textAlign: h === '' ? 'right' : 'left', padding: '0.6rem 0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {admins.map(u => <UserRow key={u.id} u={u} />)}
              {players.map(u => <UserRow key={u.id} u={u} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
