import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { 
  Search, Plus, Eye, EyeOff, Copy, ExternalLink, KeyRound, Check, 
  Trash2, Edit2, Loader2, Save, X, Bookmark, BookmarkCheck 
} from "lucide-react";
import { 
  getSenhas, createSenha, updateSenha, deleteSenha, toggleFavoritoSenha, 
  type DBSenha 
} from "@/services/passwordService";

type Categoria = "Ferramenta" | "Rede Social" | "Curso" | "Financeiro" | "E-mail" | "Autenticador" | "Outros";

const categoriaCores: Record<Categoria, string> = {
  Ferramenta: "bg-blue-500/10 text-blue-600",
  "Rede Social": "bg-pink-500/10 text-pink-600",
  Curso: "bg-amber-500/10 text-amber-600",
  Financeiro: "bg-green-500/10 text-green-600",
  "E-mail": "bg-purple-500/10 text-purple-600",
  Autenticador: "bg-red-500/10 text-red-600",
  Outros: "bg-slate-500/10 text-slate-600",
};

export function Senhas() {
  const [senhas, setSenhas] = useState<DBSenha[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<Categoria | "todas">("todas");
  const [senhasVisiveis, setSenhasVisiveis] = useState<Record<string, boolean>>({});
  const [copiados, setCopiados] = useState<Record<string, boolean>>({});
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSenha, setSelectedSenha] = useState<DBSenha | null>(null);

  useEffect(() => {
    fetchSenhas();
  }, []);

  const fetchSenhas = async () => {
    try {
      const data = await getSenhas();
      setSenhas(data);
    } catch (error) {
      console.error("Erro ao buscar senhas:", error);
    } finally {
      setLoading(false);
    }
  };

  const categorias: Categoria[] = ["Ferramenta", "Rede Social", "Curso", "Financeiro", "E-mail", "Autenticador", "Outros"];

  const filtrados = senhas.filter((s) => {
    const matchBusca = s.servico.toLowerCase().includes(busca.toLowerCase()) || 
                       (s.usuario?.toLowerCase().includes(busca.toLowerCase()) || false);
    const matchCategoria = filtroCategoria === "todas" || s.categoria === filtroCategoria;
    return matchBusca && matchCategoria;
  });

  const toggleSenha = (id: string) => setSenhasVisiveis((prev) => ({ ...prev, [id]: !prev[id] }));

  const copiarSenha = (id: string, senha: string) => {
    navigator.clipboard.writeText(senha);
    setCopiados((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => setCopiados((prev) => ({ ...prev, [id]: false })), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este acesso?")) return;
    try {
      await deleteSenha(id);
      fetchSenhas();
    } catch (error) {
      console.error("Erro ao excluir senha:", error);
    }
  };

  const handleToggleFavorito = async (id: string, atual: boolean) => {
    try {
      await toggleFavoritoSenha(id, !atual);
      fetchSenhas();
    } catch (error) {
      console.error("Erro ao favoritar senha:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-letitia-gold/10">
            <KeyRound className="h-5 w-5 text-letitia-gold" />
          </div>
          <div>
            <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground">Senhas Úteis</h2>
            <p className="mt-0.5 text-sm text-muted">Gerencie credenciais e acessos da equipe de forma centralizada.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all flex items-center gap-2 self-start"
        >
          <Plus className="h-4 w-4" /> Novo Acesso
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-md border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted focus:ring-2 focus:ring-letitia-gold focus:outline-none"
            placeholder="Buscar por serviço ou usuário..."
          />
        </div>
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value as Categoria | "todas")}
          className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
        >
          <option value="todas">Todas categorias</option>
          {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-letitia-gold" />
              <p className="text-sm text-muted">Carregando credenciais...</p>
            </div>
          ) : senhas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 bg-foreground/[0.02]">
              <KeyRound className="h-12 w-12 text-muted/30" />
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Nenhuma senha cadastrada</p>
                <p className="text-xs text-muted">Comece adicionando um novo acesso à equipe.</p>
              </div>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="w-10"></th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Serviço / Site</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted hidden sm:table-cell">Categoria</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted hidden md:table-cell">Usuário</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Senha</th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-background/50 transition-colors">
                    <td className="pl-4 py-3">
                      <button 
                        onClick={() => handleToggleFavorito(s.id, s.favorito)}
                        className={cn("transition-colors", s.favorito ? "text-letitia-gold" : "text-muted/30 hover:text-letitia-gold")}
                      >
                        {s.favorito ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{s.servico}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", categoriaCores[s.categoria as Categoria || "Outros"])}>
                        {s.categoria || "Outros"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted hidden md:table-cell">{s.usuario || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-foreground">
                          {senhasVisiveis[s.id] ? s.senha : "••••••••••••"}
                        </span>
                        <button onClick={() => toggleSenha(s.id)} className="text-muted hover:text-foreground transition-colors">
                          {senhasVisiveis[s.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => copiarSenha(s.id, s.senha)}
                          className={cn("p-1.5 rounded hover:bg-foreground/5 transition-colors", copiados[s.id] ? "text-green-500" : "text-muted hover:text-foreground")}
                          title="Copiar senha"
                        >
                          {copiados[s.id] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                        {s.url && (
                          <a href={s.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-foreground/5 text-muted hover:text-foreground transition-colors" title="Abrir site">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          onClick={() => { setSelectedSenha(s); setIsEditModalOpen(true); }}
                          className="p-1.5 rounded hover:bg-foreground/5 text-muted hover:text-foreground transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="p-1.5 rounded hover:bg-red-500/5 text-muted hover:text-red-500 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <SenhaModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => { setIsModalOpen(false); fetchSenhas(); }} 
        />
      )}

      {isEditModalOpen && selectedSenha && (
        <SenhaModal 
          senha={selectedSenha}
          onClose={() => setIsEditModalOpen(false)} 
          onSuccess={() => { setIsEditModalOpen(false); fetchSenhas(); }} 
        />
      )}
    </div>
  );
}

function SenhaModal({ senha, onClose, onSuccess }: { senha?: DBSenha; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    servico: senha?.servico || "",
    usuario: senha?.usuario || "",
    senha: senha?.senha || "",
    url: senha?.url || "",
    categoria: senha?.categoria || "Ferramenta",
    notas: senha?.notas || "",
    favorito: senha?.favorito || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (senha) {
        await updateSenha(senha.id, formData);
      } else {
        await createSenha(formData);
      }
      onSuccess();
    } catch (error) {
      console.error("Erro ao salvar senha:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif text-2xl font-medium text-foreground">{senha ? "Editar Acesso" : "Novo Acesso"}</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-foreground/10 transition-colors">
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Serviço / Site</label>
            <input
              required
              value={formData.servico}
              onChange={e => setFormData({ ...formData, servico: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
              placeholder="Ex: HubSpot, Hotmart, Instagram"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Usuário / E-mail</label>
              <input
                value={formData.usuario}
                onChange={e => setFormData({ ...formData, usuario: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
                placeholder="Ex: equipe@laetitia.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Senha</label>
              <input
                required
                type="text"
                value={formData.senha}
                onChange={e => setFormData({ ...formData, senha: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
                placeholder="Sua senha secreta"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">URL do Site</label>
              <input
                value={formData.url}
                onChange={e => setFormData({ ...formData, url: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Categoria</label>
              <select
                value={formData.categoria}
                onChange={e => setFormData({ ...formData, categoria: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
              >
                <option value="Ferramenta">Ferramenta</option>
                <option value="Rede Social">Rede Social</option>
                <option value="Curso">Curso</option>
                <option value="Financeiro">Financeiro</option>
                <option value="E-mail">E-mail</option>
                <option value="Autenticador">Autenticador</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Notas (Opcional)</label>
            <textarea
              value={formData.notas}
              onChange={e => setFormData({ ...formData, notas: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none h-20 resize-none"
              placeholder="Alguma observação importante..."
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
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {senha ? "Salvar Alterações" : "Salvar Acesso"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
