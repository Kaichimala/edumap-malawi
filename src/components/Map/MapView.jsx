// @ts-nocheck
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { getNeedLevel, calcScore } from '../../utils/scoring'

// Fly map to selected district
function FlyTo({ district }) {
  const map = useMap()
  if (district) map.flyTo([district.lat, district.lng], 9, { duration: 1.2 })
  return null
}

export default function MapView({ districts, selectedDistrict, level, onSelect, showMarkers }) {
  return (
    <MapContainer
      center={[-13.5, 34.3]}
      zoom={6}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© OpenStreetMap'
      />

      <FlyTo district={selectedDistrict} />

      {showMarkers && districts.map(d => {
        const pop   = level === 'primary'   ? d.p_age_pop   :
                      level === 'secondary' ? d.s_age_pop   : d.t_age_pop
        const inst  = level === 'primary'   ? d.p_schools   :
                      level === 'secondary' ? d.s_schools   : d.t_institutions
        const score = calcScore(pop, inst, level)
        const need  = getNeedLevel(score)
        const radius = Math.max(8, Math.min(28, pop / 8000))

        return (
          <CircleMarker
            key={d.id}
            center={[d.lat, d.lng]}
            radius={radius}
            pathOptions={{
              color:     need.color,
              fillColor: need.color,
              fillOpacity: 0.75,
              weight: selectedDistrict?.id === d.id ? 3 : 1,
            }}
            eventHandlers={{ click: () => onSelect(d) }}
          >
            <Tooltip>{d.name} — {need.label} ({score.toFixed(0)})</Tooltip>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}