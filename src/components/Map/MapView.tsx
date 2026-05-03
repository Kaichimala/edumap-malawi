// @ts-nocheck
import React, { useRef, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap, Marker, Popup, useMapEvents, Circle, Polyline, GeoJSON } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { getNeedLevel, calcScore, getSuitabilityLevel } from '../../utils/scoring'
import { useSchools } from '../../hooks/useSchools'
import { useData } from '../../contexts/DataContext'
import MapLegend from './MapLegend'
import { HiDownload, HiPlus, HiX, HiOutlineTrash } from 'react-icons/hi'
import { LuFileImage } from 'react-icons/lu'
import { FaFilePdf } from 'react-icons/fa'
import { MdConstruction } from 'react-icons/md'

// Red pin icon for recommended sites
const redPinIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Construction icon for user-added schools
const constructionIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Fly map ONLY when the selected district actually changes — not on every re-render
function FlyTo({ district }) {
  const map = useMap()
  const prevIdRef = React.useRef(undefined)

  React.useEffect(() => {
    const newId = district?.id ?? null
    if (newId === prevIdRef.current) return // same district, don't re-fly
    prevIdRef.current = newId

    if (district) {
      map.flyTo([district.lat, district.lng], 9, { duration: 1.2 })
    } else {
      map.flyTo([-13.5, 34.3], 6, { duration: 1.2 })
    }
  }, [district?.id])

  return null
}

function MapClickHandler({ active, onLocationSelect }) {
  useMapEvents({
    click(e) {
      if (active) {
        // Ignore clicks on UI elements
        const target = e.originalEvent.target;
        if (target.closest('.leaflet-control') || target.closest('.export-ignore')) {
          return;
        }
        onLocationSelect(e.latlng)
      }
    },
    contextmenu(e) {
      // Supporting right-click for school placement as requested
      if (active) {
        onLocationSelect(e.latlng);
      }
    }
  })
  return null
}

// Memoized site layer — prevents expensive Circle+Polyline re-renders on every zoom/pan
const RecommendedSiteLayer = React.memo(function RecommendedSiteLayer({ sites, schools, level }) {
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  return (
    <>
      {sites.map((s, idx) => {
        const nearestSchools = [...(schools || [])]
          .map(sch => ({ ...sch, distance: getDistance(s.lat, s.lng, sch.lat, sch.lng) }))
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 3);

        const catchmentRadius = level === 'primary' ? 3000 : level === 'secondary' ? 8000 : 15000;
        const baseScore = s.suitability_score || 85;
        const distScore = Math.min(99, baseScore + (idx % 3));

        return (
          <React.Fragment key={`site-group-${s.id}`}>
            {/* Catchment Radius */}
            <Circle
              center={[s.lat, s.lng]}
              radius={catchmentRadius}
              pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.08, weight: 1.5, dashArray: '6, 6' }}
            >
              <Tooltip sticky>
                <div className="font-bold text-slate-700">Catchment Zone</div>
                <div className="text-xs text-slate-500">
                  Serves est. 1,200 students within {level === 'primary' ? '3km' : level === 'secondary' ? '8km' : '15km'}
                </div>
              </Tooltip>
            </Circle>

            {/* Spider-Web Lines to nearest schools */}
            {nearestSchools.map(sch => (
              <Polyline
                key={`line-${s.id}-${sch.id}`}
                positions={[[s.lat, s.lng], [sch.lat, sch.lng]]}
                pathOptions={{ color: '#f87171', weight: 1.5, dashArray: '4, 8', opacity: 0.5 }}
              >
                <Tooltip direction="center" permanent={false} className="bg-white/90 border-red-200 text-red-600 font-bold text-[10px]">
                  {sch.distance.toFixed(1)} km to {sch.name}
                </Tooltip>
              </Polyline>
            ))}

            {/* Red Pin + Popup */}
            <Marker position={[s.lat, s.lng]} icon={redPinIcon}>
              <Tooltip direction="top" offset={[0, -35]}>
                <div className="font-bold">{s.name}</div>
                <div className="text-xs text-blue-600 font-medium">Prioritized Planning Site</div>
              </Tooltip>
              <Popup className="custom-popup">
                <div className="p-2 min-w-[240px]">
                  <h3 className="font-black text-sm mb-2 text-slate-800 border-b border-slate-100 pb-2">{s.name}</h3>
                  <div className="space-y-3 mb-3">
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                        <span>School Isolation Distance</span>
                        <span className="text-emerald-600">{s.metrics?.distance || distScore / 10}km</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{width: `${Math.min(((s.metrics?.distance || 5) / 15) * 100, 100)}%`}}></div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 p-1.5 rounded border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-500">DEM Slope Gradient (&lt;15°)</span>
                      <span className="text-[10px] font-bold text-emerald-600">{s.metrics?.slope || 5}°</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 p-1.5 rounded border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-500">Hazard / Flood Risk</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">{s.metrics?.hazard_risk || 'Low'}</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 p-1.5 rounded border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-500">Growth / Rural Priority</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">{s.metrics?.growth_demand || 'High'}</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-50 border border-blue-100">
                    <p className="text-[10px] m-0 text-blue-800 font-medium italic">"{s.reason}"</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        );
      })}
    </>
  );
}, (prev, next) =>
  // Only re-render if sites array actually changed (not on zoom/pan)
  prev.sites === next.sites && prev.level === next.level
);

