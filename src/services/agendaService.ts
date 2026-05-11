import { supabase } from '@/lib/supabase';

export interface DBEvent {
  id: string;
  titulo: string;
  descricao?: string;
  data_evento: string;
  hora_inicio: string;
  hora_fim?: string;
  tipo: string;
  participantes: string[];
  google_event_id?: string;
}

// ─── Google Calendar Sync ──────────────────────────────────

async function syncWithGoogleCalendar(evento: Partial<DBEvent> & { id: string }, action: 'create' | 'update' | 'delete') {
  try {
    const { data } = await supabase.functions.invoke('google-calendar-sync', {
      body: { evento, action }
    });

    // Save google_event_id after creation
    if (action === 'create' && data?.eventId) {
      await supabase.from('eventos')
        .update({ google_event_id: data.eventId })
        .eq('id', evento.id);
    }
    return data;
  } catch (error) {
    console.warn('Google Calendar sync failed (function may not be deployed yet):', error);
    return null;
  }
}

// ─── CRUD ──────────────────────────────────────────────────

export async function getEvents() {
  const { data, error } = await supabase
    .from('eventos')
    .select('*')
    .order('data_evento', { ascending: true })
    .order('hora_inicio', { ascending: true });

  if (error) throw error;
  return data as DBEvent[];
}

export async function createEvent(event: Partial<DBEvent>) {
  const { data, error } = await supabase
    .from('eventos')
    .insert([event])
    .select()
    .single();

  if (error) throw error;

  // Sync with Google Calendar (non-blocking)
  syncWithGoogleCalendar(data, 'create');

  return data;
}

export async function updateEvent(eventId: string, updates: Partial<DBEvent>) {
  const { data: current } = await supabase.from('eventos').select('*').eq('id', eventId).single();
  
  const { error } = await supabase
    .from('eventos')
    .update(updates)
    .eq('id', eventId);

  if (error) throw error;

  // Sync with Google Calendar (non-blocking)
  if (current) syncWithGoogleCalendar({ ...current, ...updates }, 'update');
}

export async function deleteEvent(eventId: string) {
  const { data: current } = await supabase.from('eventos').select('google_event_id').eq('id', eventId).single();

  const { error } = await supabase
    .from('eventos')
    .delete()
    .eq('id', eventId);

  if (error) throw error;

  // Sync with Google Calendar (non-blocking)
  if (current?.google_event_id) {
    syncWithGoogleCalendar({ id: eventId, google_event_id: current.google_event_id }, 'delete');
  }
}

