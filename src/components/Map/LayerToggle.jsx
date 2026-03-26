import { PiTarget }         from 'react-icons/pi'
import { HiOutlineUsers }   from 'react-icons/hi'
import { LuSchool }         from 'react-icons/lu'
import { TbMapPin }         from 'react-icons/tb'

const MODES = [
  { id: 'need',         label: 'Need Score',   Icon: PiTarget           },
  { id: 'population',   label: 'Population',   Icon: HiOutlineUsers     },
  { id: 'institutions', label: 'Institutions', Icon: LuSchool           },
  { id: 'suitability',  label: 'Suitability',  Icon: TbMapPin           },
]

export default function LayerToggle({ mode, setMode }) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-lg shadow-brand-900/10 px-2 py-2 flex gap-1">
      {MODES.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => setMode(id)}
          title={label}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-150 ${
            mode === id
              ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
              : 'text-slate-500 hover:bg-brand-50 hover:text-brand-700'
          }`}
        >
          <Icon className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}
