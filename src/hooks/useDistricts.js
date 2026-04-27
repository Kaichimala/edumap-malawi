import { useState, useEffect } from 'react'

// Population/school-count supplement — sourced from MoE census estimates.
// These will be replaced by a Supabase DB call once the table is seeded.
const DISTRICT_STATS = {
  'Lilongwe':    { p_age_pop: 320000, p_schools: 180, s_age_pop: 140000, s_schools: 60,  t_age_pop: 80000,  t_institutions: 8  },
  'Blantyre':    { p_age_pop: 290000, p_schools: 160, s_age_pop: 120000, s_schools: 55,  t_age_pop: 70000,  t_institutions: 10 },
  'Mzuzu':       { p_age_pop: 110000, p_schools: 70,  s_age_pop: 50000,  s_schools: 22,  t_age_pop: 30000,  t_institutions: 4  },
  'Zomba':       { p_age_pop: 130000, p_schools: 80,  s_age_pop: 55000,  s_schools: 25,  t_age_pop: 35000,  t_institutions: 5  },
  'Kasungu':     { p_age_pop: 150000, p_schools: 75,  s_age_pop: 60000,  s_schools: 20,  t_age_pop: 25000,  t_institutions: 2  },
  'Mangochi':    { p_age_pop: 170000, p_schools: 85,  s_age_pop: 65000,  s_schools: 22,  t_age_pop: 28000,  t_institutions: 2  },
  'Salima':      { p_age_pop: 120000, p_schools: 60,  s_age_pop: 48000,  s_schools: 18,  t_age_pop: 20000,  t_institutions: 1  },
  'Dedza':       { p_age_pop: 140000, p_schools: 68,  s_age_pop: 52000,  s_schools: 19,  t_age_pop: 22000,  t_institutions: 2  },
  'Machinga':    { p_age_pop: 125000, p_schools: 55,  s_age_pop: 45000,  s_schools: 15,  t_age_pop: 15000,  t_institutions: 1  },
  'Chikwawa':    { p_age_pop: 115000, p_schools: 50,  s_age_pop: 42000,  s_schools: 12,  t_age_pop: 12000,  t_institutions: 1  },
  'Thyolo':      { p_age_pop: 145000, p_schools: 72,  s_age_pop: 58000,  s_schools: 24,  t_age_pop: 24000,  t_institutions: 2  },
  'Mulanje':     { p_age_pop: 135000, p_schools: 65,  s_age_pop: 50000,  s_schools: 18,  t_age_pop: 20000,  t_institutions: 1  },
  'Nsanje':      { p_age_pop: 95000,  p_schools: 40,  s_age_pop: 35000,  s_schools: 10,  t_age_pop: 8000,   t_institutions: 0  },
  'Mwanza':      { p_age_pop: 45000,  p_schools: 25,  s_age_pop: 18000,  s_schools: 8,   t_age_pop: 5000,   t_institutions: 0  },
  'Balaka':      { p_age_pop: 105000, p_schools: 52,  s_age_pop: 40000,  s_schools: 14,  t_age_pop: 18000,  t_institutions: 1  },
  'Ncheu':       { p_age_pop: 118000, p_schools: 58,  s_age_pop: 46000,  s_schools: 16,  t_age_pop: 20000,  t_institutions: 1  },
  'Mchinji':     { p_age_pop: 128000, p_schools: 60,  s_age_pop: 52000,  s_schools: 18,  t_age_pop: 22000,  t_institutions: 1  },
  'Dowa':        { p_age_pop: 155000, p_schools: 78,  s_age_pop: 62000,  s_schools: 22,  t_age_pop: 26000,  t_institutions: 1  },
  'Ntchisi':     { p_age_pop: 85000,  p_schools: 42,  s_age_pop: 32000,  s_schools: 12,  t_age_pop: 10000,  t_institutions: 0  },
  'Nkhotakota':  { p_age_pop: 112000, p_schools: 54,  s_age_pop: 44000,  s_schools: 15,  t_age_pop: 18000,  t_institutions: 1  },
  'Nkhata Bay':  { p_age_pop: 92000,  p_schools: 48,  s_age_pop: 38000,  s_schools: 14,  t_age_pop: 16000,  t_institutions: 1  },
  'Rumphi':      { p_age_pop: 78000,  p_schools: 45,  s_age_pop: 30000,  s_schools: 12,  t_age_pop: 12000,  t_institutions: 1  },
  'Karonga':     { p_age_pop: 108000, p_schools: 56,  s_age_pop: 45000,  s_schools: 18,  t_age_pop: 18000,  t_institutions: 2  },
  'Chitipa':     { p_age_pop: 82000,  p_schools: 42,  s_age_pop: 34000,  s_schools: 12,  t_age_pop: 10000,  t_institutions: 0  },
  'Neno':        { p_age_pop: 38000,  p_schools: 20,  s_age_pop: 15000,  s_schools: 6,   t_age_pop: 4000,   t_institutions: 0  },
  'Likoma':      { p_age_pop: 12000,  p_schools: 8,   s_age_pop: 5000,   s_schools: 2,   t_age_pop: 2000,   t_institutions: 0  },
  'Phalombe':    { p_age_pop: 102000, p_schools: 48,  s_age_pop: 42000,  s_schools: 14,  t_age_pop: 14000,  t_institutions: 0  },
  'Chiradzulu':  { p_age_pop: 98000,  p_schools: 45,  s_age_pop: 38000,  s_schools: 12,  t_age_pop: 12000,  t_institutions: 0  },
}

export function useDistricts() {
  const [districts, setDistricts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/districts`)
      .then(res => res.json())
      .then(data => {
        // Merge real geo data from backend with local population stats
        const merged = data.map(d => ({
          ...d,
          ...(DISTRICT_STATS[d.name] || {
            p_age_pop: 0, p_schools: 0,
            s_age_pop: 0, s_schools: 0,
            t_age_pop: 0, t_institutions: 0,
          }),
        }))
        setDistricts(merged)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch districts:', err)
        setError('Could not load districts from backend')
        setLoading(false)
      })
  }, [])

  return { districts, loading, error }
}