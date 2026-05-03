import { useMemo } from 'react'
import { useData } from '../contexts/DataContext'

export const useSchools = () => {
  const { 
    schools, 
    districts,
    loading, 
    error, 
    refreshData,
    selectedDistrictId,
    setSelectedDistrictId,
    level,
    setLevel
  } = useData()

  // Filter schools by district locally from the cached list
  const filteredSchools = useMemo(() => {
    const list = schools || [];
    if (!selectedDistrictId) return list;
    return list.filter(s => s && String(s.district_id) === String(selectedDistrictId));
  }, [schools, selectedDistrictId]);

  return {
    schools: filteredSchools,
    allSchools: schools,
    districts,
    loading,
    error,
    selectedDistrictId,
    setSelectedDistrictId,
    level,
    setLevel,
    refreshSchools: refreshData,
    // Add back missing functions to prevent MapView crashes
    getAllSchools: () => schools || [],
    addSchool: (s) => console.log("Add school:", s), // Placeholder for now
    removeSchool: (id) => console.log("Remove school:", id) // Placeholder for now
  }
}