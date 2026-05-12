import { useState, useEffect, useRef } from "react";
import {
  updateContent,
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
  ArrowRight, RefreshCw
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

export function ConteudoDetailModal({ conteudo, profiles, socialProfiles, onClose, onUpdate }: ConteudoDetailModalProps) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [historico, setHistorico] = useState<DBConteudoComentario[]>([]);
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
    prazo_seguranca: conteudo.prazo_seguranca || "",
    big_idea: conteudo.big_idea || "",
    roteiro: conteudo.roteiro || "",
    descricao: conteudo.descricao || "",
    links: conteudo.links || [],
  });

  const [newLink, setNewLink] = useState("");

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

      await updateContent(conteudo.id, {
        titulo: form.titulo,
        status: form.status,
        formato: form.formato,
        plataforma: form.plataforma,
        responsavel_id: form.responsavel_id || null,
        data_prevista: form.data_prevista,
        prazo_seguranca: form.prazo_seguranca || null,
        big_idea: form.big_idea || null,
        roteiro: form.roteiro || null,
        descricao: form.descricao || null,
        links: form.links.length > 0 ? form.links : null,
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
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-4xl bg-card border-l border-border shadow-2xl flex animate-in slide-in-from-right duration-300 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Left: Content Detail */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
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
            <div className="flex items-center gap-2 text-xs text-muted">
              <span className="font-mono">ID: {conteudo.id.substring(0, 8)}</span>
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
          <div className="grid grid-cols-2 gap-4">
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

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
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

          {/* Content Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-letitia-clay">Conteúdo do Post</h3>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 bg-letitia-gold text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-md shadow-letitia-gold/20 hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                Salvar
              </button>
            </div>

            {/* Big Idea */}
            <div className="rounded-xl border-2 border-amber-200 bg-amber-50/50 p-4 mb-4">
              <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-amber-600 mb-2">
                <Lightbulb className="h-3 w-3" /> Big Idea
              </label>
              <textarea
                value={form.big_idea}
                onChange={e => setForm({ ...form, big_idea: e.target.value })}
                className="w-full bg-transparent text-sm text-foreground border-0 focus:outline-none resize-none min-h-[60px] placeholder:text-amber-300"
                placeholder="Qual a grande ideia por trás deste post?"
                rows={2}
              />
            </div>

            {/* Roteiro / Legenda */}
            <div className="rounded-xl border border-border bg-background p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-letitia-clay">
                  <FileText className="h-3 w-3" /> Roteiro / Legenda
                </label>
              </div>
              <textarea
                value={form.roteiro}
                onChange={e => setForm({ ...form, roteiro: e.target.value })}
                className="w-full bg-transparent text-sm text-foreground border-0 focus:outline-none resize-none min-h-[100px] placeholder:text-muted/40"
                placeholder="Escreva o roteiro ou script do post aqui..."
                rows={4}
              />
            </div>

            {/* Descrição */}
            <div className="rounded-xl border border-border bg-background p-4 mb-4">
              <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-letitia-clay mb-2">Descrição / Notas</label>
              <textarea
                value={form.descricao}
                onChange={e => setForm({ ...form, descricao: e.target.value })}
                className="w-full bg-transparent text-sm text-foreground border-0 focus:outline-none resize-none min-h-[60px] placeholder:text-muted/40"
                placeholder="Anotações extras sobre este conteúdo..."
                rows={2}
              />
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
        </div>

        {/* Right: Unified History Sidebar */}
        <div className="w-80 border-l border-border bg-background flex flex-col">
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
                  {/* Timeline dot */}
                  <div className={cn(
                    "absolute left-0 top-1 h-4 w-4 rounded-full flex items-center justify-center border-2",
                    entry.tipo === "ajuste" ? "border-amber-300 bg-amber-50" :
                    entry.tipo === "rastro" ? "border-purple-300 bg-purple-50" :
                    "border-blue-300 bg-blue-50"
                  )}>
                    <EntryIcon tipo={entry.tipo} />
                  </div>
                  {/* Timeline line */}
                  <div className="absolute left-[7px] top-5 bottom-0 w-[2px] bg-border" />

                  <div className="space-y-1">
                    {/* Author + time */}
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

                    {/* Content */}
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
