import { useEffect, useState } from 'react'

const dist = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const generateMockSites = (districtId, level, existingSchools = []) => {
  const seed = parseInt(districtId, 10) * 20 || 2;
  const count = 4;
  const sites = [];
  const coords = {
    1: [-13.9669, 33.7878], 2: [-15.7861, 34.9976], 3: [-11.4659, 34.0158],
    4: [-15.3833, 35.3167], 5: [-13.0333, 33.4833], 6: [-14.4833, 35.2667],
    7: [-13.7833, 34.4333], 8: [-14.3667, 34.3333]
  };
  const center = coords[districtId] || [-13.9, 33.7];

  for (let i = 0; i < count; i++) {
    const lat = center[0] + (Math.cos(i * 2.1) * 0.2);
    const lng = center[1] + (Math.sin(i * 2.1) * 0.2);
    
    let penalty = 0;
    existingSchools.forEach(s => {
      const d = dist(lat, lng, s.lat, s.lng);
      if (d < 5) {
        const weight = s.isUserAdded ? (s.students / 400) : 1;
        penalty += (5 - d) * 10 * weight;
      }
    });

    const baseScore = 95 - (i * 8);
    const finalScore = Math.max(0, Math.min(100, baseScore - penalty));

    sites.push({
      id: seed + i,
      district_id: districtId,
      name: `Proposed ${level.charAt(0).toUpperCase() + level.slice(1)} Site ${i + 1}`,
      lat,
      lng,
      level: level,
      suitability_score: Math.round(finalScore),
      reason: penalty > 20 ? "Low suitability due to nearby facilities." : "High population density, far from existing facilities."
    });
  }
  return sites;
};

// Static default empty array to avoid infinite render loops
const EMPTY_ARRAY = [];

export function useSites(districtId, level, schools = EMPTY_ARRAY) {
  const [sites, setSites] = useState([])
  const [loading, setLoading] = useState(false)

  // Use JSON.stringify for schools to detect actual contents changes if needed, 
  // or just ensure schools reference is stable.
  // Actually, using EMPTY_ARRAY is enough for callers that don't pass anything.
  useEffect(() => {
    if (!districtId) {
      setSites([]);
      return;
    }
    setLoading(true)
    const timeout = setTimeout(() => {
      setSites(generateMockSites(districtId, level, schools))
      setLoading(false)
    }, 400)
    return () => clearTimeout(timeout)
  }, [districtId, level, schools])

  return { sites, loading }
}