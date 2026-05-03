import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const STORAGE_KEY = 'edumap_added_schools';
const DELETED_KEY = 'edumap_deleted_schools';

const getAddedSchools = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const saveAddedSchool = (school) => {
  const schools = getAddedSchools();
  schools.push(school);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(schools));
};

const getDeletedSchools = () => {
  const data = localStorage.getItem(DELETED_KEY);
  return data ? JSON.parse(data) : [];
};

const saveDeletedSchool = (id) => {
  const deleted = getDeletedSchools();
  if (!deleted.includes(id)) {
    deleted.push(id);
    localStorage.setItem(DELETED_KEY, JSON.stringify(deleted));
  }
};

export function useSchools(districtId) {
  const [schools, setSchools] = useState([])
  const [allSchools, setAllSchools] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchSupabaseSchools = async (dId) => {
    try {
      // Query the table directly to avoid 500 errors from complex views
      let query = supabase.from('mwi_education_edumap').select('id, name, geometry, district_id');

      if (dId) {
        query = query.eq('district_id', dId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching schools:", error);
        return [];
      }

      // Deduplicate by name and extract coordinates
      const seenNames = new Set();

      return (data || []).map(s => {
        let lat = 0, lng = 0;
        if (s.geometry && typeof s.geometry === 'object') {
          if (s.geometry.coordinates) {
            lng = s.geometry.coordinates[0];
            lat = s.geometry.coordinates[1];
          }
        }

        if (!lat || !lng) return null;

        // 1. Noise Filter: Ignore non-school buildings
        const name = s.name || 'Unknown School';
        const noiseKeywords = ['BUILDING', 'HALL', 'OFFICE', 'STAFF', 'GATE', 'CLINIC', 'HOSTEL', 'HOUSE', 'MESS'];
        if (noiseKeywords.some(k => name.toUpperCase().includes(k))) return null;

        // 2. Level Detection Logic (Improved)
        let level = 'primary';
        let students = 400;
        let displayName = name;
        const upperName = name.toUpperCase();

        const tertiaryKeywords = ['UNIVERSITY', 'COLLEGE', 'FACULTY', 'POLYTECHNIC', 'INSTITUTE', 'TRAINING CENTRE'];
        const secondaryKeywords = ['SECONDARY', 'CDSS', 'HIGH SCHOOL', 'S.S.S', 'S.S'];

        if (s.amenity === 'university' || s.amenity === 'college' || tertiaryKeywords.some(k => upperName.includes(k))) {
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
        } else if (secondaryKeywords.some(k => upperName.includes(k))) {
          level = 'secondary';
          students = 280;
        }

        // Final Deduplication Check (Deeper)
        const uniqueKey = `${displayName}-${level}`;
        if (seenNames.has(uniqueKey)) return null;
        seenNames.add(uniqueKey);

        return {
          ...s,
          name: displayName,
          lat,
          lng,
          level,
          students
        };
      }).filter(Boolean);
    } catch (err) {
      console.error("Unexpected error fetching schools:", err);
      return [];
    }
  };

  const refreshSchools = useCallback(async () => {
    setLoading(true)

    // Fetch district specific schools
    let districtSchoolsData = [];
    if (districtId) {
      districtSchoolsData = await fetchSupabaseSchools(districtId);
    }

    // Fetch all schools for searching/destroy mode
    const allSchoolsData = await fetchSupabaseSchools(null);

    const added = getAddedSchools();
    const deletedIds = getDeletedSchools();

    // Process district schools
    const districtAdded = added.filter(s => String(s.district_id) === String(districtId));
    const finalDistrictSchools = [...districtSchoolsData, ...districtAdded].filter(s => !deletedIds.includes(String(s.id)) && !deletedIds.includes(s.id));

    // Process all schools
    const finalAllSchools = [...allSchoolsData, ...added].filter(s => !deletedIds.includes(String(s.id)) && !deletedIds.includes(s.id));

    setSchools(finalDistrictSchools);
    setAllSchools(finalAllSchools);
    setLoading(false);
  }, [districtId])

  useEffect(() => {
    refreshSchools();
  }, [refreshSchools])

  const addSchool = (newSchool) => {
    const schoolWithId = {
      ...newSchool,
      id: `user-${Date.now()}`,
      district_id: districtId,
      isUserAdded: true
    };
    saveAddedSchool(schoolWithId);
    refreshSchools();
  };

  const removeSchool = (schoolId) => {
    saveDeletedSchool(schoolId);
    refreshSchools();
  };

  // MapView.tsx uses this synchronously, so we return the pre-fetched allSchools state
  const getAllSchools = () => {
    return allSchools;
  };

  return { schools, loading, addSchool, removeSchool, getAllSchools }
}