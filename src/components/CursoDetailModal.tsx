import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  X, Plus, Loader2, Play, Trash2, Edit2, Check, GripVertical,
  CheckCircle2, Circle, ChevronDown, ChevronUp, Save, Video, FileText, Link2
} from "lucide-react";
import {
  getAulas, createAula, updateAula, deleteAula,
  getProgressoCurso, toggleAulaConcluida, toEmbedUrl,
  type DBCurso, type DBAula
} from "@/services/trainingService";

interface Props {
  curso: DBCurso;
  onClose: () => void;
  onUpdate: () => void;
}

export function CursoDetailModal({ curso, onClose, onUpdate }: Props) {
  const { user } = useAuth();
  const [aulas, setAulas] = useState<DBAula[]>([]);
  const [loading, setLoading] = useState(true);
  const [progresso, setProgresso] = useState<Record<string, boolean>>({});
  const [selectedAula, setSelectedAula] = useState<DBAula | null>(null);
  const [showAddAula, setShowAddAula] = useState(false);
  const [editingAula, setEditingAula] = useState<DBAula | null>(null);

  useEffect(() => { fetchAulas(); }, []);

  async function fetchAulas() {
    try {
      const [aulasData, progressoData] = await Promise.all([
        getAulas(curso.id),
        user ? getProgressoCurso(curso.id, user.id) : Promise.resolve([]),
      ]);
      setAulas(aulasData);
      const pMap: Record<string, boolean> = {};
      progressoData.forEach((p: any) => { pMap[p.aula_id] = p.concluida; });
      setProgresso(pMap);
      if (aulasData.length > 0 && !selectedAula) setSelectedAula(aulasData[0]);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  async function handleToggle(aulaId: string) {
    if (!user) return;
    const next = !progresso[aulaId];
    setProgresso(prev => ({ ...prev, [aulaId]: next }));
    try { await toggleAulaConcluida(aulaId, user.id, next); } catch (e) { console.error(e); }
  }

  async function handleDeleteAula(id: string) {
    if (!confirm("Excluir esta aula?")) return;
    try {
      await deleteAula(id);
      setAulas(prev => prev.filter(a => a.id !== id));
      if (selectedAula?.id === id) setSelectedAula(null);
    } catch (e) { console.error(e); }
  }

  const totalAulas = aulas.length;
  const concluidas = Object.values(progresso).filter(Boolean).length;
  const pct = totalAulas > 0 ? Math.round((concluidas / totalAulas) * 100) : 0;

  return (
    <div className="modal-overlay items-center justify-center p-2 sm:p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-6xl max-h-[95vh] bg-card border border-border rounded-2xl shadow-lg modal-content flex flex-col md:flex-row overflow-hidden">

        {/* Sidebar - Lista de Aulas */}
        <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-border flex flex-col bg-background/50 max-h-[40vh] md:max-h-none">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-serif text-lg font-semibold text-foreground truncate pr-2">{curso.titulo}</h3>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-foreground/10 text-muted flex-shrink-0"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted mb-2">
              <span className="px-2 py-0.5 rounded-full bg-letitia-gold/10 text-letitia-clay font-semibold text-[10px]">{curso.categoria}</span>
              <span>{totalAulas} aulas</span>
            </div>
            {totalAulas > 0 && (
              <div>
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-muted">{concluidas}/{totalAulas} concluídas</span>
                  <span className="text-letitia-gold font-bold">{pct}%</span>
                </div>
                <div className="h-1.5 bg-border rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", pct === 100 ? "bg-green-500" : "bg-letitia-gold")} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-letitia-gold" /></div>
            ) : aulas.length === 0 ? (
              <p className="text-xs text-muted text-center py-6">Nenhuma aula cadastrada.</p>
            ) : (
              aulas.map((aula, idx) => (
                <button
                  key={aula.id}
                  onClick={() => { setSelectedAula(aula); setEditingAula(null); }}
                  className={cn(
                    "w-full flex items-center gap-2 p-2.5 rounded-xl text-left transition-colors group",
                    selectedAula?.id === aula.id ? "bg-letitia-gold/10 border border-letitia-gold/30" : "hover:bg-foreground/5 border border-transparent"
                  )}
                >
                  <button
                    onClick={e => { e.stopPropagation(); handleToggle(aula.id); }}
                    className="flex-shrink-0"
                  >
                    {progresso[aula.id] ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted/40" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs font-medium truncate", progresso[aula.id] ? "text-muted line-through" : "text-foreground")}>{idx + 1}. {aula.titulo}</p>
                    {aula.duracao_minutos > 0 && <span className="text-[10px] text-muted">{aula.duracao_minutos}min</span>}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-0.5">
                    <button onClick={e => { e.stopPropagation(); setEditingAula(aula); setSelectedAula(aula); }} className="p-1 rounded hover:bg-foreground/10 text-muted"><Edit2 className="h-3 w-3" /></button>
                    <button onClick={e => { e.stopPropagation(); handleDeleteAula(aula.id); }} className="p-1 rounded hover:bg-red-500/10 text-muted hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="p-2 border-t border-border">
            <button onClick={() => { setShowAddAula(true); setEditingAula(null); }} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-letitia-gold/40 text-letitia-gold hover:bg-letitia-gold/5 text-xs font-medium transition-colors">
              <Plus className="h-3.5 w-3.5" /> Adicionar Aula
            </button>
          </div>
        </div>

        {/* Main Content - Player ou Form */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {showAddAula || editingAula ? (
            <AulaForm
              cursoId={curso.id}
              aula={editingAula}
              nextOrdem={aulas.length}
              onSave={() => { setShowAddAula(false); setEditingAula(null); fetchAulas(); }}
              onCancel={() => { setShowAddAula(false); setEditingAula(null); }}
            />
          ) : selectedAula ? (
            <AulaPlayer aula={selectedAula} />
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <Play className="h-12 w-12 text-muted/20 mx-auto mb-3" />
                <p className="text-sm text-muted">Selecione uma aula para começar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Aula Player (Video Embed) ─────────────────────────── */
function AulaPlayer({ aula }: { aula: DBAula }) {
  const embedUrl = aula.video_url ? toEmbedUrl(aula.video_url) : null;

  return (
    <div className="flex-1 flex flex-col">
      {embedUrl ? (
        <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            title={aula.titulo}
          />
        </div>
      ) : (
        <div className="h-48 bg-foreground/5 flex items-center justify-center">
          <FileText className="h-10 w-10 text-muted/30" />
        </div>
      )}
      <div className="p-6 space-y-3">
        <h2 className="font-serif text-xl font-semibold text-foreground">{aula.titulo}</h2>
        <div className="flex items-center gap-3 text-xs text-muted">
          {aula.tipo === 'video' && <span className="flex items-center gap-1"><Video className="h-3 w-3" /> Vídeo</span>}
          {aula.duracao_minutos > 0 && <span>{aula.duracao_minutos} minutos</span>}
        </div>
        {aula.descricao && <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">{aula.descricao}</p>}
        {aula.video_url && !embedUrl && (
          <a href={aula.video_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-letitia-clay hover:text-letitia-gold transition-colors">
            <Link2 className="h-3 w-3" /> Abrir link externo
          </a>
        )}
      </div>
    </div>
  );
}

/* ─── Aula Form (Add/Edit) ──────────────────────────────── */
function AulaForm({ cursoId, aula, nextOrdem, onSave, onCancel }: {
  cursoId: string; aula: DBAula | null; nextOrdem: number; onSave: () => void; onCancel: () => void;
}) {
  const [titulo, setTitulo] = useState(aula?.titulo || "");
  const [descricao, setDescricao] = useState(aula?.descricao || "");
  const [videoUrl, setVideoUrl] = useState(aula?.video_url || "");
  const [tipo, setTipo] = useState(aula?.tipo || "video");
  const [duracao, setDuracao] = useState(aula?.duracao_minutos || 0);
  const [saving, setSaving] = useState(false);

  const previewUrl = videoUrl ? toEmbedUrl(videoUrl) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;
    setSaving(true);
    try {
      const payload = { titulo: titulo.trim(), descricao, video_url: videoUrl || null, tipo, duracao_minutos: duracao };
      if (aula) {
        await updateAula(aula.id, payload);
      } else {
        await createAula({ ...payload, curso_id: cursoId, ordem: nextOrdem });
      }
      onSave();
    } catch (e) { console.error(e); alert("Erro ao salvar aula."); } finally { setSaving(false); }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg font-semibold text-foreground">{aula ? "Editar Aula" : "Nova Aula"}</h3>
        <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-foreground/10 text-muted"><X className="h-4 w-4" /></button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1.5">Título da Aula</label>
          <input value={titulo} onChange={e => setTitulo(e.target.value)} required className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-letitia-gold outline-none" placeholder="Ex: Introdução ao módulo" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1.5">Tipo</label>
            <select value={tipo} onChange={e => setTipo(e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-letitia-gold outline-none">
              <option value="video">Vídeo</option>
              <option value="texto">Texto</option>
              <option value="link">Link Externo</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1.5">Duração (min)</label>
            <input type="number" min={0} value={duracao} onChange={e => setDuracao(+e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-letitia-gold outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1.5">URL do Vídeo (YouTube, Vimeo ou Google Drive)</label>
          <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-letitia-gold outline-none" placeholder="https://youtube.com/watch?v=... ou vimeo.com/..." />
          {previewUrl && (
            <div className="mt-3 rounded-xl overflow-hidden border border-border bg-black" style={{ paddingBottom: '56.25%', position: 'relative' }}>
              <iframe src={previewUrl} className="absolute inset-0 w-full h-full" allowFullScreen title="Preview" />
            </div>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1.5">Descrição</label>
          <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={3} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-letitia-gold outline-none resize-none" placeholder="Descrição da aula..." />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors">Cancelar</button>
          <button type="submit" disabled={saving} className="bg-letitia-gold text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {aula ? "Salvar" : "Criar Aula"}
          </button>
        </div>
      </form>
    </div>
  );
}
