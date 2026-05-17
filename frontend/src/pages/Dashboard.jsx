import { useAuth } from '../context/AuthContext'

const ROLE_LABEL = {
  admin: 'Administrador',
  player: 'Jugador',
}

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <p style={{ margin: '0 0 0.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Bienvenido de vuelta
        </p>
        <h1 style={{ margin: '0 0 0.5rem', color: 'var(--primary)' }}>
          {user.real_name}
        </h1>
        <span
          style={{
            display: 'inline-block',
            background: user.role === 'admin' ? 'var(--accent)' : 'var(--surface-2)',
            color: user.role === 'admin' ? 'white' : 'var(--text-muted)',
            borderRadius: '999px',
            padding: '0.2rem 0.75rem',
            fontSize: '0.8rem',
            fontWeight: 500,
          }}
        >
          {ROLE_LABEL[user.role] ?? user.role}
        </span>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0, color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500 }}>
          Dashboard general
        </h2>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>
          Aquí irán las estadísticas y resumen de mesas. Próximamente en el commit 18.
        </p>
      </div>
    </div>
  )
}
