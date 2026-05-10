import { useState, useEffect } from "react";
import { getPastas, updateDocumento, createDocumento, createPasta, type DBPasta, type DBDocumento } from "@/services/docService";
import { cn } from "@/lib/utils";
import { 
  Search, Plus, FolderOpen, Star, FileText, ChevronDown, ChevronRight, 
  Bold, Italic, Underline, List, ListOrdered, Link2, Heading1, Heading2, 
  Heading3, Loader2, X, Edit2, Trash2, Save, MoreVertical, Globe, Lock, Share2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export function Documentos() {
  const { user } = useAuth();
  const [pastas, setPastas] = useState<DBPasta[]>([]);
  const [loading, setLoading] = useState(true);
  const [docSelecionado, setDocSelecionado] = useState<DBDocumento | null>(null);
  const [busca, setBusca] = useState("");
  const [pastasAbertas, setPastasAbertas] = useState<Record<string, boolean>>({});
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isPastaModalOpen, setIsPastaModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const data = await getPastas();
      setPastas(data);

      if (data.length > 0 && !docSelecionado) {
        const firstDoc = data.find(p => p.documentos && p.documentos.length > 0)?.documentos?.[0];
        if (firstDoc) {
          setDocSelecionado(firstDoc);
          setPastasAbertas({ [firstDoc.pasta_id]: true });
        }
      }
    } catch (error) {
      console.error("Erro ao buscar pastas/documentos:", error);
    } finally {
      setLoading(false);
    }
  }

  const togglePasta = (id: string) => setPastasAbertas((prev) => ({ ...prev, [id]: !prev[id] }));

  const todosDocs = pastas.flatMap((p) => p.documentos || []);
  const favoritos = todosDocs.filter((d) => d.favorito);

  const filtrados = busca
    ? todosDocs.filter((d) => d.titulo.toLowerCase().includes(busca.toLowerCase()))
    : null;

  const handleToggleFavorito = async () => {
    if (!docSelecionado) return;
    try {
      const novoFavorito = !docSelecionado.favorito;
      await updateDocumento(docSelecionado.id, { favorito: novoFavorito });
      setDocSelecionado({ ...docSelecionado, favorito: novoFavorito });
      fetchData();
    } catch (error) {
      console.error("Erro ao favoritar documento:", error);
    }
  };

  const handleSaveEdit = async () => {
    if (!docSelecionado) return;
    try {
      await updateDocumento(docSelecionado.id, { 
        conteudo: editContent,
        titulo: editTitle 
      });
      setDocSelecionado({ ...docSelecionado, conteudo: editContent, titulo: editTitle });
      setIsEditing(false);
      fetchData();
    } catch (error) {
      console.error("Erro ao salvar documento:", error);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este documento?")) return;
    try {
      const { error } = await supabase.from('documentos').delete().eq('id', id);
      if (error) throw error;
      setDocSelecionado(null);
      fetchData();
    } catch (error) {
      console.error("Erro ao excluir documento:", error);
    }
  };

  const handleDeletePasta = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja excluir esta pasta e TODOS os seus documentos?")) return;
    try {
      const { error } = await supabase.from('pastas').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error("Erro ao excluir pasta:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-letitia-gold" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground">Documentos</h2>
            <p className="mt-1 text-sm text-muted">Atas de reunião, processos e documentação interna.</p>
          </div>
        </div>

      <div className="flex gap-4 flex-1 overflow-hidden min-h-0">
        {/* Sidebar de documentos */}
        <div className="w-72 flex-shrink-0 border border-border rounded-xl bg-card overflow-hidden flex flex-col shadow-sm">
          <div className="p-3 border-b border-border flex gap-2">
            <button 
              onClick={() => setIsDocModalOpen(true)}
              className="flex-1 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> Novo
            </button>
            <button 
              onClick={() => setIsPastaModalOpen(true)}
              className="rounded-md border border-border px-3 py-2 text-xs font-medium text-muted hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <FolderOpen className="h-3.5 w-3.5" /> Pasta
            </button>
          </div>

          <div className="px-3 py-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full rounded-md border border-border bg-background pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:ring-1 focus:ring-letitia-gold focus:outline-none"
                placeholder="Buscar documento..."
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-3">
            {busca && filtrados ? (
              <div className="space-y-0.5">
                {filtrados.map((doc) => (
                  <DocItem key={doc.id} doc={doc} selected={docSelecionado?.id === doc.id} onClick={() => { setDocSelecionado(doc); setBusca(""); }} />
                ))}
              </div>
            ) : (
              <>
                {favoritos.length > 0 && (
                  <div>
                    <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted">Favoritos</p>
                    {favoritos.map((doc) => (
                      <DocItem key={doc.id} doc={doc} selected={docSelecionado?.id === doc.id} onClick={() => setDocSelecionado(doc)} />
                    ))}
                  </div>
                )}

                {pastas.map((pasta) => (
                  <div key={pasta.id} className="group/pasta">
                    <button 
                      onClick={() => togglePasta(pasta.id)} 
                      className="flex items-center gap-1.5 px-2 py-1 w-full text-left hover:bg-foreground/5 rounded-md transition-colors"
                    >
                      {pastasAbertas[pasta.id] ? <ChevronDown className="h-3 w-3 text-muted" /> : <ChevronRight className="h-3 w-3 text-muted" />}
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted flex-1">{pasta.nome}</span>
                      <button 
                        onClick={(e) => handleDeletePasta(pasta.id, e)}
                        className="opacity-0 group-hover/pasta:opacity-100 p-0.5 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </button>
                    {pastasAbertas[pasta.id] && (
                      <div className="ml-2 space-y-0.5">
                        {pasta.documentos?.map((doc) => (
                          <DocItem key={doc.id} doc={doc} selected={docSelecionado?.id === doc.id} onClick={() => setDocSelecionado(doc)} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Área de conteúdo */}
        <div className="flex-1 border border-border rounded-xl bg-card overflow-hidden flex flex-col shadow-sm">
          {docSelecionado ? (
            <>
              <div className="p-4 border-b border-border bg-background/30">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-letitia-gold/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-letitia-gold" />
                    </div>
                    {isEditing ? (
                      <input 
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        className="text-lg font-semibold text-foreground bg-background border border-border px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-letitia-gold"
                      />
                    ) : (
                      <h3 className="text-lg font-semibold text-foreground">{docSelecionado.titulo}</h3>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <button 
                          onClick={() => setIsEditing(false)}
                          className="px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground transition-colors"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={handleSaveEdit}
                          className="px-3 py-1.5 rounded-md bg-letitia-gold text-white text-xs font-medium hover:opacity-90 transition-all flex items-center gap-1.5"
                        >
                          <Save className="h-3.5 w-3.5" /> Salvar
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={async () => {
                            if (!docSelecionado.publico) {
                              if (confirm("Este documento é privado. Deseja torná-lo público para compartilhar o link?")) {
                                await updateDocumento(docSelecionado.id, { publico: true });
                                fetchData();
                              } else {
                                return;
                              }
                            }
                            const shareUrl = `${window.location.origin}/publico/documento/${docSelecionado.id}`;
                            navigator.clipboard.writeText(shareUrl);
                            alert("Link público copiado para a área de transferência!");
                          }}
                          className="p-2 rounded-md hover:bg-letitia-gold/5 text-muted hover:text-letitia-gold transition-colors"
                          title="Compartilhar Link Público"
                        >
                          <Share2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setIsEditing(true);
                            setEditContent(docSelecionado.conteudo || "");
                            setEditTitle(docSelecionado.titulo || "");
                          }}
                          className="p-2 rounded-md hover:bg-foreground/5 text-muted hover:text-foreground transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteDoc(docSelecionado.id)}
                          className="p-2 rounded-md hover:bg-red-500/5 text-muted hover:text-red-500 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted/60 bg-background border border-border px-2 py-0.5 rounded">
                    {pastas.find(p => p.id === docSelecionado.pasta_id)?.nome || "Sem pasta"}
                  </span>
                  <button 
                    onClick={handleToggleFavorito}
                    className="text-xs text-muted hover:text-letitia-gold transition-colors flex items-center gap-1"
                  >
                    <Star className={cn("h-3 w-3", docSelecionado.favorito ? "fill-letitia-gold text-letitia-gold" : "")} /> Favorito
                  </button>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-foreground/[0.03] border border-border/50">
                    {docSelecionado.publico ? <Globe className="h-3 w-3 text-green-500" /> : <Lock className="h-3 w-3 text-muted" />}
                    <span className="text-[10px] font-bold uppercase tracking-tight text-muted">
                      {docSelecionado.publico ? "Acesso Público" : "Acesso Privado"}
                    </span>
                  </div>
                </div>
              </div>

              {isEditing ? (
                <div className="flex-1 flex flex-col bg-background/5">
                  <div className="px-4 py-2 border-b border-border flex items-center gap-1 flex-wrap bg-card">
                    {[Heading1, Heading2, Heading3].map((Icon, i) => (
                      <button key={i} className="p-1.5 rounded hover:bg-foreground/10 text-muted transition-colors"><Icon className="h-4 w-4" /></button>
                    ))}
                    <div className="w-px h-5 bg-border mx-1" />
                    {[Bold, Italic, Underline].map((Icon, i) => (
                      <button key={i} className="p-1.5 rounded hover:bg-foreground/10 text-muted transition-colors"><Icon className="h-4 w-4" /></button>
                    ))}
                  </div>
                  <textarea 
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    className="flex-1 w-full p-8 bg-transparent resize-none focus:outline-none font-mono text-sm leading-relaxed"
                    placeholder="Comece a escrever seu documento em Markdown..."
                  />
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-8 bg-card selection:bg-letitia-gold/20">
                  <div className="max-w-3xl mx-auto prose prose-sm prose-slate prose-headings:font-serif">
                    {docSelecionado.conteudo?.split("\n").map((line, i) => {
                      if (line.startsWith("### ")) return <h3 key={i} className="text-base font-bold text-foreground mt-6 mb-2 border-l-4 border-letitia-gold/30 pl-3">{line.replace("### ", "")}</h3>;
                      if (line.startsWith("## ")) return <h2 key={i} className="text-xl font-bold text-foreground mt-8 mb-4 border-b border-border pb-2">{line.replace("## ", "")}</h2>;
                      if (line.startsWith("# ")) return <h1 key={i} className="text-3xl font-serif font-bold text-foreground mt-10 mb-6">{line.replace("# ", "")}</h1>;
                      if (line.startsWith("- [ ] ")) return <div key={i} className="flex items-center gap-2 py-1"><div className="w-4 h-4 rounded border border-border flex-shrink-0" /><span className="text-sm text-foreground">{line.replace("- [ ] ", "")}</span></div>;
                      if (line.startsWith("- [x] ")) return <div key={i} className="flex items-center gap-2 py-1"><div className="w-4 h-4 rounded bg-letitia-gold flex items-center justify-center flex-shrink-0"><X className="h-3 w-3 text-white" /></div><span className="text-sm text-muted line-through">{line.replace("- [x] ", "")}</span></div>;
                      if (line.startsWith("- **")) return <li key={i} className="text-sm text-foreground ml-6 list-disc mb-1">{renderBold(line.replace("- ", ""))}</li>;
                      if (line.startsWith("- ")) return <li key={i} className="text-sm text-foreground ml-6 list-disc mb-1">{line.replace("- ", "")}</li>;
                      if (line.match(/^\d+\. /)) return <li key={i} className="text-sm text-foreground ml-6 list-decimal mb-1">{renderBold(line.replace(/^\d+\. /, ""))}</li>;
                      if (line.startsWith("|")) return <TableRow key={i} line={line} />;
                      if (line.startsWith("---")) return <hr key={i} className="my-8 border-border" />;
                      if (line.trim() === "") return <div key={i} className="h-4" />;
                      return <p key={i} className="text-sm text-foreground/80 leading-relaxed mb-4">{renderBold(line)}</p>;
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted gap-4">
              <div className="h-16 w-16 rounded-full bg-foreground/[0.03] flex items-center justify-center">
                <FileText className="h-8 w-8 opacity-20" />
              </div>
              <p className="text-sm">Selecione um documento para visualizar ou editar</p>
            </div>
          )}
        </div>
      </div>

      {isDocModalOpen && (
        <NovoDocumentoModal 
          pastas={pastas}
          onClose={() => setIsDocModalOpen(false)} 
          onSuccess={(newDoc) => { setIsDocModalOpen(false); fetchData(); setDocSelecionado(newDoc); }} 
        />
      )}

      {isPastaModalOpen && (
        <NovoPastaModal 
          onClose={() => setIsPastaModalOpen(false)} 
          onSuccess={() => { setIsPastaModalOpen(false); fetchData(); }} 
        />
      )}
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────────────── */

function TableRow({ line }: { line: string }) {
  const cells = line.split("|").filter(c => c.trim() !== "").map(c => c.trim());
  if (cells.every(c => c.includes("---"))) return null; // Ignorar separador de header
  
  return (
    <div className="grid grid-cols-4 gap-2 py-2 border-b border-border/50 items-center">
      {cells.map((cell, i) => (
        <div key={i} className={cn("text-xs", i === 0 ? "font-bold text-foreground" : "text-muted")}>
          {renderBold(cell)}
        </div>
      ))}
    </div>
  );
}

function NovoDocumentoModal({ pastas, onClose, onSuccess }: { pastas: DBPasta[]; onClose: () => void; onSuccess: (doc: DBDocumento) => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: "",
    conteudo: "",
    pasta_id: pastas[0]?.id || "",
    publico: false,
    criado_por: user?.id || ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newDoc = await createDocumento(formData);
      onSuccess(newDoc);
    } catch (error) {
      console.error("Erro ao criar documento:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl h-[80vh] flex flex-col rounded-xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="font-serif text-2xl font-medium text-foreground">Novo Documento</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-foreground/10 transition-colors">
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1.5">Título</label>
              <input
                required
                value={formData.titulo}
                onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
                placeholder="Título do documento"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1.5">Pasta de Destino</label>
              <select
                value={formData.pasta_id}
                onChange={e => setFormData({ ...formData, pasta_id: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
              >
                {pastas.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 px-6 pb-6 flex flex-col min-h-0">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1.5">Conteúdo (Suporta Markdown)</label>
            <textarea
              required
              value={formData.conteudo}
              onChange={e => setFormData({ ...formData, conteudo: e.target.value })}
              className="flex-1 w-full rounded-md border border-border bg-background px-4 py-4 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none resize-none font-mono leading-relaxed"
              placeholder="# Cabeçalho 1&#10;- Item de lista&#10;**Texto em negrito**"
            />
          </div>

          <div className="p-6 border-t border-border bg-background/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                id="publico_new" 
                checked={formData.publico}
                onChange={e => setFormData({ ...formData, publico: e.target.checked })}
                className="w-4 h-4 rounded border-border text-letitia-gold focus:ring-letitia-gold"
              />
              <label htmlFor="publico_new" className="text-sm font-medium text-muted cursor-pointer hover:text-foreground">Tornar este documento público</label>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-border px-6 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-letitia-gold px-8 py-2 text-sm font-bold text-white hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-letitia-gold/20"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Criar Documento
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function NovoPastaModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    favorita: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createPasta(formData);
      onSuccess();
    } catch (error) {
      console.error("Erro ao criar pasta:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif text-2xl font-medium text-foreground">Nova Pasta</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-foreground/10 transition-colors">
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1.5">Nome da Pasta</label>
            <input
              required
              value={formData.nome}
              onChange={e => setFormData({ ...formData, nome: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
              placeholder="Ex: Processos Comerciais"
            />
          </div>

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
              Criar Pasta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DocItem({ doc, selected, onClick }: { doc: DBDocumento; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-2.5 py-2 rounded-md text-sm transition-colors flex items-center gap-2 group",
        selected ? "bg-letitia-gold/10 text-foreground font-medium" : "text-muted hover:bg-foreground/5 hover:text-foreground"
      )}
    >
      <FileText className={cn("h-3.5 w-3.5 flex-shrink-0 transition-colors", selected ? "text-letitia-gold" : "text-muted group-hover:text-foreground")} />
      <span className="truncate text-xs flex-1">{doc.titulo}</span>
      {doc.favorito && <Star className="h-2.5 w-2.5 fill-letitia-gold text-letitia-gold" />}
    </button>
  );
}

function renderBold(text: string | React.ReactNode) {
  if (typeof text !== "string") return text;
  
  // Primeiro, processar links markdown [texto](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = text.split(linkRegex);
  
  const content = [];
  for (let i = 0; i < parts.length; i++) {
    if (i % 3 === 0) {
      // Texto normal
      const boldParts = parts[i].split(/(\*\*.*?\*\*)/g);
      content.push(...boldParts.map((part, j) =>
        part.startsWith("**") && part.endsWith("**")
          ? <strong key={`${i}-${j}`} className="font-bold text-foreground">{part.slice(2, -2)}</strong>
          : part
      ));
    } else if (i % 3 === 1) {
      // Texto do link
      const url = parts[i+1];
      content.push(<a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-letitia-gold hover:underline font-medium">{parts[i]}</a>);
      i++; // Pular a URL que já pegamos
    }
  }
  
  return <>{content}</>;
}
