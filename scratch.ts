import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://example.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'dummy'
)

// we can't easily run it since env vars might not be available
