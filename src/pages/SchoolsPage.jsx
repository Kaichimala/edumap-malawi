import { useState } from 'react'
import { useDistricts } from '../hooks/useDistricts'
import { useSchools } from '../hooks/useSchools'

export default function SchoolsPage() {
  const { districts } = useDistricts()
  const [selectedDistrictId, setSelectedDistrictId] = useState('')
  const { schools, loading } = useSchools(selectedDistrictId || null)
  const [search, setSearch] = useState('')

  const filteredSchools = schools.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase">Search Schools</label>
          <input 
            type="text" 
            placeholder="Search by school name..."
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1a5276] outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full md:w-64 space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase">District</label>
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
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 animate-pulse">Fetching schools for the selected district...</div>
        ) : !selectedDistrictId ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-lg font-medium">Please select a district to view schools</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">School Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Level</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Students</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Coordinates</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSchools.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{s.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        s.level === 'primary'   ? 'bg-blue-100 text-blue-700'
                        : s.level === 'secondary' ? 'bg-purple-100 text-purple-700'
                        : 'bg-green-100 text-green-700'
                      }`}>
                        {s.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{s.students.toLocaleString()}</td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                      {s.lat.toFixed(4)}, {s.lng.toFixed(4)}
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
