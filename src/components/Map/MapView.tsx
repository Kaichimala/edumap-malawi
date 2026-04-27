// @ts-nocheck
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { getNeedLevel, calcScore, getPopulationLevel, getInstitutionsLevel, getSuitabilityLevel } from '../../utils/scoring'
import MapLegend from './MapLegend'
import LayerToggle from './LayerToggle'
import { useSchools } from '../../hooks/useSchools'
import { useSites } from '../../hooks/useSites'
import { HiDownload } from 'react-icons/hi'
import { LuFileImage } from 'react-icons/lu'
import { FaFilePdf } from 'react-icons/fa'

// Red pin icon for recommended sites
const redPinIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Fly map to selected district or return to center
function FlyTo({ district }) {
  const map = useMap()
  if (district) {
    map.flyTo([district.lat, district.lng], 9, { duration: 1.2 })
  } else {
    // Zoom out to default Malawi view
    map.flyTo([-13.5, 34.3], 6, { duration: 1.2 })
  }
  return null
}

export default function MapView({ districts, selectedDistrict, level = 'primary', onSelect }) {
  const [layerMode, setLayerMode] = useState('need')
  const [exportLoading, setExportLoading] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const mapRef = useRef(null)
  
  const { schools } = useSchools(selectedDistrict?.id)
  const { sites }   = useSites(selectedDistrict?.id, level)

  const handleExport = async (format) => {
    if (!mapRef.current) return
    setExportLoading(true)
    setShowExportMenu(false)
    
    try {
      // Small delay to ensure any hover effects or menus are cleared
      await new Promise(resolve => setTimeout(resolve, 100))

      const canvas = await html2canvas(mapRef.current, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#f8fafc',
        scale: 2, // Higher quality
        ignoreElements: (element) => {
          // Ignore the export button itself during capture
          return element.classList.contains('export-ignore')
        }
      })

      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `edumap-analysis-${timestamp}`

      if (format === 'png') {
        const link = document.createElement('a')
        link.download = `${filename}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
      } else if (format === 'pdf') {
        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height]
        })
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
        pdf.save(`${filename}.pdf`)
      }
    } catch (err) {
      console.error('Export failed:', err)
      alert('Failed to export map. Please try again.')
    } finally {
      setExportLoading(false)
    }
  }

  return (
    <div ref={mapRef} className="relative w-full h-full bg-slate-50">
      <LayerToggle mode={layerMode} setMode={setLayerMode} />
      <MapLegend mode={layerMode} />

      {/* Export Button Overlay */}
      <div className="absolute bottom-6 right-6 z-[500] flex flex-col items-end gap-2 export-ignore">
        {showExportMenu && (
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden mb-2 transition-all">
            <button 
              onClick={() => handleExport('png')}
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-slate-700 w-full text-left transition-colors"
            >
              <LuFileImage className="text-blue-500 w-5 h-5" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Export as PNG</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">High Resolution Image</span>
              </div>
            </button>
            <div className="h-px bg-slate-100 mx-2" />
            <button 
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-slate-700 w-full text-left transition-colors"
            >
              <FaFilePdf className="text-red-500 w-5 h-5" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Export as PDF</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Document for Reports</span>
              </div>
            </button>
          </div>
        )}
        
        <button
          onClick={() => setShowExportMenu(!showExportMenu)}
          disabled={exportLoading}
          className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none group"
        >
          {exportLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <HiDownload className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
          )}
          <span className="font-semibold text-sm">Export Analysis</span>
        </button>
      </div>

      <MapContainer
        center={[-13.5, 34.3]}
        zoom={6}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© OpenStreetMap'
        />

        <FlyTo district={selectedDistrict} />

        {/* Existing Schools (Green Dots) */}
        {schools.map(s => (
          <CircleMarker
            key={`school-${s.id}`}
            center={[s.lat, s.lng]}
            radius={6}
            pathOptions={{ color: '#ffffff', fillColor: '#22c55e', fillOpacity: 0.9, weight: 1.5 }}
          >
            <Tooltip>
              <div className="font-semibold">{s.name}</div>
              <div className="text-xs text-gray-500">{s.students} students — {s.level}</div>
            </Tooltip>
          </CircleMarker>
        ))}

        {/* Recommended Sites (Red Pins) */}
        {sites.map(s => (
          <Marker
            key={`site-${s.id}`}
            position={[s.lat, s.lng]}
            icon={redPinIcon}
          >
            <Tooltip direction="top" offset={[0, -35]}>{s.name} (Suitability: {s.suitability_score}%)</Tooltip>
            <Popup>
              <div className="p-1 min-w-[150px]">
                <h3 className="font-bold text-sm mb-1 text-gray-800">{s.name}</h3>
                <div className="bg-red-50 p-2 rounded-md mb-2">
                  <p className="text-xs m-0"><strong>Suitability:</strong> <span className="text-red-600 font-bold">{s.suitability_score}%</span></p>
                </div>
                <p className="text-xs m-0 text-gray-600 leading-relaxed">{s.reason}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Districts */}
        {districts.map(d => {
          const pop   = level === 'primary'   ? d.p_age_pop   :
                        level === 'secondary' ? d.s_age_pop   : d.t_age_pop
          const inst  = level === 'primary'   ? d.p_schools   :
                        level === 'secondary' ? d.s_schools   : d.t_institutions
          const score = calcScore(pop, inst, level)
          
          let colorInfo;
          if (layerMode === 'population') {
            colorInfo = getPopulationLevel(pop);
          } else if (layerMode === 'institutions') {
            colorInfo = getInstitutionsLevel(inst);
          } else if (layerMode === 'suitability') {
            colorInfo = getSuitabilityLevel(100 - score); // Mock district suitability inverse to need
          } else {
            colorInfo = getNeedLevel(score);
          }

          // Marker radius scaled to population size
          const radius = Math.max(10, Math.min(35, pop / 6000));

          return (
            <CircleMarker
              key={d.id}
              center={[d.lat, d.lng]}
              radius={radius}
              pathOptions={{
                color:     colorInfo.color,
                fillColor: colorInfo.color,
                fillOpacity: layerMode === 'suitability' ? 0.4 : 0.75, // Lighter opacity for suitability area
                weight: selectedDistrict?.id === d.id ? 3 : 1,
              }}
              eventHandlers={{ click: () => onSelect(d) }}
            >
              <Tooltip>
                <div className="text-left">
                  <strong className="block border-b border-gray-200 pb-1 mb-1">{d.name} District</strong>
                  {layerMode === 'population' && <div>Population: {pop.toLocaleString()}</div>}
                  {layerMode === 'institutions' && <div>Institutions: {inst}</div>}
                  {layerMode === 'need' && <div>Need Score: {score.toFixed(0)} <span style={{color: colorInfo.color}}>({colorInfo.label})</span></div>}
                  {layerMode === 'suitability' && <div>Avg Suitability: {(100-score).toFixed(0)} <span style={{color: colorInfo.color}}>({colorInfo.label})</span></div>}
                  
                  {selectedDistrict?.id !== d.id && (
                    <div className="text-[10px] text-blue-500 mt-2 italic">Click to view schools & sites</div>
                  )}
                </div>
              </Tooltip>
            </CircleMarker>
          )
        })}
      </MapContainer>
    </div>
  )
}