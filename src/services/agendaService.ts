import { supabase } from '@/lib/supabase';

export type RecurrenceType = 'diario' | 'semanal' | 'quinzenal' | 'mensal' | 'semestral' | 'anual';

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
  recorrencia?: RecurrenceType | null;
  recorrencia_pai_id?: string | null;
}

// ─── Recurrence helpers ────────────────────────────────────

export const recurrenceLabels: Record<RecurrenceType, string> = {
  diario: 'Diário',
  semanal: 'Semanal',
  quinzenal: 'Quinzenal',
  mensal: 'Mensal',
  semestral: 'Semestral',
  anual: 'Anual',
};

/**
 * Given a base date and a recurrence type, returns up to `count` future dates.
 * The first generated date starts from `baseDate` + 1 period.
 */
function generateRecurringDates(baseDate: string, type: RecurrenceType, count: number): string[] {
  const dates: string[] = [];
  const base = new Date(baseDate + 'T00:00:00');

  for (let i = 1; i <= count; i++) {
    const d = new Date(base);
    switch (type) {
      case 'diario':
        d.setDate(d.getDate() + i);
        break;
      case 'semanal':
        d.setDate(d.getDate() + i * 7);
        break;
      case 'quinzenal':
        d.setDate(d.getDate() + i * 14);
        break;
      case 'mensal':
        d.setMonth(d.getMonth() + i);
        break;
      case 'semestral':
        d.setMonth(d.getMonth() + i * 6);
        break;
      case 'anual':
        d.setFullYear(d.getFullYear() + i);
        break;
    }
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

/** How many occurrences to pre-generate for each type */
const RECURRENCE_COUNT: Record<RecurrenceType, number> = {
  diario: 30,      // ~1 month ahead
  semanal: 12,     // ~3 months
  quinzenal: 12,   // ~6 months
  mensal: 12,      // ~1 year
  semestral: 4,    // ~2 years
  anual: 3,        // ~3 years
};

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

  // If the event has recurrence, generate future occurrences
  if (data.recorrencia && data.data_evento) {
    const count = RECURRENCE_COUNT[data.recorrencia as RecurrenceType] || 4;
    const futureDates = generateRecurringDates(data.data_evento, data.recorrencia as RecurrenceType, count);

    const recurringEvents = futureDates.map(date => ({
      titulo: event.titulo,
      descricao: event.descricao,
      hora_inicio: event.hora_inicio,
      hora_fim: event.hora_fim,
      tipo: event.tipo,
      participantes: event.participantes,
      recorrencia: event.recorrencia,
      recorrencia_pai_id: data.id,
      data_evento: date,
    }));

    if (recurringEvents.length > 0) {
      await supabase.from('eventos').insert(recurringEvents);
    }
  }

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

/**
 * Atualizar todos os eventos futuros de uma recorrência
 */
export async function updateRecurringSeries(parentId: string, updates: Partial<DBEvent>) {
  const today = new Date().toISOString().split('T')[0];
  
  // Update all future child events
  const { error } = await supabase
    .from('eventos')
    .update(updates)
    .eq('recorrencia_pai_id', parentId)
    .gte('data_evento', today);

  if (error) throw error;
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

/**
 * Deletar todos os eventos futuros de uma recorrência
 */
export async function deleteRecurringSeries(parentId: string) {
  const today = new Date().toISOString().split('T')[0];
  
  // Delete the parent itself
  await supabase.from('eventos').delete().eq('id', parentId);
  
  // Delete all future child events
  const { error } = await supabase
    .from('eventos')
    .delete()
    .eq('recorrencia_pai_id', parentId)
    .gte('data_evento', today);

  if (error) throw error;
}
