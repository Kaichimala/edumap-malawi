import { calcScore, getNeedLevel, getRecommendedNew } from '../../utils/scoring'
import { HiOutlineUsers, HiOutlineOfficeBuilding, HiOutlineChartBar, HiOutlineLocationMarker } from 'react-icons/hi'
import { IoClose } from 'react-icons/io5'

const STAT_ICONS = {
  pop:   <HiOutlineUsers          className="w-5 h-5 text-brand-500" />,
  inst:  <HiOutlineOfficeBuilding className="w-5 h-5 text-brand-500" />,
  score: <HiOutlineChartBar       className="w-5 h-5 text-brand-500" />,
  site:  <HiOutlineLocationMarker className="w-5 h-5 text-red-500"   />,
}

export default function DetailPanel({ district, level, onClose }) {
  const pop  = level === 'primary'   ? district.p_age_pop   :
               level === 'secondary' ? district.s_age_pop   : district.t_age_pop
  const inst = level === 'primary'   ? district.p_schools   :
               level === 'secondary' ? district.s_schools   : district.t_institutions
  const score   = calcScore(pop, inst, level)
  const need    = getNeedLevel(score)
  const newInst = getRecommendedNew(pop, inst, level)
  const instLabel = level === 'tertiary' ? 'Institutions' : 'Schools'

  return (
    <div className="w-80 bg-white h-full overflow-y-auto border-l border-slate-200 shadow-xl flex flex-col">

      {/* Accent bar */}
      <div className="h-1.5 w-full" style={{ backgroundColor: need.color }} />

      {/* Title row */}
      <div className="flex justify-between items-start px-5 pt-5 pb-4">
        <div>
          <h2 className="font-bold text-brand-900 text-lg leading-tight">{district.name}</h2>
          <span
            className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: need.color }}
          >
            {need.label} Need
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
        <StatCard icon={STAT_ICONS.pop}   label="Total Population" value={district.total_pop ? district.total_pop.toLocaleString() : (district.p_age_pop + district.s_age_pop + district.t_age_pop).toLocaleString()} />
        <StatCard icon={STAT_ICONS.inst}  label={`Existing ${instLabel}`} value={inst} />
        <StatCard
          icon={STAT_ICONS.score}
          label="Need Score"
          value={`${score.toFixed(1)} / 100`}
          highlight={need.color}
        />
        <StatCard
          icon={STAT_ICONS.site}
          label={`Recommended New ${instLabel}`}
          value={newInst === 0 ? 'Sufficient' : `+${newInst}`}
          highlight={newInst > 0 ? need.color : '#16a34a'}
        />
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
