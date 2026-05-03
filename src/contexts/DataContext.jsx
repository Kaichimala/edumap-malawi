import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'

const DataContext = createContext()

export function DataProvider({ children }) {
  const [districts, setDistricts] = useState([])
  const [schools, setSchools] = useState([])
  const [sites, setSites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Navigation Memory
  const [selectedDistrictId, setSelectedDistrictId] = useState(null)
  const [level, setLevel] = useState('primary')

  const fetchDistricts = useCallback(async () => {
    try {
      const { data, error: sbError } = await supabase
        .from('app_districts')
        .select('*')
        .order('name', { ascending: true })

      if (sbError) throw sbError

      const safeDistricts = (data || [])
        .map(d => ({
          ...d,
          lat: Number(d.lat),
          lng: Number(d.lng)
        }))
        .filter(d => !isNaN(d.lat) && !isNaN(d.lng) && d.lat !== 0 && d.lng !== 0)

      setDistricts(safeDistricts)
    } catch (err) {
      console.error("Error fetching districts:", err)
      setError(err)
    }
  }, [])

  const fetchSchools = useCallback(async () => {
    try {
      const { data, error: sbError } = await supabase
        .from('mwi_education_edumap')
        .select('id, name, geometry, district_id, amenity')
      
      if (sbError) throw sbError
      
      const seenNames = new Set();
      const processed = (data || []).map(s => {
        let lat = 0, lng = 0;
        if (s.geometry?.coordinates) {
          lng = s.geometry.coordinates[0];
          lat = s.geometry.coordinates[1];
        }
        if (!lat || !lng) return null;

        const name = s.name || 'Unknown School';
        const noiseKeywords = ['BUILDING', 'HALL', 'OFFICE', 'STAFF', 'GATE', 'CLINIC', 'HOSTEL', 'HOUSE', 'MESS'];
        if (noiseKeywords.some(k => name.toUpperCase().includes(k))) return null;

        let level = 'primary';
        let students = 400;
        let displayName = name;
        const upperName = name.toUpperCase();

        if (s.amenity === 'university' || s.amenity === 'college' || ['UNIVERSITY', 'COLLEGE', 'FACULTY', 'POLYTECHNIC', 'INSTITUTE', 'TRAINING CENTRE'].some(k => upperName.includes(k))) {
          level = 'tertiary';
          students = 8000;
          
          // Fix: If it says University of Malawi but is in Blantyre (lng < 35.1), it's actually KUHeS
          const isKuhes = upperName.includes('COLLEGE OF MEDICINE') || 
                          upperName.includes('KUHES') || 
                          (upperName.includes('NURSING') && !upperName.includes('ZOMBA')) ||
                          (upperName.includes('UNIVERSITY OF MALAWI') && lng < 35.1);

          if (isKuhes) {
            displayName = 'Kamuzu University of Health Sciences (KUHeS)';
          } else if (upperName.includes('CHANCELLOR') || upperName.includes('UNIVERSITY OF MALAWI') || upperName.includes('UNIMA') || upperName.includes('FACULTY') || upperName.includes('CENTRE')) {
            displayName = 'University of Malawi (UNIMA)';
          } else if (upperName.includes('POLYTECHNIC') || upperName.includes('MUBAS') || upperName.includes('BUSINESS AND APPLIED')) {
            displayName = 'Malawi University of Business and Applied Sciences (MUBAS)';
          } else if (upperName.includes('MZUZU UNIVERSITY') || upperName.includes('MZUNI')) {
            displayName = 'Mzuzu University (MZUNI)';
          } else if (upperName.includes('LUANAR') || upperName.includes('BUNDUNDA') || upperName.includes('NATURAL RESOURCES')) {
            displayName = 'LUANAR';
          }
        } else if (['SECONDARY', 'CDSS', 'HIGH SCHOOL', 'S.S.S', 'S.S'].some(k => upperName.includes(k))) {
          level = 'secondary';
          students = 280;
        }

        const uniqueKey = `${displayName}-${level}`;
        if (seenNames.has(uniqueKey)) return null;
        seenNames.add(uniqueKey);

        return { ...s, name: displayName, lat, lng, level, students };
      }).filter(Boolean);

      setSchools(processed)
    } catch (err) {
      console.error("Error fetching schools:", err)
    }
  }, [])

  const fetchGlobalSites = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('sites').select('*')
      if (error) throw error
      const processed = (data || []).map(s => ({
        ...s,
        lat: Number(s.lat),
        lng: Number(s.lng),
        suitability_score: Number(s.suitability_score || s.score || 85)
      })).filter(s => !isNaN(s.lat) && !isNaN(s.lng))
      setSites(processed)
    } catch (err) {
      console.error("Error fetching sites:", err)
    }
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchDistricts(), fetchSchools(), fetchGlobalSites()])
    setLoading(false)
  }, [fetchDistricts, fetchSchools, fetchGlobalSites])

  useEffect(() => {
    fetchData()
  }, [])

  // Memoize the value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(() => ({
    districts,
    schools,
    sites,
    loading,
    error,
    selectedDistrictId,
    setSelectedDistrictId,
    level,
    setLevel,
    refreshData: fetchData
  }), [districts, schools, sites, loading, error, selectedDistrictId, level, fetchData])

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => useContext(DataContext)
