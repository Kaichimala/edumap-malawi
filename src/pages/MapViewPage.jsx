import MapView from '../components/Map/MapView.tsx'
import MapDistrictSidebar from '../components/Map/MapDistrictSidebar'
import DetailPanel from '../components/DetailPanel/DetailPanel'
import { useDistricts } from '../hooks/useDistricts'
import { useState, useEffect } from 'react'

export default function MapViewPage() {
  const { districts, loading } = useDistricts()
  const [selectedDistrict, setSelectedDistrict] = useState(null)
  const [level, setLevel] = useState('primary')
  
  // Persist session analysis state
  const [isAnalyzed, setIsAnalyzed] = useState(() => {
    return sessionStorage.getItem('edumap_is_analyzed_map') === 'true'
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)

  // Shared state for Build Mode and Visibility
  const [isBuildMode, setIsBuildMode] = useState(false)
  const [isDestroyMode, setIsDestroyMode] = useState(false)
  const [showSites, setShowSites] = useState(true)

  useEffect(() => {
    sessionStorage.setItem('edumap_is_analyzed_map', isAnalyzed)
  }, [isAnalyzed])

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
          setIsAnalyzed(true)
          setShowSites(true)
        }, 300)
      }
    }, interval)
  }

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse font-medium tracking-widest">Initialising Spatial Data Engine...</div>

  return (
    <div className="h-[calc(100vh-10rem)] flex bg-white rounded-2xl shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100 relative">
      
      {/* Left Panel: District List, Planning Tools & Analytical Engine */}
      <MapDistrictSidebar 
        districts={districts}
        level={level}
        selectedDistrict={selectedDistrict}
        onSelect={setSelectedDistrict}
        isBuildMode={isBuildMode}
        setIsBuildMode={setIsBuildMode}
        isDestroyMode={isDestroyMode}
        setIsDestroyMode={setIsDestroyMode}
        isAnalyzed={isAnalyzed}
        isAnalyzing={isAnalyzing}
        progress={progress}
        handleStartAnalysis={handleStartAnalysis}
        showSites={showSites}
        setShowSites={setShowSites}
      />

      {/* Center: Map */}
      <div className="flex-1 relative group">
        {/* Floating Level Toggle */}
        <div className="absolute top-4 right-4 z-[1000] bg-white/80 backdrop-blur-md p-1.5 rounded-xl shadow-xl flex gap-1 border border-white/50">
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

        <MapView
          districts={districts}
          selectedDistrict={selectedDistrict}
          level={level}
          onSelect={setSelectedDistrict}
          showMarkers={true}
          showSites={showSites}
          isBuildMode={isBuildMode}
          setIsBuildMode={setIsBuildMode}
          isDestroyMode={isDestroyMode}
          setIsDestroyMode={setIsDestroyMode}
          isAnalyzed={isAnalyzed}
        />
      </div>

      {/* Right Panel: Detail Panel */}
      {selectedDistrict && (
        <DetailPanel
          district={selectedDistrict}
          level={level}
          onClose={() => setSelectedDistrict(null)}
        />
      )}
    </div>
  )
}
