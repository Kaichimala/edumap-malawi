import { useMemo } from 'react'
import { useData } from '../contexts/DataContext'

export const useSites = () => {
  const { 
    sites, 
    districts,
    loading, 
    error, 
    selectedDistrictId, 
    setSelectedDistrictId,
    level,
    setLevel,
    runSpatialAnalysis
  } = useData()

  const filteredSites = useMemo(() => {
    const list = sites || [];
    // Filter by district and level
    return list.filter(s => {
      const matchDistrict = !selectedDistrictId || String(s.district_id) === String(selectedDistrictId);
      const matchLevel = !level || s.level?.toLowerCase() === level?.toLowerCase();
      return matchDistrict && matchLevel;
    });
  }, [sites, selectedDistrictId, level]);

  return {
    sites: filteredSites,
    allSites: sites,
    districts,
    loading,
    error,
    selectedDistrictId,
    setSelectedDistrictId,
    level,
    setLevel,
    runSpatialAnalysis
  }
}