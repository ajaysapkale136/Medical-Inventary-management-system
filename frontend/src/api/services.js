import api from './axios'

/** All backend calls in one place. */
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
}

export const userApi = {
  me: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
  changePassword: (data) => api.put('/users/me/password', data),
  all: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  toggleActive: (id) => api.patch(`/users/${id}/toggle-active`),
  remove: (id) => api.delete(`/users/${id}`),
}

export const medicineApi = {
  list: (params) => api.get('/medicines', { params }),
  get: (id) => api.get(`/medicines/${id}`),
  create: (data) => api.post('/medicines', data),
  update: (id, data) => api.put(`/medicines/${id}`, data),
  remove: (id) => api.delete(`/medicines/${id}`),
  addStock: (id, data) => api.patch(`/medicines/${id}/add-stock`, data),
  removeStock: (id, data) => api.patch(`/medicines/${id}/remove-stock`, data),
  restock: (id, data) => api.post(`/medicines/${id}/restock`, data),
  lowStock: () => api.get('/medicines/low-stock'),
  nearExpiry: () => api.get('/medicines/near-expiry'),
  expired: () => api.get('/medicines/expired'),
  history: (id) => api.get(`/medicines/${id}/history`),
}

export const supplierApi = {
  list: (keyword) => api.get('/suppliers', { params: { keyword } }),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  remove: (id) => api.delete(`/suppliers/${id}`),
  medicines: (id) => api.get(`/suppliers/${id}/medicines`),
}

export const categoryApi = {
  list: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
}

export const dashboardApi = { stats: () => api.get('/dashboard/stats') }

export const notificationApi = {
  list: () => api.get('/notifications'),
  readAll: () => api.patch('/notifications/read-all'),
}

export const saleApi = {
  create: (data) => api.post('/sales', data),
  listAdmin: () => api.get('/sales/admin'),
  downloadPdf: (id) => api.get(`/sales/${id}/pdf`, { responseType: 'blob' }),
}

export const purchaseApi = {
  list: () => api.get('/purchases'),
}

/** Downloads a report file (pdf | excel). */
export const reportApi = {
  download: async (format, type) => {
    const res = await api.get(`/reports/${format}`, { params: { type }, responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.download = `medistock-${type}.${format === 'excel' ? 'xlsx' : 'pdf'}`
    link.click()
    URL.revokeObjectURL(url)
  },
}
