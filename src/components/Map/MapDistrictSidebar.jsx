import { useState } from 'react'
import { calcScore, getNeedLevel } from '../../utils/scoring'
import { HiOutlineSearch, HiOutlineChevronRight, HiOutlineChartBar, HiOutlineCheckCircle, HiOutlineEye, HiOutlineEyeOff, HiOutlineTrash } from 'react-icons/hi'
import { MdConstruction } from 'react-icons/md'

export default function MapDistrictSidebar({ 
  districts, 
  level, 
  onSelect, 
  selectedDistrict, 
  isBuildMode, 
  setIsBuildMode,
  isAnalyzed,
  onAnalysisComplete,
  handleClearAnalysis,
  showSites,
  setShowSites,
  isDestroyMode,
  setIsDestroyMode
}) {
  const [search, setSearch] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleStartAnalysis = () => {
    setIsAnalyzing(true)
    setProgress(0)
    
    const duration = 2500
    const interval = 50
    const steps = duration / interval
    let currentStep = 0

    const timer = setInterval(() => {
      currentStep++
      const p = Math.min(100, Math.round((currentStep / steps) * 100))
      setProgress(p)

      if (currentStep >= steps) {
        clearInterval(timer)
        setTimeout(() => {
          setIsAnalyzing(false)
          onAnalysisComplete()
        }, 300)
      }
    }, interval)
  }

  const filteredDistricts = districts.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="w-72 bg-white h-full flex flex-col border-r border-slate-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 space-y-4">
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">District Selection</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Administrative District List</p>
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

      {/* Analytical Engine Section */}
      <div className="p-4 bg-slate-50/80 border-b border-slate-100 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Spatial Engine</h3>
          {isAnalyzed && selectedDistrict && (
            <button
              onClick={() => setShowSites(!showSites)}
              className={`p-1 rounded-md transition-colors ${showSites ? 'text-[#1a5276] hover:bg-blue-50' : 'text-slate-400 hover:bg-slate-100'}`}
            >
              {showSites ? <HiOutlineEye className="w-4 h-4" /> : <HiOutlineEyeOff className="w-4 h-4" />}
            </button>
          )}
        </div>
        
        {!selectedDistrict ? (
          <div className="flex flex-col items-center justify-center p-4 bg-slate-100/50 rounded-xl border border-slate-200 border-dashed text-center">
            <HiOutlineSearch className="text-2xl text-slate-300 mb-2" />
            <p className="text-[10px] font-black uppercase tracking-tight text-slate-500">Engine Locked</p>
            <p className="text-[9px] text-slate-400 font-medium mt-1">Select a district below to unlock spatial analysis.</p>
          </div>
        ) : isAnalyzing ? (
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-[#1a5276] uppercase tracking-tighter">
              <span>{progress < 100 ? 'Processing...' : 'Complete'}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#1a5276] transition-all duration-300" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : isAnalyzed ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-[#1a5276] rounded-lg border border-blue-100">
            <HiOutlineCheckCircle className="text-xl shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-tight leading-none">{selectedDistrict.name} Calibrated</p>
              <p className="text-[9px] font-medium opacity-80 mt-0.5 truncate">Planning sites ready</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <button 
                onClick={handleStartAnalysis} 
                className="text-[9px] font-bold text-[#1a5276] hover:underline"
              >
                Re-run
              </button>
              <button 
                onClick={handleClearAnalysis} 
                className="text-[9px] font-bold text-red-500 hover:underline"
              >
                Clear
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleStartAnalysis}
            className="w-full py-2.5 bg-[#1a5276] text-white text-[11px] font-black rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 active:scale-95 uppercase tracking-wider"
          >
            <HiOutlineChartBar className="text-lg" />
            Analyze {selectedDistrict.name}
          </button>
        )}
      </div>

      {/* Planning Tools Section */}
      <div className="p-4 bg-slate-50/50 border-b border-slate-100">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Planning Tools</h3>
          {isBuildMode && <span className="text-[8px] bg-red-100 text-red-600 px-1 rounded font-black animate-pulse">BUILD MODE</span>}
          {isDestroyMode && <span className="text-[8px] bg-red-100 text-red-600 px-1 rounded font-black animate-pulse">DESTROY MODE</span>}
        </div>
        <div className="space-y-2">
          <button
            onClick={() => {
              setIsBuildMode(!isBuildMode)
              if (!isBuildMode) setIsDestroyMode(false)
            }}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border ${
              isBuildMode 
                ? 'bg-amber-600 border-amber-700 text-white shadow-lg scale-[1.02]' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-colors ${
              isBuildMode ? 'bg-white/20' : 'bg-amber-50 text-amber-600'
            }`}>
              <MdConstruction />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold leading-tight">Build School</p>
              <p className={`text-[9px] font-medium ${isBuildMode ? 'text-amber-100' : 'text-slate-400'}`}>
                {isBuildMode ? 'Click map to place spot' : 'New Infrastructure mode'}
              </p>
            </div>
          </button>
          
          <button
            onClick={() => {
              setIsDestroyMode(!isDestroyMode)
              if (!isDestroyMode) setIsBuildMode(false)
            }}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border ${
              isDestroyMode 
                ? 'bg-red-600 border-red-700 text-white shadow-lg scale-[1.02]' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-colors ${
              isDestroyMode ? 'bg-white/20' : 'bg-red-50 text-red-600'
            }`}>
              <HiOutlineTrash />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold leading-tight">Destroy School</p>
              <p className={`text-[9px] font-medium ${isDestroyMode ? 'text-red-100' : 'text-slate-400'}`}>
                {isDestroyMode ? 'Search to remove' : 'Remove Infrastructure'}
              </p>
            </div>
          </button>
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
              <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm bg-blue-400" />
              <div className="flex-1 text-left min-w-0">
                <p className={`text-xs font-bold truncate ${isSelected ? 'text-[#1a5276]' : 'text-slate-700'}`}>
                  {d.name}
                </p>
                <p className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-tighter">
                  District Metadata Active
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
