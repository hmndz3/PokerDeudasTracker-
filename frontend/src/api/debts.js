import api from './client'

export const getDebts = () => api.get('/debts').then(r => r.data)
export const getPendingDebts = () => api.get('/debts/pending').then(r => r.data)
export const confirmPayment = (id) => api.post(`/debts/${id}/confirm-payment`).then(r => r.data)
export const confirmReceived = (id) => api.post(`/debts/${id}/confirm-received`).then(r => r.data)
export const rejectPayment = (id) => api.post(`/debts/${id}/reject`).then(r => r.data)
