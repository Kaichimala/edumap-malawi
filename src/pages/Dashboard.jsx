import { useState } from 'react'
import Navbar from '../components/Navbar/Navbar'
import Sidebar from '../components/Sidebar/Sidebar'
import DetailPanel from '../components/DetailPanel/DetailPanel'
import MapView from '../components/Map/MapView'
import { useDistricts } from '../hooks/useDistricts'

export default function Dashboard() {
  const { districts, loading } = useDistricts()
  const [selectedDistrict, setSelectedDistrict] = useState(null)
  const [level, setLevel] = useState('primary')
  const [filter, setFilter] = useState('all')

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-brand-100 border-t-brand-500 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading EduMap…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Navbar — level toggle lives here now */}
      <Navbar level={level} setLevel={setLevel} />

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <Sidebar
          districts={districts}
          level={level}
          filter={filter}
          setFilter={setFilter}
          selectedDistrict={selectedDistrict}
          onSelect={setSelectedDistrict}
        />

        {/* Map */}
        <div className="flex-1 relative">
          <MapView
            districts={districts}
            selectedDistrict={selectedDistrict}
            level={level}
            onSelect={setSelectedDistrict}
          />
        </div>

        {/* Detail Panel */}
        {selectedDistrict && (
          <DetailPanel
            district={selectedDistrict}
            level={level}
            onClose={() => setSelectedDistrict(null)}
          />
        )}
      </div>
    </div>
  )
}