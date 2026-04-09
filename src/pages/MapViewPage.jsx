import MapView from '../components/Map/MapView'
import MapDistrictSidebar from '../components/Map/MapDistrictSidebar'
import DetailPanel from '../components/DetailPanel/DetailPanel'
import { useDistricts } from '../hooks/useDistricts'
import { useState, useEffect } from 'react'
import { HiOutlineChartBar, HiOutlineCheckCircle, HiOutlineRefresh } from 'react-icons/hi'

export default function MapViewPage() {
  const { districts, loading } = useDistricts()
  const [selectedDistrict, setSelectedDistrict] = useState(null)
  const [level, setLevel] = useState('primary')
  const [isAnalyzed, setIsAnalyzed] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleStartAnalysis = () => {
    setIsAnalyzing(true)
    setProgress(0)
    
    // Simulated multi-stage analysis progress
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
        }, 300)
      }
    }, interval)
  }

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse font-medium tracking-widest">Initialising Spatial Data Engine...</div>

  return (
    <div className="h-[calc(100vh-10rem)] flex bg-white rounded-2xl shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100 relative">
      
      {/* Left Panel: District List */}
      <MapDistrictSidebar 
        districts={districts}
        level={level}
        selectedDistrict={selectedDistrict}
        onSelect={setSelectedDistrict}
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
          showMarkers={isAnalyzed}
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
          onClose={() => setSelectedDistrict(null)}
        />
      )}
    </div>
  )
}
