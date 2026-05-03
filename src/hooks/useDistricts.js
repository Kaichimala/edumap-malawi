import { useData } from '../contexts/DataContext'

export const useDistricts = () => {
  const { 
    districts, 
    loading, 
    error, 
    refreshData,
    selectedDistrictId,
    setSelectedDistrictId,
    level,
    setLevel
  } = useData()

  return { 
    districts: (districts || [])
        .map(d => ({
            ...d,
            lat: Number(d.lat),
            lng: Number(d.lng)
        }))
        .filter(d => !isNaN(d.lat) && !isNaN(d.lng) && d.lat !== 0 && d.lng !== 0), 
    loading, 
    error, 
    refreshDistricts: refreshData,
    selectedDistrictId,
    setSelectedDistrictId,
    level,
    setLevel
  }
}