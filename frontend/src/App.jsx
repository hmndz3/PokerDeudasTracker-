import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'

function Home() {
  return (
    <div className="card">
      <h2 style={{ marginTop: 0, color: 'var(--primary)' }}>Bienvenido a PokerUxLab</h2>
      <p style={{ color: 'var(--text-muted)' }}>
        Aquí irá el dashboard general.
      </p>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Home />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}