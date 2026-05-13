import { useState, useEffect } from "react";
import { getEvents, createEvent, updateEvent, deleteEvent, deleteRecurringSeries, recurrenceLabels, type DBEvent, type RecurrenceType } from "@/services/agendaService";
import { Calendar as CalIcon, Video, Users, Mic, Loader2, Plus, X, Search, LayoutGrid, List, ChevronLeft, ChevronRight, Clock, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { getProfiles, type DBProfile } from "@/services/profileService";
import { UserSelector } from "@/components/UserSelector";
import { useAuth } from "@/contexts/AuthContext";

type ViewMode = "grid" | "lista";
type RangeMode = "dia" | "semana" | "mes";

const tipoConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  reuniao: { label: "Reunião", color: "text-blue-500 bg-blue-500/10 border-blue-500/20", icon: <Users className="h-3 w-3" /> },
  call_theway: { label: "Call THE WAY", color: "text-letitia-gold bg-letitia-gold/10 border-letitia-gold/20", icon: <Video className="h-3 w-3" /> },
  podcast: { label: "Podcast", color: "text-red-500 bg-red-500/10 border-red-500/20", icon: <Mic className="h-3 w-3" /> },
  one_on_one: { label: "1x1", color: "text-green-500 bg-green-500/10 border-green-500/20", icon: <Users className="h-3 w-3" /> },
  live: { label: "Live", color: "text-purple-500 bg-purple-500/10 border-purple-500/20", icon: <Video className="h-3 w-3" /> },
};

