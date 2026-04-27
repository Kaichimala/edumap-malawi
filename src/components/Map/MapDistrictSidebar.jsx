import { useState } from 'react'
import { calcScore, getNeedLevel } from '../../utils/scoring'
import { HiOutlineSearch, HiOutlineChevronRight } from 'react-icons/hi'

export default function MapDistrictSidebar({ districts, level, onSelect, selectedDistrict }) {
  const [search, setSearch] = useState('')

  const filteredDistricts = districts.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="w-72 bg-white h-full flex flex-col border-r border-slate-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 space-y-4">
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">District Selection</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Global Needs Assessment</p>
        </div>

        {/* Search */}
        <div className="relative group">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1a5276] transition-colors" />
          <input
            type="text"
            placeholder="Search districts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1a5276]/20 focus:bg-white focus:border-[#1a5276] transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredDistricts.map(d => {
          const score = calcScore(d.p_age_pop, d.p_schools, level)
          const need = getNeedLevel(score)
          const isSelected = selectedDistrict?.id === d.id

          return (
            <button
              key={d.id}
              onClick={() => onSelect(d)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border ${
                isSelected 
                  ? 'bg-blue-50 border-blue-200 shadow-sm' 
                  : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-100'
              }`}
            >
              <span 
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" 
                style={{ backgroundColor: need.color }} 
              />
              <div className="flex-1 text-left min-w-0">
                <p className={`text-xs font-bold truncate ${isSelected ? 'text-[#1a5276]' : 'text-slate-700'}`}>
                  {d.name}
                </p>
                <p className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-tighter">
                  {need.label} Need · Score {score.toFixed(0)}
                </p>
              </div>
              <HiOutlineChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-[#1a5276] translate-x-1' : 'text-slate-300'}`} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
