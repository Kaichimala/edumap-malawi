import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useDistricts() {
  const [districts, setDistricts] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)

  useEffect(() => {
    async function fetch() {
      const { data, error } = await supabase
        .from('districts')
        .select('*')
        .order('name')

      if (error) setError(error)
      else       setDistricts(data)
      setLoading(false)
    }
    fetch()
  }, [])

  return { districts, loading, error }
}