import { supabase } from '@/lib/supabase';

// ─── Types ──────────────────────────────────────────────────

export interface DBCurso {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  nivel: string;
  instrutor: string;
  capa_url: string | null;
  publicado: boolean;
  created_at: string;
  updated_at: string;
  // computed on frontend
  total_aulas?: number;
  duracao_total?: number;
  progresso?: number;
}

export interface DBAula {
  id: string;
  curso_id: string;
  titulo: string;
  descricao: string;
  ordem: number;
  tipo: 'video' | 'texto' | 'link';
  video_url: string | null;
  duracao_minutos: number;
  created_at: string;
  // joined
  concluida?: boolean;
}

export interface DBPdi {
  id: string;
  user_id: string;
  titulo: string;
  descricao: string;
  status: 'em_andamento' | 'concluido' | 'pausado';
  prazo: string | null;
  created_at: string;
  updated_at: string;
  // joined
  profiles?: { full_name: string; avatar_url: string | null };
  metas?: DBPdiMeta[];
}

export interface DBPdiMeta {
  id: string;
  pdi_id: string;
  titulo: string;
  concluida: boolean;
  ordem: number;
  created_at: string;
}

// ─── CURSOS ─────────────────────────────────────────────────

export async function getCursos() {
  const { data, error } = await supabase
    .from('cursos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as DBCurso[];
}

export async function getCurso(id: string) {
  const { data, error } = await supabase
    .from('cursos')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as DBCurso;
}

export async function createCurso(curso: Partial<DBCurso>) {
  const { data, error } = await supabase
    .from('cursos')
    .insert([curso])
    .select()
    .single();

  if (error) throw error;
  return data as DBCurso;
}

export async function updateCurso(id: string, updates: Partial<DBCurso>) {
  const { error } = await supabase
    .from('cursos')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteCurso(id: string) {
  const { error } = await supabase
    .from('cursos')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ─── AULAS ──────────────────────────────────────────────────

export async function getAulas(cursoId: string) {
  const { data, error } = await supabase
    .from('aulas')
    .select('*')
    .eq('curso_id', cursoId)
    .order('ordem', { ascending: true });

  if (error) throw error;
  return data as DBAula[];
}

export async function createAula(aula: Partial<DBAula>) {
  const { data, error } = await supabase
    .from('aulas')
    .insert([aula])
    .select()
    .single();

  if (error) throw error;
  return data as DBAula;
}

export async function updateAula(id: string, updates: Partial<DBAula>) {
  const { error } = await supabase
    .from('aulas')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteAula(id: string) {
  const { error } = await supabase
    .from('aulas')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ─── PROGRESSO ──────────────────────────────────────────────

export async function getProgressoCurso(cursoId: string, userId: string) {
  const { data, error } = await supabase
    .from('aulas_progresso')
    .select('aula_id, concluida, aulas!inner(curso_id)')
    .eq('aulas.curso_id', cursoId)
    .eq('user_id', userId);

  if (error) throw error;
  return data as any[];
}

export async function toggleAulaConcluida(aulaId: string, userId: string, concluida: boolean) {
  const { data: existing } = await supabase
    .from('aulas_progresso')
    .select('id')
    .eq('aula_id', aulaId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('aulas_progresso')
      .update({ concluida, concluida_em: concluida ? new Date().toISOString() : null })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('aulas_progresso')
      .insert([{ aula_id: aulaId, user_id: userId, concluida, concluida_em: concluida ? new Date().toISOString() : null }]);
    if (error) throw error;
  }
}

// ─── PDI ────────────────────────────────────────────────────

export async function getPdis() {
  const { data, error } = await supabase
    .from('pdis')
    .select('*, profiles(full_name, avatar_url), pdi_metas(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((pdi: any) => ({
    ...pdi,
    metas: (pdi.pdi_metas || []).sort((a: DBPdiMeta, b: DBPdiMeta) => a.ordem - b.ordem),
  })) as DBPdi[];
}

export async function createPdi(pdi: Partial<DBPdi>) {
  const { data, error } = await supabase
    .from('pdis')
    .insert([pdi])
    .select('*, profiles(full_name, avatar_url)')
    .single();

  if (error) throw error;
  return { ...data, metas: [] } as DBPdi;
}

export async function updatePdi(id: string, updates: Partial<DBPdi>) {
  const { error } = await supabase
    .from('pdis')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function deletePdi(id: string) {
  const { error } = await supabase
    .from('pdis')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ─── PDI METAS ──────────────────────────────────────────────

export async function addPdiMeta(pdiId: string, titulo: string, ordem: number) {
  const { data, error } = await supabase
    .from('pdi_metas')
    .insert([{ pdi_id: pdiId, titulo, ordem }])
    .select()
    .single();

  if (error) throw error;
  return data as DBPdiMeta;
}

export async function togglePdiMeta(id: string, concluida: boolean) {
  const { error } = await supabase
    .from('pdi_metas')
    .update({ concluida })
    .eq('id', id);

  if (error) throw error;
}

export async function deletePdiMeta(id: string) {
  const { error } = await supabase
    .from('pdi_metas')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ─── Helpers ────────────────────────────────────────────────

/** Converts any YouTube/Vimeo/Drive URL to an embeddable URL */
export function toEmbedUrl(url: string): string | null {
  if (!url) return null;

  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  // YouTube Shorts
  const ytShort = url.match(/youtube\.com\/shorts\/([\w-]+)/);
  if (ytShort) return `https://www.youtube.com/embed/${ytShort[1]}`;

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  // Google Drive — handles /file/d/ID, /file/u/0/d/ID, and strips ?t=... etc.
  const driveMatch = url.match(/drive\.google\.com\/file\/(?:u\/\d+\/)?d\/([\w-]+)/);
  if (driveMatch) return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;

  // Already an embed URL or other iframe-compatible URL
  if (url.includes('/embed/') || url.includes('/preview') || url.includes('player.vimeo.com')) {
    return url;
  }

  return url;
}
