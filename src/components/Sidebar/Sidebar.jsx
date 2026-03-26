import { calcScore, getNeedLevel } from '../../utils/scoring'
import { HiOutlineChevronRight }      from 'react-icons/hi'

const LEVEL_LABELS = { primary: 'P', secondary: 'S', tertiary: 'T' }

export default function Sidebar({ districts, level, onSelect, selectedDistrict }) {
  return (
    <div className="w-72 bg-brand-50 h-full overflow-y-auto border-r border-slate-200 flex flex-col">

      {/* Header */}
      <div className="px-4 pt-5 pb-3 border-b border-slate-200">
        <h2 className="font-semibold text-brand-900 text-sm uppercase tracking-widest">Districts</h2>
        <p className="text-xs text-slate-400 mt-0.5">Select a district to explore</p>
      </div>

      {/* List */}
      <div className="flex-1 p-3 space-y-1.5">
        {districts.map(d => {
          const pop  = level === 'primary'   ? d.p_age_pop   :
                       level === 'secondary' ? d.s_age_pop   : d.t_age_pop
          const inst = level === 'primary'   ? d.p_schools   :
                       level === 'secondary' ? d.s_schools   : d.t_institutions
          const score    = calcScore(pop, inst, level)
          const need     = getNeedLevel(score)
          const isSelected = selectedDistrict?.id === d.id

          return (
            <div
              key={d.id}
              onClick={() => onSelect(d)}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all duration-150 ${
                isSelected
                  ? 'bg-brand-100 border-brand-400 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-brand-300 hover:bg-brand-50'
              }`}
            >
              {/* Need color dot */}
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: need.color }} />

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isSelected ? 'text-brand-800' : 'text-slate-800'}`}>
                  {d.name}
                </p>
                <p className="text-xs text-slate-400">{need.label} Need · Score {score.toFixed(0)}</p>
              </div>

              {/* Level badge */}
              <span className="text-[10px] font-bold text-brand-500 bg-brand-50 border border-brand-200 rounded px-1.5 py-0.5 shrink-0">
                {LEVEL_LABELS[level]}
              </span>

              {/* Chevron */}
              <HiOutlineChevronRight
                className={`w-4 h-4 shrink-0 transition-colors ${isSelected ? 'text-brand-500' : 'text-slate-300'}`}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}