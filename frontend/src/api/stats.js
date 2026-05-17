import api from './client'

export const getDashboardStats = () => api.get('/stats/dashboard').then(r => r.data)
export const getMyStats = () => api.get('/stats/me').then(r => r.data)
export const getMyHistory = () => api.get('/stats/me/history').then(r => r.data)
export const getPlayerStats = (userId) => api.get(`/stats/players/${userId}`).then(r => r.data)
export const getAllPlayerStats = () => api.get('/stats/players').then(r => r.data)
export const getAuditLogs = (limit = 100) =>
  api.get('/audit', { params: { limit } }).then(r => r.data)
export const getUsers = () => api.get('/users').then(r => r.data)
export const registerUser = (data) => api.post('/auth/register', data).then(r => r.data)
export const deactivateUser = (id) => api.patch(`/users/${id}/deactivate`).then(r => r.data)
export const activateUser = (id) => api.patch(`/users/${id}/activate`).then(r => r.data)
