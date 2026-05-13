import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, FileText, CheckSquare, Calendar, X, Loader2, ArrowRight, Hash, Clock, Star, FileStack } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

// ─── Types ──────────────────────────────────────────────────
interface SearchResult {
  id: string;
  type: "documento" | "conteudo" | "tarefa";
  titulo: string;
  subtitle: string;
  meta?: string;
  status?: string;
  icon: "doc" | "post" | "task";
  data?: any;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Search Functions ───────────────────────────────────────

async function searchDocumentos(query: string): Promise<SearchResult[]> {
  const { data, error } = await supabase
    .from("documentos")
    .select("id, titulo, pasta_id, favorito, created_at, pastas(nome)")
    .or(`titulo.ilike.%${query}%,conteudo.ilike.%${query}%`)
    .limit(8);

  if (error || !data) return [];

  return data.map((doc: any) => ({
    id: doc.id,
    type: "documento" as const,
    titulo: doc.titulo,
    subtitle: doc.pastas?.nome || "Sem pasta",
    meta: new Date(doc.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
    icon: "doc" as const,
    data: doc,
  }));
}

async function searchConteudo(query: string): Promise<SearchResult[]> {
  const { data, error } = await supabase
    .from("conteudo_pautas")
    .select("id, titulo, plataforma, formato, status, data_prevista, pilar")
    .or(`titulo.ilike.%${query}%,pilar.ilike.%${query}%,plataforma.ilike.%${query}%`)
    .limit(8);

  if (error || !data) return [];

  const statusLabels: Record<string, string> = {
    legenda: "🟠 Legenda",
    ajuste: "⚠️ Ajuste",
    pronto: "🔵 Pronto",
    programado: "⏰ Programado",
    postado: "✅ Postado",
    cancelado: "❌ Cancelado",
  };

  return data.map((p: any) => ({
    id: p.id,
    type: "conteudo" as const,
    titulo: p.titulo,
    subtitle: `${p.plataforma} · ${p.formato}`,
    meta: new Date(p.data_prevista + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
    status: statusLabels[p.status] || p.status,
    icon: "post" as const,
    data: p,
  }));
}

async function searchTarefas(query: string): Promise<SearchResult[]> {
  const { data, error } = await supabase
    .from("tarefas")
    .select("id, titulo, status, prioridade, prazo, responsavel_id, profiles(full_name)")
    .or(`titulo.ilike.%${query}%,descricao.ilike.%${query}%`)
    .limit(8);

  if (error || !data) return [];

  const statusLabels: Record<string, string> = {
    fazer: "A Fazer",
    progresso: "Em Progresso",
    revisao: "Revisão",
    concluido: "Concluído",
  };

  const prioridadeLabels: Record<string, string> = {
    baixa: "⬇ Baixa",
    normal: "— Normal",
    alta: "⬆ Alta",
    urgente: "🔴 Urgente",
  };

  return data.map((t: any) => ({
    id: t.id,
    type: "tarefa" as const,
    titulo: t.titulo,
    subtitle: `${statusLabels[t.status] || t.status} · ${prioridadeLabels[t.prioridade] || t.prioridade}`,
    meta: t.prazo
      ? new Date(t.prazo + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
      : "Sem prazo",
    icon: "task" as const,
    data: t,
  }));
}

// ─── Component ──────────────────────────────────────────────

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState<"all" | "documento" | "conteudo" | "tarefa">("all");
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setActiveCategory("all");
    }
  }, [isOpen]);

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [docs, content, tasks] = await Promise.all([
        searchDocumentos(searchQuery),
        searchConteudo(searchQuery),
        searchTarefas(searchQuery),
      ]);
      setResults([...docs, ...content, ...tasks]);
      setSelectedIndex(0);
    } catch (error) {
      console.error("Erro na busca global:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => performSearch(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, performSearch]);

  // Filter by category
  const filteredResults = activeCategory === "all"
    ? results
    : results.filter((r) => r.type === activeCategory);

  // Group results by type
  const grouped = {
    documento: filteredResults.filter((r) => r.type === "documento"),
    conteudo: filteredResults.filter((r) => r.type === "conteudo"),
    tarefa: filteredResults.filter((r) => r.type === "tarefa"),
  };

  const flatResults = [...grouped.documento, ...grouped.conteudo, ...grouped.tarefa];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      }

      if (e.key === "Enter" && flatResults[selectedIndex]) {
        e.preventDefault();
        handleResultClick(flatResults[selectedIndex]);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, flatResults, selectedIndex, onClose]);

  // Auto-scroll selected item
  useEffect(() => {
    if (resultsRef.current) {
      const selectedEl = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selectedEl?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // Navigate to result
  const handleResultClick = (result: SearchResult) => {
    onClose();
    switch (result.type) {
      case "documento":
        navigate("/documentos", { state: { openDocId: result.id } });
        break;
      case "conteudo":
        navigate("/editorial", { state: { openConteudoId: result.id } });
        break;
      case "tarefa":
        navigate("/tarefas", { state: { openTarefaId: result.id } });
        break;
    }
  };

  if (!isOpen) return null;

  const categories = [
    { id: "all" as const, label: "Todos", count: results.length },
    { id: "documento" as const, label: "Documentos", icon: FileStack, count: results.filter((r) => r.type === "documento").length },
    { id: "conteudo" as const, label: "Posts", icon: Calendar, count: results.filter((r) => r.type === "conteudo").length },
    { id: "tarefa" as const, label: "Tarefas", icon: CheckSquare, count: results.filter((r) => r.type === "tarefa").length },
  ];

  const typeConfig = {
    documento: { label: "Documentos", icon: FileStack, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    conteudo: { label: "Posts / Conteúdo", icon: Calendar, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
    tarefa: { label: "Tarefas", icon: CheckSquare, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  };

  let flatIndex = -1;

  return (
    <div
      className="modal-overlay items-start justify-center p-4 pt-[10vh] sm:pt-[12vh]" style={{ zIndex: 100 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-lg overflow-hidden modal-content">
        {/* Search Input */}
        <div className="relative flex items-center border-b border-border">
          <Search className="absolute left-5 h-5 w-5 text-muted pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent pl-14 pr-20 py-4 text-base text-foreground placeholder:text-muted/60 focus:outline-none"
            placeholder="Buscar documentos, posts, tarefas..."
            autoComplete="off"
            spellCheck={false}
          />
          <div className="absolute right-3 flex items-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted" />}
            <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded-md border border-border bg-background px-2 text-[10px] font-medium text-muted select-none">
              ESC
            </kbd>
            <button
              onClick={onClose}
              className="sm:hidden p-1 rounded-md hover:bg-foreground/10 text-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        {results.length > 0 && (
          <div className="flex items-center gap-1 px-4 py-2 border-b border-border/50 bg-background/30">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setSelectedIndex(0); }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  activeCategory === cat.id
                    ? "bg-letitia-gold/15 text-foreground border border-letitia-gold/30 shadow-sm"
                    : "text-muted hover:text-foreground hover:bg-foreground/5"
                )}
              >
                {cat.icon && <cat.icon className="h-3 w-3" />}
                {cat.label}
                {cat.count > 0 && (
                  <span className={cn(
                    "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                    activeCategory === cat.id ? "bg-letitia-gold/20 text-letitia-gold" : "bg-foreground/5 text-muted"
                  )}>
                    {cat.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        <div ref={resultsRef} className="max-h-[50vh] overflow-y-auto">
          {/* Empty state */}
          {query.length >= 2 && !loading && flatResults.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted gap-3">
              <div className="h-14 w-14 rounded-2xl bg-foreground/[0.03] flex items-center justify-center">
                <Search className="h-7 w-7 opacity-20" />
              </div>
              <p className="text-sm font-medium">Nenhum resultado encontrado</p>
              <p className="text-xs text-muted/60">Tente termos diferentes ou mais curtos</p>
            </div>
          )}

          {/* Initial state */}
          {query.length < 2 && !loading && (
            <div className="flex flex-col items-center justify-center py-12 text-muted gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-letitia-gold/10 to-letitia-clay/10 flex items-center justify-center border border-letitia-gold/10">
                <Search className="h-6 w-6 text-letitia-gold/50" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground/70">Busca Global</p>
                <p className="text-xs text-muted/60 mt-1">Pesquise documentos, posts e tarefas em todo o sistema</p>
              </div>
              <div className="flex items-center gap-6 mt-2">
                <div className="flex items-center gap-2 text-[10px] text-muted/50">
                  <FileStack className="h-3.5 w-3.5" />
                  <span>Documentos</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted/50">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Posts</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted/50">
                  <CheckSquare className="h-3.5 w-3.5" />
                  <span>Tarefas</span>
                </div>
              </div>
            </div>
          )}

          {/* Grouped Results */}
          {(["documento", "conteudo", "tarefa"] as const).map((type) => {
            const items = grouped[type];
            if (items.length === 0) return null;
            const config = typeConfig[type];

            return (
              <div key={type} className="py-1">
                {/* Group Header */}
                <div className="flex items-center gap-2 px-5 py-2">
                  <config.icon className={cn("h-3.5 w-3.5", config.color)} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                    {config.label}
                  </span>
                  <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full", config.bg, config.color)}>
                    {items.length}
                  </span>
                </div>

                {/* Items */}
                {items.map((result) => {
                  flatIndex++;
                  const currentFlatIndex = flatIndex;
                  const isSelected = currentFlatIndex === selectedIndex;

                  return (
                    <button
                      key={result.id}
                      data-index={currentFlatIndex}
                      onClick={() => handleResultClick(result)}
                      onMouseEnter={() => setSelectedIndex(currentFlatIndex)}
                      className={cn(
                        "w-full flex items-center gap-3 px-5 py-3 text-left transition-all group",
                        isSelected
                          ? "bg-letitia-gold/8 border-l-2 border-letitia-gold"
                          : "hover:bg-foreground/[0.03] border-l-2 border-transparent"
                      )}
                    >
                      {/* Icon */}
                      <div className={cn(
                        "h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all border",
                        isSelected ? `${config.bg} ${config.border}` : "bg-foreground/[0.03] border-transparent"
                      )}>
                        {type === "documento" && <FileText className={cn("h-4 w-4", isSelected ? config.color : "text-muted")} />}
                        {type === "conteudo" && <Calendar className={cn("h-4 w-4", isSelected ? config.color : "text-muted")} />}
                        {type === "tarefa" && <CheckSquare className={cn("h-4 w-4", isSelected ? config.color : "text-muted")} />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-medium truncate transition-colors",
                          isSelected ? "text-foreground" : "text-foreground/80"
                        )}>
                          {highlightMatch(result.titulo, query)}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted truncate">{result.subtitle}</span>
                          {result.status && (
                            <span className="text-[9px] font-medium text-muted/70 bg-foreground/5 px-1.5 py-0.5 rounded flex-shrink-0">
                              {result.status}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right side */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] text-muted/60">{result.meta}</span>
                        <ArrowRight className={cn(
                          "h-3.5 w-3.5 transition-all",
                          isSelected ? "text-letitia-gold opacity-100 translate-x-0" : "text-muted opacity-0 -translate-x-1"
                        )} />
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {flatResults.length > 0 && (
          <div className="flex items-center justify-between px-5 py-2.5 border-t border-border/50 bg-background/30">
            <div className="flex items-center gap-4 text-[10px] text-muted/50">
              <span className="flex items-center gap-1">
                <kbd className="inline-flex items-center justify-center h-4 w-4 rounded border border-border bg-background text-[8px]">↑</kbd>
                <kbd className="inline-flex items-center justify-center h-4 w-4 rounded border border-border bg-background text-[8px]">↓</kbd>
                navegar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="inline-flex items-center justify-center h-4 min-w-[2rem] rounded border border-border bg-background text-[8px] px-1">Enter</kbd>
                abrir
              </span>
            </div>
            <span className="text-[10px] text-muted/40">
              {flatResults.length} resultado{flatResults.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Highlight helper ───────────────────────────────────────

function highlightMatch(text: string, query: string) {
  if (!query || query.length < 2) return text;

  const regex = new RegExp(`(${escapeRegex(query)})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span key={i} className="text-letitia-gold font-semibold bg-letitia-gold/10 rounded-sm px-0.5">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
