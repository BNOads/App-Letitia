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
  // Tenta usar RPC que bypassa RLS para ver TODOS os perfis
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_all_profiles');
  
  if (!rpcError && rpcData) {
    return rpcData as DBProfile[];
  }

  // Fallback: query direta (pode ser limitada por RLS)
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name', { ascending: true });

  if (error) throw error;
  return data as DBProfile[];
}

export async function updateProfile(id: string, updates: Partial<DBProfile>) {
  const payload = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  // Tenta via RPC (bypassa RLS para editar perfil de outros usuários)
  const { error: rpcError } = await supabase.rpc('update_profile', {
    target_user_id: id,
    profile_data: payload,
  });

  if (rpcError) {
    // Fallback: query direta (funciona apenas se RLS permitir)
    console.warn('RPC update_profile falhou, tentando query direta:', rpcError.message);
    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', id);

    if (error) throw error;
  }
}

/**
 * Garante que um perfil exista na tabela `profiles` para um determinado user id.
 * Usa upsert para evitar conflitos e inclui retry com polling para lidar com
 * o atraso entre o signUp e a execução do trigger handle_new_user.
 */
export async function ensureProfileExists(
  userId: string,
  profileData: {
    full_name?: string;
    email?: string;
    avatar_url?: string;
    role?: string;
  },
  maxRetries = 5
): Promise<void> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Primeiro tenta um upsert direto
    const { error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          full_name: profileData.full_name || null,
          email: profileData.email || null,
          avatar_url: profileData.avatar_url || null,
          role: profileData.role || 'Suporte',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (!error) {
      console.log(`✅ Perfil garantido para ${profileData.full_name || userId} (tentativa ${attempt + 1})`);
      return;
    }

    console.warn(`⚠️ Tentativa ${attempt + 1} falhou ao criar/atualizar perfil:`, error.message);

    // Espera um pouco antes de tentar novamente (dá tempo para o trigger executar)
    if (attempt < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, 800 * (attempt + 1)));
    }
  }

  // Última tentativa: tenta fazer update ao invés de upsert
  // (caso o registro já exista mas com dados incompletos)
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      full_name: profileData.full_name || null,
      email: profileData.email || null,
      avatar_url: profileData.avatar_url || null,
      role: profileData.role || 'Suporte',
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (updateError) {
    console.error('❌ Falha final ao garantir perfil:', updateError.message);
  }
}

/**
 * Sincroniza todos os usuários do Supabase Auth com a tabela profiles.
 * Para cada usuário no Auth que não possua um registro na tabela profiles,
 * cria o registro correspondente.
 *
 * Esta função usa a RPC `get_auth_users` se disponível, caso contrário
 * compara os perfis existentes com os dados do Auth metadata.
 */
export async function syncAuthUsersToProfiles(): Promise<{ synced: number; errors: string[]; total_auth: number }> {
  const result = { synced: 0, errors: [] as string[], total_auth: 0 };

  try {
    // Tenta usar RPC para buscar usuários do Auth
    console.log('🔄 Iniciando sincronização Auth → Profiles...');
    const { data: authUsers, error: rpcError } = await supabase.rpc('get_auth_users');

    if (rpcError) {
      const errorMsg = `RPC get_auth_users falhou: ${rpcError.message} (code: ${rpcError.code})`;
      console.error('❌', errorMsg);
      result.errors.push(errorMsg);
      return result;
    }

    if (!authUsers || authUsers.length === 0) {
      console.log('ℹ️ Nenhum usuário encontrado no Auth');
      return result;
    }

    result.total_auth = authUsers.length;
    console.log(`📋 Encontrados ${authUsers.length} usuários no Auth:`, authUsers.map((u: any) => u.email));

    // Buscar todos os perfis existentes (com dados completos para verificar incompletos)
    const { data: existingProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, email');

    const profileMap = new Map((existingProfiles || []).map(p => [p.id, p]));
    console.log(`📋 Perfis existentes: ${profileMap.size}`);

    // Criar perfis para usuários que não têm
    const missing = authUsers.filter((u: any) => !profileMap.has(u.id));
    console.log(`🔍 Usuários sem perfil: ${missing.length}`, missing.map((u: any) => u.email));

    for (const authUser of missing) {
      const metadata = authUser.raw_user_meta_data || {};
      try {
        await ensureProfileExists(authUser.id, {
          full_name: metadata.full_name || authUser.email?.split('@')[0] || 'Novo Membro',
          email: authUser.email,
          avatar_url: metadata.avatar_url || null,
          role: metadata.role || 'Suporte',
        }, 3);
        result.synced++;
        console.log(`✅ Perfil criado: ${authUser.email}`);
      } catch (err: any) {
        const errMsg = `Erro no usuário ${authUser.email}: ${err.message}`;
        result.errors.push(errMsg);
        console.error('❌', errMsg);
      }
    }

    // Atualizar perfis incompletos (sem nome ou email) com dados do Auth
    for (const authUser of authUsers) {
      const profile = profileMap.get(authUser.id);
      if (profile && (!profile.full_name || !profile.email)) {
        const metadata = authUser.raw_user_meta_data || {};
        const updates: any = {};
        if (!profile.full_name) {
          updates.full_name = metadata.full_name || authUser.email?.split('@')[0] || 'Novo Membro';
        }
        if (!profile.email) {
          updates.email = authUser.email;
        }
        if (Object.keys(updates).length > 0) {
          updates.updated_at = new Date().toISOString();
          const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', authUser.id);
          
          if (!error) {
            result.synced++;
            console.log(`🔧 Perfil atualizado (dados incompletos): ${authUser.email}`, updates);
          } else {
            console.warn(`⚠️ Erro ao atualizar perfil incompleto ${authUser.email}:`, error.message);
          }
        }
      }
    }

    if (result.synced > 0) {
      console.log(`✅ ${result.synced} perfis sincronizados/atualizados`);
    } else if (missing.length === 0) {
      console.log('✅ Todos os usuários já possuem perfil completo');
    }
  } catch (err: any) {
    result.errors.push(err.message);
    console.error('❌ syncAuthUsersToProfiles erro geral:', err.message);
  }

  return result;
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
