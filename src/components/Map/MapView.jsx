// @ts-nocheck
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap, GeoJSON } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { getNeedLevel, calcScore } from '../../utils/scoring'

// Fly map to selected district
function FlyTo({ district }) {
  const map = useMap()
  useEffect(() => {
    if (district) {
      map.flyTo([district.lat, district.lng], 9, { duration: 1.2 })
    } else {
      map.flyTo([-13.25, 34.30], 7, { duration: 1.2 })
    }
  }, [district, map])
  return null
}

function MalawiMask() {
  const [maskData, setMaskData] = useState(null)

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/wmgeolab/geoBoundaries/main/releaseData/gbOpen/MWI/ADM0/geoBoundaries-MWI-ADM0_simplified.geojson')
      .then(res => res.json())
      .then(data => {
        if (data.features && data.features.length > 0) {
          const geometry = data.features[0].geometry;
          let holes = [];
          if (geometry.type === 'Polygon') {
            holes = geometry.coordinates;
          } else if (geometry.type === 'MultiPolygon') {
            holes = geometry.coordinates.flat(1);
          }

          const invertedPolygon = {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: {
                  type: "Polygon",
                  coordinates: [
                    [
                      [-180, -90],
                      [180, -90],
                      [180, 90],
                      [-180, 90],
                      [-180, -90]
                    ],
                    ...holes
                  ]
                },
                properties: {}
              }
            ]
          };
          setMaskData(invertedPolygon);
        }
      })
      .catch(err => console.error("Error fetching Malawi GeoJSON", err))
  }, [])

  if (!maskData) return null;

  return (
    <GeoJSON
      data={maskData}
      style={{
        fillColor: '#000',
        fillOpacity: 0.4,
        color: 'transparent',
        weight: 0
      }}
      interactive={false}
    />
  )
}

export default function MapView({ districts, selectedDistrict, level, onSelect, showMarkers }) {
  return (
    <MapContainer
      center={[-13.25, 34.30]}
      zoom={7}
      minZoom={6}
      maxBounds={[[-17.15, 32.60], [-9.35, 36.00]]}
      maxBoundsViscosity={1.0}
      style={{ height: '100%', width: '100%' }}
    >
      <MalawiMask />
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