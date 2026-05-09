import { useState } from "react";
import { cn } from "@/lib/utils";
import { Search, Plus, Eye, EyeOff, Copy, ExternalLink, KeyRound, Check } from "lucide-react";

type Categoria = "Ferramenta" | "Rede Social" | "Curso" | "Financeiro" | "E-mail" | "Autenticador";

type Senha = {
  id: string;
  nome: string;
  categoria: Categoria;
  usuario: string;
  senha: string;
  url?: string;
};

const categoriaCores: Record<Categoria, string> = {
  Ferramenta: "bg-blue-500/10 text-blue-600",
  "Rede Social": "bg-pink-500/10 text-pink-600",
  Curso: "bg-amber-500/10 text-amber-600",
  Financeiro: "bg-green-500/10 text-green-600",
  "E-mail": "bg-purple-500/10 text-purple-600",
  Autenticador: "bg-red-500/10 text-red-600",
};

const senhasMock: Senha[] = [
  { id: "s1", nome: "Meta Business Suite", categoria: "Ferramenta", usuario: "equipe@leticiacazarre.com.br", senha: "M3t@Bu$1n3ss!", url: "https://business.facebook.com" },
  { id: "s2", nome: "Instagram @leticiacazarre", categoria: "Rede Social", usuario: "equipe@leticiacazarre.com.br", senha: "Insta#2026Lc" },
  { id: "s3", nome: "Hotmart (Produtor)", categoria: "Ferramenta", usuario: "leticia@leticiacazarre.com.br", senha: "H0tm@rt!Pr0d", url: "https://app.hotmart.com" },
  { id: "s4", nome: "Supabase LetitiAPP", categoria: "Ferramenta", usuario: "dev@leticiacazarre.com.br", senha: "Sup@b4s3!2026", url: "https://supabase.com" },
  { id: "s5", nome: "Substack Newsletter", categoria: "Ferramenta", usuario: "leticia@leticiacazarre.com.br", senha: "Sub$t@ck#PJ", url: "https://substack.com" },
  { id: "s6", nome: "Google Workspace", categoria: "E-mail", usuario: "admin@leticiacazarre.com.br", senha: "G00gl3#Ws!", url: "https://admin.google.com" },
  { id: "s7", nome: "Asaas (Cobranças)", categoria: "Financeiro", usuario: "financeiro@leticiacazarre.com.br", senha: "As@@s#F1n!", url: "https://www.asaas.com" },
  { id: "s8", nome: "Canva Pro", categoria: "Ferramenta", usuario: "equipe@leticiacazarre.com.br", senha: "C@nv4#Pr0!", url: "https://canva.com" },
  { id: "s9", nome: "YouTube Studio", categoria: "Rede Social", usuario: "equipe@leticiacazarre.com.br", senha: "YT$tud10#26" },
  { id: "s10", nome: "Comunidade Sobral", categoria: "Curso", usuario: "equipe@leticiacazarre.com.br", senha: "S0br@l#Tr4f!", url: "https://comunidade.sobral.com" },
  { id: "s11", nome: "CapCut Pro", categoria: "Ferramenta", usuario: "mariana@leticiacazarre.com.br", senha: "C@pCut#2026" },
  { id: "s12", nome: "Spotify for Podcasters", categoria: "Ferramenta", usuario: "leticia@leticiacazarre.com.br", senha: "Sp0t1fy#P0d!", url: "https://podcasters.spotify.com" },
];

export function Senhas() {
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<Categoria | "todas">("todas");
  const [senhasVisiveis, setSenhasVisiveis] = useState<Record<string, boolean>>({});
  const [copiados, setCopiados] = useState<Record<string, boolean>>({});

  const categorias: Categoria[] = ["Ferramenta", "Rede Social", "Curso", "Financeiro", "E-mail", "Autenticador"];

  const filtrados = senhasMock.filter((s) => {
    const matchBusca = s.nome.toLowerCase().includes(busca.toLowerCase()) || s.usuario.toLowerCase().includes(busca.toLowerCase());
    const matchCategoria = filtroCategoria === "todas" || s.categoria === filtroCategoria;
    return matchBusca && matchCategoria;
  });

  const toggleSenha = (id: string) => setSenhasVisiveis((prev) => ({ ...prev, [id]: !prev[id] }));

  const copiarSenha = (id: string, senha: string) => {
    navigator.clipboard.writeText(senha);
    setCopiados((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => setCopiados((prev) => ({ ...prev, [id]: false })), 2000);
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
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all flex items-center gap-2 self-start">
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
            placeholder="Buscar por nome ou usuário..."
          />
        </div>
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value as Categoria | "todas")}
          className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
        >
          <option value="todas">Todas categorias ({senhasMock.length})</option>
          {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Nome do Login</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted hidden sm:table-cell">Categoria</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted hidden md:table-cell">Usuário</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Senha</th>
                <th className="text-center px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-background/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-letitia-gold flex-shrink-0" />
                      <span className="text-sm font-medium text-foreground">{s.nome}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", categoriaCores[s.categoria])}>
                      {s.categoria}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted hidden md:table-cell">{s.usuario}</td>
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
