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

                setDistricts(data || []);
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