import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import { getMyStats } from '../api/stats'
import { useEffect } from 'react'
import { fmtQ } from '../utils/format'

export default function Profile() {
  const { user, login } = useAuth()
  const [stats, setStats] = useState(null)

  // Username form
  const [username, setUsername] = useState(user?.username || '')
  const [usernameMsg, setUsernameMsg] = useState('')
  const [savingUser, setSavingUser] = useState(false)

  // Password form
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [savingPw, setSavingPw] = useState(false)

  useEffect(() => {
    getMyStats().then(setStats)
  }, [])

  const handleUsername = async (e) => {
    e.preventDefault()
    setUsernameMsg('')
    setSavingUser(true)
    try {
      await api.patch('/users/me/username', { username })
      setUsernameMsg('✓ Usuario actualizado')
      // Re-fetch user info
      const res = await api.get('/auth/me')
      // Update context by re-storing token and re-fetching
      const token = localStorage.getItem('token')
      if (token) await login(token)
    } catch (err) {
      setUsernameMsg(err.response?.data?.detail || 'Error')
    } finally {
      setSavingUser(false)
    }
  }

  const handlePassword = async (e) => {
    e.preventDefault()
    setPwMsg('')
    setSavingPw(true)
    try {
      await api.patch('/users/me/password', { current_password: currentPw, new_password: newPw })
      setPwMsg('✓ Contraseña actualizada')
      setCurrentPw('')
      setNewPw('')
    } catch (err) {
      setPwMsg(err.response?.data?.detail || 'Error')
    } finally {
      setSavingPw(false)
    }
  }

  return (
    <div>
      <h1 style={{ margin: '0 0 1.25rem', fontSize: '1.4rem' }}>Mi perfil</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'start' }}>
        {/* Info + stats */}
        <div>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Nombre</div>
            <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '1rem' }}>{user.real_name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Rol</div>
            <div>{user.role === 'admin' ? 'Administrador' : 'Jugador'}</div>
          </div>

          {stats && stats.tables_played > 0 && (
            <div className="card">
              <h3 style={{ marginTop: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Estadísticas</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {[
                  { label: 'Mesas jugadas', value: stats.tables_played },
                  { label: 'Neto total', value: `${stats.total_net >= 0 ? '+' : ''}${fmtQ(stats.total_net)}`, color: stats.total_net >= 0 ? 'var(--success)' : 'var(--danger)' },
                  { label: 'Mejor mesa', value: `+${fmtQ(stats.best_result)}`, color: 'var(--success)' },
                  { label: 'Peor mesa', value: fmtQ(stats.worst_result), color: 'var(--danger)' },
                  { label: 'Recompras', value: fmtQ(stats.total_rebuys) },
                  { label: 'Promedio', value: `${stats.avg_net >= 0 ? '+' : ''}${fmtQ(stats.avg_net)}` },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</div>
                    <div style={{ fontWeight: 600, color: color || 'var(--text)' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Edit forms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <h3 style={{ marginTop: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Cambiar usuario</h3>
            <form onSubmit={handleUsername}>
              <div className="form-group">
                <label>Nuevo usuario</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  minLength={3}
                  required
                />
              </div>
              {usernameMsg && (
                <p style={{ color: usernameMsg.startsWith('✓') ? 'var(--success)' : 'var(--danger)', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>
                  {usernameMsg}
                </p>
              )}
              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={savingUser}>
                {savingUser ? 'Guardando...' : 'Guardar'}
              </button>
            </form>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Cambiar contraseña</h3>
            <form onSubmit={handlePassword}>
              <div className="form-group">
                <label>Contraseña actual</label>
                <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Nueva contraseña</label>
                <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} minLength={6} required />
              </div>
              {pwMsg && (
                <p style={{ color: pwMsg.startsWith('✓') ? 'var(--success)' : 'var(--danger)', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>
                  {pwMsg}
                </p>
              )}
              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={savingPw}>
                {savingPw ? 'Guardando...' : 'Cambiar contraseña'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
