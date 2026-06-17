import { useState, useEffect, useRef } from "react";
import {
  updateContent, deleteContent,
  getConteudoComentarios, addConteudoComentario,
  type DBContent, type DBConteudoComentario
} from "@/services/contentService";
import { type DBProfile } from "@/services/profileService";
import { type SocialProfile } from "@/services/socialProfileService";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  X, Save, Loader2, Send, MessageSquare, AlertTriangle,
  Calendar, Clock, Link2, Trash2, Plus, Lightbulb, FileText,
  ArrowRight, RefreshCw, Share2, ChevronDown, ChevronUp
} from "lucide-react";

const STATUS_OPTIONS = [
  { id: "legenda", label: "🟠 Escrever Legenda", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { id: "ajuste", label: "⚠️ Precisa de Ajuste", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  { id: "pronto", label: "🔵 Pronto para Postar", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "programado", label: "⏰ Programado", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { id: "postado", label: "✅ Postado", color: "bg-green-50 text-green-700 border-green-200" },
  { id: "cancelado", label: "❌ Cancelado", color: "bg-red-50 text-red-700 border-red-200" },
];

const FORMATO_OPTIONS = [
  { id: "reels", label: "Reels" },
  { id: "carrossel", label: "Carrossel" },
  { id: "post", label: "Post" },
  { id: "youtube", label: "YouTube" },
  { id: "podcast", label: "Podcast" },
  { id: "newsletter", label: "Newsletter" },
];

function statusLabel(id: string) {
  return STATUS_OPTIONS.find(s => s.id === id)?.label || id;
}

interface ConteudoDetailModalProps {
  conteudo: DBContent;
  profiles: DBProfile[];
  socialProfiles: SocialProfile[];
  onClose: () => void;
  onUpdate: () => void;
}

// Strip seconds from time string: "14:27:00" → "14:27"
function formatTime(t: string | null | undefined): string {
  if (!t) return "";
  return t.split(":").slice(0, 2).join(":");
}

export function ConteudoDetailModal({ conteudo, profiles, socialProfiles, onClose, onUpdate }: ConteudoDetailModalProps) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [historico, setHistorico] = useState<DBConteudoComentario[]>([]);
  const [historicoOpen, setHistoricoOpen] = useState(false);
  const [novoComentario, setNovoComentario] = useState("");
  const [tipoComentario, setTipoComentario] = useState<"comentario" | "ajuste">("comentario");
  const [loadingHistorico, setLoadingHistorico] = useState(true);
  const historicoEndRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    titulo: conteudo.titulo,
    status: conteudo.status || "legenda",
    formato: conteudo.formato,
    plataforma: conteudo.plataforma,
    responsavel_id: conteudo.responsavel_id || "",
    data_prevista: conteudo.data_prevista,
    horario_previsto: formatTime(conteudo.horario_previsto),
    prazo_seguranca: conteudo.prazo_seguranca || "",
    big_idea: conteudo.big_idea || "",
    roteiro: conteudo.roteiro || "",
    descricao: conteudo.descricao || "",
    links: conteudo.links || [],
    collab_plataformas: conteudo.collab_plataformas || [],
  });

  const [newLink, setNewLink] = useState("");

  // Accordion states for mobile — start open if field has content
  const [bigIdeaOpen, setBigIdeaOpen] = useState(!!conteudo.big_idea);
  const [roteiroOpen, setRoteiroOpen] = useState(!!conteudo.roteiro);
  const [descricaoOpen, setDescricaoOpen] = useState(!!conteudo.descricao);

  useEffect(() => {
    fetchHistorico();
  }, []);

  useEffect(() => {
    historicoEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [historico]);

  async function fetchHistorico() {
    try {
      const data = await getConteudoComentarios(conteudo.id);
      setHistorico(data);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
    } finally {
      setLoadingHistorico(false);
    }
  }

  // Log a trail entry automatically
  async function logRastro(mensagem: string) {
    if (!user) return;
    try {
      const entry = await addConteudoComentario(conteudo.id, user.id, mensagem, "rastro");
      setHistorico(prev => [...prev, entry]);
    } catch (e) {
      console.error("Erro ao registrar rastro:", e);
    }
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      // Detect changes and log trail entries
      const trails: string[] = [];

      if (form.status !== conteudo.status) {
        trails.push(`Mudou etapa: ${statusLabel(conteudo.status)} → ${statusLabel(form.status)}`);
      }
      if (form.responsavel_id !== (conteudo.responsavel_id || "")) {
        const oldName = profiles.find(p => p.id === conteudo.responsavel_id)?.full_name || "Nenhum";
        const newName = profiles.find(p => p.id === form.responsavel_id)?.full_name || "Nenhum";
        trails.push(`Mudou responsável: ${oldName} → ${newName}`);
      }
      if (form.plataforma !== conteudo.plataforma) {
        trails.push(`Mudou perfil: ${conteudo.plataforma} → ${form.plataforma}`);
      }
      if (form.data_prevista !== conteudo.data_prevista) {
        trails.push(`Mudou data prevista: ${conteudo.data_prevista} → ${form.data_prevista}`);
      }
      if (form.titulo !== conteudo.titulo) {
        trails.push(`Editou título: "${conteudo.titulo}" → "${form.titulo}"`);
      }
      if (form.formato !== conteudo.formato) {
        trails.push(`Mudou formato: ${conteudo.formato} → ${form.formato}`);
      }
      if (form.horario_previsto !== formatTime(conteudo.horario_previsto)) {
        const oldTime = formatTime(conteudo.horario_previsto) || "Nenhum";
        const newTime = form.horario_previsto || "Nenhum";
        trails.push(`Mudou horário: ${oldTime} → ${newTime}`);
      }

      await updateContent(conteudo.id, {
        titulo: form.titulo,
        status: form.status,
        formato: form.formato,
        plataforma: form.plataforma,
        responsavel_id: form.responsavel_id || null,
        data_prevista: form.data_prevista,
        horario_previsto: form.horario_previsto || null,
        prazo_seguranca: form.prazo_seguranca || null,
        big_idea: form.big_idea || null,
        roteiro: form.roteiro || null,
        descricao: form.descricao || null,
        links: form.links.length > 0 ? form.links : null,
        collab_plataformas: form.collab_plataformas.length > 0 ? form.collab_plataformas : null,
      });

      // Log all trails
      for (const trail of trails) {
        await logRastro(trail);
      }

      onUpdate();
    } catch (error) {
      console.error("Erro ao salvar:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteContent(conteudo.id);
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Erro ao deletar:", error);
      setDeleting(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/editorial?id=${conteudo.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (e) {
      console.error("Erro ao copiar link", e);
    }
  };

  const handleAddComment = async () => {
    if (!novoComentario.trim() || !user) return;
    try {
      const comment = await addConteudoComentario(conteudo.id, user.id, novoComentario.trim(), tipoComentario);
      setHistorico(prev => [...prev, comment]);
      setNovoComentario("");
      setTipoComentario("comentario");
    } catch (error) {
      console.error("Erro ao adicionar comentário:", error);
    }
  };

  const handleAddLink = () => {
    if (!newLink.trim()) return;
    setForm(prev => ({ ...prev, links: [...prev.links, newLink.trim()] }));
    setNewLink("");
  };

  const handleRemoveLink = (idx: number) => {
    setForm(prev => ({ ...prev, links: prev.links.filter((_, i) => i !== idx) }));
  };

  const sp = socialProfiles.find(p => p.nome === form.plataforma);

  // Icons for different entry types
  function EntryIcon({ tipo }: { tipo: string }) {
    if (tipo === "ajuste") return <AlertTriangle className="h-3 w-3 text-amber-500" />;
    if (tipo === "rastro") return <RefreshCw className="h-3 w-3 text-purple-400" />;
    return <MessageSquare className="h-3 w-3 text-blue-400" />;
  }

  return (
    <div className="modal-overlay modal-overlay-z60 items-stretch justify-end" onClick={onClose}>
      <div
        className="w-full max-w-4xl bg-card border-l border-border shadow-lg flex flex-col xl:flex-row modal-slide-right overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Left: Content Detail */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 xl:p-8 pb-24 xl:pb-8 space-y-6">
          {/* Mobile close button */}
          <div className="flex xl:hidden items-center justify-between mb-2">
            <span />
            <button onClick={onClose} className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-foreground/5 transition-colors" title="Fechar">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Top badges */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <select
                value={form.formato}
                onChange={e => setForm({ ...form, formato: e.target.value })}
                className={cn(
                  "text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border cursor-pointer appearance-none",
                  "bg-letitia-gold/10 text-letitia-clay border-letitia-gold/30"
                )}
              >
                {FORMATO_OPTIONS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>

              {sp && (
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border text-foreground bg-background border-border">
                  {sp.avatar_url ? (
                    <img src={sp.avatar_url} alt="" className="h-4 w-4 rounded-full object-cover" />
                  ) : (
                    <div className="h-4 w-4 rounded-full text-[7px] font-bold text-white flex items-center justify-center" style={{ backgroundColor: sp.cor }}>
                      {sp.nome.charAt(0)}
                    </div>
                  )}
                  {sp.nome}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted">
              {confirmDelete ? (
                <div className="flex items-center gap-1.5 bg-red-50 px-2 py-1 rounded-md border border-red-100">
                  <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Certeza?</span>
                  <button onClick={handleDelete} className="p-1 rounded text-white bg-red-500 hover:bg-red-600" title="Sim, Excluir">
                    {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className="p-1 rounded text-red-700 bg-red-100 hover:bg-red-200">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <>
                  <button onClick={handleShare} className="p-1.5 rounded-md hover:bg-foreground/5 text-muted hover:text-foreground transition-colors relative" title="Compartilhar">
                    <Share2 className="h-4 w-4" />
                    {copiedLink && (
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-2 py-1 rounded whitespace-nowrap shadow-md z-10">Copiado!</span>
                    )}
                  </button>
                  <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded-md hover:bg-red-50 text-muted hover:text-red-500 transition-colors" title="Excluir">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Title */}
          <input
            value={form.titulo}
            onChange={e => setForm({ ...form, titulo: e.target.value })}
            className="w-full text-2xl font-serif font-semibold text-foreground bg-transparent border-0 focus:outline-none focus:ring-0 placeholder:text-muted/40"
            placeholder="Título do conteúdo"
          />

          {/* Pipeline + Responsavel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border p-4">
              <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-letitia-clay mb-2">Etapa do Pipeline</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full bg-transparent text-sm font-medium text-foreground border-0 focus:outline-none cursor-pointer appearance-none"
              >
                {STATUS_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div className="rounded-xl border border-border p-4">
              <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-letitia-clay mb-2">Responsável</label>
              <select
                value={form.responsavel_id}
                onChange={e => setForm({ ...form, responsavel_id: e.target.value })}
                className="w-full bg-transparent text-sm font-medium text-foreground border-0 focus:outline-none cursor-pointer appearance-none"
              >
                <option value="">Nenhum</option>
                {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}
              </select>
            </div>
          </div>

          {/* Dates + Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border p-4">
              <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-letitia-clay mb-2 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Data Prevista
              </label>
              <input
                type="date"
                value={form.data_prevista}
                onChange={e => setForm({ ...form, data_prevista: e.target.value })}
                className="w-full bg-transparent text-sm font-medium text-foreground border-0 focus:outline-none cursor-pointer"
              />
            </div>
            <div className="rounded-xl border border-letitia-gold/30 bg-letitia-gold/5 p-4">
              <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-letitia-clay mb-2 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Horário do Post
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={form.horario_previsto}
                  onChange={async (e) => {
                    const newTime = e.target.value;
                    setForm(prev => ({ ...prev, horario_previsto: newTime }));
                    // Auto-save time
                    try {
                      await updateContent(conteudo.id, { horario_previsto: newTime || null });
                      if (newTime !== formatTime(conteudo.horario_previsto)) {
                        const oldT = formatTime(conteudo.horario_previsto) || "Nenhum";
                        await logRastro(`Mudou horário: ${oldT} → ${newTime}`);
                      }
                    } catch (err) { console.error("Erro ao salvar horário:", err); }
                  }}
                  className="flex-1 bg-transparent text-sm font-medium text-foreground border-0 focus:outline-none cursor-pointer"
                />
                {form.horario_previsto && (
                  <button type="button" onClick={async () => {
                    setForm(prev => ({ ...prev, horario_previsto: "" }));
                    try {
                      await updateContent(conteudo.id, { horario_previsto: null });
                      const oldT = formatTime(conteudo.horario_previsto) || "Nenhum";
                      if (oldT !== "Nenhum") await logRastro(`Removeu horário (era ${oldT})`);
                    } catch (err) { console.error("Erro ao remover horário:", err); }
                  }} className="text-[9px] text-red-400 hover:text-red-500 transition-colors">
                    ✕
                  </button>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-border p-4">
              <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-orange-500 mb-2 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Prazo de Segurança
              </label>
              <input
                type="date"
                value={form.prazo_seguranca}
                onChange={e => setForm({ ...form, prazo_seguranca: e.target.value })}
                className="w-full bg-transparent text-sm font-medium text-foreground border-0 focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Plataforma */}
          <div className="rounded-xl border border-border p-4">
            <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-letitia-clay mb-2">Perfil / Plataforma</label>
            <select
              value={form.plataforma}
              onChange={e => setForm({ ...form, plataforma: e.target.value })}
              className="w-full bg-transparent text-sm font-medium text-foreground border-0 focus:outline-none cursor-pointer appearance-none"
            >
              {socialProfiles.map(sp => <option key={sp.id} value={sp.nome}>{sp.nome}</option>)}
            </select>
          </div>

          {/* Collab Toggle */}
          <div className="rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-letitia-clay">
                <Link2 className="h-3 w-3" /> Collab
              </label>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, collab_plataformas: prev.collab_plataformas.length > 0 ? [] : [] }))}
                className={cn("relative w-10 h-5 rounded-full transition-all duration-300", form.collab_plataformas.length > 0 ? "bg-letitia-gold" : "bg-foreground/15")}
              >
                <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-md transition-all duration-300", form.collab_plataformas.length > 0 ? "left-[22px]" : "left-0.5")} />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {socialProfiles.filter(sp => sp.nome !== form.plataforma).map(sp => {
                const sel = form.collab_plataformas.includes(sp.nome);
                return (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => setForm(prev => ({
                      ...prev,
                      collab_plataformas: sel
                        ? prev.collab_plataformas.filter(n => n !== sp.nome)
                        : [...prev.collab_plataformas, sp.nome]
                    }))}
                    className={cn(
                      "flex items-center gap-1 pl-0.5 pr-2 py-0.5 rounded-full text-[10px] font-medium border transition-all",
                      sel ? "border-letitia-gold bg-letitia-gold/10 text-foreground" : "border-border bg-card text-muted hover:text-foreground"
                    )}
                  >
                    {sp.avatar_url ? (
                      <img src={sp.avatar_url} alt="" className="h-4 w-4 rounded-full object-cover" />
                    ) : (
                      <div className="h-4 w-4 rounded-full flex items-center justify-center text-[6px] font-bold text-white" style={{ backgroundColor: sp.cor }}>
                        {sp.nome.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {sp.nome}
                    {sel && <span className="text-letitia-gold">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-letitia-clay">Conteúdo do Post</h3>
              <button
                onClick={handleSave}
                disabled={saving || deleting}
                className="flex items-center gap-1.5 bg-letitia-gold text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-md shadow-letitia-gold/20 hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                Salvar
              </button>
            </div>

            {/* Big Idea */}
            <div className="rounded-xl border-2 border-amber-200 bg-amber-50/50 mb-4 overflow-hidden">
              <button
                type="button"
                onClick={() => setBigIdeaOpen(!bigIdeaOpen)}
                className="w-full xl:hidden flex items-center justify-between p-4"
              >
                <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-amber-600 pointer-events-none">
                  <Lightbulb className="h-3 w-3" /> Big Idea
                  {!bigIdeaOpen && form.big_idea && <span className="ml-2 text-amber-400 font-normal normal-case tracking-normal truncate max-w-[150px] inline-block align-bottom">— {form.big_idea}</span>}
                </label>
                {bigIdeaOpen ? <ChevronUp className="h-4 w-4 text-amber-400" /> : <ChevronDown className="h-4 w-4 text-amber-400" />}
              </button>
              <div className={cn("xl:block", bigIdeaOpen ? "block" : "hidden")}>
                <div className="hidden xl:flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-amber-600 mb-2 px-4 pt-4">
                  <Lightbulb className="h-3 w-3" /> Big Idea
                </div>
                <div className="px-4 pb-4">
                  <textarea
                    value={form.big_idea}
                    onChange={e => setForm({ ...form, big_idea: e.target.value })}
                    className="w-full bg-transparent text-sm text-foreground border-0 focus:outline-none resize-none min-h-[60px] placeholder:text-amber-300"
                    placeholder="Qual a grande ideia por trás deste post?"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Roteiro / Legenda */}
            <div className="rounded-xl border border-border bg-background mb-4 overflow-hidden">
              <button
                type="button"
                onClick={() => setRoteiroOpen(!roteiroOpen)}
                className="w-full xl:hidden flex items-center justify-between p-4"
              >
                <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-letitia-clay pointer-events-none">
                  <FileText className="h-3 w-3" /> Roteiro / Legenda
                  {!roteiroOpen && form.roteiro && <span className="ml-2 text-muted font-normal normal-case tracking-normal truncate max-w-[150px] inline-block align-bottom">— preenchido</span>}
                </label>
                {roteiroOpen ? <ChevronUp className="h-4 w-4 text-muted" /> : <ChevronDown className="h-4 w-4 text-muted" />}
              </button>
              <div className={cn("xl:block", roteiroOpen ? "block" : "hidden")}>
                <div className="hidden xl:flex items-center justify-between mb-2 px-4 pt-4">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-letitia-clay">
                    <FileText className="h-3 w-3" /> Roteiro / Legenda
                  </label>
                </div>
                <div className="px-4 pb-4">
                  <textarea
                    value={form.roteiro}
                    onChange={e => setForm({ ...form, roteiro: e.target.value })}
                    className="w-full bg-transparent text-sm text-foreground border-0 focus:outline-none resize-none min-h-[100px] placeholder:text-muted/40"
                    placeholder="Escreva o roteiro ou script do post aqui..."
                    rows={4}
                  />
                </div>
              </div>
            </div>

            {/* Descrição */}
            <div className="rounded-xl border border-border bg-background mb-4 overflow-hidden">
              <button
                type="button"
                onClick={() => setDescricaoOpen(!descricaoOpen)}
                className="w-full xl:hidden flex items-center justify-between p-4"
              >
                <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-letitia-clay pointer-events-none">
                  Descrição / Notas
                  {!descricaoOpen && form.descricao && <span className="ml-2 text-muted font-normal normal-case tracking-normal truncate max-w-[150px] inline-block align-bottom">— preenchido</span>}
                </label>
                {descricaoOpen ? <ChevronUp className="h-4 w-4 text-muted" /> : <ChevronDown className="h-4 w-4 text-muted" />}
              </button>
              <div className={cn("xl:block", descricaoOpen ? "block" : "hidden")}>
                <div className="hidden xl:block text-[10px] font-bold uppercase tracking-[0.15em] text-letitia-clay mb-2 px-4 pt-4">Descrição / Notas</div>
                <div className="px-4 pb-4">
                  <textarea
                    value={form.descricao}
                    onChange={e => setForm({ ...form, descricao: e.target.value })}
                    className="w-full bg-transparent text-sm text-foreground border-0 focus:outline-none resize-none min-h-[60px] placeholder:text-muted/40"
                    placeholder="Anotações extras sobre este conteúdo..."
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-letitia-clay mb-3 flex items-center gap-1">
              <Link2 className="h-3 w-3" /> Links e Arquivos
            </label>
            <div className="space-y-2">
              {form.links.map((link, idx) => (
                <div key={idx} className="flex items-center gap-2 group">
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-xs text-letitia-clay hover:text-letitia-gold truncate underline underline-offset-2"
                  >
                    {link}
                  </a>
                  <button onClick={() => handleRemoveLink(idx)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-500 transition-all">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={newLink}
                  onChange={e => setNewLink(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleAddLink())}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none placeholder:text-muted/40"
                  placeholder="https://..."
                />
                <button onClick={handleAddLink} className="p-1.5 rounded-lg bg-letitia-gold/10 text-letitia-gold hover:bg-letitia-gold/20 transition-colors">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* History: Accordion on mobile (inside scrollable area) */}
          <div className="xl:hidden border-t border-border bg-background rounded-xl mt-4">
          <button
            onClick={() => setHistoricoOpen(!historicoOpen)}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-foreground/5 transition-colors"
          >
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
              <MessageSquare className="h-3.5 w-3.5 text-letitia-gold" /> Histórico
              {historico.length > 0 && (
                <span className="ml-1 text-[10px] font-medium text-muted bg-foreground/5 px-1.5 py-0.5 rounded-full">{historico.length}</span>
              )}
            </h3>
            {historicoOpen ? <ChevronUp className="h-4 w-4 text-muted" /> : <ChevronDown className="h-4 w-4 text-muted" />}
          </button>
          {historicoOpen && (
            <div className="border-t border-border">
              <div className="p-4 space-y-3 max-h-[50vh] overflow-y-auto">
                {loadingHistorico ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-letitia-gold" />
                  </div>
                ) : historico.length === 0 ? (
                  <p className="text-xs text-muted text-center py-8 italic">Nenhuma atividade registrada ainda.</p>
                ) : (
                  historico.map(entry => (
                    <div key={entry.id} className="relative pl-6">
                      <div className={cn(
                        "absolute left-0 top-1 h-4 w-4 rounded-full flex items-center justify-center border-2",
                        entry.tipo === "ajuste" ? "border-amber-300 bg-amber-50" :
                        entry.tipo === "rastro" ? "border-purple-300 bg-purple-50" :
                        "border-blue-300 bg-blue-50"
                      )}>
                        <EntryIcon tipo={entry.tipo} />
                      </div>
                      <div className="absolute left-[7px] top-5 bottom-0 w-[2px] bg-border" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <div className="h-5 w-5 rounded-full bg-letitia-gold/10 border border-letitia-gold/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {entry.profiles?.avatar_url ? (
                              <img src={entry.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-[7px] font-bold text-letitia-gold">{entry.profiles?.full_name?.charAt(0) || "?"}</span>
                            )}
                          </div>
                          <span className="text-[11px] font-semibold text-foreground truncate">{entry.profiles?.full_name || "Membro"}</span>
                          <span className="text-[9px] text-muted ml-auto flex-shrink-0">
                            {new Date(entry.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                            {" "}
                            {new Date(entry.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <div className={cn(
                          "rounded-lg px-3 py-2 text-xs leading-relaxed",
                          entry.tipo === "ajuste" ? "bg-amber-50 border border-amber-200 text-amber-800" :
                          entry.tipo === "rastro" ? "bg-purple-50/50 border border-purple-100 text-purple-700 italic" :
                          "bg-card border border-border text-foreground"
                        )}>
                          {entry.tipo === "ajuste" && (
                            <span className="flex items-center gap-1 text-[9px] font-bold text-amber-600 mb-0.5 uppercase tracking-wider">
                              <AlertTriangle className="h-2.5 w-2.5" /> Pedido de Ajuste
                            </span>
                          )}
                          {entry.tipo === "rastro" && (
                            <span className="flex items-center gap-1 text-[9px] font-bold text-purple-500 mb-0.5 uppercase tracking-wider">
                              <ArrowRight className="h-2.5 w-2.5" /> Ação
                            </span>
                          )}
                          {entry.conteudo}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={historicoEndRef} />
              </div>
              <div className="border-t border-border p-4 space-y-2">
                <div className="relative">
                  <textarea
                    value={novoComentario}
                    onChange={e => setNovoComentario(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                    className="w-full rounded-xl border border-border bg-card px-4 py-3 pr-10 text-xs text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none resize-none placeholder:text-muted/50"
                    placeholder="Deixe um comentário..."
                    rows={2}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!novoComentario.trim()}
                    className="absolute bottom-3 right-3 p-1.5 rounded-full bg-letitia-gold text-white hover:opacity-90 disabled:opacity-30 transition-all"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  onClick={() => setTipoComentario(prev => prev === "comentario" ? "ajuste" : "comentario")}
                  className={cn(
                    "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors",
                    tipoComentario === "ajuste"
                      ? "bg-amber-100 text-amber-700"
                      : "text-muted hover:text-foreground hover:bg-foreground/5"
                  )}
                >
                  <AlertTriangle className="h-3 w-3" /> Ajuste {tipoComentario === "ajuste" && "✓"}
                </button>
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Desktop Sidebar (hidden on mobile) */}
        <div className="hidden xl:flex w-80 border-l border-border bg-background flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
              <MessageSquare className="h-3.5 w-3.5 text-letitia-gold" /> Histórico
            </h3>
            <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-foreground/5 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Timeline */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loadingHistorico ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-letitia-gold" />
              </div>
            ) : historico.length === 0 ? (
              <p className="text-xs text-muted text-center py-8 italic">Nenhuma atividade registrada ainda.</p>
            ) : (
              historico.map(entry => (
                <div key={entry.id} className="relative pl-6">
                  <div className={cn(
                    "absolute left-0 top-1 h-4 w-4 rounded-full flex items-center justify-center border-2",
                    entry.tipo === "ajuste" ? "border-amber-300 bg-amber-50" :
                    entry.tipo === "rastro" ? "border-purple-300 bg-purple-50" :
                    "border-blue-300 bg-blue-50"
                  )}>
                    <EntryIcon tipo={entry.tipo} />
                  </div>
                  <div className="absolute left-[7px] top-5 bottom-0 w-[2px] bg-border" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <div className="h-5 w-5 rounded-full bg-letitia-gold/10 border border-letitia-gold/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {entry.profiles?.avatar_url ? (
                          <img src={entry.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-[7px] font-bold text-letitia-gold">{entry.profiles?.full_name?.charAt(0) || "?"}</span>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold text-foreground truncate">{entry.profiles?.full_name || "Membro"}</span>
                      <span className="text-[9px] text-muted ml-auto flex-shrink-0">
                        {new Date(entry.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                        {" "}
                        {new Date(entry.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className={cn(
                      "rounded-lg px-3 py-2 text-xs leading-relaxed",
                      entry.tipo === "ajuste" ? "bg-amber-50 border border-amber-200 text-amber-800" :
                      entry.tipo === "rastro" ? "bg-purple-50/50 border border-purple-100 text-purple-700 italic" :
                      "bg-card border border-border text-foreground"
                    )}>
                      {entry.tipo === "ajuste" && (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-amber-600 mb-0.5 uppercase tracking-wider">
                          <AlertTriangle className="h-2.5 w-2.5" /> Pedido de Ajuste
                        </span>
                      )}
                      {entry.tipo === "rastro" && (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-purple-500 mb-0.5 uppercase tracking-wider">
                          <ArrowRight className="h-2.5 w-2.5" /> Ação
                        </span>
                      )}
                      {entry.conteudo}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={historicoEndRef} />
          </div>

          {/* Comment input */}
          <div className="border-t border-border p-4 space-y-2">
            <div className="relative">
              <textarea
                value={novoComentario}
                onChange={e => setNovoComentario(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 pr-10 text-xs text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none resize-none placeholder:text-muted/50"
                placeholder="Deixe um comentário..."
                rows={2}
              />
              <button
                onClick={handleAddComment}
                disabled={!novoComentario.trim()}
                className="absolute bottom-3 right-3 p-1.5 rounded-full bg-letitia-gold text-white hover:opacity-90 disabled:opacity-30 transition-all"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
            <button
              onClick={() => setTipoComentario(prev => prev === "comentario" ? "ajuste" : "comentario")}
              className={cn(
                "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors",
                tipoComentario === "ajuste"
                  ? "bg-amber-100 text-amber-700"
                  : "text-muted hover:text-foreground hover:bg-foreground/5"
              )}
            >
              <AlertTriangle className="h-3 w-3" /> Ajuste {tipoComentario === "ajuste" && "✓"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
