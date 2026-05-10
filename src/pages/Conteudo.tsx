import { useState, useEffect } from "react";
import { getContent, updateContentStatus, createContent, type DBContent } from "@/services/contentService";
import { pilarColors, formatoIcons } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { List, LayoutGrid, Calendar, ChevronLeft, ChevronRight, Camera, Video, Loader2, Plus, X, Music } from "lucide-react";
import { getProfiles, type DBProfile } from "@/services/profileService";
import { UserSelector } from "@/components/UserSelector";
import { useAuth } from "@/contexts/AuthContext";

type ViewMode = "kanban" | "lista" | "calendario";
type CalMode = "dia" | "semana" | "mes";

const plataformas = [
  { id: "todas", label: "Todas", icon: null },
  { id: "leticiacazarre", label: "@leticiacazarre", icon: Camera, color: "text-pink-500", logo: "https://unavatar.io/instagram/leticiacazarre" },
  { id: "l__academia", label: "@l__academia", icon: Camera, color: "text-purple-500", logo: "https://unavatar.io/instagram/l__academia" },
  { id: "vaipormim.podcast", label: "@vaipormim.podcast", icon: Camera, color: "text-red-500", logo: "https://unavatar.io/instagram/vaipormim.podcast" },
  { id: "theway_mentoria", label: "@theway_mentoria", icon: Camera, color: "text-amber-500", logo: "https://unavatar.io/instagram/theway_mentoria" },
  { id: "YouTube", label: "YouTube", icon: Video, color: "text-red-500" },
  { id: "TikTok", label: "TikTok", icon: Music, color: "text-black" },
];

const statusCols = [
  { id: "rascunho" as const, label: "Rascunho", color: "border-t-gray-400" },
  { id: "revisao_leticia" as const, label: "Revisão Letícia", color: "border-t-amber-400" },
  { id: "aprovado" as const, label: "Aprovado", color: "border-t-green-400" },
  { id: "publicado" as const, label: "Publicado", color: "border-t-letitia-gold" },
];

