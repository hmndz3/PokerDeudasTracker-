import { useEffect, useState } from 'react'
import { getAuditLogs } from '../api/stats'

const ACTION_LABELS = {
  'table.created': 'Mesa creada',
  'table.closed': 'Mesa cerrada',
  'table.result_edited_after_close': '⚠️ Resultado editado (post-cierre)',
  'debt.payer_confirmed': 'Pago enviado',
  'debt.completed': 'Pago completado',
  'debt.rejected': 'Pago rechazado',
}

export default function AuditLog() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAuditLogs(200).then(setLogs).finally(() => setLoading(false))
  }, [])

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Cargando...</p>

  return (
    <div>
      <h1 style={{ margin: '0 0 1.25rem', fontSize: '1.4rem' }}>Historial de auditoría</h1>

      {logs.length === 0 ? (
        <div className="card"><p style={{ color: 'var(--text-muted)', margin: 0 }}>No hay registros.</p></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                {['Fecha', 'Actor', 'Acción', 'Entidad', 'ID', 'Detalles'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.6rem 0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.55rem 0.85rem', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                    {new Date(log.created_at).toLocaleString('es-GT')}
                  </td>
                  <td style={{ padding: '0.55rem 0.85rem' }}>{log.actor_name ?? '—'}</td>
                  <td style={{ padding: '0.55rem 0.85rem', fontWeight: 500 }}>
                    {ACTION_LABELS[log.action] ?? log.action}
                  </td>
                  <td style={{ padding: '0.55rem 0.85rem', color: 'var(--text-muted)' }}>{log.entity_type}</td>
                  <td style={{ padding: '0.55rem 0.85rem', color: 'var(--text-muted)' }}>{log.entity_id ?? '—'}</td>
                  <td style={{ padding: '0.55rem 0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                    {log.details ? (
                      <span title={log.details}>{log.details.substring(0, 60)}{log.details.length > 60 ? '…' : ''}</span>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