export function Agenda() {
  const { user, loading: authLoading } = useAuth();
  const [eventos, setEventos] = useState<DBEvent[]>([]);
  const [profiles, setProfiles] = useState<DBProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<DBEvent | null>(null);
  
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [rangeMode, setRangeMode] = useState<RangeMode>("semana");
  const [busca, setBusca] = useState("");
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [user, authLoading]);

  async function fetchData() {
    try {
      const [eventsData, profilesData] = await Promise.all([
        getEvents(), 
        getProfiles()
      ]);
      setEventos(eventsData);
      setProfiles(profilesData);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchEvents() {
    try {
      const data = await getEvents();
      setEventos(data);
    } catch (error) {
      console.error("Erro ao buscar eventos:", error);
    }
  }

  const handleDeleteEvent = async (id: string) => {
    const evento = eventos.find(e => e.id === id);
    if (!evento) return;

    // If the event has recurrence, ask if they want to delete only this or all
    if (evento.recorrencia) {
      const choice = confirm(
        "Este é um evento recorrente.\n\nOK = Excluir TODA a série\nCancelar = Cancelar"
      );
      if (!choice) return;
      try {
        const parentId = evento.recorrencia_pai_id || evento.id;
        await deleteRecurringSeries(parentId);
        fetchEvents();
      } catch (error) {
        console.error("Erro ao excluir série:", error);
      }
      return;
    }

    if (!confirm("Tem certeza que deseja excluir este compromisso?")) return;
    try {
      await deleteEvent(id);
      fetchEvents();
    } catch (error) {
      console.error("Erro ao excluir evento:", error);
    }
  };

  const filtrados = eventos.filter(e => 
    e.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    e.participantes?.some(p => p.toLowerCase().includes(busca.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-letitia-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-letitia-gold/10">
            <CalIcon className="h-5 w-5 text-letitia-gold" />
          </div>
          <div>
            <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground">Agenda</h2>
            <p className="mt-0.5 text-sm text-muted">Acompanhe as reuniões e compromissos do time.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Novo Evento
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-md border border-border bg-card pl-9 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted focus:ring-2 focus:ring-letitia-gold focus:outline-none"
              placeholder="Buscar evento..."
            />
          </div>

          <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-0.5">
            <button onClick={() => setViewMode("grid")} className={cn("p-1.5 rounded-md transition-all", viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground")}>
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button onClick={() => setViewMode("lista")} className={cn("p-1.5 rounded-md transition-all", viewMode === "lista" ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground")}>
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-0.5">
            {(["dia", "semana", "mes"] as RangeMode[]).map((m) => (
              <button 
                key={m} 
                onClick={() => { setRangeMode(m); setOffset(0); }} 
                className={cn("px-3 py-1 rounded-md text-xs font-medium transition-all capitalize", rangeMode === m ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground")}
              >
                {m === "dia" ? "Dia" : m === "semana" ? "Semana" : "Mês"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button onClick={() => setOffset(o => o - 1)} className="p-1.5 rounded-md hover:bg-foreground/5 text-muted hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setOffset(0)} className="text-xs font-medium px-2 py-1 hover:bg-foreground/5 rounded text-foreground">Hoje</button>
            <button onClick={() => setOffset(o => o + 1)} className="p-1.5 rounded-md hover:bg-foreground/5 text-muted hover:text-foreground">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {viewMode === "lista" ? (
          <ListView eventos={filtrados} onEdit={setEditingEvent} onDelete={handleDeleteEvent} />
        ) : (
          <>
            {rangeMode === "dia" && <DayView eventos={filtrados} offset={offset} onEdit={setEditingEvent} onDelete={handleDeleteEvent} />}
            {rangeMode === "semana" && <WeekView eventos={filtrados} offset={offset} onEdit={setEditingEvent} onDelete={handleDeleteEvent} />}
            {rangeMode === "mes" && <MonthView eventos={filtrados} offset={offset} onEdit={setEditingEvent} />}
          </>
        )}
      </div>

      {(isModalOpen || editingEvent) && (
        <NovoEventoModal 
          profiles={profiles}
          evento={editingEvent}
          onClose={() => { setIsModalOpen(false); setEditingEvent(null); }} 
          onSuccess={() => { setIsModalOpen(false); setEditingEvent(null); fetchEvents(); }} 
        />
      )}
    </div>
  );
}

/* ─── Views ─────────────────────────────────────────────────── */

function ListView({ eventos, onEdit, onDelete }: { eventos: DBEvent[]; onEdit: (e: DBEvent) => void; onDelete: (id: string) => void }) {
  const sorted = [...eventos].sort((a, b) => {
    const da = new Date(a.data_evento + 'T' + a.hora_inicio);
    const db = new Date(b.data_evento + 'T' + b.hora_inicio);
    return da.getTime() - db.getTime();
  });

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-background/50">
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Data/Hora</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Evento</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Tipo</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Participantes</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted italic">Nenhum evento encontrado.</td></tr>
            ) : (
              sorted.map((e) => {
                const config = tipoConfig[e.tipo] || tipoConfig.reuniao;
                return (
                  <tr key={e.id} className="border-b border-border last:border-0 hover:bg-background/50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">{new Date(e.data_evento + 'T00:00:00').toLocaleDateString("pt-BR")}</span>
                        <span className="text-xs text-muted flex items-center gap-1"><Clock className="h-3 w-3" /> {e.hora_inicio.substring(0, 5)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{e.titulo}</span>
                        {e.recorrencia && (
                          <span className="flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 border border-violet-500/20">
                            <Repeat className="h-2.5 w-2.5" />
                            {recurrenceLabels[e.recorrencia as RecurrenceType]}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border border-transparent", config.color, "border-border/10")}>
                        {config.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex -space-x-1">
                        {e.participantes?.map((p, i) => (
                          <div key={i} title={p} className="flex h-5 w-5 items-center justify-center rounded-full bg-background border border-border text-[8px] font-medium text-foreground ring-1 ring-background">
                            {p}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onEdit(e)} className="p-1.5 rounded hover:bg-foreground/5 text-muted hover:text-foreground">
                          <Plus className="h-4 w-4 rotate-45" />
                        </button>
                        <button onClick={() => onDelete(e.id)} className="p-1.5 rounded hover:bg-red-500/10 text-muted hover:text-red-500">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DayView({ eventos, offset, onEdit, onDelete }: { eventos: DBEvent[]; offset: number; onEdit: (e: DBEvent) => void; onDelete: (id: string) => void }) {
  const day = new Date();
  day.setDate(day.getDate() + offset);
  const dayStr = day.toISOString().split("T")[0];
  const dayEvents = eventos.filter(e => e.data_evento === dayStr);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border bg-background/50 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground capitalize">
          {day.toLocaleDateString("pt-BR", { weekday: 'long', day: 'numeric', month: 'long' })}
        </h3>
        <span className="text-xs text-muted font-medium">{dayEvents.length} eventos</span>
      </div>
      <div className="p-6 space-y-3">
        {dayEvents.length === 0 ? (
          <div className="py-12 text-center text-muted italic text-sm">Nada agendado para este dia.</div>
        ) : (
          dayEvents.sort((a,b) => a.hora_inicio.localeCompare(b.hora_inicio)).map(e => <EventCard key={e.id} event={e} onEdit={onEdit} onDelete={onDelete} />)
        )}
      </div>
    </div>
  );
}

function WeekView({ eventos, offset, onEdit, onDelete }: { eventos: DBEvent[]; offset: number; onEdit: (e: DBEvent) => void; onDelete: (id: string) => void }) {
  const today = new Date();
  const startOfWeek = new Date(today);
  const dayOfWeek = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + offset * 7);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
      {days.map((day) => {
        const dayStr = day.toISOString().split("T")[0];
        const dayEvts = eventos.filter((e) => e.data_evento === dayStr);
        const isToday = dayStr === today.toISOString().split("T")[0];
        
        return (
          <div key={dayStr} className={cn("rounded-xl border overflow-hidden min-h-[300px] transition-all", isToday ? "border-letitia-gold bg-letitia-gold/5" : "border-border bg-card hover:border-border/80")}>
            <div className={cn("px-4 py-3 border-b text-center", isToday ? "border-letitia-gold/30 bg-letitia-gold/10" : "border-border bg-background/50")}>
              <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">{day.toLocaleDateString("pt-BR", { weekday: "short" })}</p>
              <p className={cn("text-xl font-bold mt-0.5", isToday ? "text-letitia-clay" : "text-foreground")}>{day.getDate()}</p>
            </div>
            <div className="p-2 space-y-2">
              {dayEvts.length === 0 ? (
                <p className="text-[10px] text-muted italic text-center py-10 opacity-50">Livre</p>
              ) : (
                dayEvts.sort((a,b) => a.hora_inicio.localeCompare(b.hora_inicio)).map((evt) => <EventCard key={evt.id} event={evt} compact onEdit={onEdit} onDelete={onDelete} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MonthView({ eventos, offset, onEdit }: { eventos: DBEvent[]; offset: number; onEdit: (e: DBEvent) => void }) {
  const today = new Date();
  const monthDate = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = monthDate.getDay() === 0 ? 6 : monthDate.getDay() - 1;
  const monthLabel = monthDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const cells = Array.from({ length: 42 }, (_, i) => {
    const dayNum = i - firstDayOfWeek + 1;
    if (dayNum < 1 || dayNum > daysInMonth) return null;
    return new Date(monthDate.getFullYear(), monthDate.getMonth(), dayNum);
  });

  const weekdays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border bg-background/50 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground capitalize">{monthLabel}</h3>
      </div>
      <div className="grid grid-cols-7">
        {weekdays.map((wd) => (
          <div key={wd} className="px-2 py-3 text-center text-[10px] font-bold text-muted uppercase border-b border-border bg-background/10">{wd}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="border-b border-r border-border min-h-[100px] bg-background/5" />;
          const dayStr = day.toISOString().split("T")[0];
          const dayEvts = eventos.filter((e) => e.data_evento === dayStr);
          const isToday = dayStr === today.toISOString().split("T")[0];
          
          return (
            <div key={i} className={cn("border-b border-r border-border min-h-[100px] p-1.5 transition-colors cursor-pointer", isToday ? "bg-letitia-gold/5" : "hover:bg-foreground/[0.02]")}>
              <p className={cn("text-xs font-bold mb-1.5 px-1", isToday ? "text-letitia-clay" : "text-muted")}>{day.getDate()}</p>
              <div className="space-y-1">
                {dayEvts.slice(0, 3).map((e) => {
                  const config = tipoConfig[e.tipo] || tipoConfig.reuniao;
                  return (
                    <div key={e.id} onClick={() => onEdit(e)} className={cn("rounded px-1.5 py-0.5 border-l-2 text-[9px] font-medium truncate bg-background/60 hover:brightness-95", config.color)}>
                      {e.hora_inicio.substring(0, 5)} {e.titulo}
                    </div>
                  );
                })}
                {dayEvts.length > 3 && <p className="text-[8px] text-muted px-1">+{dayEvts.length - 3} mais</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EventCard({ event, compact, onEdit, onDelete }: { event: DBEvent; compact?: boolean; onEdit: (e: DBEvent) => void; onDelete: (id: string) => void }) {
  const tipo = tipoConfig[event.tipo] || tipoConfig.reuniao;
  return (
    <div className={cn("rounded-lg border-l-2 p-3 cursor-pointer hover:shadow-md transition-all group", tipo.color, !compact && "border border-border/20")}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-muted">
          {tipo.icon}
          <span className="text-[10px] font-bold tracking-tight">{event.hora_inicio.substring(0, 5)}</span>
          {!compact && <span className="text-[10px] opacity-50 ml-1">• {tipo.label}</span>}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onEdit(event); }} className="p-1 rounded hover:bg-foreground/5 text-muted hover:text-foreground">
            <Plus className="h-3 w-3 rotate-45" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(event.id); }} className="p-1 rounded hover:bg-red-500/10 text-muted hover:text-red-500">
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
      <p className={cn("font-medium text-foreground leading-snug", compact ? "text-[11px]" : "text-sm")}>{event.titulo}</p>
      {event.recorrencia && (
        <div className="flex items-center gap-1 mt-1">
          <Repeat className="h-2.5 w-2.5 text-violet-500" />
          <span className="text-[9px] font-medium text-violet-600">{recurrenceLabels[event.recorrencia as RecurrenceType]}</span>
        </div>
      )}
      <div className="flex -space-x-1 mt-2.5">
        {event.participantes?.map((p, i) => (
          <div key={i} title={p} className="flex h-5 w-5 items-center justify-center rounded-full bg-background border border-border text-[8px] font-bold text-foreground ring-2 ring-background">
            {p}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Modals ────────────────────────────────────────────────── */

function NovoEventoModal({ profiles, onClose, onSuccess, evento }: { 
  profiles: DBProfile[]; 
  onClose: () => void; 
  onSuccess: () => void;
  evento?: DBEvent | null;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: evento?.titulo || "",
    data_evento: evento?.data_evento || new Date().toISOString().split("T")[0],
    hora_inicio: evento?.hora_inicio.substring(0, 5) || "09:00",
    tipo: evento?.tipo || "reuniao",
    participantes: evento?.participantes || [] as string[],
    recorrencia: (evento?.recorrencia || null) as RecurrenceType | null
  });
  
  // Find initial user IDs from initials (imperfect but better than nothing if table was empty)
  const initialUserIds = profiles
    .filter(p => {
      const initials = (p.full_name || "").split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      return formData.participantes.includes(initials);
    })
    .map(p => p.id);

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(initialUserIds);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (evento) {
        await updateEvent(evento.id, formData);
      } else {
        await createEvent(formData);
      }
      onSuccess();
    } catch (error) {
      console.error("Erro ao salvar evento:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg modal-content">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif text-2xl font-medium text-foreground">{evento ? "Editar Compromisso" : "Novo Compromisso"}</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-foreground/10 transition-colors">
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Título do Evento</label>
            <input
              required
              value={formData.titulo}
              onChange={e => setFormData({ ...formData, titulo: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
              placeholder="Ex: Alinhamento de Vendas"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Data</label>
              <input
                required
                type="date"
                value={formData.data_evento}
                onChange={e => setFormData({ ...formData, data_evento: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Horário</label>
              <input
                required
                type="time"
                value={formData.hora_inicio}
                onChange={e => setFormData({ ...formData, hora_inicio: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Tipo de Compromisso</label>
            <select
              value={formData.tipo}
              onChange={e => setFormData({ ...formData, tipo: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
            >
              <option value="reuniao">Reunião Interna</option>
              <option value="call_theway">Call THE WAY</option>
              <option value="podcast">Gravação Podcast</option>
              <option value="one_on_one">Reunião 1x1</option>
              <option value="live">Live / Masterclass</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Recorrência</label>
            <div className="relative">
              <Repeat className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <select
                value={formData.recorrencia || ''}
                onChange={e => setFormData({ ...formData, recorrencia: (e.target.value || null) as RecurrenceType | null })}
                className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none appearance-none"
              >
                <option value="">Sem recorrência</option>
                <option value="diario">📅 Diário</option>
                <option value="semanal">📆 Semanal</option>
                <option value="quinzenal">🗓️ Quinzenal</option>
                <option value="mensal">📅 Mensal</option>
                <option value="semestral">🗓️ Semestral</option>
                <option value="anual">📆 Anual</option>
              </select>
            </div>
            {formData.recorrencia && (
              <p className="mt-1.5 text-[11px] text-violet-600 flex items-center gap-1.5 bg-violet-500/5 px-2.5 py-1.5 rounded-md border border-violet-500/10">
                <Repeat className="h-3 w-3" />
                Este evento será repetido automaticamente ({recurrenceLabels[formData.recorrencia]}) a partir de {new Date(formData.data_evento + 'T00:00:00').toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>

          <UserSelector
            multiple
            label="Participantes"
            placeholder="Adicionar participantes..."
            users={profiles}
            selectedIds={selectedUserIds}
            onSelect={(ids) => {
              const idArray = ids as string[];
              setSelectedUserIds(idArray);
              const initials = profiles
                .filter(p => idArray.includes(p.id))
                .map(p => (p.full_name || "??").split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase());
              setFormData({ ...formData, participantes: initials });
            }}
          />

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all flex items-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {evento ? "Salvar Alterações" : "Agendar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
