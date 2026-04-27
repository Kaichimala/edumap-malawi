import { useState } from 'react';

export function useSuitability() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSuitability = async (criteria) => {
    // criteria must include district_id plus weight fields
    if (!criteria.district_id) {
      console.warn('useSuitability: no district_id provided');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/analyze-suitability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(criteria),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearData = () => setData(null);

  return { data, loading, error, fetchSuitability, clearData };
}
