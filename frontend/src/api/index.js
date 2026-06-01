import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats').then(res => res.data),
}

export const usersAPI = {
  getAll: () => api.get('/users').then(res => res.data),
  getTechnicians: () => api.get('/users/technicians').then(res => res.data),
}

export const categoriesAPI = {
  getAll: () => api.get('/categories').then(res => res.data),
  create: (data) => api.post('/categories', data).then(res => res.data),
}

export const materialsAPI = {
  getAll: () => api.get('/materials').then(res => res.data),
}

export const ticketsAPI = {
  getAll: (params) => api.get('/tickets', { params }).then(res => res.data),
  getById: (id) => api.get(`/tickets/${id}`).then(res => res.data),
  create: (data) => api.post('/tickets', data).then(res => res.data),
  assign: (id, data) => api.put(`/tickets/${id}/assign`, data).then(res => res.data),
  accept: (id, data) => api.put(`/tickets/${id}/accept`, data).then(res => res.data),
  complete: (id, data) => api.put(`/tickets/${id}/complete`, data).then(res => res.data),
  close: (id, data) => api.put(`/tickets/${id}/close`, data).then(res => res.data),
  escalate: (id, data) => api.put(`/tickets/${id}/escalate`, data).then(res => res.data),
  addFollowUp: (id, data) => api.post(`/tickets/${id}/followup`, data).then(res => res.data),
}

export const followUpsAPI = {
  getPending: () => api.get('/followups/pending').then(res => res.data),
}

export const statusMap = {
  pending: { label: '待派工', value: 'pending' },
  assigned: { label: '已派工', value: 'assigned' },
  in_progress: { label: '维修中', value: 'in_progress' },
  completed: { label: '已完成', value: 'completed' },
  closed: { label: '已关闭', value: 'closed' },
}

export const priorityMap = {
  urgent: { label: '紧急', value: 'urgent' },
  high: { label: '高', value: 'high' },
  normal: { label: '普通', value: 'normal' },
  low: { label: '低', value: 'low' },
}

export const roleMap = {
  customer_service: { label: '客服', value: 'customer_service' },
  team_leader: { label: '班组长', value: 'team_leader' },
  technician: { label: '维修人员', value: 'technician' },
  manager: { label: '经理', value: 'manager' },
}

export default api
