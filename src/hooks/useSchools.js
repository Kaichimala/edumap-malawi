import { useEffect, useState } from 'react'

const generateMockSchools = (districtId) => {
  const seed = parseInt(districtId, 10) * 10 || 1;
  const count = 15;
  const schools = [];
  const coords = {
    1: [-13.9669, 33.7878], 2: [-15.7861, 34.9976], 3: [-11.4659, 34.0158],
    4: [-15.3833, 35.3167], 5: [-13.0333, 33.4833], 6: [-14.4833, 35.2667],
    7: [-13.7833, 34.4333], 8: [-14.3667, 34.3333]
  };
  const center = coords[districtId] || [-13.9, 33.7];

  for (let i = 0; i < count; i++) {
    schools.push({
      id: seed + i,
      district_id: districtId,
      name: `School ${seed + i}`,
      lat: center[0] + (Math.sin(i * 1.5) * 0.15),
      lng: center[1] + (Math.cos(i * 1.5) * 0.15),
      level: i % 2 === 0 ? 'primary' : 'secondary',
      students: 200 + (Math.abs(Math.sin(i)) * 500)
    });
  }
  return schools;
};

export function useSchools(districtId) {
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!districtId) {
      setSchools([]);
      return;
    }
    setLoading(true)
    const timeout = setTimeout(() => {
      setSchools(generateMockSchools(districtId))
      setLoading(false)
    }, 400)
    return () => clearTimeout(timeout)
  }, [districtId])

  return { schools, loading }
}