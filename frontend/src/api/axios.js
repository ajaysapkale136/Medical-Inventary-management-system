import axios from 'axios'

/** Pre-configured Axios instance. Supports relative URL on deployed host and JWT/Session cookies. */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('medistock_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// If the session/token expired, send the user back to the login page.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('medistock_token')
      localStorage.removeItem('medistock_user')
      if (!window.location.pathname.startsWith('/auth') && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/auth'
      }
    }
    return Promise.reject(err)
  }
)

export default api
