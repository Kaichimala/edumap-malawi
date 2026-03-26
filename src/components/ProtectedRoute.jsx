import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

/**
 * ProtectedRoute — wraps any page that requires authentication.
 * Shows a loading spinner while the auth check is in flight,
 * then redirects to /login if no session is found.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Checking session…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}
