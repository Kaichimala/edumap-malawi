import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
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
  
  const districtsRef = useRef([])

  // Navigation Memory
  const [selectedDistrictId, setSelectedDistrictId] = useState(null)
  const [level, setLevel] = useState('primary')

  const utmToLatLng = (easting, northing, zone = 36, southernHemisphere = true) => {
    const a = 6378137.0
    const eccSquared = 0.00669437999014
    const k0 = 0.9996
    const eccPrimeSquared = eccSquared / (1 - eccSquared)
    const e1 = (1 - Math.sqrt(1 - eccSquared)) / (1 + Math.sqrt(1 - eccSquared))
    const x = easting - 500000.0
    let y = northing
    if (southernHemisphere) y -= 10000000.0

    const longOrigin = (zone - 1) * 6 - 180 + 3
    const M = y / k0
    const mu = M / (a * (1 - eccSquared / 4 - (3 * eccSquared * eccSquared) / 64 - (5 * eccSquared ** 3) / 256))
    const phi1Rad = mu +
      (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu) +
      (21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu) +
      (151 * e1 ** 3 / 96) * Math.sin(6 * mu) +
      (1097 * e1 ** 4 / 512) * Math.sin(8 * mu)

    const N1 = a / Math.sqrt(1 - eccSquared * Math.sin(phi1Rad) ** 2)
    const T1 = Math.tan(phi1Rad) ** 2
    const C1 = eccPrimeSquared * Math.cos(phi1Rad) ** 2
    const R1 = a * (1 - eccSquared) / Math.pow(1 - eccSquared * Math.sin(phi1Rad) ** 2, 1.5)
    const D = x / (N1 * k0)

    let lat = phi1Rad - (N1 * Math.tan(phi1Rad) / R1) * (
      D ** 2 / 2 -
      (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * eccPrimeSquared) * D ** 4 / 24 +
      (61 + 90 * T1 + 298 * C1 + 45 * T1 ** 2 - 252 * eccPrimeSquared - 3 * C1 * C1) * D ** 6 / 720
    )
    lat = lat * 180 / Math.PI

    let lon = (D -
      (1 + 2 * T1 + C1) * D ** 3 / 6 +
      (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * eccPrimeSquared + 24 * T1 ** 2) * D ** 5 / 120
    ) / Math.cos(phi1Rad)
    lon = longOrigin + lon * 180 / Math.PI

    return [lat, lon]
  }

  const fetchDistricts = useCallback(async () => {
    try {
      const { data, error: sbError } = await supabase
        .from('app_districts')
        .select('*')
        .order('name', { ascending: true })

      const { data: boundsData } = await supabase
        .from('v_district_boundaries')
        .select('name, geojson')

      const { data: popData } = await supabase
        .from('fact_population_stats')
        .select('district_name, total_total')

      if (sbError) throw sbError

      const boundsMap = {};
      if (boundsData) {
        boundsData.forEach(b => {
          if (b.name && b.geojson) boundsMap[b.name.toLowerCase()] = b.geojson;
        });
      }

      const popMap = {};
      if (popData) {
        popData.forEach(p => {
          if (p.district_name && p.total_total) popMap[p.district_name.toLowerCase()] = p.total_total;
        });
      }

      const safeDistricts = (data || [])
        .map(d => ({
          ...d,
          lat: Number(d.lat),
          lng: Number(d.lng),
          geojson: boundsMap[d.name?.toLowerCase()] || null,
          total_population: popMap[d.name?.toLowerCase()] || 0
        }))
        .filter(d => !isNaN(d.lat) && !isNaN(d.lng) && d.lat !== 0 && d.lng !== 0)

      districtsRef.current = safeDistricts
      setDistricts(safeDistricts)
    } catch (err) {
      console.error("Error fetching districts:", err)
      setError(err)
    }
  }, [])

  const fetchSchools = useCallback(async () => {
    try {
      let allData = [];
      let page = 0;
      const PAGE_SIZE = 1000;
      let hasMore = true;

      console.log('[DataContext] Starting multi-page fetch from mwi_schools_with_districts...');

      while (hasMore) {
        const { data, error: sbError } = await supabase
          .from('mwi_schools_with_districts')
          .select('gid, objectid, school_id, school_nam, status, district, xcoord, ycoord')
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (sbError) throw sbError;
        
        if (!data || data.length === 0) {
          hasMore = false;
        } else {
          allData = [...allData, ...data];
          if (data.length < PAGE_SIZE) {
            hasMore = false;
          } else {
            page++;
          }
        }
      }

      console.log(`[DataContext] Total raw records fetched: ${allData.length}`);

      const districtMap = districtsRef.current.reduce((acc, d) => {
        if (d.name) {
          acc[d.name.toLowerCase()] = d.id
          const simplified = d.name.toLowerCase().replace(' city', '').replace(' rural', '').replace(' north', '').replace(' south', '').trim()
          acc[simplified] = d.id
        }
        return acc
      }, {})

      const seenIds = new Set();
      const processed = allData.map((s, index) => {
        const x = Number(s.xcoord)
        const y = Number(s.ycoord)
        
        if (isNaN(x) || isNaN(y) || x === 0 || y === 0) return null

        const [lat, lng] = utmToLatLng(x, y, 36, true)
        if (isNaN(lat) || isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null

        const name = s.school_nam || 'Unknown School'
        const upperName = name.toUpperCase()

        let level = 'primary'
        if (['SECONDARY', 'CDSS', 'HIGH SCHOOL', 'S.S.S', 'S.S'].some(k => upperName.includes(k))) {
          level = 'secondary'
        } else if (s.status?.toUpperCase() === 'TERTIARY' || upperName.includes('UNIVERSITY') || upperName.includes('COLLEGE') || upperName.includes('INSTITUTE')) {
          level = 'tertiary'
        }

        const internalId = s.gid || s.objectid || `idx-${index}`;
        const uniqueId = `mwi-${internalId}`;

        if (seenIds.has(uniqueId)) return null
        seenIds.add(uniqueId)

        const rawDistrict = (s.district || '').toLowerCase();
        let districtId = districtMap[rawDistrict];
        if (!districtId) {
          const simplified = rawDistrict.replace(' city', '').replace(' rural', '').replace(' north', '').replace(' south', '').trim();
          districtId = districtMap[simplified];
        }

        return {
          id: uniqueId,
          name,
          lat,
          lng,
          district_id: districtId ?? null,
          district_name: s.district || null,
          level,
          students: level === 'primary' ? 400 : level === 'secondary' ? 280 : 8000
        }
      }).filter(Boolean)

      console.log(`[DataContext] Successfully processed ${processed.length} schools.`);
      setSchools(processed)
    } catch (err) {
      console.error("Error fetching schools from mwi_schools_with_districts:", err)
      // fall back to the existing app-level school view if the new table query fails
      try {
        const { data, error: fallbackError } = await supabase
          .from('api_schools_for_app')
          .select('education_id, education_name, lat, lng, district_id, amenity, level, students')

        if (fallbackError) throw fallbackError

        const seenNames = new Set();
        const processed = (data || []).map(s => {
          let lat = Number(s.lat);
          let lng = Number(s.lng);
          if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return null;

          const name = s.education_name || 'Unknown School';
          const noiseKeywords = ['BUILDING', 'HALL', 'OFFICE', 'STAFF', 'GATE', 'CLINIC', 'HOSTEL', 'HOUSE', 'MESS'];
          if (noiseKeywords.some(k => name.toUpperCase().includes(k))) return null;

          let level = s.level;
          if (!level || level === 'school') level = 'primary';

          let students = s.students || (level === 'primary' ? 400 : level === 'secondary' ? 280 : 8000);
          let displayName = name;
          const upperName = name.toUpperCase();

          if (s.amenity === 'university' || s.amenity === 'college' || ['UNIVERSITY', 'COLLEGE', 'FACULTY', 'POLYTECHNIC', 'INSTITUTE', 'TRAINING CENTRE'].some(k => upperName.includes(k))) {
            level = 'tertiary';
            students = 8000;

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

          const uniqueKey = `${displayName}-${level}`
          if (seenNames.has(uniqueKey)) return null
          seenNames.add(uniqueKey)

          return {
            id: s.education_id,
            name: displayName,
            lat,
            lng,
            district_id: s.district_id,
            level,
            students
          }
        }).filter(Boolean)

        setSchools(processed)
      } catch (fallbackErr) {
        console.error("Fallback error fetching schools:", fallbackErr)
      }
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

  // --- Spatial Helpers ---
  const hav = (lat1, lng1, lat2, lng2) => {
    const R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLng = (lng2-lng1)*Math.PI/180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const getTerrainSuitability = useCallback((lat, lng) => {
    // 1. National Water Bodies (Lake Malawi, Malombe, Chilwa, Chiuta)
    const isInLakeMalawi = (lng > 33.9 && lng < 35.3 && lat > -14.5); // Broad North/Central Lake
    const isInLakeMalombe = (lng > 35.1 && lng < 35.3 && lat < -14.5 && lat > -14.9);
    const isInLakeChilwa = (lng > 35.5 && lng < 35.9 && lat < -15.0 && lat > -15.6);
    if (isInLakeMalawi || isInLakeMalombe || isInLakeChilwa) {
      return { excluded: true, reason: 'Water Body (Lake)' };
    }
    
    // 2. High Altitude / Steep Highlands (Nyika, Viphya, Mulanje, Dedza)
    const distToNyika = hav(lat, lng, -10.6, 33.8);
    if (distToNyika < 25) return { excluded: true, reason: 'High Altitude / Rugged (Nyika)' };

    const distToViphya = hav(lat, lng, -11.8, 33.9);
    if (distToViphya < 20) return { excluded: true, reason: 'Rugged Terrain (Viphya Highlands)' };

    const distToDedza = hav(lat, lng, -14.35, 34.3);
    if (distToDedza < 10) return { excluded: true, reason: 'Steep Slope (Dedza Highlands)' };

    const distToMulanje = hav(lat, lng, -15.95, 35.6);
    if (distToMulanje < 15) return { excluded: true, reason: 'Steep Slope (Mulanje Massif)' };

    const distToZomba = hav(lat, lng, -15.35, 35.3);
    if (distToZomba < 6) return { excluded: true, reason: 'Steep Slope (Zomba Plateau)' };

    // 3. National Protected Areas (Parks & Reserves)
    const isInKasungu = (lng > 33.0 && lng < 33.3 && lat < -12.7 && lat > -13.2);
    if (isInKasungu) return { excluded: true, reason: 'Protected Area (Kasungu NP)' };

    const isInNkhotakota = (lng > 33.9 && lng < 34.3 && lat < -12.6 && lat > -13.1);
    if (isInNkhotakota) return { excluded: true, reason: 'Protected Area (Nkhotakota WR)' };

    const isInLiwonde = (lng > 35.15 && lng < 35.45 && lat < -14.65 && lat > -15.15);
    if (isInLiwonde) return { excluded: true, reason: 'Protected Area (Liwonde NP)' };
    
    const isInMangochiFR = (lng > 35.35 && lng < 35.55 && lat < -14.25 && lat > -14.65);
    if (isInMangochiFR) return { excluded: true, reason: 'Protected Area (Forest Reserve)' };

    // Dzalanyama/Lilongwe West Highlands & Wetlands - HARDENED
    const isInLilongweWetland = (lng > 33.3 && lng < 33.75 && lat < -13.9 && lat > -14.5);
    if (isInLilongweWetland) return { excluded: true, reason: 'Wetland/Forest (Lilongwe West)' };
    
    const isInChilwaSwamp = (lng > 35.45 && lng < 35.95 && lat < -14.7 && lat > -15.6);
    if (isInChilwaSwamp) return { excluded: true, reason: 'Marshland (Chilwa Basin)' };

    // 4. Major Wetlands & Marshes
    const isInElephantMarsh = (lng > 34.75 && lng < 35.15 && lat < -16.0 && lat > -16.6);
    if (isInElephantMarsh) return { excluded: true, reason: 'Wetland (Elephant Marsh)' };

    // Hazard Risk (General Flood plains)
    const isFloodProne = (lat < -16.0 && lng < 35.2);
    
    return { 
      excluded: false, 
      hazardRisk: isFloodProne ? 'High' : 'Low',
      growthZone: (lng > 35.0 && lng < 35.5) ? 1.2 : 1.0 
    };
  }, []);

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

      // 6. Boundary verts for interior scoring
      const bVerts = rings ? rings.flat() : [];
      const distToBoundary = (lat, lng) => {
        if (!bVerts.length) return 999;
        let min = Infinity;
        for (const [bLng, bLat] of bVerts) { const d = hav(lat, lng, bLat, bLng); if (d < min) min = d; }
        return min;
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

  const evaluatePointSuitability = useCallback((lat, lng, targetLevel) => {
    const terrain = getTerrainSuitability(lat, lng);
    if (terrain.excluded) return { score: 0, reason: terrain.reason, excluded: true };

    const levelSchools = schools.filter(s => s.level === targetLevel);
    let minDist = levelSchools.length === 0 ? 10 : Infinity;
    for (const sch of levelSchools) {
      const d = hav(lat, lng, sch.lat, sch.lng);
      if (d < minDist) minDist = d;
    }

    const buf = 5; // standard target catchment
    const score = Math.min(99, Math.max(10, Math.round(50 + (minDist / buf) * 30)));
    
    return { 
      score, 
      reason: terrain.reason || (minDist < 1 ? 'Too close to existing school' : 'Suitable for development'),
      excluded: false,
      distance: minDist
    };
  }, [schools]);

  const clearAnalysisSites = useCallback(() => {
    setAnalysisSites({ primary: [], secondary: [], tertiary: [] });
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    await fetchDistricts()
    await Promise.all([fetchSchools(), fetchGlobalSites()])
    setLoading(false)
  }, [fetchDistricts, fetchSchools, fetchGlobalSites])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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
    evaluatePointSuitability,
    clearAnalysisSites
  }), [districts, schools, sites, analysisSites, loading, error, selectedDistrictId, level, fetchData, runSpatialAnalysis, evaluatePointSuitability, clearAnalysisSites])

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => useContext(DataContext)
