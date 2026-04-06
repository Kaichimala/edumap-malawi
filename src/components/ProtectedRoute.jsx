import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()

  // Wait for auth to resolve before deciding — avoids a false redirect to /login
  if (loading) return null

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return children
}
