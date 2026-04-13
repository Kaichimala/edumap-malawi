import MapView from '../components/Map/MapView'
import MapDistrictSidebar from '../components/Map/MapDistrictSidebar'
import DetailPanel from '../components/DetailPanel/DetailPanel'
import { useDistricts } from '../hooks/useDistricts'
import { useState, useEffect } from 'react'
import { HiOutlineChartBar, HiOutlineCheckCircle } from 'react-icons/hi'

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

        {/* Analysis Overlay */}
        {!isAnalyzed && (
          <div className={`absolute inset-0 z-[2000] flex items-center justify-center transition-all duration-700 ${isAnalyzing ? 'bg-slate-900/40 backdrop-blur-sm' : 'bg-slate-900/10 backdrop-blur-[2px]'}`}>
            <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-md w-full mx-4 text-center transform transition-transform border border-slate-100">
              {isAnalyzing ? (
                <div className="space-y-6">
                  <div className="relative w-24 h-24 mx-auto">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="8"/>
                      <circle 
                        cx="50" cy="50" r="45" fill="none" stroke="#1a5276" strokeWidth="8"
                        strokeDasharray={2 * Math.PI * 45}
                        strokeDashoffset={2 * Math.PI * 45 * (1 - progress / 100)}
                        strokeLinecap="round"
                        className="transition-all duration-300"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-sm font-black text-[#1a5276]">
                      {progress}%
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Processing GIS Layers</h3>
                    <p className="text-sm text-slate-500 mt-2">
                      {progress < 30 ? 'Fetching population cluster data...' :
                       progress < 60 ? 'Calculating school distance matrices...' :
                       progress < 90 ? 'Optimizing suitability indices...' : 'Finalizing spatial report...'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="w-20 h-20 bg-blue-50 text-[#1a5276] rounded-2xl flex items-center justify-center mx-auto text-4xl shadow-inner">
                    <HiOutlineChartBar />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Spatial Need Analysis</h3>
                    <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                      Run the analytical engine to identify critical education gaps and suitable development areas based on the {level} level data.
                    </p>
                  </div>
                  <button
                    onClick={handleStartAnalysis}
                    className="w-full py-4 bg-[#1a5276] text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3 active:scale-95"
                  >
                    Start Spatial Analysis
                    <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] uppercase tracking-tighter">MIS-v2</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
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
