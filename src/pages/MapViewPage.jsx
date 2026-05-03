import MapView from '../components/Map/MapView.tsx'
import MapDistrictSidebar from '../components/Map/MapDistrictSidebar'
import DetailPanel from '../components/DetailPanel/DetailPanel'
import { useDistricts } from '../hooks/useDistricts'
import { useState, useEffect } from 'react'
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

  const selectedDistrict = districts.find(d => String(d.id) === String(selectedDistrictId))
  const handleSelect = (d) => setSelectedDistrictId(d ? d.id : null)
  
  // Persist session analysis state
  const [isAnalyzed, setIsAnalyzed] = useState(() => {
    return sessionStorage.getItem('edumap_is_analyzed_map') === 'true'
  })

  // Shared state for Build Mode and Visibility
  const [isBuildMode, setIsBuildMode] = useState(false)
  const [isDestroyMode, setIsDestroyMode] = useState(false)
  const [showSites, setShowSites] = useState(true)

  useEffect(() => {
    sessionStorage.setItem('edumap_is_analyzed_map', isAnalyzed)
  }, [isAnalyzed])

  const handleAnalysisComplete = () => {
    setIsAnalyzed(true)
    setShowSites(true)
  }

  const handleClearAnalysis = () => {
    setIsAnalyzed(false)
    setShowSites(false)
  }

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse font-medium tracking-widest">Initialising Spatial Data Engine...</div>

  return (
    <div className="h-[calc(100vh-10rem)] flex bg-white rounded-2xl shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100 relative">
      
      {/* Left Panel: District List, Planning Tools & Analytical Engine */}
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
            {showSites && isAnalyzed && (
              <div className="flex items-center gap-2 pt-1 mt-1 border-t border-slate-100">
                <div className="w-3 h-3 rounded bg-red-500 shadow-sm flex items-center justify-center">
                  <div className="w-1 h-1 bg-white rounded-full"></div>
                </div>
                <span className="text-xs font-bold text-red-600">Recommended Site</span>
              </div>
            )}
          </div>
        </div>

        <MapView
          districts={districts}
          selectedDistrict={selectedDistrict}
          level={level}
          onSelect={handleSelect}
          showMarkers={true}
          showSites={showSites}
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

      {/* Right Panel: Detail Panel */}
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
