import { useState, useEffect, useMemo } from "react";
import { fetchRecentLeadsData, type RecentLeadRecord } from "@/data/salesData";
import {
  BarChart3,
  TrendingUp,
  Loader2,
  Search,
  Inbox,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Calendar,
  Mail,
  Globe,
  Plus,
  X,
  Pencil,
  Trash2,
  Users,
  Eye,
  MousePointerClick,
  Send,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LabelList,
} from "recharts";
import { cn } from "@/lib/utils";

// Design System
const GOLD_COLOR = "#C4A47C";
const COLORS = [GOLD_COLOR, "#A88B63", "#D9C3A5", "#8A8275", "#5C564D", "#403B35", "#C4907C", "#7C98C4"];

// ─── TIPOS PARA MAIL MARKETING ──────────────────────────────────────────────
interface MailCampaign {
  id: string;
  titulo: string;
  texto: string;
  cta: string;
  link: string;
  emailsEnviados: number;
  taxaAbertura: number;
  cliquesLink: number;
  taxaConversao: number;
  dataSemana: string;
}

// ─── TIPOS PARA MÉTRICAS DE REDES ───────────────────────────────────────────
interface SocialMetric {
  plataforma: string;
  perfil: string;
  seguidores: number;
  alcance: number;
  engajamento: number;
  emoji: string;
}

// ─── MÉTRICAS INICIAIS (placeholder) ────────────────────────────────────────
const SOCIAL_PLATFORMS: SocialMetric[] = [
  { plataforma: "Instagram", perfil: "@leticiacazarre", seguidores: 0, alcance: 0, engajamento: 0, emoji: "📸" },
  { plataforma: "Instagram", perfil: "@theway.mentoria", seguidores: 0, alcance: 0, engajamento: 0, emoji: "📸" },
  { plataforma: "Instagram", perfil: "@bnoads", seguidores: 0, alcance: 0, engajamento: 0, emoji: "📸" },
  { plataforma: "Instagram", perfil: "@vaipormi.podcast", seguidores: 0, alcance: 0, engajamento: 0, emoji: "📸" },
  { plataforma: "YouTube", perfil: "Vai por Mim Podcast", seguidores: 0, alcance: 0, engajamento: 0, emoji: "▶️" },
  { plataforma: "Spotify", perfil: "Vai por Mim", seguidores: 0, alcance: 0, engajamento: 0, emoji: "🎧" },
  { plataforma: "LinkedIn", perfil: "Letícia Cazarré", seguidores: 0, alcance: 0, engajamento: 0, emoji: "💼" },
  { plataforma: "TikTok", perfil: "@leticiacazarre", seguidores: 0, alcance: 0, engajamento: 0, emoji: "🎵" },
  { plataforma: "YT Shorts", perfil: "Letícia Cazarré", seguidores: 0, alcance: 0, engajamento: 0, emoji: "📹" },
  { plataforma: "Newsletter", perfil: "Petit Journal (Substack)", seguidores: 0, alcance: 0, engajamento: 0, emoji: "📰" },
];

type MarketingTab = "leads" | "redes" | "mail" | "substack";

