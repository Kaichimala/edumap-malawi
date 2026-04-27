import { useState } from 'react'
import { useDistricts } from '../hooks/useDistricts'
import { useSites } from '../hooks/useSites'
import {
  HiOutlineLocationMarker,
  HiOutlineDatabase,
  HiOutlineRefresh,
} from 'react-icons/hi'

const SCORE_BADGE = (score) =>
  score >= 75
    ? 'bg-green-100 text-green-700 border-green-200'
    : score >= 50
    ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
    : 'bg-red-100 text-red-700 border-red-200'

const TIER_LABEL = (score) =>
  score >= 75 ? 'High Priority' : score >= 50 ? 'Medium Priority' : 'Lower Priority'

export default function SitesPage() {
  const { districts } = useDistricts()
  const [selectedDistrictId, setSelectedDistrictId] = useState('')
  const [level, setLevel] = useState('primary')

  const { sites, metadata, loading, error } = useSites(
    selectedDistrictId || null,
    level,
  )

  const districtName =
    districts.find((d) => String(d.id) === String(selectedDistrictId))?.name || ''

  return (
    <div className="space-y-6">
      {/* ── Controls Bar ── */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-6 items-end">
        <div className="w-full md:w-64 space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Target District
          </label>
          <select
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1a5276] outline-none transition-all"
            value={selectedDistrictId}
            onChange={(e) => setSelectedDistrictId(e.target.value)}
          >
            <option value="">Select a district...</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            School Level
          </label>
          <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
            {['primary', 'secondary', 'tertiary'].map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold capitalize transition-all ${
                  level === l
                    ? 'bg-white text-[#1a5276] shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Metadata summary pills */}
        {metadata && (
          <div className="flex flex-wrap gap-2 ml-auto">
            {[
              ['Candidates', metadata.total_candidates_evaluated],
              ['Top Sites', metadata.top_sites_returned],
              ['Existing Schools', metadata.existing_schools_in_district],
              ['Underserved Zones', metadata.underserved_zones],
              ['District Area', `${metadata.district_area_km2} km²`],
              ['Buffer Coverage', `${metadata.buffer_coverage_pct}%`],
            ].map(([label, val]) => (
              <span
                key={label}
                className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-wider"
              >
                {label}: <span className="text-[#1a5276]">{val}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Main Content ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px] flex flex-col">
        {/* Loading */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center p-16 gap-5 text-center">
            <div className="relative w-20 h-20">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="45" fill="none" stroke="#1a5276" strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * 0.25}`}
                  strokeLinecap="round"
                  className="animate-spin origin-center"
                />
              </svg>
            </div>
            <div>
              <p className="font-bold text-slate-700">Running PyLUSAT Suitability Engine...</p>
              <p className="text-xs text-slate-400 mt-1">
                Evaluating road access, water proximity &amp; terrain slope for {districtName}
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex-1 flex flex-col items-center justify-center p-16 text-center gap-4">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-2xl">⚠️</div>
            <div>
              <p className="font-bold text-red-600">Analysis Failed</p>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Empty — no district selected */}
        {!loading && !error && !selectedDistrictId && (
          <div className="flex-1 flex flex-col items-center justify-center p-16 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-2xl text-slate-300 border border-slate-100">
              <HiOutlineDatabase />
            </div>
            <p className="text-lg font-medium text-slate-600">
              Select a district to view recommended construction sites
            </p>
            <p className="text-sm text-slate-400 max-w-xs">
              The PyLUSAT engine will evaluate terrain, road access, and water proximity to rank
              the most suitable locations for new {level} schools.
            </p>
          </div>
        )}

        {/* Empty — district selected but no results */}
        {!loading && !error && selectedDistrictId && sites.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center p-16 text-center space-y-4">
            <HiOutlineRefresh className="w-10 h-10 text-slate-300" />
            <p className="text-slate-500 font-medium">No sites returned for this selection.</p>
          </div>
        )}

        {/* Results table */}
        {!loading && !error && sites.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  {[
                    'Rank', 'Suitability Score', 'Priority Tier',
                    'Road Score', 'Water Score', 'Slope Score',
                    'Dist. Road', 'Dist. Water', 'Slope', 'Coordinates',
                  ].map((h) => (
                    <th key={h} className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sites.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-sm font-bold text-slate-500">
                      #{s.rank}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${s.suitability_score}%`,
                              backgroundColor:
                                s.suitability_score >= 75 ? '#16a34a'
                                : s.suitability_score >= 50 ? '#ca8a04'
                                : '#dc2626',
                            }}
                          />
                        </div>
                        <span className="text-sm font-black text-slate-700">
                          {s.suitability_score}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 border rounded-full text-[10px] font-bold uppercase tracking-wider ${SCORE_BADGE(s.suitability_score)}`}
                      >
                        {TIER_LABEL(s.suitability_score)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 font-mono">{s.road_score}/10</td>
                    <td className="px-4 py-3 text-sm text-slate-600 font-mono">{s.water_score}/10</td>
                    <td className="px-4 py-3 text-sm text-slate-600 font-mono">{s.slope_score}/10</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{s.dist_road_m?.toLocaleString()} m</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{s.dist_water_m?.toLocaleString()} m</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{s.slope_deg}°</td>
                    <td className="px-4 py-3 text-xs text-slate-400 font-mono whitespace-nowrap">
                      {s.lat.toFixed(5)}, {s.lng.toFixed(5)}
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
