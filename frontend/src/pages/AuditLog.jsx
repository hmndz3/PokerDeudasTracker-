import { useEffect, useState } from 'react'
import { getAuditLogs } from '../api/stats'

const ACTION_CONFIG = {
  'table.created':                   { icon: '🃏', label: 'Mesa creada',                  color: 'var(--primary)',  bg: 'var(--primary-light)' },
  'table.closed':                    { icon: '🔒', label: 'Mesa cerrada',                 color: 'var(--accent)',   bg: 'var(--accent-light)'  },
  'table.result_edited_after_close': { icon: '⚠️', label: 'Resultado editado post-cierre', color: 'var(--warning)',  bg: 'var(--warning-light)' },
  'debt.payer_confirmed':            { icon: '💸', label: 'Pago enviado',                 color: 'var(--accent)',   bg: 'var(--accent-light)'  },
  'debt.completed':                  { icon: '✅', label: 'Pago completado',              color: 'var(--success)',  bg: 'var(--success-light)' },
  'debt.rejected':                   { icon: '❌', label: 'Pago rechazado',              color: 'var(--danger)',   bg: 'var(--danger-light)'  },
}

function tryParseDetails(json) {
  if (!json) return null
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

function DetailsChips({ details }) {
  if (!details) return null
  const parsed = tryParseDetails(details)
  if (!parsed) return <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{details}</span>

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
      {Object.entries(parsed).map(([k, v]) => (
        <span key={k} style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.15rem 0.55rem',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          fontFamily: 'monospace',
        }}>
          {k}: <strong style={{ color: 'var(--text)' }}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</strong>
        </span>
      ))}
    </div>
  )
}

export default function AuditLog() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAuditLogs(200).then(setLogs).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div>
      <div className="page-header"><h1 className="page-title">Historial de auditoría</h1></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {[...Array(5)].map((_, i) => <div key={i} className="card skeleton" style={{ height: 68 }} />)}
      </div>
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Historial de auditoría</h1>
        <span className="badge badge-neutral">{logs.length} registros</span>
      </div>

      {logs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>No hay registros de auditoría aún.</p>
        </div>
      ) : (
        <div className="timeline">
          {logs.map((log, i) => {
            const cfg = ACTION_CONFIG[log.action] || { icon: '📝', label: log.action, color: 'var(--text-muted)', bg: 'var(--surface-2)' }
            const date = new Date(log.created_at)

            return (
              <div key={log.id} className="timeline-item">
                {/* Dot */}
                <div className="timeline-dot" style={{ background: cfg.bg, color: cfg.color, fontSize: '1.05rem' }}>
                  {cfg.icon}
                </div>

                {/* Body */}
                <div className="timeline-body">
                  <div className="card" style={{ padding: '0.85rem 1rem', marginBottom: '0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', align: 'center', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{
                          fontWeight: 700,
                          fontSize: '0.88rem',
                          color: cfg.color,
                          background: cfg.bg,
                          padding: '0.2rem 0.65rem',
                          borderRadius: '999px',
                        }}>
                          {cfg.label}
                        </span>
                        {log.entity_id && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontFamily: 'monospace' }}>
                            {log.entity_type} #{log.entity_id}
                          </span>
                        )}
                        {log.actor_name && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            por <strong>{log.actor_name}</strong>
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', whiteSpace: 'nowrap' }}>
                        {date.toLocaleDateString('es-GT')} {date.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <DetailsChips details={log.details} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
