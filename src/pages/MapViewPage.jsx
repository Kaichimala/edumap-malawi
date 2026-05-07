import MapView from '../components/Map/MapView.tsx'
import MapDistrictSidebar from '../components/Map/MapDistrictSidebar'
import DetailPanel from '../components/DetailPanel/DetailPanel'
import { useDistricts } from '../hooks/useDistricts'
import { useData } from '../contexts/DataContext'
import { calcScore, getNeedLevel } from '../utils/scoring'
import { useState, useEffect, useRef } from 'react'

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
  const [isReanalyzing, setIsReanalyzing] = useState(false)
  const [isBuildMode, setIsBuildMode] = useState(false)
  const [isDestroyMode, setIsDestroyMode] = useState(false)
  const [showSites, setShowSites] = useState(true)
  const [visibleLevels, setVisibleLevels] = useState(['primary']) // Multi-level toggle state

  // Track the level that was last analyzed (to detect real changes)
  const analyzedLevelRef = useRef(null)

  useEffect(() => {
    sessionStorage.setItem('edumap_is_analyzed_map', isAnalyzed)
  }, [isAnalyzed])

  // Auto re-run effect removed — all 3 levels are computed in one pass now

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
    // Also reset to the very beginning (pre-district selection)
    setSelectedDistrictId(null)
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
        onAnalysisComplete={handleAnalysisComplete}
        handleClearAnalysis={handleClearAnalysis}
        showSites={showSites}
        setShowSites={setShowSites}
      />

      {/* Center: Map */}
      <div className="flex-1 relative group">
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
          {/* Floating Level Toggle (Primary Selector) */}
          <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-xl shadow-xl flex gap-1 border border-white/50">
            {['primary', 'secondary', 'tertiary'].map(l => (
              <button
                key={l}
                onClick={() => {
                  setLevel(l);
                  // Also ensure it's visible in the legend toggle
                  if (!visibleLevels.includes(l)) setVisibleLevels([...visibleLevels, l]);
                }}
                className={`px-4 py-1.5 text-[10px] font-black rounded-lg capitalize transition-all tracking-widest ${
                  level === l ? 'bg-[#1a5276] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          
          {/* Unified Map Legend & Context */}
          <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-2xl border border-white/50 w-[200px] flex flex-col gap-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-0.5">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Infrastructure Key</h4>
              <button 
                onClick={() => setVisibleLevels(visibleLevels.length === 3 ? [level] : ['primary', 'secondary', 'tertiary'])}
                className="text-[9px] font-black text-blue-600 hover:underline uppercase tracking-tighter"
              >
                {visibleLevels.length === 3 ? 'Reset' : 'Show All'}
              </button>
            </div>
            
            {/* Institution Markers with Toggles */}
            <div className="space-y-1.5">
              {[
                { id: 'primary', label: 'Primary Schools', color: 'bg-blue-500' },
                { id: 'secondary', label: 'Secondary Schools', color: 'bg-green-500' },
                { id: 'tertiary', label: 'Tertiary Institutions', color: 'bg-purple-500' }
              ].map(item => (
                <div 
                  key={item.id} 
                  className={`flex items-center justify-between group cursor-pointer p-1 rounded-lg transition-colors ${visibleLevels.includes(item.id) ? 'bg-slate-50' : 'opacity-40 grayscale hover:grayscale-0'}`}
                  onClick={() => {
                    if (visibleLevels.includes(item.id)) {
                      if (visibleLevels.length > 1) setVisibleLevels(visibleLevels.filter(v => v !== item.id));
                    } else {
                      setVisibleLevels([...visibleLevels, item.id]);
                    }
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm shrink-0 ${item.color}`}></div>
                    <span className="text-[11px] font-bold text-slate-600">{item.label}</span>
                  </div>
                  <input 
                    type="checkbox" 
                    readOnly 
                    checked={visibleLevels.includes(item.id)} 
                    className="w-3 h-3 accent-[#1a5276]"
                  />
                </div>
              ))}
            </div>

            {/* Analysis Overlay Info */}
            {showSites && isAnalyzed && (() => {
              const siteCount = analysisSites?.[level]?.length || 0;
              const pop = level === 'primary' ? selectedDistrict?.p_age_pop : level === 'secondary' ? selectedDistrict?.s_age_pop : selectedDistrict?.t_age_pop;
              const need = getNeedLevel(calcScore(pop, siteCount, level));
              
              return (
                <div className="pt-2 mt-0.5 border-t border-slate-100 space-y-2">
                   <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded bg-red-500 shadow-sm flex items-center justify-center shrink-0">
                      <div className="w-1 h-1 bg-white rounded-full"></div>
                    </div>
                    <span className="text-[11px] font-black text-red-600">
                      {siteCount} Recommended Site{siteCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Need Level</span>
                    <span className="text-[10px] font-black uppercase tracking-tighter" style={{ color: need.color }}>
                      {need.label}
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
          visibleLevels={visibleLevels} // Pass visibility array
        />
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
