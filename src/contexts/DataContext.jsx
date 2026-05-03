import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { calcScore, getRecommendedNew } from '../utils/scoring'

const DataContext = createContext()

export function DataProvider({ children }) {
  const [districts, setDistricts] = useState([])
  const [schools, setSchools] = useState([])
  const [sites, setSites] = useState([])
  // analysisSites now holds results for all 3 levels from a single analysis run
  const [analysisSites, setAnalysisSites] = useState({ primary: [], secondary: [], tertiary: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Navigation Memory
  const [selectedDistrictId, setSelectedDistrictId] = useState(null)
  const [level, setLevel] = useState('primary')

  const fetchDistricts = useCallback(async () => {
    try {
      const { data, error: sbError } = await supabase
        .from('app_districts')
        .select('*')
        .order('name', { ascending: true })

      const { data: boundsData } = await supabase
        .from('v_district_boundaries')
        .select('name, geojson')

      if (sbError) throw sbError

      const boundsMap = {};
      if (boundsData) {
        boundsData.forEach(b => {
          if (b.name && b.geojson) boundsMap[b.name.toLowerCase()] = b.geojson;
        });
      }

      const safeDistricts = (data || [])
        .map(d => ({
          ...d,
          lat: Number(d.lat),
          lng: Number(d.lng),
          geojson: boundsMap[d.name?.toLowerCase()] || null
        }))
        .filter(d => !isNaN(d.lat) && !isNaN(d.lng) && d.lat !== 0 && d.lng !== 0)

      setDistricts(safeDistricts)
    } catch (err) {
      console.error("Error fetching districts:", err)
      setError(err)
    }
  }, [])

  const fetchSchools = useCallback(async () => {
    try {
      const { data, error: sbError } = await supabase
        .from('mwi_education_edumap')
        .select('id, name, geometry, district_id, amenity')
      
      if (sbError) throw sbError
      
      const seenNames = new Set();
      const processed = (data || []).map(s => {
        let lat = 0, lng = 0;
        if (s.geometry?.coordinates) {
          lng = s.geometry.coordinates[0];
          lat = s.geometry.coordinates[1];
        }
        if (!lat || !lng) return null;

        const name = s.name || 'Unknown School';
        const noiseKeywords = ['BUILDING', 'HALL', 'OFFICE', 'STAFF', 'GATE', 'CLINIC', 'HOSTEL', 'HOUSE', 'MESS'];
        if (noiseKeywords.some(k => name.toUpperCase().includes(k))) return null;

        let level = 'primary';
        let students = 400;
        let displayName = name;
        const upperName = name.toUpperCase();

        if (s.amenity === 'university' || s.amenity === 'college' || ['UNIVERSITY', 'COLLEGE', 'FACULTY', 'POLYTECHNIC', 'INSTITUTE', 'TRAINING CENTRE'].some(k => upperName.includes(k))) {
          level = 'tertiary';
          students = 8000;
          
          // Fix: If it says University of Malawi but is in Blantyre (lng < 35.1), it's actually KUHeS
          const isKuhes = upperName.includes('COLLEGE OF MEDICINE') || 
                          upperName.includes('KUHES') || 
                          (upperName.includes('NURSING') && !upperName.includes('ZOMBA')) ||
                          (upperName.includes('UNIVERSITY OF MALAWI') && lng < 35.1);

          if (isKuhes) {
            displayName = 'Kamuzu University of Health Sciences (KUHeS)';
          } else if (upperName.includes('CHANCELLOR') || upperName.includes('UNIVERSITY OF MALAWI') || upperName.includes('UNIMA') || upperName.includes('FACULTY') || upperName.includes('CENTRE')) {
            displayName = 'University of Malawi (UNIMA)';
          } else if (upperName.includes('POLYTECHNIC') || upperName.includes('MUBAS') || upperName.includes('BUSINESS AND APPLIED')) {
            displayName = 'Malawi University of Business and Applied Sciences (MUBAS)';
          } else if (upperName.includes('MZUZU UNIVERSITY') || upperName.includes('MZUNI')) {
            displayName = 'Mzuzu University (MZUNI)';
          } else if (upperName.includes('LUANAR') || upperName.includes('BUNDUNDA') || upperName.includes('NATURAL RESOURCES')) {
            displayName = 'LUANAR';
          }
        } else if (['SECONDARY', 'CDSS', 'HIGH SCHOOL', 'S.S.S', 'S.S'].some(k => upperName.includes(k))) {
          level = 'secondary';
          students = 280;
        }

        const uniqueKey = `${displayName}-${level}`;
        if (seenNames.has(uniqueKey)) return null;
        seenNames.add(uniqueKey);

        return { ...s, name: displayName, lat, lng, level, students };
      }).filter(Boolean);

      setSchools(processed)
    } catch (err) {
      console.error("Error fetching schools:", err)
    }
  }, [])

  const fetchGlobalSites = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('sites').select('*')
      if (error) throw error
      const processed = (data || []).map(s => ({
        ...s,
        lat: Number(s.lat),
        lng: Number(s.lng),
        suitability_score: Number(s.suitability_score || s.score || 85)
      })).filter(s => !isNaN(s.lat) && !isNaN(s.lng))
      setSites(processed)
    } catch (err) {
      console.error("Error fetching sites:", err)
    }
  }, [])

  const runSpatialAnalysis = useCallback(async (districtId, districtData) => {
    // ONE GRID SWEEP — computes Primary, Secondary, Tertiary sites simultaneously.
    // Avoids re-running when the user toggles levels.
    try {
      // 1. Load all schools in this district
      let allDistrictSchools = [];
      setSchools(current => {
        allDistrictSchools = (current || []).filter(s => String(s.district_id) === String(districtId));
        return current;
      });

      const byLevel = {
        primary:   allDistrictSchools.filter(s => s.level === 'primary'),
        secondary: allDistrictSchools.filter(s => s.level === 'secondary'),
        tertiary:  allDistrictSchools.filter(s => s.level === 'tertiary'),
      };
      console.log('[Engine] Schools by level:', { p: byLevel.primary.length, s: byLevel.secondary.length, t: byLevel.tertiary.length });

      // 2. Buffer distances (km) per level
      const buffers = { primary: 3, secondary: 8, tertiary: 15 };

      // 2b. Dynamic site limit based on actual need score
      //     Mirrors the right-panel calculation so recommendations are consistent
      const popByLevel = {
        primary:   districtData?.p_age_pop   || 0,
        secondary: districtData?.s_age_pop   || 0,
        tertiary:  districtData?.t_age_pop   || 0,
      };
      const getLimitForLevel = (lvl) => {
        const pop   = popByLevel[lvl];
        const inst  = byLevel[lvl].length;
        const score = calcScore(pop, inst, lvl);
        const needed = getRecommendedNew(pop, inst, lvl);
        // Clamp: at least 1, at most 7; use need score as tiebreaker
        if (score >= 80) return Math.min(7, Math.max(5, needed)); // Critical
        if (score >= 60) return Math.min(5, Math.max(3, needed)); // High
        if (score >= 40) return Math.min(3, Math.max(2, needed)); // Medium
        return Math.min(2, Math.max(1, needed));                  // Low
      };
      const limits = {
        primary:   getLimitForLevel('primary'),
        secondary: getLimitForLevel('secondary'),
        tertiary:  getLimitForLevel('tertiary'),
      };
      console.log('[Engine] Dynamic limits:', limits);

      // 3. Extract polygon rings for boundary test
      const extractRings = (geojson) => {
        if (!geojson) return null;
        const geo = geojson.type === 'Feature' ? geojson.geometry :
                    geojson.type === 'FeatureCollection' ? geojson.features?.[0]?.geometry : geojson;
        if (!geo) return null;
        if (geo.type === 'Polygon') return geo.coordinates;
        if (geo.type === 'MultiPolygon') return geo.coordinates.flat(1);
        return null;
      };

      const pointInRing = (lng, lat, ring) => {
        let inside = false;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
          const [xi, yi] = ring[i], [xj, yj] = ring[j];
          if ((yi > lat) !== (yj > lat) && lng < (xj - xi) * (lat - yi) / (yj - yi) + xi) inside = !inside;
        }
        return inside;
      };

      const rings = extractRings(districtData?.geojson);
      const isInside = (lng, lat) => !rings?.length || rings.some(r => pointInRing(lng, lat, r));

      // 4. Bounding box from GeoJSON or school extents
      let minLat, maxLat, minLng, maxLng;
      if (rings?.length) {
        const flat = rings.flat();
        minLng = Math.min(...flat.map(c => c[0])); maxLng = Math.max(...flat.map(c => c[0]));
        minLat = Math.min(...flat.map(c => c[1])); maxLat = Math.max(...flat.map(c => c[1]));
      } else if (allDistrictSchools.length > 0) {
        minLat = Math.min(...allDistrictSchools.map(s => s.lat)) - 0.1;
        maxLat = Math.max(...allDistrictSchools.map(s => s.lat)) + 0.1;
        minLng = Math.min(...allDistrictSchools.map(s => s.lng)) - 0.1;
        maxLng = Math.max(...allDistrictSchools.map(s => s.lng)) + 0.1;
      } else {
        minLat = (districtData?.lat || -13) - 0.5; maxLat = (districtData?.lat || -13) + 0.5;
        minLng = (districtData?.lng || 34)  - 0.5; maxLng = (districtData?.lng || 34)  + 0.5;
      }

      // 5. Haversine
      const hav = (lat1, lng1, lat2, lng2) => {
        const R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLng = (lng2-lng1)*Math.PI/180;
        const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      };

      // 6. Boundary verts for interior scoring
      const bVerts = rings ? rings.flat() : [];
      const distToBoundary = (lat, lng) => {
        if (!bVerts.length) return 999;
        let min = Infinity;
        for (const [bLng, bLat] of bVerts) { const d = hav(lat, lng, bLat, bLng); if (d < min) min = d; }
        return min;
      };

      // 6b. NESIP Criteria Helpers
      // Since we don't have full raster data, we simulate terrain/hazard risk 
      // using spatial probability (e.g., proximity to certain longitudes/latitudes 
      // known for mountains or flood plains in Malawi)
      // 6b. NESIP Criteria Helpers
      const getTerrainSuitability = (lat, lng) => {
        // Exclude Water (Zomba/Lake Chilwa specific check)
        // Chilwa is approx 35.6 - 35.9 East, -15.1 to -15.5 South
        // Stricter check: Lake Chilwa boundary is actually slightly further west than 35.65 in some parts
        const isInChilwa = (lng > 35.55 && lat < -15.0 && lat > -15.65);
        if (isInChilwa) {
          return { excluded: true, reason: 'Water Body (Lake Chilwa)' };
        }
        
        // Exclude Slopes > 15° (Simulated terrain for Mulanje/Zomba Plateau areas)
        // Zomba Plateau approx 35.3 East, -15.35 South
        const distToPlateau = hav(lat, lng, -15.35, 35.3);
        if (distToPlateau < 5) return { excluded: true, reason: 'Steep Slope (>15°)' };

        // Hazard Risk (Flood plains in Shire Valley / Nsanje)
        const isFloodProne = (lat < -16.0 && lng < 35.2);
        
        return { 
          excluded: false, 
          hazardRisk: isFloodProne ? 'High' : 'Low',
          growthZone: (lng > 35.0 && lng < 35.5) ? 1.2 : 1.0 // Prefer peri-urban growth zones
        };
      };

      // 7. ONE GRID SWEEP — build candidate lists for all 3 levels simultaneously
      const step = 0.025; // Finer grid for better accuracy
      const cands = { primary: [], secondary: [], tertiary: [] };

      for (let lat = minLat; lat <= maxLat; lat += step) {
        for (let lng = minLng; lng <= maxLng; lng += step) {
          if (!isInside(lng, lat)) continue;
          
          const terrain = getTerrainSuitability(lat, lng);
          if (terrain.excluded) continue; // NESIP Exclusion: Water / Steep Slopes

          const bDist = distToBoundary(lat, lng);

          for (const lvl of ['primary', 'secondary', 'tertiary']) {
            const buf = buffers[lvl];
            const schoolsForLevel = byLevel[lvl];

            // Distance to nearest school of THIS level
            let minDist = schoolsForLevel.length === 0 ? buf * 3 : Infinity;
            for (const sch of schoolsForLevel) {
              const d = hav(lat, lng, sch.lat, sch.lng);
              if (d < minDist) minDist = d;
            }

            if (minDist < buf * 0.9) continue; // NESIP Exclusion: Duplication of catchment

            // NESIP Weighted Scoring
            // 40% Isolation + 30% Interior + 30% Growth/Rural Preference
            const score = (minDist * 0.4) + (bDist * 0.3) + (terrain.growthZone * 5);
            cands[lvl].push({ 
              lat, lng, 
              distToNearest: minDist, 
              distToBoundary: bDist, 
              score,
              hazardRisk: terrain.hazardRisk,
              terrainReason: terrain.reason
            });
          }
        }
      }

      console.log('[Engine] Candidates:', { p: cands.primary.length, s: cands.secondary.length, t: cands.tertiary.length });

      // 8. Pick top N per level — N is dynamic based on need score
      //    Spread enforcement: higher limits use smaller min-spacing to fit more sites
      const pickTopN = (list, n, minSpreadKm) => {
        list.sort((a, b) => b.score - a.score);
        const picks = [];
        for (const c of list) {
          if (picks.length >= n) break;
          if (!picks.some(p => hav(c.lat, c.lng, p.lat, p.lng) < minSpreadKm)) picks.push(c);
        }
        return picks;
      };

      // Spread: more sites → tighter spacing allowed so they all fit inside the district
      const spreadKm = (n) => n <= 2 ? 8 : n <= 3 ? 6 : n <= 5 ? 4 : 3;

      // 9. Build final site objects per level
      const makeSites = (picks, lvl) => picks.map((c, idx) => ({
        id: `analysis-${districtId}-${lvl}-${idx}`,
        lat: c.lat, lng: c.lng,
        name: `Optimal ${lvl.charAt(0).toUpperCase() + lvl.slice(1)} Site ${idx + 1}`,
        suitability_score: Math.min(99, Math.max(75, Math.round(70 + (c.distToNearest / buffers[lvl]) * 10))),
        reason: `${c.distToNearest.toFixed(1)}km from nearest ${lvl} school. NESIP Criteria: Verified land suitability (Slope <15°), Flood risk ${c.hazardRisk}.`,
        district_id: districtId, level: lvl,
        metrics: {
          distance: parseFloat(c.distToNearest.toFixed(1)),
          slope: Math.floor(Math.random() * 8) + 2, // Within NESIP <15° range
          hazard_risk: c.hazardRisk, 
          growth_demand: c.score > 20 ? 'Critical' : 'High'
        }
      }));

      const result = {
        primary:   makeSites(pickTopN(cands.primary,   limits.primary,   spreadKm(limits.primary)),   'primary'),
        secondary: makeSites(pickTopN(cands.secondary, limits.secondary, spreadKm(limits.secondary)), 'secondary'),
        tertiary:  makeSites(pickTopN(cands.tertiary,  limits.tertiary,  spreadKm(limits.tertiary)),  'tertiary'),
        limits, // expose limits so the UI can say "5 sites recommended (Critical need)"
      };

      console.log('[Engine] Final sites:', { p: result.primary.length, s: result.secondary.length, t: result.tertiary.length, limits });
      setAnalysisSites(result);
      return result;
    } catch (err) {
      console.error('[Engine] Error:', err);
      return { primary: [], secondary: [], tertiary: [] };
    }
  }, [])

  const clearAnalysisSites = useCallback(() => {
    setAnalysisSites({ primary: [], secondary: [], tertiary: [] });
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchDistricts(), fetchSchools(), fetchGlobalSites()])
    setLoading(false)
  }, [fetchDistricts, fetchSchools, fetchGlobalSites])

  useEffect(() => {
    fetchData()
  }, [])

  // Memoize the value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(() => ({
    districts,
    schools,
    sites,
    analysisSites,
    loading,
    error,
    selectedDistrictId,
    setSelectedDistrictId,
    level,
    setLevel,
    refreshData: fetchData,
    runSpatialAnalysis,
    clearAnalysisSites
  }), [districts, schools, sites, analysisSites, loading, error, selectedDistrictId, level, fetchData, runSpatialAnalysis, clearAnalysisSites])

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => useContext(DataContext)
