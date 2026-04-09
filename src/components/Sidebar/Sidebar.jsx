import { NavLink } from 'react-router-dom'
import { 
  HiOutlineViewGrid, 
  HiOutlineMap, 
  HiOutlineFlag, 
  HiOutlineOfficeBuilding, 
  HiOutlineLocationMarker, 
  HiOutlineDocumentText, 
  HiOutlineCog 
} from 'react-icons/hi'

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: HiOutlineViewGrid },
  { path: '/map', label: 'Map View', icon: HiOutlineMap },
  { path: '/districts', label: 'Districts', icon: HiOutlineFlag },
  { path: '/schools', label: 'Schools', icon: HiOutlineOfficeBuilding },
  { path: '/sites', label: 'Recommended Sites', icon: HiOutlineLocationMarker },
  { path: '/reports', label: 'Reports', icon: HiOutlineDocumentText },
]

export default function Sidebar() {
  return (
    <div className="w-72 bg-[#1a252f] text-slate-300 h-full flex flex-col shadow-2xl z-20">
      {/* Branding */}
      <div className="px-6 py-8 flex items-center gap-3 border-b border-slate-700/50">
        <div className="w-10 h-10 bg-[#1a5276] rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg ring-2 ring-blue-500/20">
          M
        </div>
        <div>
          <h1 className="text-white font-extrabold text-lg tracking-tight">EduMap Malawi</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-tight">Ministry of Education</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
              ${isActive 
                ? 'bg-[#1a5276] text-white shadow-lg shadow-blue-900/20' 
                : 'hover:bg-slate-800 hover:text-white'}
            `}
          >
            <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="font-semibold text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-slate-700/50">
        <NavLink
            to="/settings"
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
              ${isActive 
                ? 'bg-slate-700 text-white' 
                : 'hover:bg-slate-800 hover:text-white'}
            `}
          >
            <HiOutlineCog className="w-5 h-5 transition-transform group-hover:rotate-45" />
            <span className="font-semibold text-sm">Settings</span>
          </NavLink>
        
        <div className="mt-6 px-4 py-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">MIS SYNC: ACTIVE</span>
          </div>
          <p className="text-[10px] text-slate-500">v1.2.4-stable</p>
        </div>
      </div>
    </div>
  )
}