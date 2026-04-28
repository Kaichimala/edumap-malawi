import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useDistricts() {
    const [districts, setDistricts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchDistricts = async () => {
            setLoading(true);
            try {
                const { data, error: sbError } = await supabase
                    .from('app_districts')
                    .select('*');

                if (sbError) throw sbError;

                const safeDistricts = (data || [])
                    .map(d => ({
                        ...d,
                        lat: Number(d.lat),
                        lng: Number(d.lng)
                    }))
                    .filter(d => !isNaN(d.lat) && !isNaN(d.lng) && d.lat !== 0 && d.lng !== 0);

                setDistricts(safeDistricts);
            } catch (err) {
                console.error("Error fetching districts:", err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDistricts();
    }, [])

    return { districts, loading, error }
}