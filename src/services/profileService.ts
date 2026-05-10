import { supabase } from '@/lib/supabase';

export interface DBProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  metadata: any;
  updated_at: string;
}

export async function getProfile(id: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as DBProfile;
}

export async function getProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name', { ascending: true });

  if (error) throw error;
  return data as DBProfile[];
}

export async function updateProfile(id: string, updates: Partial<DBProfile>) {
  const { error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;

  // Sync with Auth Metadata if full_name is provided
  if (updates.full_name) {
    await supabase.auth.updateUser({
      data: { full_name: updates.full_name }
    });
  }
}

export async function uploadAvatar(userId: string, file: File) {
  const fileExt = file.name.split('.').pop();
  const filePath = `${userId}/avatar.${fileExt}`;

  // Upload the file to the 'avatars' bucket
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  // Get the public URL with a timestamp to avoid caching issues
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);
  
  const publicUrlWithCacheBuster = `${publicUrl}?t=${new Date().getTime()}`;

  // 1. Update the profiles table
  await updateProfile(userId, { avatar_url: publicUrlWithCacheBuster });

  // 2. Update the auth metadata so it reflects in the entire app immediately
  const { error: authError } = await supabase.auth.updateUser({
    data: { avatar_url: publicUrlWithCacheBuster }
  });

  if (authError) console.error("Erro ao atualizar metadados de auth:", authError);
  
  return publicUrlWithCacheBuster;
}

export async function changePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });
  
  if (error) throw error;
}
