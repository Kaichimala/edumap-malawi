// @ts-nocheck
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap, GeoJSON } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { getNeedLevel, calcScore, getPopulationLevel, getInstitutionsLevel, getSuitabilityLevel } from '../../utils/scoring'
import MapLegend from './MapLegend'
import LayerToggle from './LayerToggle'
import { useSchools } from '../../hooks/useSchools'
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

export default function MapView({ districts, selectedDistrict, level = 'primary', onSelect, suitabilityData }) {
  const [layerMode, setLayerMode] = useState('need')
  const [exportLoading, setExportLoading] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const mapRef = useRef(null)

  const { schools } = useSchools(selectedDistrict?.id)

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
    <div id="map-capture-area" ref={mapRef} className="relative w-full h-full bg-slate-50">
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



        {/* Dynamic PyLUSAT Suitability Data */}
        {suitabilityData && (() => {
          const features = suitabilityData.features || []
          const bufferFeatures = { type: 'FeatureCollection', features: features.filter(f => f.properties?.feature_type === 'buffer') }
          const pointFeatures  = { type: 'FeatureCollection', features: features.filter(f => f.properties?.feature_type === 'point' || !f.properties?.feature_type) }

          const scoreColor = (score) =>
            score >= 75 ? '#16a34a'   // green  — high priority
            : score >= 50 ? '#ca8a04' // amber  — medium priority
            : '#dc2626'               // red    — lower priority

          return (
            <>
              {/* Layer 1: Buffer zone polygons (rendered beneath points) */}
              {bufferFeatures.features.length > 0 && (
                <GeoJSON
                  key={`buffers-${JSON.stringify(suitabilityData.metadata)}`}
                  data={bufferFeatures}
                  style={(feature) => {
                    const score = feature?.properties?.suitability_score || 0
                    const color = scoreColor(score)
                    const hasOverlap = (feature?.properties?.overlaps || []).length > 0
                    return {
                      fillColor:   color,
                      fillOpacity: feature?.properties?.is_underserved ? 0.25 : 0.15,
                      color:       hasOverlap ? '#f59e0b' : color,
                      weight:      hasOverlap ? 2 : 1.5,
                      dashArray:   hasOverlap ? '8 4' : '5 4',
                      opacity:     0.7,
                    }
                  }}
                  onEachFeature={(feature, layer) => {
                    const p = feature.properties
                    const schoolInfo = p.schools_in_buffer > 0
                      ? `<span style="color:#dc2626;font-weight:700">${p.schools_in_buffer} school${p.schools_in_buffer > 1 ? 's' : ''} already in zone</span>`
                      : `<span style="color:#16a34a;font-weight:700">✓ Underserved — no existing schools</span>`
                    const nearestInfo = p.nearest_school_name
                      ? `Nearest: ${p.nearest_school_name} (${(p.nearest_school_dist_m / 1000).toFixed(1)} km)`
                      : ''
                    const accessIcons = `${p.road_accessible ? '🛣️ Road' : '⚠️ No road'} · ${p.water_accessible ? '💧 Water' : '⚠️ No water'}`
                    const overlapWarn = (p.overlaps || []).length > 0
                      ? `<div style="color:#f59e0b;font-weight:600;margin-top:4px">⚠ Overlaps with ${p.overlaps.map(o => `Site #${o.with_rank} (${o.overlap_pct}%)`).join(', ')}</div>`
                      : ''

                    layer.bindTooltip(
                      `<div style="font-size:11px;min-width:180px;line-height:1.5">
                        <div style="font-weight:700;font-size:12px;border-bottom:1px solid #e2e8f0;padding-bottom:3px;margin-bottom:4px">${p.name} — ${p.radius_m}m catchment</div>
                        <div>${schoolInfo}</div>
                        <div style="font-size:10px;color:#64748b">${nearestInfo}</div>
                        <div style="font-size:10px;margin-top:2px">${accessIcons}</div>
                        ${overlapWarn}
                      </div>`,
                      { sticky: true, opacity: 0.95 }
                    )
                  }}
                />
              )}

              {/* Layer 2: Site point markers (on top of buffers) */}
              {pointFeatures.features.length > 0 && (
                <GeoJSON
                  key={`points-${JSON.stringify(suitabilityData.metadata)}`}
                  data={pointFeatures}
                  pointToLayer={(feature, latlng) => {
                    const score = feature.properties.suitability_score || 0
                    const color = scoreColor(score)
                    return L.circleMarker(latlng, {
                      radius:      score >= 75 ? 10 : score >= 50 ? 8 : 6,
                      fillColor:   color,
                      color:       '#ffffff',
                      weight:      2,
                      opacity:     1,
                      fillOpacity: 0.95,
                    })
                  }}
                  onEachFeature={(feature, layer) => {
                    const p = feature.properties
                    const color = scoreColor(p.suitability_score)
                    const tier = p.suitability_score >= 75 ? 'High Priority'
                               : p.suitability_score >= 50 ? 'Medium Priority' : 'Lower Priority'
                    layer.bindPopup(`
                      <div style="min-width:180px;padding:4px">
                        <div style="font-weight:700;font-size:13px;margin-bottom:6px;color:#1e293b">${p.name}</div>
                        <div style="background:${color}18;border:1px solid ${color}40;border-radius:8px;padding:6px;margin-bottom:6px">
                          <p style="margin:0;font-size:11px"><strong>Suitability:</strong>
                            <span style="color:${color};font-weight:800;font-size:14px"> ${p.suitability_score}%</span>
                          </p>
                          <p style="margin:2px 0 0;font-size:10px;color:#64748b">${tier}</p>
                        </div>
                        <table style="font-size:10px;width:100%;border-collapse:collapse">
                          <tr><td style="color:#64748b;padding:1px 4px">Road</td><td style="font-weight:600">${p.road_score}/10 &nbsp;(${p.dist_road_m}m)</td></tr>
                          <tr><td style="color:#64748b;padding:1px 4px">Water</td><td style="font-weight:600">${p.water_score}/10 &nbsp;(${p.dist_water_m}m)</td></tr>
                          <tr><td style="color:#64748b;padding:1px 4px">Slope</td><td style="font-weight:600">${p.slope_score}/10 &nbsp;(${p.slope_deg}°)</td></tr>
                        </table>
                        <p style="margin:4px 0 0;font-size:9px;color:#94a3b8;text-align:center">PyLUSAT · EduMap Malawi MIS</p>
                      </div>
                    `)
                  }}
                />
              )}
            </>
          )
        })()}


        {/* Districts */}
        {districts.map(d => {
          const pop = level === 'primary' ? d.p_age_pop :
            level === 'secondary' ? d.s_age_pop : d.t_age_pop
          const inst = level === 'primary' ? d.p_schools :
            level === 'secondary' ? d.s_schools : d.t_institutions
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
                color: colorInfo.color,
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
                  {layerMode === 'need' && <div>Need Score: {score.toFixed(0)} <span style={{ color: colorInfo.color }}>({colorInfo.label})</span></div>}
                  {layerMode === 'suitability' && <div>Avg Suitability: {(100 - score).toFixed(0)} <span style={{ color: colorInfo.color }}>({colorInfo.label})</span></div>}

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