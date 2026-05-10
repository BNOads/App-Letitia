import { useState, useEffect } from "react";
import { getLinks, createLink, updateLink, deleteLink, type DBLink } from "@/services/linksService";
import { 
  Search, Plus, LayoutGrid, List, Star, Copy, Share2, 
  ExternalLink, MoreVertical, GripVertical, Loader2, X, Link as LinkIcon, Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, Reorder } from "framer-motion";

type ViewMode = "grid" | "lista";

const categoryColors: Record<string, string> = {
  GERAL: "bg-gray-100 text-gray-600",
  MARKETING: "bg-orange-100 text-orange-600",
  VENDAS: "bg-blue-100 text-blue-600",
  PRODUTO: "bg-purple-100 text-purple-600",
  PLANILHAS: "bg-green-100 text-green-600",
  FORMULÁRIOS: "bg-pink-100 text-pink-600",
  CHECKOUTS: "bg-yellow-100 text-yellow-600",
};

export function LinksUteis() {
  const [links, setLinks] = useState<DBLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("lista");
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchLinks();
  }, []);

  async function fetchLinks() {
    try {
      const data = await getLinks();
      setLinks(data);
    } catch (error) {
      console.error("Erro ao buscar links:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleToggleFavorite = async (link: DBLink) => {
    try {
      await updateLink(link.id, { favorito: !link.favorito });
      fetchLinks();
    } catch (error) {
      console.error("Erro ao favoritar link:", error);
    }
  };

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopySuccess(id);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const filtrados = links.filter(l => {
    const matchBusca = l.titulo.toLowerCase().includes(busca.toLowerCase());
    const matchCat = categoria === "Todas" || l.categoria === categoria;
    return matchBusca && matchCat;
  });

  const favoritos = filtrados.filter(l => l.favorito);
  const outros = filtrados.filter(l => !l.favorito);

  const categorias = ["Todas", ...new Set(links.map(l => l.categoria))];

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-letitia-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground">Links Úteis</h2>
          <p className="mt-1 text-sm text-muted">Acesse rapidamente todas as ferramentas da equipe</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
            <button 
              onClick={() => setViewMode("grid")}
              className={cn("flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all", viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground")}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Grid
            </button>
            <button 
              onClick={() => setViewMode("lista")}
              className={cn("flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all", viewMode === "lista" ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground")}
            >
              <List className="h-3.5 w-3.5" /> Lista
            </button>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Novo Link
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar links..."
            className="w-full rounded-md border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
          />
        </div>
        <select 
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none min-w-[150px]"
        >
          {categorias.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Sections */}
      <div className="space-y-10">
        {favoritos.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Star className="h-4 w-4 text-letitia-gold fill-letitia-gold" /> Favoritos
            </h3>
            <div className={cn(viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-2")}>
              {favoritos.map(l => (
                <LinkCard 
                  key={l.id} 
                  link={l} 
                  viewMode={viewMode} 
                  onToggleFav={() => handleToggleFavorite(l)}
                  onCopy={() => handleCopy(l.url, l.id)}
                  copySuccess={copySuccess === l.id}
                />
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-foreground">Outros Links</h3>
          <div className={cn(viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-2")}>
            {outros.length === 0 ? (
              <p className="text-sm text-muted italic">Nenhum link encontrado.</p>
            ) : (
              outros.map(l => (
                <LinkCard 
                  key={l.id} 
                  link={l} 
                  viewMode={viewMode} 
                  onToggleFav={() => handleToggleFavorite(l)}
                  onCopy={() => handleCopy(l.url, l.id)}
                  copySuccess={copySuccess === l.id}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <NovoLinkModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => { setIsModalOpen(false); fetchLinks(); }} 
        />
      )}
    </div>
  );
}

function LinkCard({ link, viewMode, onToggleFav, onCopy, copySuccess }: { 
  link: DBLink; 
  viewMode: ViewMode; 
  onToggleFav: () => void;
  onCopy: () => void;
  copySuccess: boolean;
}) {
  const favicon = `https://www.google.com/s2/favicons?domain=${link.url}&sz=64`;
  const badgeColor = categoryColors[link.categoria] || "bg-gray-100 text-gray-600";

  if (viewMode === "lista") {
    return (
      <div className="group flex items-center gap-4 bg-card border border-border rounded-xl p-3 hover:border-letitia-gold/30 hover:shadow-sm transition-all">
        <div className="text-muted/30 cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="h-10 w-10 rounded-lg border border-border bg-background flex items-center justify-center p-2 flex-shrink-0 overflow-hidden">
          <img src={favicon} alt="" className="h-full w-full object-contain" onError={(e) => {
            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${link.titulo}&background=f1f1f1&color=666`;
          }} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-foreground truncate">{link.titulo}</h4>
          <p className="text-[10px] text-muted truncate transition-opacity">{link.url}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tight", badgeColor)}>
            {link.categoria}
          </span>
          <div className="flex items-center gap-1 transition-opacity">
            <button onClick={onToggleFav} className={cn("p-2 rounded-md hover:bg-foreground/5 transition-colors", link.favorito ? "text-letitia-gold" : "text-muted")}>
              <Star className={cn("h-4 w-4", link.favorito && "fill-letitia-gold")} />
            </button>
            <button onClick={onCopy} className="p-2 rounded-md hover:bg-foreground/5 text-muted transition-colors relative">
              {copySuccess ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </button>
            <button className="p-2 rounded-md hover:bg-foreground/5 text-muted transition-colors">
              <Share2 className="h-4 w-4" />
            </button>
            <a href={link.url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-md hover:bg-foreground/5 text-muted transition-colors">
              <ExternalLink className="h-4 w-4" />
            </a>
            <button className="p-2 rounded-md hover:bg-foreground/5 text-muted transition-colors">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group bg-card border border-border rounded-xl p-4 hover:border-letitia-gold/30 hover:shadow-md transition-all flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <div className="h-12 w-12 rounded-xl border border-border bg-background flex items-center justify-center p-2.5 overflow-hidden">
          <img src={favicon} alt="" className="h-full w-full object-contain" />
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onToggleFav} className={cn("p-1.5 rounded-md hover:bg-foreground/5 transition-colors", link.favorito ? "text-letitia-gold" : "text-muted")}>
            <Star className={cn("h-3.5 w-3.5", link.favorito && "fill-letitia-gold")} />
          </button>
          <button className="p-1.5 rounded-md hover:bg-foreground/5 text-muted transition-colors">
            <MoreVertical className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-foreground leading-tight mb-1">{link.titulo}</h4>
        <p className="text-[11px] text-muted truncate mb-4">{link.url.replace(/^https?:\/\//, '')}</p>
      </div>
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
        <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tight", badgeColor)}>
          {link.categoria}
        </span>
        <div className="flex items-center gap-0.5">
          <button onClick={onCopy} className="p-1.5 rounded-md hover:bg-foreground/5 text-muted transition-colors">
            {copySuccess ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <a href={link.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md hover:bg-foreground/5 text-muted transition-colors">
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

function NovoLinkModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: "",
    url: "",
    categoria: "GERAL",
    favorito: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let formattedUrl = formData.url;
      if (!formattedUrl.startsWith('http')) {
        formattedUrl = 'https://' + formattedUrl;
      }
      await createLink({ ...formData, url: formattedUrl });
      onSuccess();
    } catch (error) {
      console.error("Erro ao criar link:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif text-2xl font-medium text-foreground">Novo Link</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-foreground/10 transition-colors">
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Título</label>
            <input
              required
              value={formData.titulo}
              onChange={e => setFormData({ ...formData, titulo: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
              placeholder="Ex: Central de Dashboards"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">URL</label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                required
                value={formData.url}
                onChange={e => setFormData({ ...formData, url: e.target.value })}
                className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
                placeholder="www.exemplo.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Categoria</label>
            <select
              value={formData.categoria}
              onChange={e => setFormData({ ...formData, categoria: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
            >
              <option value="GERAL">Geral</option>
              <option value="MARKETING">Marketing</option>
              <option value="VENDAS">Vendas</option>
              <option value="PRODUTO">Produto</option>
              <option value="PLANILHAS">Planilhas</option>
              <option value="FORMULÁRIOS">Formulários</option>
              <option value="CHECKOUTS">Checkouts</option>
            </select>
          </div>

          <div className="flex items-center gap-2 py-2">
            <input 
              type="checkbox" 
              id="fav"
              checked={formData.favorito}
              onChange={e => setFormData({ ...formData, favorito: e.target.checked })}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="fav" className="text-sm text-foreground font-medium cursor-pointer">Adicionar aos favoritos</label>
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
              Salvar Link
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
