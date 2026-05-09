import { supabase } from '@/lib/supabase';

export interface DBProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  departamento: string | null;
}

export async function getProfiles(currentUser?: { id: string; full_name?: string }) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name', { ascending: true });

  if (error) throw error;
  
  let profiles = data as DBProfile[];

  // Se a lista estiver vazia e tivermos um usuário logado, vamos garantir que ele apareça
  if (currentUser && !profiles.some(p => p.id === currentUser.id)) {
    const userProfile: DBProfile = {
      id: currentUser.id,
      full_name: currentUser.full_name || 'Meu Usuário',
      avatar_url: null,
      departamento: 'Equipe'
    };
    profiles = [userProfile, ...profiles];
  }

  return profiles;
}

export async function updateProfile(id: string, updates: Partial<DBProfile>) {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
}
