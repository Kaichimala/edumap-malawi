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
      let query = supabase.from('app_schools').select('*');
      if (dId) {
        query = query.eq('district_id', dId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching schools from Supabase:", error);
        return [];
      }
      
      return data || [];
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