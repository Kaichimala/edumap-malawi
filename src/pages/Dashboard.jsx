import { useState } from 'react'
import MapView   from '../components/Map/MapView'
import Sidebar   from '../components/Sidebar/Sidebar'
import DetailPanel from '../components/DetailPanel/DetailPanel'
import { useDistricts } from '../hooks/useDistricts'

export default function Dashboard() {
  const { districts, loading } = useDistricts()
  const [selectedDistrict, setSelectedDistrict] = useState(null)
  const [level, setLevel] = useState('primary')  // 'primary' | 'secondary' | 'tertiary'
  const [filter, setFilter] = useState('all')     // 'all' | 'Critical' | 'High' | 'Medium' | 'Low'

  if (loading) return <div className="flex h-screen items-center justify-center text-xl">Loading EduMap...</div>

  return (
    <div className="flex flex-col h-screen">

      {/* Top Navbar */}
      <nav className="bg-gray-900 text-white px-6 py-3 flex items-center gap-6">
        <span className="font-bold text-lg">EduMap Malawi</span>

        {/* Level Toggle */}
        {['primary','secondary','tertiary'].map(l => (
          <button
            key={l}
            onClick={() => setLevel(l)}
            className={`px-4 py-1 rounded capitalize text-sm font-medium transition
              ${level === l ? 'bg-blue-500 text-white' : 'text-gray-300 hover:text-white'}`}
          >
            {l}
          </button>
        ))}
      </nav>

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
        <div className="flex-1">
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