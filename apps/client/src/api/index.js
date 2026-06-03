import apiClient from './client.js'

export const ownersAPI = {
  getList: (params = {}) => apiClient.get('/owners', { params }),
  getDetail: (id) => apiClient.get(`/owners/${id}`),
  getPets: (id) => apiClient.get(`/owners/${id}/pets`),
  create: (data) => apiClient.post('/owners', data),
  update: (id, data) => apiClient.put(`/owners/${id}`, data),
  delete: (id) => apiClient.delete(`/owners/${id}`)
}

export const petsAPI = {
  getList: (params = {}) => apiClient.get('/pets', { params }),
  getDetail: (id) => apiClient.get(`/pets/${id}`),
  create: (data) => apiClient.post('/pets', data),
  update: (id, data) => apiClient.put(`/pets/${id}`, data),
  delete: (id) => apiClient.delete(`/pets/${id}`),
  getContraindications: (id) => apiClient.get(`/pets/${id}/contraindications`),
  getVaccinationHistory: (id) => apiClient.get(`/pets/${id}/vaccination-history`)
}

export const vaccinesAPI = {
  getList: (params = {}) => apiClient.get('/vaccines', { params }),
  getDetail: (id) => apiClient.get(`/vaccines/${id}`),
  create: (data) => apiClient.post('/vaccines', data),
  update: (id, data) => apiClient.put(`/vaccines/${id}`, data),
  delete: (id) => apiClient.delete(`/vaccines/${id}`)
}

export const vaccineBatchesAPI = {
  getList: (params = {}) => apiClient.get('/vaccine-batches', { params }),
  getDetail: (id) => apiClient.get(`/vaccine-batches/${id}`),
  getExpiring: () => apiClient.get('/vaccine-batches/expiring'),
  getAvailable: () => apiClient.get('/vaccine-batches/available'),
  create: (data) => apiClient.post('/vaccine-batches', data),
  update: (id, data) => apiClient.put(`/vaccine-batches/${id}`, data),
  use: (id, data) => apiClient.post(`/vaccine-batches/${id}/use`, data),
  delete: (id) => apiClient.delete(`/vaccine-batches/${id}`)
}

export const appointmentsAPI = {
  getList: (params = {}) => apiClient.get('/appointments', { params }),
  getCalendar: (params = {}) => apiClient.get('/appointments/calendar', { params }),
  getToday: () => apiClient.get('/appointments/today'),
  getDetail: (id) => apiClient.get(`/appointments/${id}`),
  create: (data) => apiClient.post('/appointments', data),
  update: (id, data) => apiClient.put(`/appointments/${id}`, data),
  checkIn: (id) => apiClient.post(`/appointments/${id}/check-in`),
  complete: (id) => apiClient.post(`/appointments/${id}/complete`),
  cancel: (id, data) => apiClient.post(`/appointments/${id}/cancel`, data),
  delete: (id) => apiClient.delete(`/appointments/${id}`)
}

export const checkinsAPI = {
  getList: (params = {}) => apiClient.get('/checkins', { params }),
  getDetail: (id) => apiClient.get(`/checkins/${id}`),
  getContraindicationsCheck: (id) => apiClient.get(`/checkins/${id}/contraindications-check`),
  create: (data) => apiClient.post('/checkins', data),
  update: (id, data) => apiClient.put(`/checkins/${id}`, data),
  delete: (id) => apiClient.delete(`/checkins/${id}`)
}

export const contraindicationsAPI = {
  getList: (params = {}) => apiClient.get('/contraindications', { params }),
  getDetail: (id) => apiClient.get(`/contraindications/${id}`),
  create: (data) => apiClient.post('/contraindications', data),
  update: (id, data) => apiClient.put(`/contraindications/${id}`, data),
  delete: (id) => apiClient.delete(`/contraindications/${id}`)
}

export const vaccinationsAPI = {
  getList: (params = {}) => apiClient.get('/vaccinations', { params }),
  getDetail: (id) => apiClient.get(`/vaccinations/${id}`),
  create: (data) => apiClient.post('/vaccinations', data),
  update: (id, data) => apiClient.put(`/vaccinations/${id}`, data),
  delete: (id) => apiClient.delete(`/vaccinations/${id}`)
}

export const revisitRemindersAPI = {
  getList: (params = {}) => apiClient.get('/revisit-reminders', { params }),
  getPending: () => apiClient.get('/revisit-reminders/pending'),
  getDetail: (id) => apiClient.get(`/revisit-reminders/${id}`),
  create: (data) => apiClient.post('/revisit-reminders', data),
  update: (id, data) => apiClient.put(`/revisit-reminders/${id}`, data),
  send: (id, data) => apiClient.post(`/revisit-reminders/${id}/send`, data),
  complete: (id, data) => apiClient.post(`/revisit-reminders/${id}/complete`, data),
  delete: (id) => apiClient.delete(`/revisit-reminders/${id}`)
}

export const adverseReactionsAPI = {
  getList: (params = {}) => apiClient.get('/adverse-reactions', { params }),
  getDetail: (id) => apiClient.get(`/adverse-reactions/${id}`),
  create: (data) => apiClient.post('/adverse-reactions', data),
  update: (id, data) => apiClient.put(`/adverse-reactions/${id}`, data),
  delete: (id) => apiClient.delete(`/adverse-reactions/${id}`)
}

export const followUpsAPI = {
  getList: (params = {}) => apiClient.get('/follow-ups', { params }),
  getDetail: (id) => apiClient.get(`/follow-ups/${id}`),
  create: (data) => apiClient.post('/follow-ups', data),
  update: (id, data) => apiClient.put(`/follow-ups/${id}`, data),
  delete: (id) => apiClient.delete(`/follow-ups/${id}`)
}

export const usersAPI = {
  getList: (params = {}) => apiClient.get('/users', { params }),
  getCurrent: () => apiClient.get('/users/current'),
  getDetail: (id) => apiClient.get(`/users/${id}`),
  create: (data) => apiClient.post('/users', data),
  update: (id, data) => apiClient.put(`/users/${id}`, data),
  delete: (id) => apiClient.delete(`/users/${id}`)
}

export const dashboardAPI = {
  getStats: () => apiClient.get('/dashboard/stats'),
  getWeeklyAppointments: () => apiClient.get('/dashboard/weekly-appointments'),
  getVaccineUsage: () => apiClient.get('/dashboard/vaccine-usage')
}
