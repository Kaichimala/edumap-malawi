import { useEffect, useState } from 'react'

const generateMockSites = (districtId, level) => {
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
    sites.push({
      id: seed + i,
      district_id: districtId,
      name: `Proposed ${level.charAt(0).toUpperCase() + level.slice(1)} Site ${i + 1}`,
      lat: center[0] + (Math.cos(i * 2.1) * 0.2),
      lng: center[1] + (Math.sin(i * 2.1) * 0.2),
      level: level,
      suitability_score: 95 - (i * 8),
      reason: "High population density, far from existing facilities."
    });
  }
  return sites;
};

export function useSites(districtId, level) {
  const [sites, setSites] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!districtId) {
      setSites([]);
      return;
    }
    setLoading(true)
    const timeout = setTimeout(() => {
      setSites(generateMockSites(districtId, level))
      setLoading(false)
    }, 400)
    return () => clearTimeout(timeout)
  }, [districtId, level])

  return { sites, loading }
}