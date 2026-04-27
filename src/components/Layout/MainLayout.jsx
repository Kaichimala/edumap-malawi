import { useState } from 'react'
import { useLocation, Outlet } from 'react-router-dom'
import Sidebar from '../Sidebar/Sidebar'
import { useAuth } from '../../hooks/useAuth'
import { HiOutlineMenuAlt2, HiOutlineX } from 'react-icons/hi'

export default function MainLayout() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const pageTitle = location.pathname
    .replace('/', '')
    .replace(/-/g, ' ')
    || 'Dashboard'

  return (
    <div className="flex h-screen bg-[#f4f6f7] overflow-hidden">

      {/* Sidebar — slides in from left */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Backdrop overlay (mobile / collapsed) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
          <div className="flex items-center gap-4">
            {/* Burger / Close toggle */}
            <button
              id="sidebar-toggle"
              onClick={() => setSidebarOpen(prev => !prev)}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 hover:text-[#1a5276] transition-all"
              aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            >
              {sidebarOpen
                ? <HiOutlineX className="w-6 h-6" />
                : <HiOutlineMenuAlt2 className="w-6 h-6" />}
            </button>

            <h2 className="text-xl font-bold text-slate-800 capitalize">
              {pageTitle}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
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
