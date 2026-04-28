import { useState } from 'react'
import { useDistricts } from '../hooks/useDistricts'
import { useSchools } from '../hooks/useSchools'

export default function TertiaryPage() {
  const { districts } = useDistricts()
  const [selectedDistrictId, setSelectedDistrictId] = useState('')
  // We fetch all schools for the district
  const { schools, loading } = useSchools(selectedDistrictId || null)
  const [search, setSearch] = useState('')

  // Filter for Tertiary (University/College)
  const tertiarySchools = schools.filter(s => 
    (s.level === 'tertiary' || s.amenity === 'university' || s.amenity === 'college') &&
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Tertiary Institutions</h2>
        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase tracking-wider">
          Higher Education
        </span>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase">Search Institutions</label>
          <input 
            type="text" 
            placeholder="Search by name (e.g. UNIMA, MUBAS)..."
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full md:w-64 space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase">District</label>
          <select 
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
            value={selectedDistrictId}
            onChange={(e) => setSelectedDistrictId(e.target.value)}
          >
            <option value="">All Districts</option>
            {districts.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 animate-pulse">Fetching tertiary records...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Institution Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">District ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tertiarySchools.length > 0 ? tertiarySchools.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{s.name}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-700">
                        {s.amenity || 'Tertiary'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-600">{s.district_id}</td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                      {s.lat.toFixed(4)}, {s.lng.toFixed(4)}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-slate-400 italic">
                      No tertiary institutions found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
