import { Link, useLocation, Outlet } from 'react-router-dom'
import Sidebar from '../Sidebar/Sidebar'
import { useAuth } from '../../hooks/useAuthHook'

export default function MainLayout() {
  const { user, signOut } = useAuth()
  const location = useLocation()

  return (
    <div className="flex h-screen bg-[#f4f6f7] overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-800 capitalize">
              {location.pathname.replace('/', '').replace('-', ' ') || 'Dashboard'}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-700">{user?.user_metadata?.full_name || 'Admin User'}</p>
              <p className="text-xs text-slate-500">Ministry of Education</p>
            </div>
            <button 
              onClick={signOut}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
