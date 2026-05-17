/** Convierte décimos (455) a string con 1 decimal ("45.5") */
export function fmt(decimos) {
  if (decimos === null || decimos === undefined) return '—'
  const n = Number(decimos)
  return (n / 10).toFixed(1)
}

/** Q45.5 */
export function fmtQ(decimos) {
  return `Q${fmt(decimos)}`
}

/** Convierte string "45.5" a décimos 455 */
export function toDecimos(str) {
  const n = parseFloat(str)
  if (isNaN(n)) return 0
  return Math.round(n * 10)
}

export const STATUS_LABEL = {
  pending: 'Pendiente',
  payer_confirmed: 'Pago enviado',
  completed: 'Completado',
  rejected: 'Rechazado',
}

export const STATUS_COLOR = {
  pending: 'var(--warning)',
  payer_confirmed: 'var(--accent)',
  completed: 'var(--success)',
  rejected: 'var(--danger)',
}
