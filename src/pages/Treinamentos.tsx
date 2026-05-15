import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Search, Plus, Play, Loader2, Edit2, Trash2, X, Save, CheckCircle2, Circle, Target } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { CursoDetailModal } from "@/components/CursoDetailModal";
import { UserSelector } from "@/components/UserSelector";
import { useSearchParams } from "react-router-dom";
import { 
  getCursos, createCurso, updateCurso, deleteCurso, 
  getPdis, createPdi, updatePdi, deletePdi, 
  addPdiMeta, togglePdiMeta, deletePdiMeta,
  type DBCurso, type DBPdi, type DBPdiMeta
} from "@/services/trainingService";
import { getProfiles, type DBProfile } from "@/services/profileService";

const cardGradients: Record<string, string> = {
  Analytics: "from-blue-400 to-cyan-400",
  Criativos: "from-orange-400 to-rose-400",
  Ferramentas: "from-amber-400 to-orange-400",
  Processos: "from-purple-400 to-indigo-400",
  Atendimento: "from-green-400 to-emerald-400",
  default: "from-slate-400 to-gray-500"
};

const nivelCores: Record<string, string> = {
  Iniciante: "bg-green-500/10 text-green-600",
  Intermediário: "bg-amber-500/10 text-amber-600",
  Avançado: "bg-red-500/10 text-red-600",
  default: "bg-gray-500/10 text-gray-600",
};

const categorias = ["Analytics", "Criativos", "Ferramentas", "Processos", "Atendimento"];
const niveis = ["Iniciante", "Intermediário", "Avançado"];

type Tab = "cursos" | "pdis";

