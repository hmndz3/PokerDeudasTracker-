import api from './client'

export const getTables = () => api.get('/tables').then(r => r.data)
export const getTable = (id) => api.get(`/tables/${id}`).then(r => r.data)
export const createTable = (data) => api.post('/tables', data).then(r => r.data)
export const addPlayer = (tableId, data) =>
  api.post(`/tables/${tableId}/players`, data).then(r => r.data)
export const updatePlayerResult = (tableId, userId, data) =>
  api.patch(`/tables/${tableId}/players/${userId}`, data).then(r => r.data)
export const validateTable = (tableId) =>
  api.get(`/tables/${tableId}/validate`).then(r => r.data)
export const closeTable = (tableId) =>
  api.post(`/tables/${tableId}/close`).then(r => r.data)
