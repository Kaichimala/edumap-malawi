import { useDistricts } from '../hooks/useDistricts'
import { calcScore, getNeedLevel } from '../utils/scoring'

export default function DistrictsPage() {
  const { districts, loading } = useDistricts()

  if (loading) return <div className="animate-pulse flex space-x-4">Loading Districts...</div>

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">District Name</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Primary Schools</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Secondary Schools</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Tertiary Institutions</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Need Score</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Priority Level</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {districts.map(d => {
              const score = calcScore(d.p_age_pop, d.p_schools, 'primary')
              const need = getNeedLevel(score)
              
              return (
                <tr key={d.id} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                  <td className="px-6 py-4 font-medium text-slate-900 group-hover:text-[#1a5276]">{d.name}</td>
                  <td className="px-6 py-4 text-center text-slate-600">{d.p_schools}</td>
                  <td className="px-6 py-4 text-center text-slate-600">{d.s_schools}</td>
                  <td className="px-6 py-4 text-center text-slate-600">{d.t_institutions}</td>
                  <td className="px-6 py-4 text-center font-bold text-slate-700">{score.toFixed(1)}</td>
                  <td className="px-6 py-4">
                    <span 
                      className="px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-sm"
                      style={{ backgroundColor: need.color }}
                    >
                      {need.label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