export function Treinamentos() {
  const { user: _user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') as Tab) || 'cursos';
  const setTab = useCallback((newTab: Tab) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', newTab);
      return next;
    }, { replace: true });
  }, [setSearchParams]);
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");

  // State Cursos
  const [cursos, setCursos] = useState<DBCurso[]>([]);
  const [loadingCursos, setLoadingCursos] = useState(true);
  const [selectedCurso, setSelectedCurso] = useState<DBCurso | null>(null);
  const [editingCurso, setEditingCurso] = useState<DBCurso | null>(null);
  const [showCursoForm, setShowCursoForm] = useState(false);

  // State PDIs
  const [pdis, setPdis] = useState<DBPdi[]>([]);
  const [loadingPdis, setLoadingPdis] = useState(true);
  const [editingPdi, setEditingPdi] = useState<DBPdi | null>(null);
  const [showPdiForm, setShowPdiForm] = useState(false);
  const [selectedPdi, setSelectedPdi] = useState<DBPdi | null>(null); // For detail/metas modal
  const [profiles, setProfiles] = useState<DBProfile[]>([]);

  useEffect(() => {
    if (tab === "cursos") fetchCursos();
    else fetchPdis();
  }, [tab]);

  useEffect(() => {
    getProfiles().then(setProfiles).catch(console.error);
  }, []);

  async function fetchCursos() {
    setLoadingCursos(true);
    try {
      const data = await getCursos();
      setCursos(data);
    } catch (e) { console.error(e); } finally { setLoadingCursos(false); }
  }

  async function fetchPdis() {
    setLoadingPdis(true);
    try {
      const data = await getPdis();
      setPdis(data);
    } catch (e) { console.error(e); } finally { setLoadingPdis(false); }
  }

  async function handleDeleteCurso(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Excluir este curso?")) return;
    try {
      await deleteCurso(id);
      fetchCursos();
    } catch (err) { console.error(err); alert("Erro ao excluir curso"); }
  }

  async function handleDeletePdi(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Excluir este PDI?")) return;
    try {
      await deletePdi(id);
      fetchPdis();
    } catch (err) { console.error(err); alert("Erro ao excluir PDI"); }
  }

  const filtradosCursos = cursos.filter((c) => {
    const matchBusca = c.titulo.toLowerCase().includes(busca.toLowerCase()) || (c.descricao || "").toLowerCase().includes(busca.toLowerCase());
    const matchCategoria = filtroCategoria === "todas" || c.categoria === filtroCategoria;
    return matchBusca && matchCategoria;
  });

  const filtradosPdis = pdis.filter((p) => {
    const matchBusca = p.titulo.toLowerCase().includes(busca.toLowerCase()) || p.profiles?.full_name?.toLowerCase().includes(busca.toLowerCase());
    return matchBusca;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground">Treinamentos e PDI</h2>
          <p className="mt-1 text-sm text-muted">Desenvolva habilidades com cursos e acompanhe Planos de Desenvolvimento Individual.</p>
        </div>
        {tab === "cursos" ? (
          <button onClick={() => { setEditingCurso(null); setShowCursoForm(true); }} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all flex items-center gap-2 self-start">
            <Plus className="h-4 w-4" /> Novo Curso
          </button>
        ) : (
          <button onClick={() => { setEditingPdi(null); setShowPdiForm(true); }} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all flex items-center gap-2 self-start">
            <Plus className="h-4 w-4" /> Novo PDI
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-0.5 w-fit">
        <button onClick={() => setTab("cursos")} className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2", tab === "cursos" ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground")}>
          <Play className="h-3.5 w-3.5" /> Cursos
        </button>
        <button onClick={() => setTab("pdis")} className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2", tab === "pdis" ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground")}>
          <Target className="h-3.5 w-3.5" /> PDIs
        </button>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-md border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted focus:ring-2 focus:ring-letitia-gold focus:outline-none"
            placeholder={tab === "cursos" ? "Buscar cursos..." : "Buscar PDIs..."}
          />
        </div>
        {tab === "cursos" && (
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
          >
            <option value="todas">Todas categorias</option>
            {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {/* Content */}
      {tab === "cursos" ? (
        loadingCursos ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-letitia-gold" /></div>
        ) : (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtradosCursos.map((curso) => (
                <div key={curso.id} onClick={() => setSelectedCurso(curso)} className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow cursor-pointer group flex flex-col h-full relative">
                  
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex items-center gap-1 z-10">
                    <button onClick={(e) => { e.stopPropagation(); setEditingCurso(curso); setShowCursoForm(true); }} className="p-1.5 rounded-md bg-black/40 text-white hover:bg-black/60 transition-colors backdrop-blur-sm"><Edit2 className="h-3 w-3" /></button>
                    <button onClick={(e) => handleDeleteCurso(curso.id, e)} className="p-1.5 rounded-md bg-black/40 text-white hover:bg-red-500 transition-colors backdrop-blur-sm"><Trash2 className="h-3 w-3" /></button>
                  </div>

                  <div className={cn("relative h-28 bg-gradient-to-br p-4 flex flex-col justify-between shrink-0", cardGradients[curso.categoria] || cardGradients.default)}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-white px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm">
                        {curso.categoria || "Geral"}
                      </span>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white group-hover:scale-110 transition-transform">
                      <Play className="h-5 w-5 ml-0.5" />
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col">
                    <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 mb-2">{curso.titulo}</h4>
                    <p className="text-xs text-muted line-clamp-3 mb-4 flex-1">{curso.descricao}</p>

                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase", nivelCores[curso.nivel] || nivelCores.default)}>
                        {curso.nivel || "Geral"}
                      </span>
                      <span className="text-[10px] text-muted">{curso.instrutor}</span>
                    </div>
                  </div>
                </div>
              ))}
              {filtradosCursos.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted text-sm">Nenhum curso encontrado.</div>
              )}
            </div>
          </div>
        )
      ) : (
        loadingPdis ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-letitia-gold" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtradosPdis.map((pdi) => {
              const totalMetas = pdi.metas?.length || 0;
              const concluidas = pdi.metas?.filter(m => m.concluida).length || 0;
              const pct = totalMetas > 0 ? Math.round((concluidas / totalMetas) * 100) : 0;
              return (
                <div key={pdi.id} onClick={() => setSelectedPdi(pdi)} className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow cursor-pointer group flex flex-col relative">
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 flex items-center gap-1 z-10">
                    <button onClick={(e) => { e.stopPropagation(); setEditingPdi(pdi); setShowPdiForm(true); }} className="p-1.5 rounded-md hover:bg-foreground/10 text-muted"><Edit2 className="h-3.5 w-3.5" /></button>
                    <button onClick={(e) => handleDeletePdi(pdi.id, e)} className="p-1.5 rounded-md hover:bg-red-500/10 text-muted hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-border overflow-hidden shrink-0">
                      {pdi.profiles?.avatar_url ? (
                        <img src={pdi.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-letitia-gold/20 flex items-center justify-center text-letitia-gold font-bold">{pdi.profiles?.full_name?.charAt(0) || '?'}</div>
                      )}
                    </div>
                    <div className="min-w-0 pr-12">
                      <h4 className="font-semibold text-sm text-foreground truncate">{pdi.titulo}</h4>
                      <p className="text-xs text-muted truncate">{pdi.profiles?.full_name || 'Usuário Desconhecido'}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted line-clamp-2 mb-4 flex-1">{pdi.descricao}</p>
                  
                  <div className="mt-auto">
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-muted font-medium">{concluidas}/{totalMetas} Metas</span>
                      <span className="text-letitia-gold font-bold">{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", pct === 100 ? "bg-green-500" : "bg-letitia-gold")} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
            {filtradosPdis.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted text-sm">Nenhum PDI encontrado.</div>
            )}
          </div>
        )
      )}

      {/* Modals */}
      {selectedCurso && (
        <CursoDetailModal
          curso={selectedCurso}
          onClose={() => setSelectedCurso(null)}
          onUpdate={fetchCursos}
        />
      )}

      {showCursoForm && (
        <CursoFormModal
          curso={editingCurso}
          onClose={() => { setShowCursoForm(false); setEditingCurso(null); }}
          onSave={() => { setShowCursoForm(false); setEditingCurso(null); fetchCursos(); }}
        />
      )}

      {showPdiForm && (
        <PdiFormModal
          pdi={editingPdi}
          profiles={profiles}
          onClose={() => { setShowPdiForm(false); setEditingPdi(null); }}
          onSave={() => { setShowPdiForm(false); setEditingPdi(null); fetchPdis(); }}
        />
      )}

      {selectedPdi && (
        <PdiDetailModal
          pdi={selectedPdi}
          onClose={() => setSelectedPdi(null)}
          onUpdate={fetchPdis}
        />
      )}
    </div>
  );
}

