import { createContext, useContext, useEffect, useState } from 'react'
import { authApi } from '../api/services'

const AuthContext = createContext(null)

const extractErrorMessage = (err) => {
  if (typeof err?.response?.data === 'string') return err.response.data

  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.response?.data?.detail ||
    err?.message ||
    'Invalid email or password'
  )
}

/** Stores the logged-in user + JWT in localStorage (Context API). */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('medistock_user')
    if (stored) setUser(JSON.parse(stored))
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      const { data } = await authApi.login({ email, password })
      localStorage.setItem('medistock_token', data.token)
      const profile = { id: data.id, fullName: data.fullName, email: data.email, role: data.role }
      localStorage.setItem('medistock_user', JSON.stringify(profile))
      setUser(profile)
      return profile
    } catch (err) {
      throw new Error(extractErrorMessage(err))
    }
  }

  const loginWithToken = (token, profile) => {
    localStorage.setItem('medistock_token', token)
    localStorage.setItem('medistock_user', JSON.stringify(profile))
    setUser(profile)
  }

  const logout = () => {
    localStorage.removeItem('medistock_token')
    localStorage.removeItem('medistock_user')
    setUser(null)
  }

  const hasRole = (...roles) => !!user && roles.includes(user.role)

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, loginWithToken, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
