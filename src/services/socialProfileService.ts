import { supabase } from '@/lib/supabase';

export interface SocialProfile {
  id: string;
  nome: string;
  cor: string;
  avatar_url: string | null;
  created_at: string;
}

export async function getSocialProfiles(): Promise<SocialProfile[]> {
  const { data, error } = await supabase
    .from('perfis_sociais')
    .select('*')
    .order('nome', { ascending: true });

  if (error) throw error;
  return data as SocialProfile[];
}

export async function createSocialProfile(profile: { nome: string; cor: string; avatar_url?: string }): Promise<SocialProfile> {
  const { data, error } = await supabase
    .from('perfis_sociais')
    .insert(profile)
    .select()
    .single();

  if (error) throw error;
  return data as SocialProfile;
}

export async function updateSocialProfile(id: string, updates: Partial<SocialProfile>): Promise<void> {
  const { error } = await supabase
    .from('perfis_sociais')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteSocialProfile(id: string): Promise<void> {
  const { error } = await supabase
    .from('perfis_sociais')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function uploadSocialAvatar(profileId: string, file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const filePath = `social-profiles/${profileId}/avatar.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  const urlWithCacheBuster = `${publicUrl}?t=${new Date().getTime()}`;

  // Update the profile with the new avatar URL
  await updateSocialProfile(profileId, { avatar_url: urlWithCacheBuster });

  return urlWithCacheBuster;
}