export function Conteudo() {
  const { user } = useAuth();
  const [pautas, setPautas] = useState<DBContent[]>([]);
  const [profiles, setProfiles] = useState<DBProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("kanban");
  const [calMode, setCalMode] = useState<CalMode>("semana");
  const [filtroPlataforma, setFiltroPlataforma] = useState("todas");
  const [weekOffset, setWeekOffset] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [pautasData, profilesData] = await Promise.all([
        getContent(), 
        getProfiles()
      ]);
      setPautas(pautasData);
      setProfiles(profilesData);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPautas() {
    try {
      const data = await getContent();
      setPautas(data);
    } catch (error) {
      console.error("Erro ao buscar pautas:", error);
    } finally {
      setLoading(false);
    }
  }

  const filtradas = filtroPlataforma === "todas"
    ? pautas
    : pautas.filter((p) => p.plataforma === filtroPlataforma);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-letitia-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground">Calendário Editorial</h2>
          <p className="mt-1 text-sm text-muted">{pautas.length} pautas neste ciclo</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Nova Pauta
          </button>
          
          <div className="flex items-center gap-0.5 bg-card border border-border rounded-md p-0.5">
            <button onClick={() => setView("kanban")} className={cn("p-1.5 rounded text-sm transition-all", view === "kanban" ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground")} title="Kanban">
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button onClick={() => setView("lista")} className={cn("p-1.5 rounded text-sm transition-all", view === "lista" ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground")} title="Lista">
              <List className="h-4 w-4" />
            </button>
            <button onClick={() => setView("calendario")} className={cn("p-1.5 rounded text-sm transition-all", view === "calendario" ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground")} title="Calendário">
              <Calendar className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Plataforma filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {plataformas.map((p) => (
          <button
            key={p.id}
            onClick={() => setFiltroPlataforma(p.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
              filtroPlataforma === p.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted hover:text-foreground hover:border-foreground/20"
            )}
          >
            {(p as any).logo ? (
              <img src={(p as any).logo} alt="" className="h-4 w-4 rounded-full border border-border" />
            ) : p.icon && (
              <p.icon className={cn("h-3.5 w-3.5", filtroPlataforma !== p.id ? p.color : "")} />
            )}
            {p.label}
          </button>
        ))}
      </div>

      {/* Calendar mode selector (only in calendar view) */}
      {view === "calendario" && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 bg-card border border-border rounded-md p-0.5">
            {(["dia", "semana", "mes"] as CalMode[]).map((m) => (
              <button key={m} onClick={() => setCalMode(m)} className={cn("px-3 py-1 rounded text-xs font-medium transition-all capitalize", calMode === m ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground")}>
                {m === "dia" ? "Dia" : m === "semana" ? "Semana" : "Mês"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekOffset((p) => p - 1)} className="p-1 rounded hover:bg-foreground/5 text-muted hover:text-foreground transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setWeekOffset(0)} className="text-xs font-medium text-foreground px-2 py-1 rounded hover:bg-foreground/5">Hoje</button>
            <button onClick={() => setWeekOffset((p) => p + 1)} className="p-1 rounded hover:bg-foreground/5 text-muted hover:text-foreground transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Views */}
      {view === "kanban" && <KanbanView pautas={filtradas} onUpdate={fetchPautas} />}
      {view === "lista" && <ListView pautas={filtradas} />}
      {view === "calendario" && <CalendarView pautas={filtradas} mode={calMode} weekOffset={weekOffset} />}

      {isModalOpen && (
        <NovoPautaModal 
          profiles={profiles}
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => { setIsModalOpen(false); fetchPautas(); }} 
        />
      )}
    </div>
  );
}

function NovoPautaModal({ profiles, onClose, onSuccess }: { profiles: DBProfile[]; onClose: () => void; onSuccess: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: "",
    pilar: "pessoal",
    formato: "reels",
    plataforma: "Instagram",
    data_prevista: new Date().toISOString().split("T")[0],
    status: "rascunho",
    responsavel_id: user?.id || ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createContent(formData);
      onSuccess();
    } catch (error) {
      console.error("Erro ao criar pauta:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif text-2xl font-medium text-foreground">Nova Pauta</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-foreground/10 transition-colors">
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Título da Pauta</label>
            <input
              required
              value={formData.titulo}
              onChange={e => setFormData({ ...formData, titulo: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
              placeholder="Ex: Como lidar com crises"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Pilar</label>
              <select
                value={formData.pilar}
                onChange={e => setFormData({ ...formData, pilar: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
              >
                <option value="pessoal">Pessoal</option>
                <option value="profissional">Profissional</option>
                <option value="interior">Interior</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Formato</label>
              <select
                value={formData.formato}
                onChange={e => setFormData({ ...formData, formato: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
              >
                <option value="reels">Reels</option>
                <option value="carrossel">Carrossel</option>
                <option value="post">Post Único</option>
                <option value="youtube">Vídeo YouTube</option>
                <option value="podcast">Podcast</option>
                <option value="newsletter">Newsletter</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Plataforma</label>
              <select
                value={formData.plataforma}
                onChange={e => setFormData({ ...formData, plataforma: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
              >
                <option value="leticiacazarre">@leticiacazarre</option>
                <option value="l__academia">@l__academia</option>
                <option value="vaipormim.podcast">@vaipormim.podcast</option>
                <option value="theway_mentoria">@theway_mentoria</option>
                <option value="YouTube">YouTube</option>
                <option value="TikTok">TikTok</option>
                <option value="Spotify">Podcast (Spotify)</option>
                <option value="Substack">Newsletter (Substack)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Data Prevista</label>
              <input
                required
                type="date"
                value={formData.data_prevista}
                onChange={e => setFormData({ ...formData, data_prevista: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
              />
            </div>
          </div>

          <UserSelector
            label="Responsável"
            users={profiles}
            selectedId={formData.responsavel_id}
            onSelect={(id) => setFormData({ ...formData, responsavel_id: id })}
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
              Criar Pauta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Kanban ──────────────────────────────────────────────── */
function KanbanView({ pautas, onUpdate }: { pautas: DBContent[]; onUpdate: () => void }) {
  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateContentStatus(id, status);
      onUpdate();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statusCols.map((col) => {
        const items = pautas.filter((p) => p.status === col.id);
        return (
          <div key={col.id}>
            <div className={cn("rounded-t-lg border-t-2 bg-card border border-border px-3 py-2.5 flex items-center justify-between", col.color)}>
              <h3 className="text-xs font-semibold text-foreground">{col.label}</h3>
              <span className="text-[10px] font-medium text-muted bg-background px-1.5 py-0.5 rounded-full">{items.length}</span>
            </div>
            <div className="bg-background/30 border border-t-0 border-border rounded-b-lg p-2 space-y-2 min-h-[180px]">
              {items.map((p) => (
                <div key={p.id} className="relative group">
                  <PautaCard pauta={p} />
                  <select 
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-card border border-border rounded text-[8px] cursor-pointer"
                    value={p.status}
                    onChange={(e) => handleStatusChange(p.id, e.target.value)}
                  >
                    {statusCols.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Lista ───────────────────────────────────────────────── */
function ListView({ pautas }: { pautas: DBContent[] }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {["Pauta", "Plataforma", "Pilar", "Status", "Data"].map((h) => (
                <th key={h} className={cn("text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted", ["Plataforma", "Pilar"].includes(h) && "hidden md:table-cell")}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pautas.map((p) => {
              const pilar = pilarColors[p.pilar as keyof typeof pilarColors] || pilarColors.pessoal;
              return (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-background/50 transition-colors cursor-pointer">
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><span>{formatoIcons[p.formato as keyof typeof formatoIcons]}</span><span className="text-sm font-medium text-foreground">{p.titulo}</span></div></td>
                  <td className="px-4 py-3 hidden md:table-cell"><PlataformaBadge plataforma={p.plataforma} /></td>
                  <td className="px-4 py-3 hidden md:table-cell"><span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", pilar.bg, pilar.text)}>{pilar.label}</span></td>
                  <td className="px-4 py-3"><StatusBadge status={p.status || "rascunho"} /></td>
                  <td className="px-4 py-3 text-sm text-muted">{new Date(p.data_prevista + 'T00:00:00').toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Calendário ──────────────────────────────────────────── */
function CalendarView({ pautas, mode, weekOffset }: { pautas: DBContent[]; mode: CalMode; weekOffset: number }) {
  const today = new Date();

  if (mode === "dia") {
    const day = new Date(today);
    day.setDate(day.getDate() + weekOffset);
    const dayStr = day.toISOString().split("T")[0];
    const dayPautas = pautas.filter((p) => p.data_prevista === dayStr);
    const label = day.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-background/50">
          <p className="text-sm font-semibold text-foreground capitalize">{label}</p>
        </div>
        <div className="p-4 space-y-2 min-h-[200px]">
          {dayPautas.length === 0 ? (
            <p className="text-sm text-muted italic py-8 text-center">Nenhuma pauta para este dia.</p>
          ) : (
            dayPautas.map((p) => <PautaCard key={p.id} pauta={p} wide />)
          )}
        </div>
      </div>
    );
  }

  if (mode === "semana") {
    const startOfWeek = new Date(today);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + weekOffset * 7);

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      return d;
    });

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2">
        {days.map((day) => {
          const dayStr = day.toISOString().split("T")[0];
          const dayPautas = pautas.filter((p) => p.data_prevista === dayStr);
          const isToday = dayStr === today.toISOString().split("T")[0];
          return (
            <div key={dayStr} className={cn("rounded-xl border overflow-hidden min-h-[180px]", isToday ? "border-letitia-gold bg-letitia-gold/5" : "border-border bg-card")}>
              <div className={cn("px-3 py-2 border-b text-center", isToday ? "border-letitia-gold/30 bg-letitia-gold/10" : "border-border bg-background/50")}>
                <p className="text-[10px] font-medium text-muted uppercase">{day.toLocaleDateString("pt-BR", { weekday: "short" })}</p>
                <p className={cn("text-lg font-semibold", isToday ? "text-letitia-clay" : "text-foreground")}>{day.getDate()}</p>
              </div>
              <div className="p-1.5 space-y-1">
                {dayPautas.map((p) => (
                  <div key={p.id} className="rounded-md bg-background/60 border border-border p-2 cursor-pointer hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-xs">{formatoIcons[p.formato as keyof typeof formatoIcons]}</span>
                      <PlataformaBadge plataforma={p.plataforma} tiny />
                    </div>
                    <p className="text-[10px] font-medium text-foreground leading-tight line-clamp-2">{p.titulo}</p>
                    <StatusBadge status={p.status || "rascunho"} tiny />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Mês
  const monthDate = new Date(today.getFullYear(), today.getMonth() + weekOffset, 1);
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = monthDate.getDay() === 0 ? 6 : monthDate.getDay() - 1;
  const monthLabel = monthDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const cells = Array.from({ length: 42 }, (_, i) => {
    const dayNum = i - firstDayOfWeek + 1;
    if (dayNum < 1 || dayNum > daysInMonth) return null;
    const d = new Date(monthDate.getFullYear(), monthDate.getMonth(), dayNum);
    return d;
  });

  const weekdays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-background/50">
        <p className="text-sm font-semibold text-foreground capitalize">{monthLabel}</p>
      </div>
      <div className="grid grid-cols-7">
        {weekdays.map((wd) => (
          <div key={wd} className="px-2 py-2 text-center text-[10px] font-semibold text-muted uppercase border-b border-border">{wd}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="border-b border-r border-border min-h-[80px] bg-background/30" />;
          const dayStr = day.toISOString().split("T")[0];
          const dayPautas = pautas.filter((p) => p.data_prevista === dayStr);
          const isToday = dayStr === today.toISOString().split("T")[0];
          return (
            <div key={i} className={cn("border-b border-r border-border min-h-[80px] p-1", isToday ? "bg-letitia-gold/5" : "")}>
              <p className={cn("text-xs font-medium mb-1 px-1", isToday ? "text-letitia-clay font-bold" : "text-muted")}>{day.getDate()}</p>
              {dayPautas.slice(0, 2).map((p) => (
                <div key={p.id} className="rounded px-1.5 py-0.5 mb-0.5 bg-background/60 border border-border cursor-pointer hover:shadow-sm">
                  <p className="text-[9px] font-medium text-foreground truncate">{formatoIcons[p.formato as keyof typeof formatoIcons]} {p.titulo}</p>
                </div>
              ))}
              {dayPautas.length > 2 && <p className="text-[9px] text-muted px-1">+{dayPautas.length - 2} mais</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Shared Components ───────────────────────────────────── */
function PautaCard({ pauta, wide }: { pauta: DBContent; wide?: boolean }) {
  const pilar = pilarColors[pauta.pilar as keyof typeof pilarColors] || pilarColors.pessoal;
  return (
    <div className={cn("rounded-lg border border-border bg-card p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer", wide && "flex items-start gap-3")}>
      <div className="flex items-start gap-2 flex-1">
        <span className="text-lg">{formatoIcons[pauta.formato as keyof typeof formatoIcons] || "📄"}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-snug">{pauta.titulo}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded", pilar.bg, pilar.text)}>{pilar.label}</span>
            <PlataformaBadge plataforma={pauta.plataforma} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-muted uppercase tracking-tight">{new Date(pauta.data_prevista + 'T00:00:00').toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlataformaBadge({ plataforma, tiny }: { plataforma: string; tiny?: boolean }) {
  const plat = plataformas.find(p => p.id === plataforma);
  
  if (plat?.logo) {
    return (
      <span className={cn("flex items-center gap-1 font-medium rounded", tiny ? "text-[8px]" : "text-[10px] bg-foreground/5 px-1.5 py-0.5")}>
        <img src={plat.logo} alt="" className={cn("rounded-full border border-border", tiny ? "h-3 w-3" : "h-4 w-4")} />
        <span className={cn("text-muted", tiny && "sr-only")}>{plat.label}</span>
      </span>
    );
  }

  const isIG = plataforma === "leticiacazarre" || plataforma === "l__academia" || plataforma === "vaipormim.podcast" || plataforma === "theway_mentoria" || plataforma === "Instagram";
  const isYT = plataforma === "YouTube";
  const isTK = plataforma === "TikTok";

  const color = plat?.color || "text-muted";
  const label = plat?.label || plataforma;

  return (
    <span className={cn("flex items-center gap-1 font-medium rounded", tiny ? "text-[8px]" : "text-[10px] bg-foreground/5 px-1.5 py-0.5")}>
      {isIG && <Camera className={cn(tiny ? "h-2.5 w-2.5" : "h-3 w-3", color)} />}
      {isYT && <Video className={cn(tiny ? "h-2.5 w-2.5" : "h-3 w-3", color)} />}
      {isTK && <Music className={cn(tiny ? "h-2.5 w-2.5" : "h-3 w-3", color)} />}
      <span className={cn("text-muted", tiny && "sr-only")}>{label}</span>
    </span>
  );
}

function StatusBadge({ status, tiny }: { status: string; tiny?: boolean }) {
  return (
    <span className={cn(
      "font-medium rounded-full",
      tiny ? "text-[8px] px-1 py-0" : "text-[10px] px-2 py-0.5",
      status === "publicado" ? "bg-letitia-gold/10 text-letitia-gold" :
      status === "aprovado" ? "bg-green-500/10 text-green-600" :
      status === "revisao_leticia" ? "bg-amber-500/10 text-amber-600" :
      "bg-gray-500/10 text-gray-500"
    )}>
      {status === "revisao_leticia" ? "Revisão" : status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
