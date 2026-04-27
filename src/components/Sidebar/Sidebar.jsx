import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { 
  HiOutlineViewGrid, 
  HiOutlineMap, 
  HiOutlineFlag, 
  HiOutlineOfficeBuilding, 
  HiOutlineLocationMarker, 
  HiOutlineDocumentText, 
  HiOutlineCog,
  HiOutlineLogout
} from 'react-icons/hi'

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard',          icon: HiOutlineViewGrid },
  { path: '/map',       label: 'Map View',            icon: HiOutlineMap },
  { path: '/districts', label: 'Districts',           icon: HiOutlineFlag },
  { path: '/schools',   label: 'Schools',             icon: HiOutlineOfficeBuilding },
  { path: '/sites',     label: 'Recommended Sites',   icon: HiOutlineLocationMarker },
  { path: '/reports',   label: 'Reports',             icon: HiOutlineDocumentText },
]

export default function Sidebar({ isOpen, onClose }) {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const handleNavClick = () => {
    if (onClose) onClose()
  }

  return (
    <aside
      className={`
        fixed top-0 left-0 h-full w-64
        bg-white border-r border-slate-200 flex flex-col shadow-xl
        z-40 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      {/* Branding */}
      <div className="px-5 py-6 flex items-center gap-3 border-b border-slate-100 shrink-0">
        <div className="w-9 h-9 bg-[#1a5276] rounded-lg flex items-center justify-center text-white font-bold text-base shadow-md shrink-0">
          M
        </div>
        <div>
          <h1 className="text-slate-800 font-extrabold text-base tracking-tight leading-tight">EduMap Malawi</h1>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest leading-tight">Ministry of Education</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
              ${isActive
                ? 'bg-[#1a5276] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <item.icon className="w-[18px] h-[18px] shrink-0 transition-transform group-hover:scale-110" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="px-3 py-4 border-t border-slate-100 space-y-1 shrink-0">
        <NavLink
          to="/settings"
          onClick={handleNavClick}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
            ${isActive
              ? 'bg-[#1a5276] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`
          }
        >
          <HiOutlineCog className="w-[18px] h-[18px] shrink-0 transition-transform group-hover:rotate-45" />
          <span>Settings</span>
        </NavLink>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150 group"
        >
          <HiOutlineLogout className="w-[18px] h-[18px] shrink-0 transition-transform group-hover:-translate-x-0.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
