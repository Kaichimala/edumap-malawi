import { useEffect, useState, useCallback } from 'react'

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

const generateMockSchools = (districtId) => {
  const seed = parseInt(districtId, 10) * 10 || 1;
  const count = 15;
  const schools = [];
  const coords = {
    1: [-13.9669, 33.7878], 2: [-15.7861, 34.9976], 3: [-11.4659, 34.0158],
    4: [-15.3833, 35.3167], 5: [-13.0333, 33.4833], 6: [-14.4833, 35.2667],
    7: [-13.7833, 34.4333], 8: [-14.3667, 34.3333]
  };
  const center = coords[districtId] || [-13.9, 33.7];

  for (let i = 0; i < count; i++) {
    schools.push({
      id: seed + i,
      district_id: districtId,
      name: `School ${seed + i}`,
      lat: center[0] + (Math.sin(i * 1.5) * 0.15),
      lng: center[1] + (Math.cos(i * 1.5) * 0.15),
      level: i % 2 === 0 ? 'primary' : 'secondary',
      students: 200 + (Math.abs(Math.sin(i)) * 500)
    });
  }
  return schools;
};

export function useSchools(districtId) {
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(false)

  const refreshSchools = useCallback(() => {
    if (!districtId) {
      setSchools([]);
      return;
    }
    setLoading(true)
    const timeout = setTimeout(() => {
      const mock = generateMockSchools(districtId);
      const added = getAddedSchools().filter(s => String(s.district_id) === String(districtId));
      
      const deletedIds = getDeletedSchools();
      const allSchools = [...mock, ...added].filter(s => !deletedIds.includes(String(s.id)) && !deletedIds.includes(s.id));
      
      setSchools(allSchools);
      setLoading(false)
    }, 400)
    return () => clearTimeout(timeout)
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

  const getAllSchools = () => {
    let all = [];
    for (let i = 1; i <= 8; i++) {
      all = [...all, ...generateMockSchools(i)];
    }
    const added = getAddedSchools();
    const deletedIds = getDeletedSchools();
    
    return [...all, ...added].filter(s => !deletedIds.includes(String(s.id)) && !deletedIds.includes(s.id));
  };

  return { schools, loading, addSchool, removeSchool, getAllSchools }
}