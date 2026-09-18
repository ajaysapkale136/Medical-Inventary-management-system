import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/** Blocks a page when the user is not logged in or lacks the role. */
export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="p-8">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return children
}
