import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { TbMapRoute } from 'react-icons/tb'
import { LuLogOut } from 'react-icons/lu'

export default function Navbar({ level, setLevel }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <nav className="bg-brand-900 text-white px-6 py-0 flex items-center gap-1 shadow-lg shadow-brand-900/30 z-10">

      {/* Logo + Brand */}
      <div className="flex items-center gap-2.5 mr-6 py-3">
        <div className="flex items-center justify-center w-8 h-8 bg-white/10 rounded-lg border border-white/20">
          <TbMapRoute className="w-5 h-5 text-sky-300" />
        </div>
        <span className="font-bold text-base tracking-tight">
          EduMap <span className="text-sky-300">Malawi</span>
        </span>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-white/15 mr-4" />

      {/* Level Tabs */}
      <div className="flex items-center bg-white/8 rounded-lg p-1 gap-0.5">
        {['primary', 'secondary', 'tertiary'].map(l => (
          <button
            key={l}
            onClick={() => setLevel(l)}
            className={`px-4 py-1.5 rounded-md capitalize text-sm font-medium transition-all duration-150 ${level === l
                ? 'bg-brand-500 text-white shadow-md'
                : 'text-brand-200 hover:bg-white/10 hover:text-white'
              }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* User Greeting & Sign Out */}
      <div className="flex items-center gap-4 ml-auto">
        {user && (
          <div className="hidden sm:flex flex-col items-end mr-1">
            <span className="text-xs font-semibold text-white">
              {user.user_metadata?.full_name || user.email?.split('@')[0]}
            </span>
            <span className="text-[10px] text-brand-300">
              {user.email}
            </span>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-brand-200 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LuLogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </nav>
  )
}
