import { calcScore, getNeedLevel, getRecommendedNew } from '../../utils/scoring'
import { HiOutlineUsers, HiOutlineOfficeBuilding, HiOutlineChartBar, HiOutlineLocationMarker } from 'react-icons/hi'
import { IoClose } from 'react-icons/io5'
import { useSchools } from '../../hooks/useSchools'

const STAT_ICONS = {
  inst:  <HiOutlineOfficeBuilding className="w-5 h-5 text-brand-500" />,
  site:  <HiOutlineLocationMarker className="w-5 h-5 text-red-500"   />,
}

export default function DetailPanel({ district, level, onClose }) {
  const { schools } = useSchools()
  
  // Get live counts from the actual map data instead of static district table
  const primaryCount = (schools || []).filter(s => s.level?.toLowerCase() === 'primary').length
  const secondaryCount = (schools || []).filter(s => s.level?.toLowerCase() === 'secondary').length
  const tertiaryCount = (schools || []).filter(s => s.level?.toLowerCase() === 'tertiary').length

  const pop  = level === 'primary'   ? district.p_age_pop   :
               level === 'secondary' ? district.s_age_pop   : district.t_age_pop
  const inst = level === 'primary'   ? primaryCount   :
               level === 'secondary' ? secondaryCount : tertiaryCount
  const score   = calcScore(pop, inst, level)
  const need    = getNeedLevel(score)
  const newInst = getRecommendedNew(pop, inst, level)
  const instLabel = level === 'tertiary' ? 'Institutions' : 'Schools'

  return (
    <div className="w-80 bg-white h-full overflow-y-auto border-l border-slate-200 shadow-xl flex flex-col">

      {/* Accent bar shifted to neutral */}
      <div className="h-1.5 w-full bg-slate-200" />

      {/* Title row */}
      <div className="flex justify-between items-start px-5 pt-5 pb-4">
        <div>
          <h2 className="font-bold text-brand-900 text-lg leading-tight">{district.name}</h2>
          <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold text-slate-500 bg-slate-100">
            Active Planning
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-brand-700 transition-colors"
        >
          <IoClose className="w-5 h-5" />
        </button>
      </div>

      {/* Stats */}
      <div className="px-5 pb-5 space-y-3">
        <StatCard icon={STAT_ICONS.inst}  label={`Existing ${instLabel}`} value={inst} />
        <StatCard
          icon={STAT_ICONS.site}
          label={`Recommended New ${instLabel}`}
          value={newInst === 0 ? 'Sufficient' : `+${newInst}`}
          highlight={newInst > 0 ? '#1a5276' : '#16a34a'}
        />
      </div>

      <div className="mx-5 border-t border-slate-100" />

      {/* Level Breakdown Section */}
      <div className="px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">District Breakdown</p>
        <div className="grid grid-cols-3 gap-2">
           <div className="bg-slate-50 p-2 rounded-lg text-center border border-slate-100">
             <div className="text-[10px] text-slate-400 uppercase font-bold">Primary</div>
             <div className="text-sm font-bold text-slate-700">{primaryCount}</div>
           </div>
           <div className="bg-slate-50 p-2 rounded-lg text-center border border-slate-100">
             <div className="text-[10px] text-slate-400 uppercase font-bold">Secondary</div>
             <div className="text-sm font-bold text-slate-700">{secondaryCount}</div>
           </div>
           <div className="bg-slate-50 p-2 rounded-lg text-center border border-slate-100">
             <div className="text-[10px] text-slate-400 uppercase font-bold">Tertiary</div>
             <div className="text-sm font-bold text-slate-700">{tertiaryCount}</div>
           </div>
        </div>
      </div>

      <div className="mx-5 border-t border-slate-100" />

      {/* Sites note */}
      <div className="px-5 py-4 flex-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Sites &amp; Schools</p>
        <p className="text-sm text-slate-400 italic">
          Click a marker on the map to explore individual schools and recommended sites.
        </p>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-brand-50 border-t border-slate-100">
        <p className="text-[11px] text-slate-400 text-center">
          Data based on MoE guidelines · {level.charAt(0).toUpperCase() + level.slice(1)} level
        </p>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, highlight }) {
  return (
    <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
      <span className="shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-bold truncate" style={{ color: highlight || '#0f2d5c' }}>
          {value}
        </p>
      </div>
    </div>
  )
}
