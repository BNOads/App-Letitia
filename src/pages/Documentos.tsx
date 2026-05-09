import { useState, useEffect } from "react";
import { getPastas, updateDocumento, createDocumento, createPasta, type DBPasta, type DBDocumento } from "@/services/docService";
import { cn } from "@/lib/utils";
import { Search, Plus, FolderOpen, Star, FileText, ChevronDown, ChevronRight, Bold, Italic, Underline, List, ListOrdered, Link2, Heading1, Heading2, Heading3, Loader2, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function Documentos() {
  const { user } = useAuth();
  const [pastas, setPastas] = useState<DBPasta[]>([]);
  const [loading, setLoading] = useState(true);
  const [docSelecionado, setDocSelecionado] = useState<DBDocumento | null>(null);
  const [busca, setBusca] = useState("");
  const [pastasAbertas, setPastasAbertas] = useState<Record<string, boolean>>({});
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isPastaModalOpen, setIsPastaModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const data = await getPastas();
      setPastas(data);
      if (data.length > 0 && data[0].documentos && data[0].documentos.length > 0 && !docSelecionado) {
        setDocSelecionado(data[0].documentos[0]);
        setPastasAbertas({ [data[0].id]: true });
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

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-letitia-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground">Documentos</h2>
          <p className="mt-1 text-sm text-muted">Atas de reunião, processos e documentação interna.</p>
        </div>
      </div>

      <div className="flex gap-4 h-[calc(100vh-220px)]">
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
                  <div key={pasta.id}>
                    <button onClick={() => togglePasta(pasta.id)} className="flex items-center gap-1.5 px-2 py-1 w-full text-left hover:bg-foreground/5 rounded-md transition-colors">
                      {pastasAbertas[pasta.id] ? <ChevronDown className="h-3 w-3 text-muted" /> : <ChevronRight className="h-3 w-3 text-muted" />}
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">{pasta.nome}</span>
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
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="h-5 w-5 text-letitia-clay" />
                  <h3 className="text-lg font-semibold text-foreground">{docSelecionado.titulo}</h3>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-muted bg-background border border-border px-2 py-0.5 rounded">
                    {pastas.find(p => p.id === docSelecionado.pasta_id)?.nome || "Sem pasta"}
                  </span>
                  <button 
                    onClick={handleToggleFavorito}
                    className="text-xs text-muted hover:text-letitia-gold transition-colors flex items-center gap-1"
                  >
                    <Star className={cn("h-3 w-3", docSelecionado.favorito ? "fill-letitia-gold text-letitia-gold" : "")} /> Favorito
                  </button>
                  <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", docSelecionado.publico ? "bg-green-500/10 text-green-600" : "bg-gray-500/10 text-gray-500")}>
                    {docSelecionado.publico ? "Público" : "Privado"}
                  </span>
                </div>
              </div>

              <div className="px-4 py-2 border-b border-border flex items-center gap-1 flex-wrap bg-background/10">
                {[Heading1, Heading2, Heading3].map((Icon, i) => (
                  <button key={i} className="p-1.5 rounded hover:bg-foreground/5 text-muted hover:text-foreground transition-colors"><Icon className="h-4 w-4" /></button>
                ))}
                <div className="w-px h-5 bg-border mx-1" />
                {[Bold, Italic, Underline].map((Icon, i) => (
                  <button key={i} className="p-1.5 rounded hover:bg-foreground/5 text-muted hover:text-foreground transition-colors"><Icon className="h-4 w-4" /></button>
                ))}
                <div className="w-px h-5 bg-border mx-1" />
                {[List, ListOrdered, Link2].map((Icon, i) => (
                  <button key={i} className="p-1.5 rounded hover:bg-foreground/5 text-muted hover:text-foreground transition-colors"><Icon className="h-4 w-4" /></button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-8 bg-card">
                <div className="max-w-3xl mx-auto prose prose-sm">
                  {docSelecionado.conteudo?.split("\n").map((line, i) => {
                    if (line.startsWith("### ")) return <h3 key={i} className="text-base font-semibold text-foreground mt-4 mb-2">{line.replace("### ", "")}</h3>;
                    if (line.startsWith("## ")) return <h2 key={i} className="text-lg font-semibold text-foreground mt-5 mb-2">{line.replace("## ", "")}</h2>;
                    if (line.startsWith("# ")) return <h1 key={i} className="text-xl font-bold text-foreground mt-6 mb-3">{line.replace("# ", "")}</h1>;
                    if (line.startsWith("- [ ] ")) return <div key={i} className="flex items-center gap-2 py-0.5"><input type="checkbox" className="rounded border-border" /><span className="text-sm text-foreground">{line.replace("- [ ] ", "")}</span></div>;
                    if (line.startsWith("- [x] ")) return <div key={i} className="flex items-center gap-2 py-0.5"><input type="checkbox" checked readOnly className="rounded border-border" /><span className="text-sm text-muted line-through">{line.replace("- [x] ", "")}</span></div>;
                    if (line.startsWith("- **")) return <li key={i} className="text-sm text-foreground ml-4 list-disc">{renderBold(line.replace("- ", ""))}</li>;
                    if (line.startsWith("- ")) return <li key={i} className="text-sm text-foreground ml-4 list-disc">{line.replace("- ", "")}</li>;
                    if (line.match(/^\d+\. /)) return <li key={i} className="text-sm text-foreground ml-4 list-decimal">{renderBold(line.replace(/^\d+\. /, ""))}</li>;
                    if (line.trim() === "") return <div key={i} className="h-2" />;
                    return <p key={i} className="text-sm text-foreground leading-relaxed">{renderBold(line)}</p>;
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted text-sm">
              Selecione um documento para visualizar
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
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif text-2xl font-medium text-foreground">Novo Documento</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-foreground/10 transition-colors">
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Título</label>
              <input
                required
                value={formData.titulo}
                onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
                placeholder="Título do documento"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Pasta</label>
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

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Conteúdo (Markdown)</label>
            <textarea
              required
              value={formData.conteudo}
              onChange={e => setFormData({ ...formData, conteudo: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none min-h-[300px] font-mono"
              placeholder="# Escreva aqui..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="publico" 
              checked={formData.publico}
              onChange={e => setFormData({ ...formData, publico: e.target.checked })}
              className="rounded border-border text-letitia-gold focus:ring-letitia-gold"
            />
            <label htmlFor="publico" className="text-sm text-muted">Tornar público (visível para outros usuários)</label>
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
              Salvar Documento
            </button>
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Nome da Pasta</label>
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
        "w-full text-left px-2.5 py-2 rounded-md text-sm transition-colors flex items-center gap-2",
        selected ? "bg-letitia-gold/10 text-foreground font-medium" : "text-muted hover:bg-foreground/5 hover:text-foreground"
      )}
    >
      <FileText className="h-3.5 w-3.5 flex-shrink-0" />
      <span className="truncate text-xs">{doc.titulo}</span>
    </button>
  );
}

function renderBold(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
      : part
  );
}
