import { useEffect, useState } from 'react'

const DEFAULT_WEIGHTS = {
  road_weight:        0.5,
  river_weight:       0.5,
  population_weight:  0.5,
  slope_weight:       0.5,
}

export function useSites(districtId, level, weights = DEFAULT_WEIGHTS) {
  const [sites, setSites]   = useState([])
  const [metadata, setMetadata] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)

  useEffect(() => {
    if (!districtId) {
      setSites([])
      setMetadata(null)
      return
    }

    let cancelled = false

    Promise.resolve().then(() => {
      if (!cancelled) setLoading(true)
    })

    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/analyze-suitability`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        district_id: Number(districtId),
        level,
        ...weights,
      }),
    })
      .then(res => {
        if (!res.ok) throw new Error(`Analysis failed: ${res.statusText}`)
        return res.json()
      })
      .then(data => {
        if (cancelled) return
        // Extract only point features (not buffer polygons)
        const points = (data.features || [])
          .filter(f => f.properties?.feature_type === 'point' || !f.properties?.feature_type)
          .map((f, i) => {
            const p = f.properties
            const [lng, lat] = f.geometry.coordinates
            return {
              id:               p.name ?? `Site ${i + 1}`,
              rank:             i + 1,
              lat,
              lng,
              suitability_score: p.suitability_score,
              road_score:        p.road_score,
              water_score:       p.water_score,
              slope_score:       p.slope_score,
              dist_road_m:       p.dist_road_m,
              dist_water_m:      p.dist_water_m,
              slope_deg:         p.slope_deg,
              district:          p.district,
              level,
            }
          })
        setSites(points)
        setMetadata(data.metadata || null)
        setError(null)
      })
      .catch(err => {
        if (!cancelled) {
          console.error('useSites fetch failed:', err)
          setError(err.message)
          setSites([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
      setSites([])
      setMetadata(null)
    }
  }, [districtId, level])      // intentionally excludes weights to avoid re-running on slider drag

  return { sites, metadata, loading, error }
}