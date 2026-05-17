import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_PLAYER = [
  { to: '/', label: '📊 Dashboard' },
  { to: '/tables', label: '🃏 Mesas' },
  { to: '/debts', label: '💸 Deudas' },
  { to: '/profile', label: '👤 Perfil' },
]

const NAV_ADMIN = [
  { to: '/', label: '📊 Dashboard' },
  { to: '/groups', label: '👥 Grupos' },
  { to: '/tables', label: '🃏 Mesas' },
  { to: '/debts', label: '💸 Deudas' },
  { to: '/admin', label: '⚙️ Admin' },
  { to: '/audit', label: '📜 Auditoría' },
]

const navLinkStyle = ({ isActive }) => ({
  display: 'block',
  padding: '0.55rem 1rem',
  borderRadius: 'var(--radius)',
  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
  background: isActive ? 'var(--surface-2)' : 'transparent',
  fontWeight: isActive ? 600 : 400,
  fontSize: '0.9rem',
  textDecoration: 'none',
  transition: 'background 0.12s, color 0.12s',
})

export default function Layout() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = user?.role === 'admin' ? NAV_ADMIN : NAV_PLAYER

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <header style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: 'var(--shadow)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary)' }}>
          🎲 PokerLedger
        </span>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)' }}>
                {user.real_name}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {user.role === 'admin' ? 'Administrador' : 'Jugador'}
              </div>
            </div>
            <button className="btn-secondary" onClick={handleLogout} style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem' }}>
              Salir
            </button>
          </div>
        )}
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        {user && (
          <aside style={{
            width: '200px',
            minHeight: 'calc(100vh - 53px)',
            background: 'var(--surface)',
            borderRight: '1px solid var(--border)',
            padding: '1rem 0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
            flexShrink: 0,
          }}>
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} style={navLinkStyle}>
                {item.label}
              </NavLink>
            ))}
          </aside>
        )}

        {/* Main */}
        <main style={{ flex: 1, padding: '1.75rem 2rem', minWidth: 0 }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
