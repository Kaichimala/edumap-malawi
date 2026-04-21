import { useState, useEffect } from 'react'
import { useDistricts } from '../hooks/useDistricts'
import { useSites } from '../hooks/useSites'
import { HiOutlineLocationMarker, HiOutlineDatabase, HiOutlineChevronRight } from 'react-icons/hi'

export default function SitesPage() {
  const { districts } = useDistricts()
  const [selectedDistrictId, setSelectedDistrictId] = useState('')
  const [level, setLevel] = useState('primary')
  const { sites, loading } = useSites(selectedDistrictId || null, level)
  
  // Persist session analysis state
  const [isAnalyzed, setIsAnalyzed] = useState(() => {
    return sessionStorage.getItem('edumap_is_analyzed_sites') === 'true'
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)

  useEffect(() => {
    sessionStorage.setItem('edumap_is_analyzed_sites', isAnalyzed)
  }, [isAnalyzed])

  const handleStartAnalysis = () => {
    if (!selectedDistrictId) return
    setIsAnalyzing(true)
    setAnalysisProgress(0)

    const duration = 2000
    const interval = 50
    const steps = duration / interval
    let currentStep = 0

    const timer = setInterval(() => {
      currentStep++
      setAnalysisProgress(Math.min(100, Math.round((currentStep / steps) * 100)))

      if (currentStep >= steps) {
        clearInterval(timer)
        setTimeout(() => {
          setIsAnalyzing(false)
          setIsAnalyzed(true)
        }, 200)
      }
    }, interval)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-6 items-end">
        <div className="w-full md:w-64 space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target District</label>
          <select 
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1a5276] outline-none transition-all"
            value={selectedDistrictId}
            onChange={(e) => setSelectedDistrictId(e.target.value)}
          >
            <option value="">Select a district...</option>
            {districts.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">School Level</label>
          <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
            {['primary', 'secondary', 'tertiary'].map(l => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold capitalize transition-all ${
                  level === l ? 'bg-white text-[#1a5276] shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px] flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-12 text-center text-slate-500 animate-pulse font-medium">
            Running spatial prioritization algorithm...
          </div>
        ) : !selectedDistrictId ? (
          <div className="flex-1 flex flex-col items-center justify-center p-16 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-2xl text-slate-300 border border-slate-100">
              <HiOutlineDatabase />
            </div>
            <p className="text-lg font-medium text-slate-600">Select a district to view recommended construction sites</p>
            <p className="text-sm text-slate-400 max-w-xs">Specific site suitability is calculated based on local terrain, infrastructure, and distance to existing schools.</p>
          </div>
        ) : !isAnalyzed ? (
          <div className="flex-1 flex flex-col items-center justify-center p-16 text-center space-y-8">
            <div className="relative">
               <div className={`w-24 h-24 rounded-3xl bg-blue-50 flex items-center justify-center text-4xl text-[#1a5276] shadow-inner transition-transform duration-500 ${isAnalyzing ? 'scale-110 animate-pulse' : ''}`}>
                 <HiOutlineLocationMarker />
               </div>
               {isAnalyzing && (
                 <svg className="absolute -inset-2 w-28 h-28 -rotate-90">
                    <circle cx="56" cy="56" r="52" fill="none" stroke="#1a5276" strokeWidth="4" strokeDasharray="326.7" strokeDashoffset={326.7 * (1 - analysisProgress / 100)} strokeLinecap="round" className="transition-all duration-300" />
                 </svg>
               )}
            </div>

            <div className="max-w-md space-y-3">
              <h3 className="text-2xl font-black text-slate-800">Ready for Site Prioritization</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Unlock the suitability matrix for {districts.find(d => Number(d.id) === Number(selectedDistrictId))?.name || 'the selected district'}. 
                The algorithm will evaluate multiple spatial factors to rank the most effective locations for new {level === 'tertiary' ? 'institutions' : 'schools'}.
              </p>
            </div>

            <button
              onClick={handleStartAnalysis}
              disabled={isAnalyzing}
              className={`group px-8 py-4 ${isAnalyzing ? 'bg-slate-100 text-slate-400' : 'bg-[#1a5276] text-white hover:shadow-xl hover:scale-105 active:scale-95'} font-bold rounded-2xl shadow-lg transition-all flex items-center gap-3`}
            >
              {isAnalyzing ? `Analyzing... ${analysisProgress}%` : 'Execute Suitability Engine'}
              {!isAnalyzing && <HiOutlineChevronRight className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Site ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Analysis ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Rationale</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sites.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                    <td className="px-6 py-4 text-sm font-mono text-slate-600">#{s.id}</td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Validated Site
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 leading-relaxed italic">"{s.reason}"</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-yellow-50 text-yellow-700 border border-yellow-100 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        Under Review
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
