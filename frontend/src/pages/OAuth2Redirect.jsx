import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { userApi } from '../api/services'

/** Google sends the user here with ?token=... */
export default function OAuth2Redirect() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { loginWithToken } = useAuth()

  useEffect(() => {
    const token = params.get('token')
    if (!token) return navigate('/login')

    localStorage.setItem('medistock_token', token)
    userApi.me()
      .then(({ data }) => {
        loginWithToken(token, {
          id: data.id, fullName: data.fullName, email: data.email, role: data.role,
        })
        navigate('/dashboard')
      })
      .catch(() => navigate('/login'))
  }, [])

  return <div className="p-8">Signing you in...</div>
}
