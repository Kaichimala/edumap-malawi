import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useSchools(districtId) {
  const [schools,  setSchools]  = useState([])
  const [loading,  setLoading]  = useState(false)

  useEffect(() => {
    if (!districtId) return
    setLoading(true)
    async function fetch() {
      const { data } = await supabase
        .from('schools')
        .select('*')
        .eq('district_id', districtId)
      setSchools(data || [])
      setLoading(false)
    }
    fetch()
  }, [districtId])

  return { schools, loading }
}