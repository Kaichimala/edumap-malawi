import { useDistricts } from '../hooks/useDistricts'
import { useSchools } from '../hooks/useSchools'
import { useData } from '../contexts/DataContext'
import { calcScore } from '../utils/scoring'
import { 

  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import { 
  HiOutlineDatabase, 
  HiOutlineChevronRight,
  HiOutlineOfficeBuilding,
  HiOutlineFlag,
  HiOutlineUsers,
  HiOutlineLocationMarker,
  HiOutlineMap,
  HiOutlineExclamationCircle
} from 'react-icons/hi'

const COLORS = ['#1a5276', '#28b463', '#e67e22', '#e74c3c'];


export default function Dashboard() {
  const navigate = useNavigate()
  const { districts, loading: dLoading } = useDistricts()
  const { allSchools, loading: sLoading } = useSchools()
  const { datasets, selectedDatasetId, setSelectedDatasetId } = useData()
  
  // Total schools from actual school data
  const totalSchools = (allSchools || []).length
  const totalDistricts = districts.length
  const totalPopulation = districts.reduce((acc, d) => acc + (Number(d.total_population) || 0), 0)
  const criticalDistricts = districts.filter(d => calcScore(Number(d.p_age_pop) || 0, Number(d.p_schools) || 0, 'primary') >= 80)
  
  // Data for Bar Chart: Top 10 Need Scores

  const chartData = districts
    .map(d => ({
      name: d.name,
      score: calcScore(Number(d.p_age_pop) || 0, Number(d.p_schools) || 0, 'primary')
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)

  // Data for Pie Chart: Level Distribution from actual schools
  const pieData = [
    { name: 'Primary', value: (allSchools || []).filter(s => s.level === 'primary').length },
    { name: 'Secondary', value: (allSchools || []).filter(s => s.level === 'secondary').length },
    { name: 'Tertiary', value: (allSchools || []).filter(s => s.level === 'tertiary').length },
  ]

  if (dLoading || sLoading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-[#1a5276]/20 border-t-[#1a5276] rounded-full animate-spin" />
      <p className="text-slate-500 font-bold animate-pulse">Syncing with {datasets?.find(ds => ds.id === selectedDatasetId)?.name}...</p>
    </div>
  )

  return (
    <div className="space-y-8 pb-12">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Executive Dashboard</h1>
          <p className="text-sm text-slate-500">National School Facility Analysis & Planning</p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 pl-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Active Dataset</span>
          <select 
            value={selectedDatasetId}
            onChange={(e) => setSelectedDatasetId(e.target.value)}
            className="bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-bold text-[#1a5276] focus:ring-2 focus:ring-[#1a5276]/10 outline-none cursor-pointer hover:bg-slate-100 transition-all"
          >
            {datasets?.map(ds => (
              <option key={ds.id} value={ds.id}>{ds.id}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Schools" value={totalSchools.toLocaleString()} subValue="Facility Inventory" icon={<HiOutlineOfficeBuilding />} />
        <StatCard title="Total Districts" value={totalDistricts} subValue="Administrative Units" icon={<HiOutlineFlag />} />
        <StatCard title="Total Population" value={totalPopulation.toLocaleString()} subValue="National Census Data" icon={<HiOutlineUsers />} color="text-green-600" />
        <StatCard title="Recommended Sites" value="142" subValue="Planning Pointers" icon={<HiOutlineLocationMarker />} />
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
            <HiOutlineExclamationCircle className="w-6 h-6 text-red-500" />
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
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-6">Spatial Context</h3>
            <div className="relative group overflow-hidden rounded-xl border border-slate-100 bg-slate-50 h-56 flex items-center justify-center">
               {/* Thumbnail Placeholder - in a real app this would be a static map image */}
             <div className="text-center p-8">
               <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl text-[#1a5276]">
                 <HiOutlineMap />
               </div>
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

          {/* Data Management CTA */}
          <div className="bg-gradient-to-br from-[#1a5276] to-[#154360] p-6 rounded-2xl shadow-lg border border-white/10 text-white group cursor-pointer hover:scale-[1.02] transition-all"
               onClick={() => navigate('/data')}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-2xl group-hover:bg-white/20 transition-colors">
                <HiOutlineDatabase />
              </div>
              <HiOutlineChevronRight className="w-6 h-6 text-white/40 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="font-bold text-lg">Data Management</h3>
            <p className="text-white/60 text-xs mt-1 leading-relaxed">
              Upload new geospatial datasets, update facility inventories, and manage system tables.
            </p>
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
        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-2xl text-slate-400 group-hover:bg-blue-50 group-hover:text-[#1a5276] transition-all">
          {icon}
        </div>
      </div>
    </div>
  )
}
