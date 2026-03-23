import { useState, useEffect } from 'react'

// Temporary hardcoded data until Supabase is seeded
const MOCK_DISTRICTS = [
    { id: 1, name: 'Lilongwe', lat: -13.9669, lng: 33.7878, p_age_pop: 320000, p_schools: 180, s_age_pop: 140000, s_schools: 60, t_age_pop: 80000, t_institutions: 8 },
    { id: 2, name: 'Blantyre', lat: -15.7861, lng: 34.9976, p_age_pop: 290000, p_schools: 160, s_age_pop: 120000, s_schools: 55, t_age_pop: 70000, t_institutions: 10 },
    { id: 3, name: 'Mzuzu', lat: -11.4659, lng: 34.0158, p_age_pop: 110000, p_schools: 70, s_age_pop: 50000, s_schools: 22, t_age_pop: 30000, t_institutions: 4 },
    { id: 4, name: 'Zomba', lat: -15.3833, lng: 35.3167, p_age_pop: 130000, p_schools: 80, s_age_pop: 55000, s_schools: 25, t_age_pop: 35000, t_institutions: 5 },
    { id: 5, name: 'Kasungu', lat: -13.0333, lng: 33.4833, p_age_pop: 150000, p_schools: 75, s_age_pop: 60000, s_schools: 20, t_age_pop: 25000, t_institutions: 2 },
    { id: 6, name: 'Mangochi', lat: -14.4833, lng: 35.2667, p_age_pop: 170000, p_schools: 85, s_age_pop: 65000, s_schools: 22, t_age_pop: 28000, t_institutions: 2 },
    { id: 7, name: 'Salima', lat: -13.7833, lng: 34.4333, p_age_pop: 120000, p_schools: 60, s_age_pop: 48000, s_schools: 18, t_age_pop: 20000, t_institutions: 1 },
    { id: 8, name: 'Dedza', lat: -14.3667, lng: 34.3333, p_age_pop: 140000, p_schools: 68, s_age_pop: 52000, s_schools: 19, t_age_pop: 22000, t_institutions: 2 },
]

export function useDistricts() {
    const [districts, setDistricts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        // Swap this for real Supabase fetch once DB is seeded
        setTimeout(() => {
            setDistricts(MOCK_DISTRICTS)
            setLoading(false)
        }, 500)
    }, [])

    return { districts, loading, error }
}