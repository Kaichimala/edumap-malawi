import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * useAuth — returns the current Supabase user and a loading flag.
 * Subscribes to onAuthStateChange so the UI reacts immediately to
 * login / logout events without a page refresh.
 */
export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get the session that was persisted from a previous visit
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for future sign-in / sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}
