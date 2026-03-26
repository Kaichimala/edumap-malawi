import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Guard: if env vars are missing, create a dummy client so the app still renders
const url = supabaseUrl || 'https://placeholder.supabase.co'
const key = supabaseKey || 'placeholder-anon-key'

export const supabase = createClient(url, key)
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)