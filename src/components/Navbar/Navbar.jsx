import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'

export default function Navbar() {
  const navigate      = useNavigate()
  const { user }      = useAuth()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <nav className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between">
      <span className="font-bold text-lg">EduMap Malawi</span>

      {user && (
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm hidden sm:block">{user.email}</span>
          <button
            id="logout-btn"
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm bg-gray-800 hover:bg-gray-700
                       border border-gray-700 text-gray-300 hover:text-white
                       px-3 py-1.5 rounded-lg transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
            </svg>
            Logout
          </button>
        </div>
      )}
    </nav>
  )
}