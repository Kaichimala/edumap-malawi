import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useSites(districtId, level) {
  const [sites,   setSites]   = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!districtId) return
    setLoading(true)
    async function fetch() {
      const { data } = await supabase
        .from('recommended_sites')
        .select('*')
        .eq('district_id', districtId)
        .eq('level', level)
        .order('suitability_score', { ascending: false })
      setSites(data || [])
      setLoading(false)
    }
    fetch()
  }, [districtId, level])

  return { sites, loading }
}