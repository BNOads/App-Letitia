import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// A chave VITE_SUPABASE_PUBLISHABLE_KEY está sendo usada como anon key baseada no .env
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltam variáveis de ambiente do Supabase (URL e/ou ANON KEY). Verifique seu arquivo .env.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