export function Marketing() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<MarketingTab>("leads");

  // ─── LEADS DATA (espelho) ──────────────────────────────────────────────────
  const [recentLeads, setRecentLeads] = useState<RecentLeadRecord[]>([]);
  const [recentSearch, setRecentSearch] = useState("");
  const [recentFunilFilter, setRecentFunilFilter] = useState("all");
  const [recentMonthFilter, setRecentMonthFilter] = useState("all");
  const [recentPage, setRecentPage] = useState(1);
  const recentPerPage = 15;

  // ─── MAIL MARKETING ────────────────────────────────────────────────────────
  const [mailCampaigns, setMailCampaigns] = useState<MailCampaign[]>(() => {
    const saved = localStorage.getItem("@letitia:mail-campaigns");
    return saved ? JSON.parse(saved) : [];
  });
  const [showMailModal, setShowMailModal] = useState(false);
  const [editingMail, setEditingMail] = useState<MailCampaign | null>(null);
  const [mailForm, setMailForm] = useState<Partial<MailCampaign>>({});

  // ─── MÉTRICAS REDES SOCIAIS ────────────────────────────────────────────────
  const [socialMetrics, setSocialMetrics] = useState<SocialMetric[]>(() => {
    const saved = localStorage.getItem("@letitia:social-metrics");
    return saved ? JSON.parse(saved) : SOCIAL_PLATFORMS;
  });
  const [editingSocial, setEditingSocial] = useState<number | null>(null);

  // ─── SUBSTACK ──────────────────────────────────────────────────────────────
  const [substackLeads, setSubstackLeads] = useState<{ nome: string; email: string; data: string }[]>(() => {
    const saved = localStorage.getItem("@letitia:substack-leads");
    return saved ? JSON.parse(saved) : [];
  });
  const [showSubstackModal, setShowSubstackModal] = useState(false);
  const [substackForm, setSubstackForm] = useState({ nome: "", email: "" });

  // ─── PERSISTÊNCIA ──────────────────────────────────────────────────────────
  useEffect(() => { localStorage.setItem("@letitia:mail-campaigns", JSON.stringify(mailCampaigns)); }, [mailCampaigns]);
  useEffect(() => { localStorage.setItem("@letitia:social-metrics", JSON.stringify(socialMetrics)); }, [socialMetrics]);
  useEffect(() => { localStorage.setItem("@letitia:substack-leads", JSON.stringify(substackLeads)); }, [substackLeads]);

  // ─── FETCH LEADS ───────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchRecentLeadsData();
        setRecentLeads(data);
      } catch (err) {
        console.warn("Erro ao carregar leads recentes:", err);
      }
      setLoading(false);
    })();
  }, []);

  // ─── PROCESSAMENTO LEADS ──────────────────────────────────────────────────
  const recentFunis = useMemo(() => {
    const set = new Set(recentLeads.map((l) => l.produto).filter(Boolean));
    return Array.from(set).sort();
  }, [recentLeads]);

  const recentMonths = useMemo(() => {
    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const map = new Map<string, { label: string; sort: number }>();
    recentLeads.forEach((l) => {
      const parts = l.dataFormatada.split("/");
      if (parts.length === 3) {
        const m = parseInt(parts[1], 10) - 1;
        const y = parts[2].substring(2);
        const key = `${monthNames[m]}/${y}`;
        const sortKey = parseInt(parts[2], 10) * 100 + m;
        if (!map.has(key)) map.set(key, { label: key, sort: sortKey });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.sort - b.sort);
  }, [recentLeads]);

  const filteredRecentLeads = useMemo(() => {
    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return recentLeads.filter((l) => {
      if (recentMonthFilter !== "all") {
        const parts = l.dataFormatada.split("/");
        if (parts.length === 3) {
          const m = parseInt(parts[1], 10) - 1;
          const y = parts[2].substring(2);
          if (`${monthNames[m]}/${y}` !== recentMonthFilter) return false;
        } else return false;
      }
      if (recentFunilFilter !== "all" && l.produto !== recentFunilFilter) return false;
      if (recentSearch) {
        const q = recentSearch.toLowerCase();
        if (!(l.nome.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || l.telefone.includes(q) || l.produto.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [recentLeads, recentFunilFilter, recentMonthFilter, recentSearch]);

  const recentByFunil = useMemo(() => {
    const map: Record<string, number> = {};
    filteredRecentLeads.forEach((l) => { const key = l.produto || "Sem funil"; map[key] = (map[key] || 0) + 1; });
    return Object.entries(map).map(([funil, quantidade]) => ({ funil, quantidade })).sort((a, b) => b.quantidade - a.quantidade);
  }, [filteredRecentLeads]);

  const recentByDate = useMemo(() => {
    const map: Record<string, number> = {};
    filteredRecentLeads.forEach((l) => { const d = l.dataFormatada; if (d) map[d] = (map[d] || 0) + 1; });
    return Object.entries(map).map(([data, quantidade]) => ({ data, quantidade })).sort((a, b) => {
      const [dA, mA, yA] = a.data.split("/").map(Number);
      const [dB, mB, yB] = b.data.split("/").map(Number);
      return new Date(yA, mA - 1, dA).getTime() - new Date(yB, mB - 1, dB).getTime();
    });
  }, [filteredRecentLeads]);

  const recentPieData = useMemo(() => {
    const total = filteredRecentLeads.length;
    const map: Record<string, number> = {};
    filteredRecentLeads.forEach((l) => { const key = l.produto || "Sem funil"; map[key] = (map[key] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value, percent: total > 0 ? ((value / total) * 100).toFixed(1) : "0" })).sort((a, b) => b.value - a.value);
  }, [filteredRecentLeads]);

  const sortedRecentLeads = useMemo(() => {
    return [...filteredRecentLeads].sort((a, b) => {
      const parseDateTime = (s: string) => {
        const [datePart, timePart] = s.split(" ");
        const [d, m, y] = (datePart || "").split("/").map(Number);
        const [h, min] = (timePart || "00:00").split(":").map(Number);
        return new Date(y, m - 1, d, h || 0, min || 0).getTime();
      };
      return parseDateTime(b.data) - parseDateTime(a.data);
    });
  }, [filteredRecentLeads]);

  const recentTotalPages = Math.ceil(sortedRecentLeads.length / recentPerPage);
  const recentPaginatedLeads = sortedRecentLeads.slice((recentPage - 1) * recentPerPage, recentPage * recentPerPage);

  // ─── HANDLERS MAIL MARKETING ───────────────────────────────────────────────
  const handleSaveMail = () => {
    if (!mailForm.titulo) return;
    const campaign: MailCampaign = {
      id: editingMail?.id || crypto.randomUUID(),
      titulo: mailForm.titulo || "",
      texto: mailForm.texto || "",
      cta: mailForm.cta || "",
      link: mailForm.link || "",
      emailsEnviados: Number(mailForm.emailsEnviados) || 0,
      taxaAbertura: Number(mailForm.taxaAbertura) || 0,
      cliquesLink: Number(mailForm.cliquesLink) || 0,
      taxaConversao: Number(mailForm.taxaConversao) || 0,
      dataSemana: mailForm.dataSemana || new Date().toISOString().split("T")[0],
    };
    if (editingMail) {
      setMailCampaigns(prev => prev.map(m => m.id === editingMail.id ? campaign : m));
    } else {
      setMailCampaigns(prev => [campaign, ...prev]);
    }
    setShowMailModal(false);
    setEditingMail(null);
    setMailForm({});
  };

  // ─── LOADING ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-[75vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-letitia-gold" style={{ color: GOLD_COLOR }} />
        <div className="text-center">
          <h3 className="font-serif text-lg font-medium text-foreground">Carregando Marketing</h3>
          <p className="text-xs text-muted">Processando dados de leads e métricas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* ─── HEADER ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-[#0f766e] via-[#14b8a6] to-[#5eead4] p-6 md:p-8 shadow-lg">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="absolute -left-4 -bottom-4 h-32 w-32 rounded-full bg-white/5" />
          <span className="absolute right-8 bottom-6 text-[120px] font-bold text-white/5 leading-none select-none hidden md:block">📊</span>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-11 w-11 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-2xl md:text-3xl font-semibold text-white tracking-tight">
                Marketing & Métricas
              </h1>
              <p className="text-white/70 text-sm mt-0.5">
                Leads, métricas de redes sociais, mail marketing e canais de aquisição
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── TABS ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto scrollbar-none">
        {([
          { key: "leads" as MarketingTab, label: "Leads", icon: TrendingUp },
          { key: "redes" as MarketingTab, label: "Redes Sociais", icon: BarChart3 },
          { key: "mail" as MarketingTab, label: "Mail Marketing", icon: Mail },
          { key: "substack" as MarketingTab, label: "Substack", icon: Globe },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-[1px] whitespace-nowrap",
              activeTab === tab.key
                ? "border-letitia-gold text-foreground"
                : "border-transparent text-muted hover:text-foreground hover:border-border"
            )}
            style={activeTab === tab.key ? { borderColor: GOLD_COLOR } : {}}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ─── TAB: LEADS (ESPELHO) ─────────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "leads" && (
        <div className="space-y-6">
          {/* Filtros */}
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="text-[9px] font-bold uppercase tracking-widest text-muted block mb-1">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
                <input
                  value={recentSearch}
                  onChange={(e) => { setRecentSearch(e.target.value); setRecentPage(1); }}
                  placeholder="Nome, e-mail..."
                  className="w-full rounded-md border border-border bg-background pl-8 pr-3 py-2 text-xs focus:ring-1 focus:ring-letitia-gold focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-muted block mb-1">Mês</label>
              <select
                value={recentMonthFilter}
                onChange={(e) => { setRecentMonthFilter(e.target.value); setRecentPage(1); }}
                className="rounded-md border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-letitia-gold focus:outline-none"
              >
                <option value="all">Todos</option>
                {recentMonths.map((m) => <option key={m.label} value={m.label}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-muted block mb-1">Funil</label>
              <select
                value={recentFunilFilter}
                onChange={(e) => { setRecentFunilFilter(e.target.value); setRecentPage(1); }}
                className="rounded-md border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-letitia-gold focus:outline-none"
              >
                <option value="all">Todos</option>
                {recentFunis.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted flex items-center gap-1.5">
                <Inbox className="h-4 w-4" style={{ color: GOLD_COLOR }} /> Total de Leads
              </span>
              <p className="font-serif text-3xl font-medium text-foreground mt-2">{filteredRecentLeads.length}</p>
              <p className="text-[10px] text-muted mt-1">no período selecionado</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4" style={{ color: GOLD_COLOR }} /> Funis Ativos
              </span>
              <p className="font-serif text-3xl font-medium text-foreground mt-2">{recentByFunil.length}</p>
              <p className="text-[10px] text-muted mt-1">fontes de aquisição</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted flex items-center gap-1.5">
                <Calendar className="h-4 w-4" style={{ color: GOLD_COLOR }} /> Dias com Captação
              </span>
              <p className="font-serif text-3xl font-medium text-foreground mt-2">{recentByDate.length}</p>
              <p className="text-[10px] text-muted mt-1">dias com pelo menos 1 lead</p>
            </div>
          </div>

          {/* Gráficos em grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Evolução Diária */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4" style={{ color: GOLD_COLOR }} />
                Evolução Diária de Captação
              </h3>
              <div className="h-64">
                {recentByDate.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted italic">Sem dados.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={recentByDate.slice(-30)} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} vertical={false} />
                      <XAxis dataKey="data" tick={{ fontSize: 9, fill: "var(--muted)" }} angle={-45} textAnchor="end" interval={0} height={60}
                        tickFormatter={(v) => { const p = v.split("/"); return `${p[0]}/${p[1]}`; }} />
                      <YAxis tick={{ fontSize: 10, fill: "var(--muted)" }} allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "11px", color: "var(--foreground)" }}
                        formatter={(value: any) => [`${value} leads`, "Quantidade"]} />
                      <Bar dataKey="quantidade" fill={GOLD_COLOR} radius={[3, 3, 0, 0]} maxBarSize={30}>
                        <LabelList dataKey="quantidade" position="top" style={{ fontSize: "9px", fill: "var(--foreground)", fontWeight: 600 }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Distribuição por Funil */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4" style={{ color: GOLD_COLOR }} />
                Distribuição por Funil
              </h3>
              <div className="h-64">
                {recentPieData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted italic">Sem dados.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={recentPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} (${percent}%)`}>
                        {recentPieData.map((_entry, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "11px", color: "var(--foreground)" }} />
                      <Legend wrapperStyle={{ fontSize: "10px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Detalhamento por Funil - Cards */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4" style={{ color: GOLD_COLOR }} />
              Detalhamento por Funil
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentByFunil.map((item, idx) => (
                <div key={item.funil} className="bg-background/30 border border-border p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">{item.funil}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${COLORS[idx % COLORS.length]}15`, color: COLORS[idx % COLORS.length] }}>
                      {item.quantidade} leads
                    </span>
                  </div>
                  <div className="w-full bg-foreground/5 rounded-full h-2 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (item.quantidade / (filteredRecentLeads.length || 1)) * 100)}%`, backgroundColor: COLORS[idx % COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabela de Leads Recentes */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted flex items-center gap-2">
                <Users className="h-4 w-4" style={{ color: GOLD_COLOR }} />
                Leads Recentes ({filteredRecentLeads.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-background/10 text-left">
                    {["Data", "Funil", "Nome", "E-mail", "Telefone"].map((h) => (
                      <th key={h} className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentPaginatedLeads.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted italic">Nenhum lead encontrado.</td></tr>
                  ) : (
                    recentPaginatedLeads.map((l, i) => (
                      <tr key={i} className="border-b border-border last:border-0 hover:bg-background/40 transition-colors">
                        <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">{l.dataFormatada}</td>
                        <td className="px-4 py-3 text-xs font-medium text-foreground">{l.produto || "—"}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-foreground">{l.nome}</td>
                        <td className="px-4 py-3 text-xs text-muted truncate max-w-[180px]">{l.email}</td>
                        <td className="px-4 py-3 text-xs text-muted">{l.telefone}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {recentTotalPages > 1 && (
              <div className="flex items-center justify-center gap-3 p-4 border-t border-border">
                <button onClick={() => setRecentPage(Math.max(1, recentPage - 1))} disabled={recentPage <= 1} className="p-1.5 rounded-md border border-border disabled:opacity-30 hover:bg-foreground/5">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs text-muted">{recentPage} / {recentTotalPages}</span>
                <button onClick={() => setRecentPage(Math.min(recentTotalPages, recentPage + 1))} disabled={recentPage >= recentTotalPages} className="p-1.5 rounded-md border border-border disabled:opacity-30 hover:bg-foreground/5">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ─── TAB: REDES SOCIAIS ───────────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "redes" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-xs text-muted mb-4">
              Preencha as métricas manualmente por enquanto. No futuro, integraremos com APIs para automação.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {socialMetrics.map((metric, idx) => (
              <div key={idx} className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3 relative group">
                <button
                  onClick={() => setEditingSocial(editingSocial === idx ? null : idx)}
                  className="absolute top-3 right-3 p-1.5 text-muted hover:text-foreground hover:bg-foreground/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{metric.emoji}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{metric.plataforma}</p>
                    <p className="text-[10px] text-muted">{metric.perfil}</p>
                  </div>
                </div>

                {editingSocial === idx ? (
                  <div className="space-y-2 border-t border-border pt-3">
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-widest text-muted">Seguidores</label>
                      <input type="number" value={metric.seguidores} onChange={(e) => {
                        const updated = [...socialMetrics]; updated[idx] = { ...updated[idx], seguidores: Number(e.target.value) }; setSocialMetrics(updated);
                      }} className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs focus:ring-1 focus:ring-letitia-gold focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-widest text-muted">Alcance Semanal</label>
                      <input type="number" value={metric.alcance} onChange={(e) => {
                        const updated = [...socialMetrics]; updated[idx] = { ...updated[idx], alcance: Number(e.target.value) }; setSocialMetrics(updated);
                      }} className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs focus:ring-1 focus:ring-letitia-gold focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-widest text-muted">Engajamento (%)</label>
                      <input type="number" step="0.1" value={metric.engajamento} onChange={(e) => {
                        const updated = [...socialMetrics]; updated[idx] = { ...updated[idx], engajamento: Number(e.target.value) }; setSocialMetrics(updated);
                      }} className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs focus:ring-1 focus:ring-letitia-gold focus:outline-none" />
                    </div>
                    <button onClick={() => setEditingSocial(null)} className="text-[10px] font-semibold text-letitia-gold hover:underline">
                      ✓ Salvar
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 text-center border-t border-border/50 pt-3">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted">Seguidores</p>
                      <p className="text-sm font-semibold text-foreground">{metric.seguidores > 0 ? metric.seguidores.toLocaleString("pt-BR") : "—"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted">Alcance</p>
                      <p className="text-sm font-semibold text-foreground">{metric.alcance > 0 ? metric.alcance.toLocaleString("pt-BR") : "—"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted">Engaj.</p>
                      <p className="text-sm font-semibold text-foreground">{metric.engajamento > 0 ? `${metric.engajamento}%` : "—"}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ─── TAB: MAIL MARKETING ──────────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "mail" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted">Registre campanhas de e-mail marketing com métricas de performance.</p>
            <button
              onClick={() => { setEditingMail(null); setMailForm({}); setShowMailModal(true); }}
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:opacity-90"
              style={{ backgroundColor: GOLD_COLOR }}
            >
              <Plus className="h-4 w-4" /> Nova Campanha
            </button>
          </div>

          {/* KPIs de Mail Marketing */}
          {mailCampaigns.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm text-center">
                <Send className="h-5 w-5 mx-auto mb-1" style={{ color: GOLD_COLOR }} />
                <p className="text-lg font-semibold text-foreground">{mailCampaigns.reduce((a, c) => a + c.emailsEnviados, 0).toLocaleString("pt-BR")}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted">E-mails Enviados</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm text-center">
                <Eye className="h-5 w-5 mx-auto mb-1" style={{ color: GOLD_COLOR }} />
                <p className="text-lg font-semibold text-foreground">
                  {mailCampaigns.length > 0 ? (mailCampaigns.reduce((a, c) => a + c.taxaAbertura, 0) / mailCampaigns.length).toFixed(1) : 0}%
                </p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted">Taxa de Abertura</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm text-center">
                <MousePointerClick className="h-5 w-5 mx-auto mb-1" style={{ color: GOLD_COLOR }} />
                <p className="text-lg font-semibold text-foreground">{mailCampaigns.reduce((a, c) => a + c.cliquesLink, 0).toLocaleString("pt-BR")}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted">Cliques nos Links</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm text-center">
                <TrendingUp className="h-5 w-5 mx-auto mb-1" style={{ color: GOLD_COLOR }} />
                <p className="text-lg font-semibold text-foreground">
                  {mailCampaigns.length > 0 ? (mailCampaigns.reduce((a, c) => a + c.taxaConversao, 0) / mailCampaigns.length).toFixed(1) : 0}%
                </p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted">Taxa de Conversão</p>
              </div>
            </div>
          )}

          {/* Tabela de campanhas */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-background/10 text-left">
                    {["Semana", "Título", "CTA", "Enviados", "Abertura", "Cliques", "Conversão", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mailCampaigns.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-muted italic">Nenhuma campanha registrada. Clique em "Nova Campanha" para começar.</td></tr>
                  ) : (
                    mailCampaigns.map((c) => (
                      <tr key={c.id} className="border-b border-border last:border-0 hover:bg-background/40 transition-colors">
                        <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">{c.dataSemana}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-foreground max-w-[200px] truncate">{c.titulo}</td>
                        <td className="px-4 py-3 text-xs text-muted max-w-[120px] truncate">{c.cta || "—"}</td>
                        <td className="px-4 py-3 text-xs text-foreground font-medium">{c.emailsEnviados.toLocaleString("pt-BR")}</td>
                        <td className="px-4 py-3 text-xs text-foreground">{c.taxaAbertura}%</td>
                        <td className="px-4 py-3 text-xs text-foreground">{c.cliquesLink}</td>
                        <td className="px-4 py-3 text-xs text-foreground">{c.taxaConversao}%</td>
                        <td className="px-4 py-3 text-xs">
                          <div className="flex gap-1">
                            <button onClick={() => { setEditingMail(c); setMailForm(c); setShowMailModal(true); }} className="p-1 text-muted hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                            <button onClick={() => setMailCampaigns(prev => prev.filter(m => m.id !== c.id))} className="p-1 text-muted hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal de Campanha */}
          {showMailModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowMailModal(false)}>
              <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-serif text-lg font-semibold text-foreground">{editingMail ? "Editar Campanha" : "Nova Campanha"}</h3>
                  <button onClick={() => setShowMailModal(false)} className="p-1 text-muted hover:text-foreground"><X className="h-5 w-5" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted block mb-1">Título do E-mail *</label>
                    <input value={mailForm.titulo || ""} onChange={(e) => setMailForm({ ...mailForm, titulo: e.target.value })}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-letitia-gold focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted block mb-1">Corpo do Texto (resumo)</label>
                    <textarea value={mailForm.texto || ""} onChange={(e) => setMailForm({ ...mailForm, texto: e.target.value })} rows={3}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-letitia-gold focus:outline-none resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted block mb-1">CTA</label>
                      <input value={mailForm.cta || ""} onChange={(e) => setMailForm({ ...mailForm, cta: e.target.value })}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-letitia-gold focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted block mb-1">Link</label>
                      <input value={mailForm.link || ""} onChange={(e) => setMailForm({ ...mailForm, link: e.target.value })}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-letitia-gold focus:outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted block mb-1">E-mails Enviados</label>
                      <input type="number" value={mailForm.emailsEnviados || ""} onChange={(e) => setMailForm({ ...mailForm, emailsEnviados: Number(e.target.value) })}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-letitia-gold focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted block mb-1">Taxa de Abertura (%)</label>
                      <input type="number" step="0.1" value={mailForm.taxaAbertura || ""} onChange={(e) => setMailForm({ ...mailForm, taxaAbertura: Number(e.target.value) })}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-letitia-gold focus:outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted block mb-1">Cliques no Link</label>
                      <input type="number" value={mailForm.cliquesLink || ""} onChange={(e) => setMailForm({ ...mailForm, cliquesLink: Number(e.target.value) })}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-letitia-gold focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted block mb-1">Taxa de Conversão (%)</label>
                      <input type="number" step="0.1" value={mailForm.taxaConversao || ""} onChange={(e) => setMailForm({ ...mailForm, taxaConversao: Number(e.target.value) })}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-letitia-gold focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted block mb-1">Semana</label>
                    <input type="date" value={mailForm.dataSemana || ""} onChange={(e) => setMailForm({ ...mailForm, dataSemana: e.target.value })}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-letitia-gold focus:outline-none" />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowMailModal(false)} className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-muted hover:bg-foreground/5 transition-colors">
                    Cancelar
                  </button>
                  <button onClick={handleSaveMail} className="flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90" style={{ backgroundColor: GOLD_COLOR }}>
                    {editingMail ? "Salvar" : "Criar Campanha"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ─── TAB: SUBSTACK / NEWSLETTER ───────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "substack" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted">
                Leads do Substack (Petit Journal). Semanalmente, o time precisa baixar novos assinantes e trazer para cá.
              </p>
              <p className="text-[10px] text-muted mt-1">
                Esses leads alimentarão o futuro mail marketing e aparecerão em "Leads Recentes" quando integrados ao CRM.
              </p>
            </div>
            <button
              onClick={() => { setSubstackForm({ nome: "", email: "" }); setShowSubstackModal(true); }}
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:opacity-90"
              style={{ backgroundColor: GOLD_COLOR }}
            >
              <Plus className="h-4 w-4" /> Adicionar Lead
            </button>
          </div>

          {/* KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted flex items-center gap-1.5">
                <Globe className="h-4 w-4" style={{ color: GOLD_COLOR }} /> Leads Substack Importados
              </span>
              <p className="font-serif text-3xl font-medium text-foreground mt-2">{substackLeads.length}</p>
              <p className="text-[10px] text-muted mt-1">assinantes registrados manualmente</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted flex items-center gap-1.5">
                <Mail className="h-4 w-4" style={{ color: GOLD_COLOR }} /> Base Mail Marketing
              </span>
              <p className="font-serif text-3xl font-medium text-foreground mt-2">{substackLeads.filter(l => l.email).length}</p>
              <p className="text-[10px] text-muted mt-1">com e-mail válido para campanhas</p>
            </div>
          </div>

          {/* Tabela de Leads Substack */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-background/10 text-left">
                    {["Data Import", "Nome", "E-mail", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {substackLeads.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-muted italic">Nenhum lead importado do Substack. Clique em "Adicionar Lead" para começar.</td></tr>
                  ) : (
                    substackLeads.map((l, i) => (
                      <tr key={i} className="border-b border-border last:border-0 hover:bg-background/40 transition-colors">
                        <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">{l.data}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-foreground">{l.nome || "—"}</td>
                        <td className="px-4 py-3 text-xs text-muted">{l.email}</td>
                        <td className="px-4 py-3 text-xs">
                          <button onClick={() => setSubstackLeads(prev => prev.filter((_, idx) => idx !== i))} className="p-1 text-muted hover:text-red-500">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal Substack */}
          {showSubstackModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowSubstackModal(false)}>
              <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-serif text-lg font-semibold text-foreground">Adicionar Lead Substack</h3>
                  <button onClick={() => setShowSubstackModal(false)} className="p-1 text-muted hover:text-foreground"><X className="h-5 w-5" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted block mb-1">Nome</label>
                    <input value={substackForm.nome} onChange={(e) => setSubstackForm({ ...substackForm, nome: e.target.value })}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-letitia-gold focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted block mb-1">E-mail *</label>
                    <input type="email" value={substackForm.email} onChange={(e) => setSubstackForm({ ...substackForm, email: e.target.value })}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-letitia-gold focus:outline-none" />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowSubstackModal(false)} className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-muted hover:bg-foreground/5 transition-colors">
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      if (!substackForm.email) return;
                      setSubstackLeads(prev => [{ ...substackForm, data: new Date().toLocaleDateString("pt-BR") }, ...prev]);
                      setShowSubstackModal(false);
                    }}
                    className="flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ backgroundColor: GOLD_COLOR }}
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
