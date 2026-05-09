import { useState, useEffect } from "react";
import { getPastas, updateDocumento, type DBPasta, type DBDocumento } from "@/services/docService";
import { cn } from "@/lib/utils";
import { Search, Plus, FolderOpen, Star, FileText, ChevronDown, ChevronRight, Bold, Italic, Underline, List, ListOrdered, Link2, Heading1, Heading2, Heading3, Loader2 } from "lucide-react";

export function Documentos() {
  const [pastas, setPastas] = useState<DBPasta[]>([]);
  const [loading, setLoading] = useState(true);
  const [docSelecionado, setDocSelecionado] = useState<DBDocumento | null>(null);
  const [busca, setBusca] = useState("");
  const [pastasAbertas, setPastasAbertas] = useState<Record<string, boolean>>({});

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
      <div>
        <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground">Documentos</h2>
        <p className="mt-1 text-sm text-muted">Atas de reunião, processos e documentação interna.</p>
      </div>

      <div className="flex gap-4 h-[calc(100vh-220px)]">
        {/* Sidebar de documentos */}
        <div className="w-72 flex-shrink-0 border border-border rounded-xl bg-card overflow-hidden flex flex-col">
          <div className="p-3 border-b border-border flex gap-2">
            <button className="flex-1 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 transition-all flex items-center justify-center gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Novo
            </button>
            <button className="rounded-md border border-border px-3 py-2 text-xs font-medium text-muted hover:text-foreground transition-colors flex items-center gap-1.5">
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
        <div className="flex-1 border border-border rounded-xl bg-card overflow-hidden flex flex-col">
          {docSelecionado ? (
            <>
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="h-5 w-5 text-letitia-clay" />
                  <h3 className="text-lg font-semibold text-foreground">{docSelecionado.titulo}</h3>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-muted bg-background px-2 py-0.5 rounded">
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

              <div className="px-4 py-2 border-b border-border flex items-center gap-1 flex-wrap">
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

              <div className="flex-1 overflow-y-auto p-6">
                <div className="prose prose-sm max-w-none">
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
