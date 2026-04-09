import { useState, useEffect } from 'react'

// Temporary hardcoded data until Supabase is seeded
const MOCK_DISTRICTS = [
    { id: 1,  name: 'Lilongwe',      lat: -13.9669, lng: 33.7878, p_age_pop: 320000, p_schools: 180, s_age_pop: 140000, s_schools: 60, t_age_pop: 80000, t_institutions: 8 },
    { id: 2,  name: 'Blantyre',      lat: -15.7861, lng: 34.9976, p_age_pop: 290000, p_schools: 160, s_age_pop: 120000, s_schools: 55, t_age_pop: 70000, t_institutions: 10 },
    { id: 3,  name: 'Mzuzu',         lat: -11.4659, lng: 34.0158, p_age_pop: 110000, p_schools: 70,  s_age_pop: 50000,  s_schools: 22, t_age_pop: 30000, t_institutions: 4 },
    { id: 4,  name: 'Zomba',         lat: -15.3833, lng: 35.3167, p_age_pop: 130000, p_schools: 80,  s_age_pop: 55000,  s_schools: 25, t_age_pop: 35000, t_institutions: 5 },
    { id: 5,  name: 'Kasungu',       lat: -13.0333, lng: 33.4833, p_age_pop: 150000, p_schools: 75,  s_age_pop: 60000,  s_schools: 20, t_age_pop: 25000, t_institutions: 2 },
    { id: 6,  name: 'Mangochi',      lat: -14.4833, lng: 35.2667, p_age_pop: 170000, p_schools: 85,  s_age_pop: 65000,  s_schools: 22, t_age_pop: 28000, t_institutions: 2 },
    { id: 7,  name: 'Salima',        lat: -13.7833, lng: 34.4333, p_age_pop: 120000, p_schools: 60,  s_age_pop: 48000,  s_schools: 18, t_age_pop: 20000, t_institutions: 1 },
    { id: 8,  name: 'Dedza',         lat: -14.3667, lng: 34.3333, p_age_pop: 140000, p_schools: 68,  s_age_pop: 52000,  s_schools: 19, t_age_pop: 22000, t_institutions: 2 },
    { id: 9,  name: 'Machinga',      lat: -15.1667, lng: 35.5000, p_age_pop: 125000, p_schools: 55,  s_age_pop: 45000,  s_schools: 15, t_age_pop: 15000, t_institutions: 1 },
    { id: 10, name: 'Chikwawa',      lat: -16.0333, lng: 34.8000, p_age_pop: 115000, p_schools: 50,  s_age_pop: 42000,  s_schools: 12, t_age_pop: 12000, t_institutions: 1 },
    { id: 11, name: 'Thyolo',        lat: -16.0667, lng: 35.1333, p_age_pop: 145000, p_schools: 72,  s_age_pop: 58000,  s_schools: 24, t_age_pop: 24000, t_institutions: 2 },
    { id: 12, name: 'Mulanje',       lat: -16.0333, lng: 35.5000, p_age_pop: 135000, p_schools: 65,  s_age_pop: 50000,  s_schools: 18, t_age_pop: 20000, t_institutions: 1 },
    { id: 13, name: 'Nsanje',        lat: -16.9167, lng: 35.2667, p_age_pop: 95000,  p_schools: 40,  s_age_pop: 35000,  s_schools: 10, t_age_pop: 8000,  t_institutions: 0 },
    { id: 14, name: 'Mwanza',        lat: -15.6167, lng: 34.5167, p_age_pop: 45000,  p_schools: 25,  s_age_pop: 18000,  s_schools: 8,  t_age_pop: 5000,  t_institutions: 0 },
    { id: 15, name: 'Balaka',        lat: -14.9833, lng: 34.9500, p_age_pop: 105000, p_schools: 52,  s_age_pop: 40000,  s_schools: 14, t_age_pop: 18000, t_institutions: 1 },
    { id: 16, name: 'Ncheu',         lat: -14.8167, lng: 34.6333, p_age_pop: 118000, p_schools: 58,  s_age_pop: 46000,  s_schools: 16, t_age_pop: 20000, t_institutions: 1 },
    { id: 17, name: 'Mchinji',       lat: -13.8000, lng: 32.9000, p_age_pop: 128000, p_schools: 60,  s_age_pop: 52000,  s_schools: 18, t_age_pop: 22000, t_institutions: 1 },
    { id: 18, name: 'Dowa',          lat: -13.6500, lng: 33.9333, p_age_pop: 155000, p_schools: 78,  s_age_pop: 62000,  s_schools: 22, t_age_pop: 26000, t_institutions: 1 },
    { id: 19, name: 'Ntchisi',       lat: -13.3667, lng: 33.9167, p_age_pop: 85000,  p_schools: 42,  s_age_pop: 32000,  s_schools: 12, t_age_pop: 10000, t_institutions: 0 },
    { id: 20, name: 'Nkhotakota',    lat: -12.9167, lng: 34.3000, p_age_pop: 112000, p_schools: 54,  s_age_pop: 44000,  s_schools: 15, t_age_pop: 18000, t_institutions: 1 },
    { id: 21, name: 'Nkhata Bay',    lat: -11.6000, lng: 34.3000, p_age_pop: 92000,  p_schools: 48,  s_age_pop: 38000,  s_schools: 14, t_age_pop: 16000, t_institutions: 1 },
    { id: 22, name: 'Rumphi',        lat: -11.0167, lng: 33.8667, p_age_pop: 78000,  p_schools: 45,  s_age_pop: 30000,  s_schools: 12, t_age_pop: 12000, t_institutions: 1 },
    { id: 23, name: 'Karonga',       lat: -9.9333,  lng: 33.9333, p_age_pop: 108000, p_schools: 56,  s_age_pop: 45000,  s_schools: 18, t_age_pop: 18000, t_institutions: 2 },
    { id: 24, name: 'Chitipa',       lat: -9.7000,  lng: 33.2667, p_age_pop: 82000,  p_schools: 42,  s_age_pop: 34000,  s_schools: 12, t_age_pop: 10000, t_institutions: 0 },
    { id: 25, name: 'Neno',          lat: -15.4000, lng: 34.6500, p_age_pop: 38000,  p_schools: 20,  s_age_pop: 15000,  s_schools: 6,  t_age_pop: 4000,  t_institutions: 0 },
    { id: 26, name: 'Likoma',        lat: -12.0667, lng: 34.7333, p_age_pop: 12000,  p_schools: 8,   s_age_pop: 5000,   s_schools: 2,  t_age_pop: 2000,  t_institutions: 0 },
    { id: 27, name: 'Phalombe',      lat: -15.8333, lng: 35.6500, p_age_pop: 102000, p_schools: 48,  s_age_pop: 42000,  s_schools: 14, t_age_pop: 14000, t_institutions: 0 },
    { id: 28, name: 'Chiradzulu',    lat: -15.6833, lng: 35.1833, p_age_pop: 98000,  p_schools: 45,  s_age_pop: 38000,  s_schools: 12, t_age_pop: 12000, t_institutions: 0 },
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