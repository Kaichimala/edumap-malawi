// @ts-nocheck
import { useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { getNeedLevel, calcScore, getPopulationLevel, getInstitutionsLevel, getSuitabilityLevel } from '../../utils/scoring'
import MapLegend from './MapLegend'
import LayerToggle from './LayerToggle'
import { useSchools } from '../../hooks/useSchools'
import { useSites } from '../../hooks/useSites'

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
  const { schools } = useSchools(selectedDistrict?.id)
  const { sites }   = useSites(selectedDistrict?.id, level)

  return (
    <div className="relative w-full h-full">
      <LayerToggle mode={layerMode} setMode={setLayerMode} />
      <MapLegend mode={layerMode} />

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