import { useEffect, useState } from 'react'

export function useSchools(districtId) {
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Skip fetch when no district is selected; cleanup clears previous results
    if (!districtId) return

    let cancelled = false

    // Defer the loading flag to avoid a synchronous setState inside an effect
    Promise.resolve().then(() => {
      if (!cancelled) setLoading(true)
    })

    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/schools/${districtId}`)
      .then(res => res.json())
      .then(data => {
        if (!cancelled) setSchools(Array.isArray(data) ? data : [])
      })
      .catch(err => {
        console.error('Failed to fetch schools:', err)
        if (!cancelled) setSchools([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    // Cleanup: cancel stale response and clear list when district changes
    return () => {
      cancelled = true
      setSchools([])
    }
  }, [districtId])

  return { schools, loading }
}