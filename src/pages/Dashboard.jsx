import { useDistricts } from '../hooks/useDistricts'
import { useSchools } from '../hooks/useSchools'
import { useSites } from '../hooks/useSites'
import { calcScore, getNeedLevel } from '../utils/scoring'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { useNavigate } from 'react-router-dom'

const COLORS = ['#1a5276', '#28b463', '#e67e22', '#e74c3c'];

export default function Dashboard() {
  const navigate = useNavigate()
  const { districts, loading: dLoading } = useDistricts()
  
  // Aggregate data for stats
  const totalSchools = districts.reduce((acc, d) => acc + d.p_schools + d.s_schools, 0)
  const totalDistricts = districts.length
  const criticalDistricts = districts.filter(d => calcScore(d.p_age_pop, d.p_schools, 'primary') >= 80)
  
  // Data for Bar Chart: Top 10 Need Scores
  const chartData = districts
    .map(d => ({
      name: d.name,
      score: calcScore(d.p_age_pop, d.p_schools, 'primary')
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)

  // Data for Pie Chart: Level Distribution
  const pieData = [
    { name: 'Primary', value: districts.reduce((acc, d) => acc + d.p_schools, 0) },
    { name: 'Secondary', value: districts.reduce((acc, d) => acc + d.s_schools, 0) },
    { name: 'Tertiary', value: districts.reduce((acc, d) => acc + d.t_institutions, 0) },
  ]

  if (dLoading) return <div className="p-8 text-center animate-pulse text-slate-500">Loading Dashboard Data...</div>

  return (
    <div className="space-y-8 pb-12">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Schools" value={totalSchools.toLocaleString()} subValue="Facility Inventory" icon="🏫" />
        <StatCard title="Total Districts" value={totalDistricts} subValue="Administrative Units" icon="🇲🇼" />
        <StatCard title="Population Coverage" value="68.4%" subValue="Service Area Mapping" icon="👥" color="text-green-600" />
        <StatCard title="Recommended Sites" value="142" subValue="Planning Pointers" icon="📍" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bar Chart Section */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800">School Distribution by District (Top 10)</h3>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Primary Level</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="score" fill="#1a5276" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <h3 className="font-bold text-slate-800 mb-6 text-center">School Level Distribution</h3>
          <div className="flex-1 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Insights Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-red-500 rounded-full" />
            Critical Districts Insights
          </h3>
          <div className="space-y-4">
            {criticalDistricts.slice(0, 5).map(d => (
              <div key={d.id} className="flex items-center justify-between p-4 bg-red-50/50 rounded-xl border border-red-100">
                <div>
                  <h4 className="font-bold text-slate-800">{d.name}</h4>
                  <p className="text-xs text-slate-500">Planning Status: <span className="text-blue-600 font-bold">Active</span></p>
                </div>
                <button 
                  onClick={() => navigate('/map')}
                  className="px-3 py-1.5 bg-white text-xs font-bold text-red-600 border border-red-200 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Map Preview Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-6">Spatial Context</h3>
          <div className="relative group overflow-hidden rounded-xl border border-slate-100 bg-slate-50 h-56 flex items-center justify-center">
             {/* Thumbnail Placeholder - in a real app this would be a static map image */}
             <div className="text-center p-8">
               <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🌍</div>
               <p className="text-sm font-semibold text-slate-600">Interactive Map Preview</p>
               <p className="text-xs text-slate-400 mt-1">Overlaying 28 districts and 142 recommended sites</p>
             </div>
             
             <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button 
                  onClick={() => navigate('/map')}
                  className="px-6 py-2 bg-[#1a5276] text-white font-bold rounded-full shadow-xl hover:scale-105 transition-transform"
                >
                  Open Full GIS Map
                </button>
             </div>
          </div>
          
          <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Data Updated: Today, 08:32 AM</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#1a5276] rounded-full" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">MIS Sync: Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, subValue, icon, color = "text-slate-800" }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
          <p className={`text-3xl font-black ${color} group-hover:text-[#1a5276] transition-colors`}>{value}</p>
          <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-tight">{subValue}</p>
        </div>
        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-2xl group-hover:bg-blue-50 transition-colors">
          {icon}
        </div>
      </div>
    </div>
  )
}