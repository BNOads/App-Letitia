import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  const { data: users, error: authError } = await supabase.auth.signInWithPassword({
    email: 'contato@mariliacouto.com.br', // an example email from the image
    password: 'test'
  });
  
  console.log('auth:', authError ? authError.message : 'success')
  
  // just try to update a specific profile via admin key if we had it, but we only have anon.
}

test()
