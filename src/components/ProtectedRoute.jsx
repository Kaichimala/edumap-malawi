import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children }) {
  const { session } = useAuth()

  // Session is synchronous now (from localStorage), no loading state needed
  if (!session) {
    return <Navigate to="/login" replace />
  }

  return children
}
