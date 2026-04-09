import { useDistricts } from '../hooks/useDistricts'
import { calcScore, getNeedLevel } from '../utils/scoring'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import {
  HiOutlineAcademicCap,
  HiOutlineMap,
  HiOutlineUsers,
  HiOutlineLocationMarker,
  HiOutlineExclamationCircle,
  HiOutlineArrowRight,
  HiOutlineGlobe,
} from 'react-icons/hi'

const COLORS = ['#1a5276', '#28b463', '#e67e22', '#e74c3c']

export default function Dashboard() {
  const navigate = useNavigate()
  const { districts, loading: dLoading } = useDistricts()

  const totalSchools = districts.reduce((acc, d) => acc + d.p_schools + d.s_schools, 0)
  const totalDistricts = districts.length
  const criticalDistricts = districts.filter(d => calcScore(d.p_age_pop, d.p_schools, 'primary') >= 80)

  const chartData = districts
    .map(d => ({
      name: d.name,
      score: calcScore(d.p_age_pop, d.p_schools, 'primary')
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)

  const pieData = [
    { name: 'Primary',   value: districts.reduce((acc, d) => acc + d.p_schools, 0) },
    { name: 'Secondary', value: districts.reduce((acc, d) => acc + d.s_schools, 0) },
    { name: 'Tertiary',  value: districts.reduce((acc, d) => acc + d.t_institutions, 0) },
  ]

  if (dLoading) return (
    <div className="p-8 text-center animate-pulse text-slate-400 font-medium">
      Loading Dashboard Data...
    </div>
  )

  return (
    <div className="space-y-6">

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Schools"
          value={totalSchools.toLocaleString()}
          subValue="Primary · Secondary · Tertiary"
          icon={HiOutlineAcademicCap}
          iconColor="text-[#1a5276]"
          iconBg="bg-blue-50"
        />
        <StatCard
          title="Total Districts"
          value={totalDistricts}
          subValue={`${criticalDistricts.length} Critical Need`}
          icon={HiOutlineMap}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
        />
        <StatCard
          title="Population Coverage"
          value="68.4%"
          subValue="+2.1% from last year"
          icon={HiOutlineUsers}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatCard
          title="Recommended Sites"
          value="142"
          subValue="48 Priority-1 Sites"
          icon={HiOutlineLocationMarker}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-800">Need Score by District</h3>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Top 10 · Primary</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <RechartsTooltip
                  contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: '12px' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="score" fill="#1a5276" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <h3 className="font-bold text-slate-800 mb-5">School Level Distribution</h3>
          <div className="flex-1 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={78}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Critical Districts */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-5">
            <HiOutlineExclamationCircle className="w-5 h-5 text-red-500 shrink-0" />
            <h3 className="font-bold text-slate-800">Critical Districts</h3>
          </div>
          <div className="space-y-3">
            {criticalDistricts.slice(0, 5).map(d => {
              const score = calcScore(d.p_age_pop, d.p_schools, 'primary')
              const need = getNeedLevel(score)
              return (
                <div
                  key={d.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: need.color }}
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{d.name}</p>
                      <p className="text-xs text-slate-500">
                        Score: <span className="font-bold text-red-500">{score.toFixed(1)}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/map')}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#1a5276] border border-slate-200 rounded-lg hover:bg-[#1a5276] hover:text-white hover:border-[#1a5276] transition-all"
                  >
                    View <HiOutlineArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Map Preview */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-5">
            <HiOutlineGlobe className="w-5 h-5 text-[#1a5276] shrink-0" />
            <h3 className="font-bold text-slate-800">Spatial Context</h3>
          </div>
          <div className="relative group overflow-hidden rounded-lg border border-slate-100 bg-slate-50 h-52 flex items-center justify-center">
            <div className="text-center">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <HiOutlineMap className="w-7 h-7 text-[#1a5276]" />
              </div>
              <p className="text-sm font-semibold text-slate-600">Interactive Map Preview</p>
              <p className="text-xs text-slate-400 mt-1">28 districts · 142 recommended sites</p>
            </div>
            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={() => navigate('/map')}
                className="flex items-center gap-2 px-5 py-2 bg-[#1a5276] text-white text-sm font-bold rounded-full shadow-lg hover:scale-105 transition-transform"
              >
                Open Full GIS Map <HiOutlineArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data Updated: Today, 08:32 AM</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#1a5276] rounded-full" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">MIS Sync: Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, subValue, icon: Icon, iconColor, iconBg }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
          <p className="text-3xl font-black text-slate-800">{value}</p>
          <p className="text-[10px] font-semibold text-slate-400 mt-2 uppercase tracking-tight">{subValue}</p>
        </div>
        <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  )
}
