import { useState } from 'react'
import { useDistricts } from '../hooks/useDistricts'
import { useSites } from '../hooks/useSites'

export default function SitesPage() {
  const { districts } = useDistricts()
  const [selectedDistrictId, setSelectedDistrictId] = useState('')
  const [level, setLevel] = useState('primary')
  const { sites, loading } = useSites(selectedDistrictId || null, level)

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

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 animate-pulse font-medium">Running spatial prioritization algorithm...</div>
        ) : !selectedDistrictId ? (
          <div className="p-16 text-center text-slate-400">
            <p className="text-lg font-medium">Select a district to view recommended construction sites</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Site ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Suitability Score</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Rationale</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sites.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                    <td className="px-6 py-4 text-sm font-mono text-slate-600">#{s.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full max-w-[100px] overflow-hidden">
                          <div 
                            className="h-full bg-green-500 transition-all duration-1000" 
                            style={{ width: `${s.suitability_score}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-slate-700">{s.suitability_score}%</span>
                      </div>
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