// ─── Componentes Auxiliares (Modals) ──────────────────────────────────────────────────

function CursoFormModal({ curso, onClose, onSave }: { curso: DBCurso | null, onClose: () => void, onSave: () => void }) {
  const [titulo, setTitulo] = useState(curso?.titulo || "");
  const [descricao, setDescricao] = useState(curso?.descricao || "");
  const [categoria, setCategoria] = useState(curso?.categoria || categorias[0]);
  const [nivel, setNivel] = useState(curso?.nivel || niveis[0]);
  const [instrutor, setInstrutor] = useState(curso?.instrutor || "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;
    setSaving(true);
    try {
      const payload = { titulo, descricao, categoria, nivel, instrutor, publicado: true };
      if (curso) await updateCurso(curso.id, payload);
      else await createCurso(payload);
      onSave();
    } catch (e) { console.error(e); alert("Erro ao salvar curso."); } finally { setSaving(false); }
  }

  return (
    <div className="modal-overlay items-center justify-center p-4 z-50">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-6 relative">
        <button onClick={onClose} className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-foreground/10 text-muted"><X className="h-4 w-4" /></button>
        <h3 className="font-serif text-lg font-semibold text-foreground mb-5">{curso ? "Editar Curso" : "Novo Curso"}</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1.5">Título</label>
            <input value={titulo} onChange={e => setTitulo(e.target.value)} required className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-letitia-gold outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1.5">Descrição</label>
            <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={3} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-letitia-gold outline-none resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1.5">Categoria</label>
              <select value={categoria} onChange={e => setCategoria(e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-letitia-gold outline-none">
                {categorias.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1.5">Nível</label>
              <select value={nivel} onChange={e => setNivel(e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-letitia-gold outline-none">
                {niveis.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1.5">Instrutor</label>
            <input value={instrutor} onChange={e => setInstrutor(e.target.value)} required className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-letitia-gold outline-none" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-muted hover:text-foreground">Cancelar</button>
            <button type="submit" disabled={saving} className="bg-letitia-gold text-white px-6 py-2 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {curso ? "Salvar" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PdiFormModal({ pdi, profiles, onClose, onSave }: { pdi: DBPdi | null, profiles: DBProfile[], onClose: () => void, onSave: () => void }) {
  const [titulo, setTitulo] = useState(pdi?.titulo || "");
  const [descricao, setDescricao] = useState(pdi?.descricao || "");
  const [userId, setUserId] = useState(pdi?.user_id || "");
  const [status, setStatus] = useState(pdi?.status || "em_andamento");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !userId) return alert("Preencha título e selecione um usuário.");
    setSaving(true);
    try {
      const payload = { titulo, descricao, user_id: userId, status: status as any };
      if (pdi) await updatePdi(pdi.id, payload);
      else await createPdi(payload);
      onSave();
    } catch (e) { console.error(e); alert("Erro ao salvar PDI."); } finally { setSaving(false); }
  }

  return (
    <div className="modal-overlay items-center justify-center p-4 z-50">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-6 relative">
        <button onClick={onClose} className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-foreground/10 text-muted"><X className="h-4 w-4" /></button>
        <h3 className="font-serif text-lg font-semibold text-foreground mb-5">{pdi ? "Editar PDI" : "Novo PDI"}</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4 overflow-visible">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1.5">Usuário</label>
            <UserSelector users={profiles} selectedIds={userId} onSelect={(id) => setUserId(typeof id === 'string' ? id : id[0] || '')} />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1.5">Título do PDI</label>
            <input value={titulo} onChange={e => setTitulo(e.target.value)} required className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-letitia-gold outline-none" placeholder="Ex: Formação em Tráfego" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1.5">Descrição / Foco</label>
            <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={3} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-letitia-gold outline-none resize-none" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1.5">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as "concluido" | "em_andamento" | "pausado")} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-letitia-gold outline-none">
              <option value="em_andamento">Em Andamento</option>
              <option value="concluido">Concluído</option>
              <option value="pausado">Pausado</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-muted hover:text-foreground">Cancelar</button>
            <button type="submit" disabled={saving} className="bg-letitia-gold text-white px-6 py-2 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {pdi ? "Salvar" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PdiDetailModal({ pdi, onClose, onUpdate }: { pdi: DBPdi, onClose: () => void, onUpdate: () => void }) {
  const [novaMeta, setNovaMeta] = useState("");
  const [saving, setSaving] = useState(false);
  
  // local copy for immediate UI update
  const [metas, setMetas] = useState<DBPdiMeta[]>(pdi.metas || []);

  async function handleAddMeta(e: React.FormEvent) {
    e.preventDefault();
    if (!novaMeta.trim()) return;
    setSaving(true);
    try {
      const added = await addPdiMeta(pdi.id, novaMeta, metas.length);
      setMetas([...metas, added]);
      setNovaMeta("");
      onUpdate();
    } catch (err) { console.error(err); alert("Erro ao adicionar meta"); } finally { setSaving(false); }
  }

  async function handleToggleMeta(meta: DBPdiMeta) {
    const newVal = !meta.concluida;
    setMetas(metas.map(m => m.id === meta.id ? { ...m, concluida: newVal } : m));
    try {
      await togglePdiMeta(meta.id, newVal);
      onUpdate();
    } catch (err) { console.error(err); setMetas(metas.map(m => m.id === meta.id ? { ...m, concluida: meta.concluida } : m)); }
  }

  async function handleDeleteMeta(id: string) {
    if (!confirm("Excluir meta?")) return;
    setMetas(metas.filter(m => m.id !== id));
    try {
      await deletePdiMeta(id);
      onUpdate();
    } catch (err) { console.error(err); onUpdate(); /* fallback */ }
  }

  const concluidas = metas.filter(m => m.concluida).length;
  const pct = metas.length > 0 ? Math.round((concluidas / metas.length) * 100) : 0;

  return (
    <div className="modal-overlay items-center justify-center p-4 z-40" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-xl flex flex-col max-h-[85vh]">
        <div className="p-5 border-b border-border flex items-start justify-between">
          <div className="flex items-center gap-3">
             <div className="h-12 w-12 rounded-full bg-border overflow-hidden shrink-0">
               {pdi.profiles?.avatar_url ? (
                 <img src={pdi.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
               ) : (
                 <div className="h-full w-full bg-letitia-gold/20 flex items-center justify-center text-letitia-gold font-bold text-lg">{pdi.profiles?.full_name?.charAt(0) || '?'}</div>
               )}
             </div>
             <div>
                <h3 className="font-serif text-xl font-semibold text-foreground leading-tight">{pdi.titulo}</h3>
                <p className="text-sm text-muted">{pdi.profiles?.full_name}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-foreground/10 text-muted"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {pdi.descricao && (
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">Foco do Plano</h4>
              <p className="text-sm text-foreground bg-foreground/5 p-4 rounded-xl leading-relaxed">{pdi.descricao}</p>
            </div>
          )}

          <div>
             <div className="flex items-center justify-between mb-3">
               <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted">Metas & Marcos</h4>
               <span className="text-xs font-semibold text-letitia-gold">{pct}% Concluído</span>
             </div>
             
             <div className="h-2 w-full bg-border rounded-full overflow-hidden mb-4">
               <div className={cn("h-full rounded-full transition-all duration-500", pct === 100 ? "bg-green-500" : "bg-letitia-gold")} style={{ width: `${pct}%` }} />
             </div>

             <div className="space-y-2">
               {metas.length === 0 ? (
                 <p className="text-sm text-muted text-center py-4 border border-dashed border-border rounded-xl">Nenhuma meta definida ainda.</p>
               ) : (
                 metas.map((meta, i) => (
                   <div key={meta.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background hover:border-letitia-gold/30 transition-colors group">
                     <button onClick={() => handleToggleMeta(meta)} className="flex-shrink-0 text-muted hover:text-letitia-gold transition-colors">
                       {meta.concluida ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Circle className="h-5 w-5" />}
                     </button>
                     <span className={cn("flex-1 text-sm font-medium transition-colors", meta.concluida ? "text-muted line-through" : "text-foreground")}>
                       {i + 1}. {meta.titulo}
                     </span>
                     <button onClick={() => handleDeleteMeta(meta.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-500/10 text-muted hover:text-red-500 transition-all">
                       <Trash2 className="h-4 w-4" />
                     </button>
                   </div>
                 ))
               )}
             </div>

             <form onSubmit={handleAddMeta} className="mt-4 flex gap-2">
               <input
                 value={novaMeta}
                 onChange={e => setNovaMeta(e.target.value)}
                 placeholder="Adicionar nova meta..."
                 className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-letitia-gold outline-none"
               />
               <button type="submit" disabled={saving || !novaMeta.trim()} className="bg-foreground/5 hover:bg-foreground/10 text-foreground px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
                 {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Adicionar
               </button>
             </form>
          </div>
        </div>
      </div>
    </div>
  );
}
