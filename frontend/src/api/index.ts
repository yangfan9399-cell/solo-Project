import axios from 'axios'
import type { Application, Merchant, ShopUnit, User } from '../types'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error.response?.data?.message || error.message)
  }
)

export const applicationApi = {
  getAll: () => api.get<Application[]>('/applications'),
  getById: (id: string) => api.get<Application>(`/applications/${id}`),
  create: (data: any) => api.post<Application>('/applications', data),
  checkTimeConflict: (data: any) => api.post<any>('/applications/check-time-conflict', data),
  investmentReview: (id: string, data: any) => api.put<Application>(`/applications/${id}/investment-review`, data),
  engineerInspection: (id: string, data: any) => api.put<Application>(`/applications/${id}/engineer-inspection`, data),
  fireInspection: (id: string, data: any) => api.put<Application>(`/applications/${id}/fire-inspection`, data),
  rectificationComplete: (id: string, data: any) => api.put<Application>(`/applications/${id}/rectification-complete`, data),
  archive: (id: string, data: any) => api.put<Application>(`/applications/${id}/archive`, data),
  reschedule: (id: string, data: any) => api.put<Application>(`/applications/${id}/reschedule`, data),
  delete: (id: string) => api.delete(`/applications/${id}`)
}

export const merchantApi = {
  getAll: () => api.get<Merchant[]>('/merchants'),
  getById: (id: string) => api.get<Merchant>(`/merchants/${id}`),
  create: (data: any) => api.post<Merchant>('/merchants', data),
  update: (id: string, data: any) => api.put<Merchant>(`/merchants/${id}`, data),
  delete: (id: string) => api.delete(`/merchants/${id}`)
}

export const shopUnitApi = {
  getAll: () => api.get<ShopUnit[]>('/shop-units'),
  getById: (id: string) => api.get<ShopUnit>(`/shop-units/${id}`),
  create: (data: any) => api.post<ShopUnit>('/shop-units', data),
  update: (id: string, data: any) => api.put<ShopUnit>(`/shop-units/${id}`, data),
  delete: (id: string) => api.delete(`/shop-units/${id}`)
}

export const userApi = {
  getAll: () => api.get<User[]>('/users'),
  getById: (id: string) => api.get<User>(`/users/${id}`),
  getByRole: (role: string) => api.get<User[]>(`/users/role/${role}`),
  create: (data: any) => api.post<User>('/users', data),
  update: (id: string, data: any) => api.put<User>(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`)
}
