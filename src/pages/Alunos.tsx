import { useState, useMemo } from "react";
import {
  processAlunos,
  getProductColor,
  type Aluno,
} from "@/data/alunosData";
import {
  Users,
  Search,
  Mail,
  Phone,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  X,
  ShoppingBag,
  Layers,
  TrendingUp,
  Sparkles,
  ArrowUpDown,
  Filter,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";

const GOLD = "#C4A47C";
const SAGE = "#7A8B6F";

// ─── Helpers ─────────────────────────────────────────────────────────
function formatPhoneForWhatsApp(phone: string): string {
  return phone.replace(/[^0-9+]/g, "").replace(/^\+/, "");
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Generates a subtle hue from a string hash
function hashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 35%, 55%)`;
}

// ─── Component ─────────────────────────────────────────────────────
export function Alunos() {
  const allAlunos = useMemo(() => processAlunos(), []);

  // Filters
  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState("all");
  const [multiFilter, setMultiFilter] = useState<"all" | "multi" | "single">("all");
  const [sortBy, setSortBy] = useState<"name" | "products">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Detail modal
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null);

  // Copied state
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // ─── Derived data ─────────────────────────────────────────────────
  const allProducts = useMemo(() => {
    const set = new Set<string>();
    allAlunos.forEach((a) => a.produtosUnicos.forEach((p) => set.add(p)));
    return Array.from(set).sort();
  }, [allAlunos]);

  const totalAlunos = allAlunos.length;
  const multiProdutoAlunos = useMemo(() => allAlunos.filter((a) => a.isMultiProduto), [allAlunos]);
  const multiProdutoPercent = totalAlunos > 0 ? ((multiProdutoAlunos.length / totalAlunos) * 100).toFixed(1) : "0";

  // Product distribution
  const productDistribution = useMemo(() => {
    const map = new Map<string, number>();
    allAlunos.forEach((a) => {
      a.produtosUnicos.forEach((p) => {
        map.set(p, (map.get(p) || 0) + 1);
      });
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [allAlunos]);

  // Cross-sell / intersection matrix (top 5 products)
  const crossSellData = useMemo(() => {
    const top5 = productDistribution.slice(0, 5).map((p) => p.name);
    const matrix: { from: string; to: string; count: number }[] = [];

    for (let i = 0; i < top5.length; i++) {
      for (let j = i + 1; j < top5.length; j++) {
        const count = allAlunos.filter(
          (a) => a.produtosUnicos.includes(top5[i]) && a.produtosUnicos.includes(top5[j])
        ).length;
        if (count > 0) {
          matrix.push({ from: top5[i], to: top5[j], count });
        }
      }
    }
    return matrix.sort((a, b) => b.count - a.count);
  }, [allAlunos, productDistribution]);

  // Filter/sort
  const filteredAlunos = useMemo(() => {
    let result = [...allAlunos];

    // Search
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.nome.toLowerCase().includes(s) ||
          a.email.toLowerCase().includes(s) ||
          a.telefone.includes(s) ||
          a.produtosUnicos.some((p) => p.toLowerCase().includes(s))
      );
    }

    // Product filter
    if (productFilter !== "all") {
      result = result.filter((a) => a.produtosUnicos.includes(productFilter));
    }

    // Multi/single filter
    if (multiFilter === "multi") {
      result = result.filter((a) => a.isMultiProduto);
    } else if (multiFilter === "single") {
      result = result.filter((a) => !a.isMultiProduto);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "name") {
        const cmp = a.nome.localeCompare(b.nome, "pt-BR");
        return sortDir === "asc" ? cmp : -cmp;
      }
      const cmp = a.produtosUnicos.length - b.produtosUnicos.length;
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [allAlunos, search, productFilter, multiFilter, sortBy, sortDir]);

  const totalPages = Math.ceil(filteredAlunos.length / itemsPerPage);
  const paginatedAlunos = filteredAlunos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page on filter change
  const handleFilterChange = (fn: () => void) => {
    fn();
    setCurrentPage(1);
  };

  const toggleSort = (key: "name" | "products") => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
    setCurrentPage(1);
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // fallback
    }
  };

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* ─── HEADER ──────────────────────────────────────────────────── */}
      <div className="border-b border-border pb-6">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span
            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1"
            style={{
              backgroundColor: `${GOLD}15`,
              color: GOLD,
              borderColor: `${GOLD}33`,
            }}
          >
            <GraduationCap className="h-3 w-3" /> Base de Alunos
          </span>
          <span className="text-xs text-muted">
            • {totalAlunos} alunos únicos • {allProducts.length} produtos
          </span>
        </div>
        <h2 className="font-serif text-3xl md:text-4xl font-medium tracking-tight text-foreground">
          Painel de Alunos
        </h2>
        <p className="mt-1 text-sm text-muted">
          Visão completa de todos os alunos por produto, com insights de cross-sell e esteira de produtos.
        </p>
      </div>

      {/* ─── KPIs ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Alunos */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between min-h-[130px]">
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted flex items-center gap-1.5">
            <Users className="h-4 w-4" style={{ color: GOLD }} /> Total de Alunos
          </span>
          <p className="font-serif text-3xl font-medium text-foreground my-2">{totalAlunos}</p>
          <p className="text-[10px] text-muted uppercase tracking-wider">Alunos únicos por e-mail</p>
        </div>

        {/* Multi-Produto */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between min-h-[130px]">
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted flex items-center gap-1.5">
            <Layers className="h-4 w-4" style={{ color: GOLD }} /> Multi-Produto
          </span>
          <div className="my-2">
            <p className="font-serif text-3xl font-medium text-foreground">
              {multiProdutoAlunos.length}
              <span className="text-sm font-sans text-muted font-normal ml-2">({multiProdutoPercent}%)</span>
            </p>
          </div>
          <div className="w-full bg-foreground/5 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${multiProdutoPercent}%`, backgroundColor: SAGE }}
            />
          </div>
        </div>

        {/* Produtos Ativos */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between min-h-[130px]">
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted flex items-center gap-1.5">
            <ShoppingBag className="h-4 w-4" style={{ color: GOLD }} /> Produtos
          </span>
          <p className="font-serif text-3xl font-medium text-foreground my-2">{allProducts.length}</p>
          <p className="text-[10px] text-muted uppercase tracking-wider">Produtos na esteira</p>
        </div>

        {/* Top Produto */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between min-h-[130px]">
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4" style={{ color: GOLD }} /> Mais Comprado
          </span>
          <div className="my-2">
            <p className="font-serif text-lg font-medium text-foreground leading-tight">
              {productDistribution[0]?.name || "—"}
            </p>
            <p className="text-xs text-muted mt-1">
              {productDistribution[0]?.value || 0} alunos
            </p>
          </div>
        </div>
      </div>

      {/* ─── CHARTS ROW ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie - Product Distribution */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" style={{ color: GOLD }} /> Distribuição por Produto
          </h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={productDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }: { name?: string; percent?: number }) => {
                    const n = name || '';
                    const p = percent || 0;
                    return `${n.length > 18 ? n.slice(0, 18) + "…" : n} (${(p * 100).toFixed(0)}%)`;
                  }}
                  labelLine={true}
                >
                  {productDistribution.map((entry) => (
                    <Cell key={entry.name} fill={getProductColor(entry.name)} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#EFEAE0",
                    border: "1px solid rgba(138,130,117,0.2)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: any, name: any) => [`${value} alunos`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar - Product Ranking */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5" style={{ color: GOLD }} /> Ranking de Produtos
          </h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productDistribution} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(138,130,117,0.12)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#8A8275" }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={140}
                  tick={{ fontSize: 10, fill: "#1A1A1A" }}
                  tickFormatter={(v: string) => (v.length > 22 ? v.slice(0, 22) + "…" : v)}
                />
                <Tooltip
                  contentStyle={{
                    background: "#EFEAE0",
                    border: "1px solid rgba(138,130,117,0.2)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: any) => [`${value} alunos`]}
                />
                <Bar
                  dataKey="value"
                  radius={[0, 6, 6, 0]}
                  maxBarSize={28}
                >
                  {productDistribution.map((entry) => (
                    <Cell key={entry.name} fill={getProductColor(entry.name)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ─── CROSS-SELL / INTERSECTION TABLE ─────────────────────────── */}
      {crossSellData.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
            <Layers className="h-3.5 w-3.5" style={{ color: GOLD }} /> Interseção de Produtos — Alunos que compram mais de um
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2.5 pr-4 text-[10px] font-bold uppercase tracking-widest text-muted">Produto A</th>
                  <th className="py-2.5 pr-4 text-[10px] font-bold uppercase tracking-widest text-muted">Produto B</th>
                  <th className="py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted text-right">Alunos em comum</th>
                </tr>
              </thead>
              <tbody>
                {crossSellData.map((row, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-foreground/[0.02] transition-colors">
                    <td className="py-3 pr-4">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: getProductColor(row.from) }}
                      >
                        {row.from}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: getProductColor(row.to) }}
                      >
                        {row.to}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="font-serif text-lg font-medium text-foreground">{row.count}</span>
                      <span className="text-[10px] text-muted ml-1.5">alunos</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── FILTERS ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 text-muted">
            <Filter className="h-4 w-4" style={{ color: GOLD }} />
            <span className="text-xs font-semibold uppercase tracking-wider">Filtros & Busca</span>
          </div>
          {(search || productFilter !== "all" || multiFilter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setProductFilter("all");
                setMultiFilter("all");
                setCurrentPage(1);
              }}
              className="text-[10px] font-bold uppercase tracking-wider hover:underline cursor-pointer"
              style={{ color: GOLD }}
            >
              Limpar Filtros ✕
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="space-y-1 md:col-span-2">
            <label className="text-[9px] font-bold uppercase tracking-widest text-muted block">Buscar Aluno</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted" />
              <input
                type="text"
                placeholder="Nome, email, telefone, produto..."
                value={search}
                onChange={(e) => handleFilterChange(() => setSearch(e.target.value))}
                className="w-full rounded-md border border-border bg-background pl-8 pr-3 py-2 text-xs text-foreground focus:ring-1 focus:outline-none"
                style={{ "--tw-ring-color": GOLD } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Product */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold uppercase tracking-widest text-muted block">Produto</label>
            <select
              value={productFilter}
              onChange={(e) => handleFilterChange(() => setProductFilter(e.target.value))}
              className="w-full rounded-md border border-border bg-background px-2.5 py-2 text-xs text-foreground focus:ring-1 focus:outline-none"
            >
              <option value="all">Todos ({allProducts.length})</option>
              {allProducts.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Multi-produto */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold uppercase tracking-widest text-muted block">Tipo de Aluno</label>
            <select
              value={multiFilter}
              onChange={(e) => handleFilterChange(() => setMultiFilter(e.target.value as "all" | "multi" | "single"))}
              className="w-full rounded-md border border-border bg-background px-2.5 py-2 text-xs text-foreground focus:ring-1 focus:outline-none"
            >
              <option value="all">Todos</option>
              <option value="multi">Multi-Produto ({multiProdutoAlunos.length})</option>
              <option value="single">Produto Único ({totalAlunos - multiProdutoAlunos.length})</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── STUDENT LIST ────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-foreground/[0.02] border-b border-border text-[10px] font-bold uppercase tracking-widest text-muted">
          <div className="col-span-4 sm:col-span-3 flex items-center gap-1 cursor-pointer select-none" onClick={() => toggleSort("name")}>
            Nome
            <ArrowUpDown className="h-3 w-3" />
            {sortBy === "name" && (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
          </div>
          <div className="col-span-3 hidden sm:block">Email</div>
          <div className="col-span-2 hidden md:block">Telefone</div>
          <div className="col-span-5 sm:col-span-4 md:col-span-4 flex items-center gap-1 cursor-pointer select-none" onClick={() => toggleSort("products")}>
            Produtos
            <ArrowUpDown className="h-3 w-3" />
            {sortBy === "products" && (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
          </div>
        </div>

        {/* Students rows */}
        {paginatedAlunos.length === 0 ? (
          <div className="px-5 py-12 text-center text-muted text-sm">
            Nenhum aluno encontrado com os filtros atuais.
          </div>
        ) : (
          paginatedAlunos.map((aluno) => (
            <div
              key={aluno.id}
              className="grid grid-cols-12 gap-2 px-5 py-3.5 border-b border-border/50 hover:bg-foreground/[0.02] transition-colors cursor-pointer group"
              onClick={() => setSelectedAluno(aluno)}
            >
              {/* Name + Avatar */}
              <div className="col-span-4 sm:col-span-3 flex items-center gap-3 min-w-0">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 transition-transform group-hover:scale-105"
                  style={{ backgroundColor: hashColor(aluno.email) }}
                >
                  {getInitials(aluno.nome)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate group-hover:underline decoration-foreground/30 underline-offset-2">
                    {aluno.nome}
                  </p>
                  <p className="text-[10px] text-muted truncate sm:hidden">{aluno.email}</p>
                </div>
              </div>

              {/* Email */}
              <div className="col-span-3 hidden sm:flex items-center min-w-0">
                <p className="text-xs text-foreground/80 truncate">{aluno.email}</p>
              </div>

              {/* Phone */}
              <div className="col-span-2 hidden md:flex items-center gap-1.5 min-w-0">
                <p className="text-xs text-foreground/80 truncate">{aluno.telefone || "—"}</p>
                {aluno.telefone && (
                  <a
                    href={`https://wa.me/${formatPhoneForWhatsApp(aluno.telefone)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 rounded-full p-1 hover:bg-green-100 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                    title="Abrir WhatsApp"
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-green-600" />
                  </a>
                )}
              </div>

              {/* Products */}
              <div className="col-span-5 sm:col-span-4 md:col-span-4 flex items-center gap-1.5 flex-wrap">
                {aluno.produtosUnicos.slice(0, 3).map((prod) => (
                  <span
                    key={prod}
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white whitespace-nowrap"
                    style={{ backgroundColor: getProductColor(prod) }}
                  >
                    {prod.length > 20 ? prod.slice(0, 20) + "…" : prod}
                  </span>
                ))}
                {aluno.produtosUnicos.length > 3 && (
                  <span className="text-[10px] text-muted font-medium">
                    +{aluno.produtosUnicos.length - 3}
                  </span>
                )}
              </div>
            </div>
          ))
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 bg-foreground/[0.01]">
            <p className="text-[10px] text-muted uppercase tracking-wider">
              {filteredAlunos.length} aluno{filteredAlunos.length !== 1 ? "s" : ""} • Página {currentPage} de {totalPages}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="p-1.5 rounded-md border border-border hover:bg-foreground/5 disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "w-7 h-7 rounded-md text-xs font-semibold transition-colors cursor-pointer",
                      currentPage === page
                        ? "text-white"
                        : "text-foreground/60 hover:bg-foreground/5 border border-border"
                    )}
                    style={currentPage === page ? { backgroundColor: GOLD } : {}}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="p-1.5 rounded-md border border-border hover:bg-foreground/5 disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── DETAIL MODAL ────────────────────────────────────────────── */}
      {selectedAluno && (
        <div className="modal-overlay items-center justify-center p-4" onClick={() => setSelectedAluno(null)}>
          <div
            className="modal-content bg-card rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-card/95 backdrop-blur-sm z-10 px-6 pt-5 pb-4 border-b border-border flex items-start justify-between">
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                  style={{ backgroundColor: hashColor(selectedAluno.email) }}
                >
                  {getInitials(selectedAluno.nome)}
                </div>
                <div className="min-w-0">
                  <h3 className="font-serif text-xl font-medium text-foreground truncate">{selectedAluno.nome}</h3>
                  <p className="text-xs text-muted mt-0.5">
                    {selectedAluno.produtosUnicos.length} produto{selectedAluno.produtosUnicos.length !== 1 ? "s" : ""}
                    {selectedAluno.isMultiProduto && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-green-100 text-green-700">
                        Multi-Produto ✨
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAluno(null)}
                className="p-1.5 rounded-lg hover:bg-foreground/5 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5 text-muted" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              {/* Contact Info */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted">Informações de Contato</h4>

                {/* Email */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-foreground/[0.02] border border-border/50">
                  <Mail className="h-4 w-4 text-muted flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted">Email</p>
                    <a
                      href={`mailto:${selectedAluno.email}`}
                      className="text-sm text-foreground hover:underline underline-offset-2 break-all"
                    >
                      {selectedAluno.email}
                    </a>
                  </div>
                  <button
                    onClick={() => copyToClipboard(selectedAluno.email, `email-${selectedAluno.id}`)}
                    className="p-1.5 rounded-md hover:bg-foreground/5 transition-colors cursor-pointer"
                    title="Copiar email"
                  >
                    {copiedField === `email-${selectedAluno.id}` ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-muted" />
                    )}
                  </button>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-foreground/[0.02] border border-border/50">
                  <Phone className="h-4 w-4 text-muted flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted">Telefone</p>
                    <p className="text-sm text-foreground">{selectedAluno.telefone || "Não informado"}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {selectedAluno.telefone && (
                      <>
                        <button
                          onClick={() => copyToClipboard(selectedAluno.telefone, `phone-${selectedAluno.id}`)}
                          className="p-1.5 rounded-md hover:bg-foreground/5 transition-colors cursor-pointer"
                          title="Copiar telefone"
                        >
                          {copiedField === `phone-${selectedAluno.id}` ? (
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-muted" />
                          )}
                        </button>
                        <a
                          href={`https://wa.me/${formatPhoneForWhatsApp(selectedAluno.telefone)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition-all hover:opacity-90"
                          style={{ backgroundColor: "#25D366" }}
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          WhatsApp
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Products */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted">
                  Produtos Adquiridos ({selectedAluno.produtosUnicos.length})
                </h4>
                <div className="space-y-2">
                  {selectedAluno.produtosUnicos.map((prod) => (
                    <div
                      key={prod}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border/50"
                      style={{ backgroundColor: `${getProductColor(prod)}08` }}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getProductColor(prod) }}
                      />
                      <p className="text-sm font-medium text-foreground">{prod}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Raw product entries */}
              {selectedAluno.produtos.length > selectedAluno.produtosUnicos.length && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted">
                    Registros Originais ({selectedAluno.produtos.length} linhas no CSV)
                  </h4>
                  <div className="space-y-1">
                    {selectedAluno.produtos.map((p, i) => (
                      <p key={i} className="text-[11px] text-muted pl-3 border-l-2 border-border/40 py-0.5">
                        {p}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
