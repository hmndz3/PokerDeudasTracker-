import api from './client'

export const getGroups = () => api.get('/groups').then(r => r.data)
export const getGroup = (id) => api.get(`/groups/${id}`).then(r => r.data)
export const createGroup = (data) => api.post('/groups', data).then(r => r.data)
export const addMember = (groupId, userId) =>
  api.post(`/groups/${groupId}/members`, { user_id: userId }).then(r => r.data)
export const removeMember = (groupId, userId) =>
  api.delete(`/groups/${groupId}/members/${userId}`)
