import MapView from '../components/Map/MapView.tsx'
import MapDistrictSidebar from '../components/Map/MapDistrictSidebar'
import DetailPanel from '../components/DetailPanel/DetailPanel'
import { useDistricts } from '../hooks/useDistricts'
import { useData } from '../contexts/DataContext'
import { calcScore, getNeedLevel } from '../utils/scoring'
import { useState, useEffect, useRef } from 'react'
import { HiOutlineChartBar, HiOutlineCheckCircle, HiOutlineRefresh } from 'react-icons/hi'

export default function MapViewPage() {
  const { 
    districts, 
    loading, 
    selectedDistrictId, 
    setSelectedDistrictId, 
    level, 
    setLevel 
  } = useDistricts()

  const { runSpatialAnalysis, clearAnalysisSites, analysisSites } = useData()

  const selectedDistrict = districts.find(d => String(d.id) === String(selectedDistrictId))
  const handleSelect = (d) => setSelectedDistrictId(d ? d.id : null)
  
  const [isAnalyzed, setIsAnalyzed] = useState(() => {
    return sessionStorage.getItem('edumap_is_analyzed_map') === 'true'
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isReanalyzing, setIsReanalyzing] = useState(false)
  const [isBuildMode, setIsBuildMode] = useState(false)
  const [isDestroyMode, setIsDestroyMode] = useState(false)
  const [showSites, setShowSites] = useState(true)

  // Track the level that was last analyzed
  const analyzedLevelRef = useRef(null)

  useEffect(() => {
    sessionStorage.setItem('edumap_is_analyzed_map', isAnalyzed)
  }, [isAnalyzed])

  const handleAnalysisComplete = () => {
    analyzedLevelRef.current = level
    setIsAnalyzed(true)
    setShowSites(true)
  }

  const handleClearAnalysis = () => {
    setIsAnalyzed(false)
    setShowSites(false)
    clearAnalysisSites()
    analyzedLevelRef.current = null
  }

  const handleStartAnalysis = async () => {
    if (!selectedDistrict) return
    setIsAnalyzing(true)
    setProgress(0)
    
    let p = 0
    const fastInterval = setInterval(() => {
      p = Math.min(p + 4, 80)
      setProgress(p)
      if (p >= 80) clearInterval(fastInterval)
    }, 60)
    
    await runSpatialAnalysis(selectedDistrict.id, selectedDistrict)
    
    clearInterval(fastInterval)
    setProgress(100)
    setTimeout(() => {
      setIsAnalyzing(false)
      handleAnalysisComplete()
    }, 300)
  }

  // When district changes, clear old analysis
  useEffect(() => {
    if (isAnalyzed) {
      setIsAnalyzed(false)
      clearAnalysisSites()
      analyzedLevelRef.current = null
    }
  }, [selectedDistrictId])

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse font-medium tracking-widest">Initialising Spatial Data Engine...</div>

  return (
    <div className="h-[calc(100vh-10rem)] flex bg-white rounded-2xl shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100 relative">
      
      {/* Left Panel */}
      <MapDistrictSidebar 
        districts={districts}
        level={level}
        selectedDistrict={selectedDistrict}
        onSelect={handleSelect}
        isBuildMode={isBuildMode}
        setIsBuildMode={setIsBuildMode}
        isDestroyMode={isDestroyMode}
        setIsDestroyMode={setIsDestroyMode}
        isAnalyzed={isAnalyzed}
        isAnalyzing={isAnalyzing}
        progress={progress}
        handleStartAnalysis={handleStartAnalysis}
        handleClearAnalysis={handleClearAnalysis}
        showSites={showSites}
        setShowSites={setShowSites}
      />

      {/* Center: Map */}
      <div className="flex-1 relative group">
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
          {/* Floating Level Toggle */}
          <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-xl shadow-xl flex gap-1 border border-white/50">
            {['primary', 'secondary', 'tertiary'].map(l => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`px-4 py-1.5 text-[10px] font-black rounded-lg capitalize transition-all tracking-widest ${
                  level === l ? 'bg-[#1a5276] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          
          {/* Map Legend */}
          <div className="bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-xl border border-white/50 w-full flex flex-col gap-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-100 pb-1 mb-1">Map Legend</h4>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 border border-white shadow-sm"></div>
              <span className="text-xs font-semibold text-slate-600">Primary</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 border border-white shadow-sm"></div>
              <span className="text-xs font-semibold text-slate-600">Secondary</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500 border border-white shadow-sm"></div>
              <span className="text-xs font-semibold text-slate-600">Tertiary</span>
            </div>
            {showSites && isAnalyzed && (() => {
              const siteCount = analysisSites?.[level]?.length || 0;
              const need = getNeedLevel(calcScore(
                level === 'primary' ? selectedDistrict?.p_age_pop : level === 'secondary' ? selectedDistrict?.s_age_pop : selectedDistrict?.t_age_pop,
                siteCount, 
                level
              ));
              return (
                <div className="pt-1 mt-1 border-t border-slate-100 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-500 shadow-sm flex items-center justify-center">
                      <div className="w-1 h-1 bg-white rounded-full"></div>
                    </div>
                    <span className="text-xs font-bold text-red-600 capitalize">
                      {siteCount} {level} Site{siteCount !== 1 ? 's' : ''} Recommended
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: need.color + '20', color: need.color }}
                    >
                      {need.label} Need
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Re-analyzing overlay */}
        {isReanalyzing && (
          <div className="absolute inset-0 z-[900] bg-slate-900/20 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
            <div className="bg-white/95 rounded-2xl shadow-2xl px-8 py-5 flex items-center gap-4 border border-slate-100">
              <div className="w-5 h-5 border-2 border-[#1a5276]/30 border-t-[#1a5276] rounded-full animate-spin" />
              <div>
                <p className="font-black text-sm text-slate-800 uppercase tracking-tight">Re-running Analysis</p>
                <p className="text-[10px] text-slate-500 font-medium capitalize">Scanning for {level} school deserts...</p>
              </div>
            </div>
          </div>
        )}

        <MapView
          districts={districts}
          selectedDistrict={selectedDistrict}
          level={level}
          onSelect={handleSelect}
          showMarkers={true}
          showSites={showSites && !isReanalyzing}
          isBuildMode={isBuildMode}
          setIsBuildMode={setIsBuildMode}
          isDestroyMode={isDestroyMode}
          setIsDestroyMode={setIsDestroyMode}
          isAnalyzed={isAnalyzed}
        />

        {/* Spatial Analysis floating button — always visible */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[2000]">
          {isAnalyzing ? (
            <div className="flex items-center gap-2.5 px-5 py-2.5 bg-white border border-slate-200 rounded-full shadow-lg text-sm font-semibold text-[#1a5276]">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#e2e8f0" strokeWidth="3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="#1a5276" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Analysing… {progress}%
            </div>
          ) : isAnalyzed ? (
            <button
              onClick={handleStartAnalysis}
              className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-full shadow-lg hover:shadow-xl hover:bg-slate-50 active:scale-95 transition-all"
            >
              <HiOutlineCheckCircle className="w-4 h-4 text-emerald-500" />
              Re-run Analysis
              <HiOutlineRefresh className="w-3.5 h-3.5 text-slate-400" />
            </button>
          ) : (
            <button
              onClick={handleStartAnalysis}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#1a5276] text-white text-sm font-bold rounded-full shadow-lg hover:shadow-xl hover:bg-[#154360] active:scale-95 transition-all"
            >
              <HiOutlineChartBar className="w-4 h-4" />
              Start Spatial Analysis
            </button>
          )}
        </div>
      </div>

      {/* Right Panel */}
      {selectedDistrict && (
        <DetailPanel
          district={selectedDistrict}
          level={level}
          onClose={() => handleSelect(null)}
        />
      )}
    </div>
  )
}

