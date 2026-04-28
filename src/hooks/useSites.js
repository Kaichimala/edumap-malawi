import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Keep the distance calculation for fallback/offline scenarios
const dist = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Static default empty array to avoid infinite render loops
const EMPTY_ARRAY = [];

export function useSites(districtId, level, schools = EMPTY_ARRAY) {
  const [sites, setSites] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!districtId) {
      setSites([]);
      return;
    }

    const fetchSites = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('sites')
          .select('*')
          .eq('district_id', districtId)
          // Also optionally filter by level if your schema supports it
          // .eq('level', level);

        if (error) {
          console.error("Error fetching sites from Supabase:", error);
          setSites([]);
          return;
        }

        const mappedSites = (data || []).map(s => ({
          ...s,
          lat: Number(s.lat),
          lng: Number(s.lng),
          level: s.level || level,
          suitability_score: Number(s.suitability_score || s.score || 85)
        })).filter(s => !isNaN(s.lat) && !isNaN(s.lng));

        const filteredSites = mappedSites.filter(s => s.level.toLowerCase() === level.toLowerCase());
        setSites(filteredSites);

      } catch (err) {
        console.error("Unexpected error fetching sites:", err);
        setSites([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSites();
  }, [districtId, level, schools])

  return { sites, loading }
}