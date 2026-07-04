import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Search, Plus, Play, Loader2, Edit2, Trash2, X, Save } from "lucide-react";
import { CursoDetailModal } from "@/components/CursoDetailModal";
import { 
  getCursos, createCurso, updateCurso, deleteCurso, 
  type DBCurso
} from "@/services/trainingService";

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

export function Treinamentos() {
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");

  // State Cursos
  const [cursos, setCursos] = useState<DBCurso[]>([]);
  const [loadingCursos, setLoadingCursos] = useState(true);
  const [selectedCurso, setSelectedCurso] = useState<DBCurso | null>(null);
  const [editingCurso, setEditingCurso] = useState<DBCurso | null>(null);
  const [showCursoForm, setShowCursoForm] = useState(false);

  const { cursoId: urlCursoId, aulaId: urlAulaId } = useParams<{ cursoId?: string; aulaId?: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCursos();
  }, []);

  async function fetchCursos() {
    setLoadingCursos(true);
    try {
      const data = await getCursos();
      setCursos(data);
      // Deep-link: abrir curso/aula da URL automaticamente
      if (urlCursoId && !selectedCurso) {
        const match = data.find((c: DBCurso) => c.id === urlCursoId);
        if (match) setSelectedCurso(match);
      }
    } catch (e) { console.error(e); } finally { setLoadingCursos(false); }
  }

  async function handleDeleteCurso(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Excluir este curso?")) return;
    try {
      await deleteCurso(id);
      fetchCursos();
    } catch (err) { console.error(err); alert("Erro ao excluir curso"); }
  }

  const filtradosCursos = cursos.filter((c) => {
    const matchBusca = c.titulo.toLowerCase().includes(busca.toLowerCase()) || (c.descricao || "").toLowerCase().includes(busca.toLowerCase());
    const matchCategoria = filtroCategoria === "todas" || c.categoria === filtroCategoria;
    return matchBusca && matchCategoria;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground">Universidade Laetitia</h2>
          <p className="mt-1 text-sm text-muted">Desenvolva habilidades com cursos e treinamentos internos.</p>
          <a href="https://jpconfins.com.br/transicao-laetitia/" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-letitia-gold hover:text-letitia-gold/80 transition-colors border border-letitia-gold/30 bg-letitia-gold/5 hover:bg-letitia-gold/10 rounded-lg px-3 py-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Guia de Transição
          </a>
        </div>
        <button onClick={() => { setEditingCurso(null); setShowCursoForm(true); }} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all flex items-center gap-2 self-start">
            <Plus className="h-4 w-4" /> Novo Curso
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
            placeholder="Buscar cursos..."
          />
        </div>
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
        >
          <option value="todas">Todas categorias</option>
          {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Content */}
      {loadingCursos ? (
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
      )}

      {/* Modals */}
      {selectedCurso && (
        <CursoDetailModal
          curso={selectedCurso}
          onClose={() => { setSelectedCurso(null); navigate('/treinamentos', { replace: true }); }}
          onUpdate={fetchCursos}
          initialAulaId={urlAulaId}
        />
      )}

      {showCursoForm && (
        <CursoFormModal
          curso={editingCurso}
          onClose={() => { setShowCursoForm(false); setEditingCurso(null); }}
          onSave={() => { setShowCursoForm(false); setEditingCurso(null); fetchCursos(); }}
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
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;
    setSaving(true);
    try {
      const payload = { titulo, descricao, categoria, nivel, publicado: true };
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