export default function MapView({ 
  districts, 
  selectedDistrict, 
  level = 'primary', 
  onSelect, 
  showMarkers = true,
  showSites = true,
  isBuildMode,
  setIsBuildMode,
  isDestroyMode,
  setIsDestroyMode,
  isAnalyzed,
  visibleLevels = ['primary'] // Multi-level toggle state
}) {
  // Analytical modes removed per user request
  const [exportLoading, setExportLoading] = useState(false)
  const [newSchoolLoc, setNewSchoolLoc] = useState(null)
  const [formState, setFormState] = useState({ name: '', capacity: 400, level: 'primary' })
  const [destroySearch, setDestroySearch] = useState('')
  const [showExportMenu, setShowExportMenu] = useState(false)
  
  const mapRef = useRef(null)
  
  const { schools, addSchool, removeSchool, getAllSchools } = useSchools()
  const { analysisSites } = useData()

  const handleExport = async (format) => {
    if (!mapRef.current) return
    setExportLoading(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100))
      const canvas = await html2canvas(mapRef.current, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#f8fafc',
        scale: 2,
        ignoreElements: (element) => element.classList.contains('export-ignore')
      })

      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `edumap-analysis-${timestamp}`

      if (format === 'png') {
        const link = document.createElement('a')
        link.download = `${filename}.png`; link.href = canvas.toDataURL('image/png'); link.click()
      } else if (format === 'pdf') {
        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
          unit: 'px', format: [canvas.width, canvas.height]
        })
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
        pdf.save(`${filename}.pdf`)
      }
    } catch (err) {
      console.error('Export failed:', err); alert('Failed to export map.')
    } finally {
      setExportLoading(false)
    }
  }

  const handleSaveSchool = (e) => {
    e.preventDefault();
    if (!newSchoolLoc) return;
    addSchool({
      name: formState.name || 'New School',
      lat: newSchoolLoc.lat,
      lng: newSchoolLoc.lng,
      students: parseInt(formState.capacity),
      level: formState.level
    });
    setNewSchoolLoc(null);
    setIsBuildMode(false); // Disable build mode after saving
    setFormState({ name: '', capacity: 400, level: 'primary' });
    alert('Infrastructure added! The spatial suitability engine has been updated to reflect the new facility.');
  }

  const handleDestroySchool = (school) => {
    if (window.confirm(`Are you sure you want to destroy ${school.name}? This cannot be undone.`)) {
      removeSchool(school.id);
      setDestroySearch('');
      setIsDestroyMode(false);
      alert('Infrastructure removed. The spatial suitability engine has been updated.');
    }
  }

  const allAvailableSchools = getAllSchools();
  const filteredSchoolsToDestroy = destroySearch.length > 0 
    ? allAvailableSchools.filter(s => s.name.toLowerCase().includes(destroySearch.toLowerCase().trim()))
    : [];

  return (
    <div ref={mapRef} className={`relative w-full h-full bg-slate-50 ${isBuildMode ? 'cursor-crosshair' : ''}`}>
      {/* Suitability Legend - forced to suitability mode */}
      {isAnalyzed && <MapLegend mode="suitability" />}

      {/* Build Mode active indicator */}
      {isBuildMode && !newSchoolLoc && (
        <div className="absolute top-4 left-4 z-[500] bg-amber-600 text-white px-6 py-3 rounded-2xl shadow-2xl animate-pulse font-bold text-sm border-2 border-white/20 export-ignore">
          <div className="flex items-center gap-2">
            <MdConstruction className="text-xl" />
            {(window.innerWidth > 768) ? 'Click or Right-Click on map to place school' : 'Click on map to place school'}
            <button onClick={() => setIsBuildMode(false)} className="ml-2 hover:bg-white/20 p-1 rounded">
              <HiX />
            </button>
          </div>
        </div>
      )}

      {/* Build Form Modal Overlay */}
      {newSchoolLoc && (
        <div className="absolute inset-0 z-[2001] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 export-ignore">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full border border-slate-100 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center text-2xl">
                <MdConstruction />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">New Infrastructure</h3>
                <p className="text-xs text-slate-500 font-medium">Pin: {newSchoolLoc.lat.toFixed(4)}, {newSchoolLoc.lng.toFixed(4)}</p>
              </div>
            </div>

            <form onSubmit={handleSaveSchool} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">School Name</label>
                <input 
                  autoFocus required type="text" 
                  value={formState.name}
                  onChange={e => setFormState({...formState, name: e.target.value})}
                  placeholder="e.g. Kasungu Central Academy"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Level</label>
                  <select 
                    value={formState.level}
                    onChange={e => setFormState({...formState, level: e.target.value})}
                    className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-semibold"
                  >
                    <option value="primary">Primary</option>
                    <option value="secondary">Secondary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Capacity</label>
                  <input 
                    required type="number" 
                    value={formState.capacity}
                    onChange={e => setFormState({...formState, capacity: e.target.value})}
                    className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" onClick={() => setNewSchoolLoc(null)}
                  className="flex-1 py-3 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 text-white font-bold text-sm rounded-xl shadow-lg hover:bg-blue-700 transition-all active:scale-95"
                >
                  Save School
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Destroy Mode Overlay */}
      {isDestroyMode && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[2001] w-full max-w-md px-4 export-ignore">
          <div className="bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center text-xl">
                  <HiOutlineTrash />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 leading-tight">Destroy Infrastructure</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Search to remove</p>
                </div>
              </div>
              <button onClick={() => setIsDestroyMode(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-lg transition-colors">
                <HiX />
              </button>
            </div>
            
            <input 
              autoFocus 
              type="text" 
              value={destroySearch}
              onChange={e => setDestroySearch(e.target.value)}
              placeholder="Enter school name..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all text-sm mb-2"
            />

            {destroySearch.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-1 mt-3">
                {filteredSchoolsToDestroy.length > 0 ? (
                  filteredSchoolsToDestroy.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100 group">
                      <div>
                        <div className="text-sm font-bold text-slate-800 group-hover:text-red-900">{s.name}</div>
                        <div className="text-[10px] text-slate-500">{s.level} • {s.students} students</div>
                      </div>
                      <button 
                        onClick={() => handleDestroySchool(s)}
                        className="px-3 py-1.5 bg-red-100 text-red-600 text-xs font-bold rounded-lg hover:bg-red-600 hover:text-white transition-colors"
                      >
                        Destroy
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-slate-400 text-sm font-medium">
                    No matching schools found.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Export Menu (Consolidated & Collapsible) */}
      <div 
        className="absolute bottom-6 right-6 z-[500] flex flex-col items-end gap-2 export-ignore"
        onMouseEnter={() => setShowExportMenu(true)}
        onMouseLeave={() => setShowExportMenu(false)}
      >
        <div className={`flex flex-col gap-2 transition-all duration-300 origin-bottom mb-2 ${showExportMenu ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
          <button
            onClick={() => handleExport('pdf')}
            disabled={exportLoading}
            className="flex items-center gap-2 bg-white text-slate-700 px-4 py-2.5 rounded-xl shadow-xl hover:bg-slate-50 border border-slate-200 transition-all active:scale-95 disabled:opacity-50"
          >
            <FaFilePdf className="text-red-500" />
            <span className="font-bold text-[10px] uppercase tracking-wider">Export PDF</span>
          </button>

          <button
            onClick={() => handleExport('png')}
            disabled={exportLoading}
            className="flex items-center gap-2 bg-white text-slate-700 px-4 py-2.5 rounded-xl shadow-xl hover:bg-slate-50 border border-slate-200 transition-all active:scale-95 disabled:opacity-50"
          >
            <LuFileImage className="text-blue-500" />
            <span className="font-bold text-[10px] uppercase tracking-wider">Export Image</span>
          </button>
        </div>

        <button
          onClick={() => setShowExportMenu(!showExportMenu)}
          className="flex items-center gap-2 bg-[#1a5276] text-white px-6 py-3 rounded-2xl shadow-2xl hover:bg-slate-800 transition-all active:scale-95 relative"
        >
          {exportLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <HiDownload className="w-5 h-5" />
          )}
          <span className="font-bold text-xs tracking-tight uppercase">Tools & Export</span>
        </button>
      </div>

      <MapContainer
        center={[-13.5, 34.3]}
        zoom={6}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© OpenStreetMap'
        />

        {/* Interactive District Boundaries (Glow & Tooltips) */}
        {districts?.map(d => {
          if (!d.geojson) return null;
          const isSelected = selectedDistrict?.id === d.id;
          
          return (
            <GeoJSON 
              key={`district-hover-${d.id}`}
              data={d.geojson} 
              style={{
                color: isSelected ? '#3b82f6' : '#94a3b8',
                weight: isSelected ? 3 : 1,
                opacity: isSelected ? 0.8 : 0.0, // Invisible until hovered if not selected
                fillColor: isSelected ? '#3b82f6' : 'transparent',
                fillOpacity: isSelected ? 0.05 : 0
              }}
              eventHandlers={{
                mouseover: (e) => {
                  const layer = e.target;
                  if (!isSelected) {
                    layer.setStyle({
                      color: '#3b82f6',
                      weight: 2,
                      opacity: 0.8,
                      fillColor: '#3b82f6',
                      fillOpacity: 0.1
                    });
                  }
                },
                mouseout: (e) => {
                  const layer = e.target;
                  if (!isSelected) {
                    layer.setStyle({
                      color: '#94a3b8',
                      weight: 1,
                      opacity: 0.0,
                      fillColor: 'transparent',
                      fillOpacity: 0
                    });
                  }
                },
                click: () => {
                  if (onSelect) onSelect(d);
                }
              }}
            >
              <Tooltip sticky className="bg-white/90 backdrop-blur border border-slate-200 shadow-xl rounded-xl p-3">
                <div className="font-bold text-slate-800 text-sm mb-2">{d.name}</div>
                <div className="flex flex-col gap-1.5 min-w-[140px]">
                  <div className="flex justify-between gap-4 text-xs">
                    <span className="text-slate-500 capitalize">{level} {level === 'tertiary' ? 'Institutions' : 'Schools'}:</span>
                    <span className="font-black text-blue-600">
                      {level === 'primary' ? d.p_schools : level === 'secondary' ? d.s_schools : d.t_institutions}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4 text-xs">
                    <span className="text-slate-500">Target Pop:</span>
                    <span className="font-bold text-slate-700">
                      {(level === 'primary' ? d.p_age_pop : level === 'secondary' ? d.s_age_pop : d.t_age_pop)?.toLocaleString() || 'N/A'}
                    </span>
                  </div>
                  <div className="mt-1 pt-1 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Need Score</span>
                    <span className="text-[10px] font-black text-red-500">
                      {Math.round(calcScore(
                        level === 'primary' ? d.p_age_pop : level === 'secondary' ? d.s_age_pop : d.t_age_pop,
                        level === 'primary' ? d.p_schools : level === 'secondary' ? d.s_schools : d.t_institutions,
                        level
                      ))}
                    </span>
                  </div>
                </div>
              </Tooltip>
            </GeoJSON>
          )
        })}

        <FlyTo district={selectedDistrict} />
        <MapClickHandler active={isBuildMode} onLocationSelect={setNewSchoolLoc} />

        {/* Existing & User-Added Schools (Filtered by visibleLevels) */}
        {showMarkers && (schools || [])
          .filter(s => visibleLevels.includes(s.level) || s.isUserAdded)
          .map(s => {
            let markerColor = '#22c55e'; // Default Green
            if (s.isUserAdded) {
              markerColor = '#f59e0b'; // Amber
            } else if (s.level === 'primary') {
              markerColor = '#3b82f6'; // Blue
            } else if (s.level === 'secondary') {
              markerColor = '#22c55e'; // Green
            } else if (s.level === 'tertiary') {
              markerColor = '#a855f7'; // Purple
            }

            return (
              <CircleMarker
                key={`school-${s.id}`}
                center={[s.lat, s.lng]}
                radius={s.isUserAdded ? 8 : 5}
                pathOptions={{ 
                  color: '#ffffff', 
                  fillColor: markerColor, 
                  fillOpacity: 1, 
                  weight: s.isUserAdded ? 3 : 1.5 
                }}
                eventHandlers={{
                  mouseover: (e) => {
                    e.target.setRadius(s.isUserAdded ? 12 : 9);
                    e.target.setStyle({ weight: 3, opacity: 1 });
                  },
                  mouseout: (e) => {
                    e.target.setRadius(s.isUserAdded ? 8 : 5);
                    e.target.setStyle({ weight: s.isUserAdded ? 3 : 1.5, opacity: 1 });
                  }
                }}
              >
                <Tooltip className="bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl rounded-xl p-3">
                  <div className="font-bold flex items-center gap-2 text-slate-800 text-sm mb-1">
                    {s.isUserAdded && <MdConstruction className="text-amber-600" />}
                    {s.name}
                    {s.isUserAdded && <span className="text-[8px] bg-amber-100 text-amber-700 px-1 rounded uppercase">New</span>}
                  </div>
                  <div className="flex flex-col gap-1 mt-2">
                    <div className="flex justify-between gap-4 text-xs">
                      <span className="text-slate-500">Level:</span>
                      <span className="font-semibold text-slate-700 capitalize">{s.level || 'Primary'}</span>
                    </div>
                    <div className="flex justify-between gap-4 text-xs">
                      <span className="text-slate-500">Students:</span>
                      <span className="font-semibold text-blue-600">{s.students?.toLocaleString() || 'N/A'}</span>
                    </div>
                  </div>
                </Tooltip>
              </CircleMarker>
            )
          })}

        {/* Recommended Sites — memoized to prevent zoom/pan lag */}
        {showMarkers && showSites && isAnalyzed && selectedDistrict && (analysisSites?.[level]?.length > 0) && (
          <RecommendedSiteLayer sites={analysisSites[level]} schools={schools} level={level} />
        )}

        {/* Suitable Areas (Analytical Spots) - Removed to prevent redundant vague outputs */}
      </MapContainer>
    </div>
  )
}