import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTables() {
  // We can't directly list tables with anon key usually, 
  // but we can try to query some common schema info or just check if certain tables exist.
  const tablesToCheck = [
    'mwi_schools_with_districts',
    'api_schools_for_app',
    'mwi_schools_shp',
    'datasets'
  ]

  for (const table of tablesToCheck) {
    const { data, error } = await supabase.from(table).select('*').limit(1)
    if (error) {
      console.log(`Table ${table}: Error or not found (${error.message})`)
    } else {
      console.log(`Table ${table}: Found`)
    }
  }
}

checkTables()
