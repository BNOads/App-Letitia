import { useState, useEffect, useMemo } from "react";
import { fetchLiveSalesData, fetchRecentLeadsData, MONTHS_METADATA, type LeadRecord, type RecentLeadRecord } from "@/data/salesData";
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Loader2,
  Search,
  Users,
  Inbox,
  Filter,
  Target,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertCircle,
  FileText,
  Calendar,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ExternalLink,
  RotateCw
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
  AreaChart,
  Area,
  LabelList,
  ReferenceLine
} from "recharts";
import { cn } from "@/lib/utils";

// Cores do Design System do LaetitiAPP
const GOLD_COLOR = "#C4A47C";
const CLAY_COLOR = "#8A8275";
const CHARCOAL_COLOR = "#1A1A1A";

const COLORS = [GOLD_COLOR, "#A88B63", "#D9C3A5", "#8A8275", "#5C564D", "#403B35", "#C4907C", "#7C98C4"];

export function VendasRelatorio() {
  const [loading, setLoading] = useState(true);
  const [allLeads, setAllLeads] = useState<LeadRecord[]>([]);
  const [isLive, setIsLive] = useState(false);

  // Tab principal: Dashboard vs Leads Recentes
  const [mainTab, setMainTab] = useState<"dashboard" | "leads-recentes">("dashboard");

  // Leads Recentes
  const [recentLeads, setRecentLeads] = useState<RecentLeadRecord[]>([]);
  const [recentLeadsLoading, setRecentLeadsLoading] = useState(false);
  const [recentSearch, setRecentSearch] = useState("");
  const [recentFunilFilter, setRecentFunilFilter] = useState("all");
  const [recentMonthFilter, setRecentMonthFilter] = useState("all");
  const [recentPage, setRecentPage] = useState(1);
  const recentPerPage = 15;

  // Filtros de Período e Aba (Mês)
  const [monthFilter, setMonthFilter] = useState<string>(() => {
    const date = new Date();
    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const currentMonthName = monthNames[date.getMonth()];
    const currentYearShort = String(date.getFullYear()).substring(2);
    const label = `${currentMonthName}/${currentYearShort}`;
    if (MONTHS_METADATA.some((m) => m.label === label)) {
      return label;
    }
    return "all";
  });
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Filtros Operacionais
  const [search, setSearch] = useState("");
  const [vendedoraFilter, setVendedoraFilter] = useState("all");
  const [origemFilter, setOrigemFilter] = useState("all");
  const [produtoFilter, setProdutoFilter] = useState("all");
  const [resultadoFilter, setResultadoFilter] = useState("all");

  // Paginação e Ordenação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [sortConfig, setSortConfig] = useState<{
    key: keyof LeadRecord;
    direction: "asc" | "desc";
  } | null>(null);

  // Lead selecionado para detalhes
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);

  // Refreshing manual
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleSort = (key: keyof LeadRecord) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  async function loadData(silent = false) {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    const start = Date.now();
    try {
      const [leads, recents] = await Promise.all([
        fetchLiveSalesData(),
        fetchRecentLeadsData().catch(() => [] as RecentLeadRecord[])
      ]);
      setAllLeads(leads);
      setRecentLeads(recents);
      // Se conseguimos puxar leads de múltiplos meses e o tamanho bate, deduzimos live
      setIsLive(leads.length > 0);
    } catch (err) {
      console.warn("Falha no fetch live, usando fallback estático", err);
    }
    
    const elapsed = Date.now() - start;
    if (elapsed < 600) {
      await new Promise((r) => setTimeout(r, 600 - elapsed));
    }
    if (silent) {
      setIsRefreshing(false);
    } else {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // ─── LEADS RECENTES: PROCESSAMENTO (hooks devem ficar antes do return) ──────
  const recentFunis = useMemo(() => {
    const set = new Set(recentLeads.map((l) => l.produto).filter(Boolean));
    return Array.from(set).sort();
  }, [recentLeads]);

  // Meses disponíveis nos leads recentes (extraídos da data DD/MM/YYYY)
  const recentMonths = useMemo(() => {
    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const map = new Map<string, { label: string; sort: number; count: number }>();
    recentLeads.forEach((l) => {
      const parts = l.dataFormatada.split("/");
      if (parts.length === 3) {
        const m = parseInt(parts[1], 10) - 1;
        const y = parts[2].substring(2); // "2026" -> "26"
        const key = `${monthNames[m]}/${y}`;
        const sortKey = parseInt(parts[2], 10) * 100 + m;
        if (!map.has(key)) {
          map.set(key, { label: key, sort: sortKey, count: 0 });
        }
        map.get(key)!.count++;
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
      // Filtro de mês
      if (recentMonthFilter !== "all") {
        const parts = l.dataFormatada.split("/");
        if (parts.length === 3) {
          const m = parseInt(parts[1], 10) - 1;
          const y = parts[2].substring(2);
          const leadMonth = `${monthNames[m]}/${y}`;
          if (leadMonth !== recentMonthFilter) return false;
        } else {
          return false;
        }
      }
      // Filtro de funil
      if (recentFunilFilter !== "all" && l.produto !== recentFunilFilter) return false;
      // Busca textual
      if (recentSearch) {
        const q = recentSearch.toLowerCase();
        const matches =
          l.nome.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.telefone.includes(q) ||
          l.produto.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [recentLeads, recentFunilFilter, recentMonthFilter, recentSearch]);

  const recentByFunil = useMemo(() => {
    const map: Record<string, number> = {};
    filteredRecentLeads.forEach((l) => {
      const key = l.produto || "Sem funil";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map)
      .map(([funil, quantidade]) => ({ funil, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade);
  }, [filteredRecentLeads]);

  const recentByDate = useMemo(() => {
    const map: Record<string, number> = {};
    filteredRecentLeads.forEach((l) => {
      const d = l.dataFormatada;
      if (d) map[d] = (map[d] || 0) + 1;
    });
    return Object.entries(map)
      .map(([data, quantidade]) => ({ data, quantidade }))
      .sort((a, b) => {
        const [dA, mA, yA] = a.data.split("/").map(Number);
        const [dB, mB, yB] = b.data.split("/").map(Number);
        return new Date(yA, mA - 1, dA).getTime() - new Date(yB, mB - 1, dB).getTime();
      });
  }, [filteredRecentLeads]);

  const recentPieData = useMemo(() => {
    const total = filteredRecentLeads.length;
    const map: Record<string, number> = {};
    filteredRecentLeads.forEach((l) => {
      const key = l.produto || "Sem funil";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value, percent: total > 0 ? ((value / total) * 100).toFixed(1) : "0" }))
      .sort((a, b) => b.value - a.value);
  }, [filteredRecentLeads]);

  const sortedRecentLeads = useMemo(() => {
    return [...filteredRecentLeads].sort((a, b) => {
      // data format: "DD/MM/YYYY HH:MM"
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
  const recentPaginatedLeads = sortedRecentLeads.slice(
    (recentPage - 1) * recentPerPage,
    recentPage * recentPerPage
  );

  if (loading) {
    return (
      <div className="flex h-[75vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-letitia-gold" style={{ color: GOLD_COLOR }} />
        <div className="text-center">
          <h3 className="font-serif text-lg font-medium text-foreground">Carregando Relatório de Vendas</h3>
          <p className="text-xs text-muted">Processando dados de múltiplos meses e gerando painel...</p>
        </div>
      </div>
    );
  }

  // Helper para conversão rápida de data da planilha (DD/MM/YYYY) para Objeto Date do JavaScript
  const parseLeadDate = (dateStr: string) => {
    if (!dateStr) return null;
    const parts = dateStr.split("/");
    if (parts.length !== 3) return null;
    return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
  };

  // ─── PROCESSAMENTO E FILTRAGEM DOS LEADS ─────────────────────────────────

  const filteredLeads = allLeads.filter((l) => {
    // 1. Filtro da aba de mês da planilha
    if (monthFilter !== "all" && l.mes !== monthFilter) {
      return false;
    }

    // 2. Filtro de data personalizado (Start/End Date)
    if (startDate || endDate) {
      const leadDate = parseLeadDate(l.dataEntrada);
      if (leadDate) {
        if (startDate) {
          const start = new Date(startDate + "T00:00:00");
          if (leadDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate + "T23:59:59");
          if (leadDate > end) return false;
        }
      } else {
        return false;
      }
    }

    // 3. Busca textual
    const matchesSearch =
      l.nome.toLowerCase().includes(search.toLowerCase()) ||
      l.telefone.includes(search) ||
      l.origem.toLowerCase().includes(search.toLowerCase()) ||
      l.produto.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    // 4. Outros filtros dropdown
    if (vendedoraFilter !== "all" && l.vendedora !== vendedoraFilter) return false;
    if (origemFilter !== "all" && l.origem !== origemFilter) return false;
    if (produtoFilter !== "all" && l.produto !== produtoFilter) return false;

    if (resultadoFilter !== "all") {
      if (resultadoFilter === "ganha" && l.resultado !== "Venda Ganha") return false;
      if (resultadoFilter === "perdida" && l.resultado !== "Venda Perdida") return false;
      if (resultadoFilter === "conversando") {
        const lowerRes = (l.resultado || "").toLowerCase();
        if (lowerRes.includes("ganha") || lowerRes.includes("perdida")) return false;
      }
    }

    return true;
  });

  // Lista dinâmica de filtros únicos com base no dataset filtrado por mês/data
  const vendedorasUnicas = Array.from(new Set(allLeads.map((l) => l.vendedora).filter(Boolean)));
  const origensUnicas = Array.from(new Set(allLeads.map((l) => l.origem).filter(Boolean)));
  const produtosUnicos = Array.from(new Set(allLeads.map((l) => l.produto).filter(Boolean)));

  // ─── CÁLCULO DE MÉTRICAS OPERACIONAIS E FINANCEIRAS ──────────────────────

  const filteredRevenue = filteredLeads.reduce((acc, l) => acc + (l.resultado === "Venda Ganha" ? l.valorVenda : 0), 0);
  const filteredSalesCount = filteredLeads.filter((l) => l.resultado === "Venda Ganha").length;
  const filteredTicketMedio = filteredSalesCount > 0 ? filteredRevenue / filteredSalesCount : 0;
  const filteredConversionRate = filteredLeads.length > 0 ? (filteredSalesCount / filteredLeads.length) * 100 : 0;

  // Estatísticas do Funil com base nos leads ativos
  const filteredLeadsContactados = filteredLeads.length;
  const filteredCallsAgendadas = filteredLeads.filter((l) => l.callAgendada === "Sim").length;
  const filteredCallsRealizadas = filteredLeads.filter((l) => l.callAgendada === "Sim" && l.apareceuCall === "Sim").length;

  // Meta Comercial Dinâmica com base no mês selecionado
  const activeMonthMeta = (() => {
    if (monthFilter === "all") {
      // Se for todos os meses, somamos as metas dos meses ativos com dados no filtro
      const activeMonths = Array.from(new Set(filteredLeads.map((l) => l.mes)));
      if (activeMonths.length === 0) return 200000.0;
      return MONTHS_METADATA.filter((m) => activeMonths.includes(m.label)).reduce((acc, m) => acc + m.meta, 0);
    } else {
      const match = MONTHS_METADATA.find((m) => m.label === monthFilter);
      return match ? match.meta : 200000.0;
    }
  })();

  const metaAchievedPercent = Math.min(100, (filteredRevenue / activeMonthMeta) * 100);

  // ─── DADOS SEMANAIS PARA GRÁFICO META X VENDA ────────────────────────────

  const weeklyMetaData = (() => {
    // Determinar o mês/ano ativo para calcular semanas
    let targetMonth: number | null = null;
    let targetYear: number | null = null;

    if (monthFilter !== "all") {
      // Ex: "Junho/26" -> Junho = 5 (0-indexed), 2026
      const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
      ];
      const parts = monthFilter.split("/");
      const mIdx = monthNames.indexOf(parts[0]);
      if (mIdx >= 0) {
        targetMonth = mIdx;
        targetYear = 2000 + parseInt(parts[1], 10);
      }
    } else {
      // Se "all", usar o mês atual
      const now = new Date();
      targetMonth = now.getMonth();
      targetYear = now.getFullYear();
    }

    if (targetMonth === null || targetYear === null) return [];

    // Calcular número de dias no mês
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

    // Definir as semanas do mês
    const weeks: { label: string; startDay: number; endDay: number }[] = [];
    const weekRanges = [
      { start: 1, end: 7 },
      { start: 8, end: 14 },
      { start: 15, end: 21 },
      { start: 22, end: daysInMonth }
    ];

    weekRanges.forEach((range, idx) => {
      const endDay = Math.min(range.end, daysInMonth);
      weeks.push({
        label: `Semana ${idx + 1} (${String(range.start).padStart(2, '0')}/${String(targetMonth! + 1).padStart(2, '0')} - ${String(endDay).padStart(2, '0')}/${String(targetMonth! + 1).padStart(2, '0')})`,
        startDay: range.start,
        endDay: endDay
      });
    });

    // Meta proporcional por semana
    const weeklyMeta = activeMonthMeta / weeks.length;

    // Calcular vendas por semana
    return weeks.map((week) => {
      let weekRevenue = 0;
      filteredLeads.forEach((l) => {
        if (l.resultado === "Venda Ganha" && l.valorVenda > 0) {
          const leadDate = parseLeadDate(l.dataEntrada);
          if (leadDate) {
            const day = leadDate.getDate();
            const leadMonth = leadDate.getMonth();
            const leadYear = leadDate.getFullYear();
            if (leadMonth === targetMonth && leadYear === targetYear && day >= week.startDay && day <= week.endDay) {
              weekRevenue += l.valorVenda;
            }
          }
        }
      });

      const faltante = Math.max(0, weeklyMeta - weekRevenue);
      return {
        semana: week.label,
        vendido: weekRevenue,
        faltante: faltante,
        meta: weeklyMeta,
        percentual: weeklyMeta > 0 ? Math.min(100, (weekRevenue / weeklyMeta) * 100) : 0
      };
    });
  })();

  // Dados para o gráfico consolidado (barra única de meta total)
  const metaTotalChartData = [{
    label: "Meta de Venda",
    vendido: filteredRevenue,
    faltante: Math.max(0, activeMonthMeta - filteredRevenue),
    meta: activeMonthMeta
  }];

  // ─── MODELAGEM DOS DADOS PARA GRÁFICOS ───────────────────────────────────

  // 1. Gráfico de Evolução de Faturamento Diário e Acumulado
  const salesByDateMap: { [date: string]: { faturamento: number; volume: number } } = {};
  filteredLeads.forEach((l) => {
    if (l.resultado === "Venda Ganha" && l.valorVenda > 0) {
      const dateStr = l.dataEntrada; // DD/MM/YYYY
      if (!salesByDateMap[dateStr]) {
        salesByDateMap[dateStr] = { faturamento: 0, volume: 0 };
      }
      salesByDateMap[dateStr].faturamento += l.valorVenda;
      salesByDateMap[dateStr].volume += 1;
    }
  });

  const sortedDates = Object.keys(salesByDateMap).sort((a, b) => {
    const [dayA, monthA, yearA] = a.split("/").map(Number);
    const [dayB, monthB, yearB] = b.split("/").map(Number);
    return new Date(yearA, monthA - 1, dayA).getTime() - new Date(yearB, monthB - 1, dayB).getTime();
  });

  let accumFaturamento = 0;
  const timelineData = sortedDates.map((dateStr) => {
    const day = dateStr.split("/")[0] + "/" + dateStr.split("/")[1];
    accumFaturamento += salesByDateMap[dateStr].faturamento;
    return {
      data: day,
      faturamento: salesByDateMap[dateStr].faturamento,
      acumulado: accumFaturamento,
      volume: salesByDateMap[dateStr].volume
    };
  });

  // 2. Estatísticas de Captação e Fechamento por Origem
  const sourceStatsMap: { [source: string]: { leads: number; faturamento: number; vendas: number } } = {};
  filteredLeads.forEach((l) => {
    const src = l.origem || "Não Informada";
    if (!sourceStatsMap[src]) {
      sourceStatsMap[src] = { leads: 0, faturamento: 0, vendas: 0 };
    }
    sourceStatsMap[src].leads += 1;
    if (l.resultado === "Venda Ganha") {
      sourceStatsMap[src].faturamento += l.valorVenda;
      sourceStatsMap[src].vendas += 1;
    }
  });

  const sourceData = Object.keys(sourceStatsMap)
    .map((src) => ({
      origem: src,
      leads: sourceStatsMap[src].leads,
      vendas: sourceStatsMap[src].vendas,
      faturamento: Math.round(sourceStatsMap[src].faturamento),
      conversao: sourceStatsMap[src].leads > 0 ? parseFloat(((sourceStatsMap[src].vendas / sourceStatsMap[src].leads) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.faturamento - a.faturamento);

  // 2b. Dados de porcentagem de origem do lead (para gráfico "Origem do Lead (%)")
  const totalLeadsForPercent = filteredLeads.length;
  const origemPercentData = Object.keys(sourceStatsMap)
    .map((src) => ({
      origem: src.length > 20 ? src.substring(0, 18) + "..." : src,
      origemFull: src,
      percentual: totalLeadsForPercent > 0
        ? parseFloat(((sourceStatsMap[src].leads / totalLeadsForPercent) * 100).toFixed(2))
        : 0,
      leads: sourceStatsMap[src].leads
    }))
    .sort((a, b) => b.percentual - a.percentual);

  // 3. Faturamento por Produto
  const productStatsMap: { [prod: string]: { volume: number; faturamento: number } } = {};
  filteredLeads.forEach((l) => {
    if (l.resultado === "Venda Ganha" && l.valorVenda > 0) {
      const prod = l.produto || "Outros";
      if (!productStatsMap[prod]) {
        productStatsMap[prod] = { volume: 0, faturamento: 0 };
      }
      productStatsMap[prod].volume += 1;
      productStatsMap[prod].faturamento += l.valorVenda;
    }
  });

  const productData = Object.keys(productStatsMap)
    .map((prod) => ({
      name: prod,
      value: Math.round(productStatsMap[prod].faturamento),
      vendas: productStatsMap[prod].volume
    }))
    .sort((a, b) => b.value - a.value);

  // 4. Comparativo Vendedoras
  const sellerStatsMap: { [seller: string]: { leads: number; faturamento: number; vendas: number } } = {};
  filteredLeads.forEach((l) => {
    const seller = l.vendedora || "Outro/Letícia";
    if (!sellerStatsMap[seller]) {
      sellerStatsMap[seller] = { leads: 0, faturamento: 0, vendas: 0 };
    }
    sellerStatsMap[seller].leads += 1;
    if (l.resultado === "Venda Ganha") {
      sellerStatsMap[seller].faturamento += l.valorVenda;
      sellerStatsMap[seller].vendas += 1;
    }
  });

  const sellerData = Object.keys(sellerStatsMap).map((seller) => ({
    vendedora: seller,
    leads: sellerStatsMap[seller].leads,
    vendas: sellerStatsMap[seller].vendas,
    faturamento: Math.round(sellerStatsMap[seller].faturamento),
    ticketMedio: sellerStatsMap[seller].vendas > 0 ? Math.round(sellerStatsMap[seller].faturamento / sellerStatsMap[seller].vendas) : 0,
    conversao: sellerStatsMap[seller].leads > 0 ? parseFloat(((sellerStatsMap[seller].vendas / sellerStatsMap[seller].leads) * 100).toFixed(1)) : 0
  }));

  // 5. Motivos de Perda
  const lossStatsMap: { [reason: string]: number } = {};
  filteredLeads.forEach((l) => {
    if (l.resultado === "Venda Perdida" || (l.pipeline === "FINALIZADO" && l.resultado !== "Venda Ganha")) {
      let r = l.motivoPerda || l.detalhes;
      if (!r) {
        if (l.pipeline === "SEM RETORNO") r = "Sem resposta / Sem retorno";
        else r = "Não especificado";
      }

      let groupedReason = r;
      const lower = r.toLowerCase();
      if (lower.includes("financeir") || lower.includes("dinheir") || lower.includes("investir") || lower.includes("custo") || lower.includes("preço") || lower.includes("valor")) {
        groupedReason = "Financeiro / Falta de Verba";
      } else if (lower.includes("tempo") || lower.includes("agenda") || lower.includes("momento") || lower.includes("viagem") || lower.includes("viajar")) {
        groupedReason = "Falta de Tempo / Momento Inadequado";
      } else if (lower.includes("marido") || lower.includes("consultar")) {
        groupedReason = "Depende de Terceiros (Marido)";
      } else if (lower.includes("interesse") || lower.includes("não quer") || lower.includes("perfil")) {
        groupedReason = "Falta de Interesse / Fora do Perfil";
      } else if (lower.includes("número") || lower.includes("errado") || lower.includes("mensagem") || lower.includes("contato")) {
        groupedReason = "Erro de Contato (Número/Mensagem)";
      } else if (groupedReason.length > 35) {
        groupedReason = groupedReason.substring(0, 35) + "...";
      }

      lossStatsMap[groupedReason] = (lossStatsMap[groupedReason] || 0) + 1;
    }
  });

  const lossData = Object.keys(lossStatsMap)
    .map((r) => ({
      motivo: r,
      quantidade: lossStatsMap[r]
    }))
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 5);

  // Lógica de ordenação dos Leads
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    const aVal = a[key];
    const bVal = b[key];

    // Caso especial para data (formato DD/MM/YYYY)
    if (key === "dataEntrada") {
      const dateA = parseLeadDate(String(aVal || ""));
      const dateB = parseLeadDate(String(bVal || ""));
      if (!dateA && !dateB) return 0;
      if (!dateA) return direction === "asc" ? 1 : -1;
      if (!dateB) return direction === "asc" ? -1 : 1;
      return direction === "asc"
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    }

    // Caso especial para valor numérico (valorVenda)
    if (key === "valorVenda") {
      const numA = Number(aVal) || 0;
      const numB = Number(bVal) || 0;
      return direction === "asc" ? numA - numB : numB - numA;
    }

    // Ordenação padrão de string com suporte a caracteres latinos
    const strA = String(aVal || "").trim();
    const strB = String(bVal || "").trim();
    return direction === "asc"
      ? strA.localeCompare(strB, "pt-BR", { sensitivity: "base" })
      : strB.localeCompare(strA, "pt-BR", { sensitivity: "base" });
  });

  // Paginação dos Leads
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLeads = sortedLeads.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(sortedLeads.length / itemsPerPage);

  // Período de Análise dinâmico para exibição amigável
  const periodLabel = (() => {
    if (startDate || endDate) {
      const startFmt = startDate ? startDate.split("-").reverse().join("/") : "Início";
      const endFmt = endDate ? endDate.split("-").reverse().join("/") : "Fim";
      return `${startFmt} a ${endFmt}`;
    }
    if (monthFilter !== "all") {
      const match = MONTHS_METADATA.find((m) => m.label === monthFilter);
      return match ? `${match.name} de 2026` : monthFilter;
    }
    return "Consolidado 2026 (Todos os Meses)";
  })();

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* ─── CABEÇALHO DO RELATÓRIO ──────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-letitia-gold/15 text-letitia-gold text-[10px] font-bold uppercase tracking-wider border border-letitia-gold/20 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Relatório Executivo Multi-Abas
            </span>
            <span className="text-xs text-muted flex items-center gap-1">
              • Planilha: {isLive ? "Conectada em tempo real 🟢" : "Local Fallback 🟡"}
            </span>
            <a
              href="https://docs.google.com/spreadsheets/d/19MYerw0dR6mwDSvK-qahzZ97suXOO2Nv/edit"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold hover:underline flex items-center gap-1 ml-2 transition-all"
              style={{ color: GOLD_COLOR }}
            >
              • Abrir Planilha Base <ExternalLink className="h-3 w-3" />
            </a>
            <button
              onClick={() => loadData(true)}
              disabled={isRefreshing || loading}
              className="text-xs font-semibold hover:underline flex items-center gap-1 ml-2 transition-all text-muted hover:text-foreground disabled:opacity-50 cursor-pointer"
            >
              • Atualizar Dados <RotateCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl font-medium tracking-tight text-foreground mt-2">
            Dashboard de Vendas & Performance
          </h2>
          <p className="mt-1 text-sm text-muted">
            Relatório de leads, faturamento e metas extraído das abas mensais da planilha para a liderança.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-left bg-background/50 border border-border/60 rounded-lg px-4 py-2 min-w-[180px]">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted flex items-center gap-1">
              <Calendar className="h-3 w-3 text-letitia-gold" style={{ color: GOLD_COLOR }} /> Período Ativo
            </p>
            <p className="text-xs font-semibold text-foreground mt-0.5">{periodLabel}</p>
          </div>
          <button
            onClick={() => window.print()}
            className="rounded-md border border-border bg-card px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-foreground hover:bg-foreground/5 transition-all flex items-center gap-2"
          >
            <FileText className="h-4 w-4 text-muted" /> Imprimir Relatório
          </button>
        </div>
      </div>

      {/* ─── TABS PRINCIPAIS (DASHBOARD vs LEADS RECENTES) ────────────────── */}
      <div className="flex items-center gap-2 border-b border-border pb-0">
        <button
          onClick={() => setMainTab("dashboard")}
          className={cn(
            "px-5 py-3 text-sm font-semibold tracking-wide transition-all border-b-2 -mb-px flex items-center gap-2",
            mainTab === "dashboard"
              ? "border-letitia-gold text-foreground"
              : "border-transparent text-muted hover:text-foreground hover:border-border"
          )}
          style={mainTab === "dashboard" ? { borderColor: GOLD_COLOR } : {}}
        >
          <TrendingUp className="h-4 w-4" /> Dashboard de Vendas
        </button>
        <button
          onClick={() => { setMainTab("leads-recentes"); setRecentPage(1); }}
          className={cn(
            "px-5 py-3 text-sm font-semibold tracking-wide transition-all border-b-2 -mb-px flex items-center gap-2",
            mainTab === "leads-recentes"
              ? "border-letitia-gold text-foreground"
              : "border-transparent text-muted hover:text-foreground hover:border-border"
          )}
          style={mainTab === "leads-recentes" ? { borderColor: GOLD_COLOR } : {}}
        >
          <Inbox className="h-4 w-4" /> Leads Recentes
          {recentLeads.length > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-letitia-gold/15 text-letitia-gold" style={{ color: GOLD_COLOR }}>
              {recentLeads.length}
            </span>
          )}
        </button>
      </div>

      {mainTab === "dashboard" && (
      <>
      {/* ─── TABS DE SELEÇÃO RÁPIDA DE MÊSES (ABAS DA PLANILHA) ────────────── */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted mb-3 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-letitia-gold" style={{ color: GOLD_COLOR }} /> Selecione a aba mensal da planilha para analisar
        </h3>
        {/* Dropdown no Mobile */}
        <div className="block sm:hidden">
          <select
            value={monthFilter}
            onChange={(e) => {
              setMonthFilter(e.target.value);
              setStartDate("");
              setEndDate("");
              setCurrentPage(1);
            }}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-letitia-gold focus:outline-none uppercase font-semibold"
          >
            <option value="all">Todos os Meses (Consolidado)</option>
            {MONTHS_METADATA.map((month) => {
              const hasData = allLeads.some((l) => l.mes === month.label);
              return (
                <option key={month.label} value={month.label} disabled={!hasData}>
                  {month.name} {!hasData ? "(Sem dados)" : `(${allLeads.filter((l) => l.mes === month.label).length} contatos)`}
                </option>
              );
            })}
          </select>
        </div>

        {/* Abas no Desktop */}
        <div className="hidden sm:flex items-center overflow-x-auto pb-1 gap-2 scrollbar-none">
          <button
            onClick={() => {
              setMonthFilter("all");
              setStartDate("");
              setEndDate("");
              setCurrentPage(1);
            }}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-semibold tracking-wider transition-all whitespace-nowrap border border-border/80 uppercase",
              monthFilter === "all"
                ? "bg-letitia-gold text-white shadow-sm border-letitia-gold"
                : "bg-background hover:bg-foreground/5 text-foreground/80"
            )}
            style={monthFilter === "all" ? { backgroundColor: GOLD_COLOR } : {}}
          >
            Todos os Meses (Consolidado)
          </button>
          
          {MONTHS_METADATA.map((month) => {
            const hasData = allLeads.some((l) => l.mes === month.label);
            return (
              <button
                key={month.label}
                disabled={!hasData}
                onClick={() => {
                  setMonthFilter(month.label);
                  setStartDate("");
                  setEndDate("");
                  setCurrentPage(1);
                }}
                className={cn(
                  "px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wider transition-all whitespace-nowrap border uppercase flex items-center gap-1.5",
                  !hasData && "opacity-40 cursor-not-allowed hover:bg-transparent",
                  monthFilter === month.label
                    ? "bg-letitia-gold text-white shadow-sm border-letitia-gold"
                    : "bg-background hover:bg-foreground/5 text-foreground/80 border-border/80"
                )}
                style={monthFilter === month.label ? { backgroundColor: GOLD_COLOR, borderColor: GOLD_COLOR } : {}}
              >
                {month.name}
                {hasData && (
                  <span className="text-[9px] px-1.5 py-0.25 rounded-full bg-foreground/10 text-foreground/70 font-normal">
                    {allLeads.filter((l) => l.mes === month.label).length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── GRID DE CARDS KPI DINÂMICOS ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Faturamento */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-letitia-gold" style={{ color: GOLD_COLOR }} /> Faturado
            </span>
            <span className="text-xs font-bold text-letitia-gold">{metaAchievedPercent.toFixed(1)}% da Meta</span>
          </div>
          <div className="my-2">
            <p className="font-serif text-3xl font-medium text-foreground">
              R$ {filteredRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-full bg-foreground/5 rounded-full h-2 mt-1 overflow-hidden">
            <div
              className="bg-letitia-gold h-full rounded-full transition-all duration-500"
              style={{ width: `${metaAchievedPercent}%`, backgroundColor: GOLD_COLOR }}
            />
          </div>
        </div>

        {/* KPI 2: Quantas Vendas */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between min-h-[140px]">
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted flex items-center gap-1.5">
            <ShoppingBag className="h-4 w-4 text-letitia-gold" style={{ color: GOLD_COLOR }} /> Vendas Ganhas
          </span>
          <div className="my-2">
            <p className="font-serif text-3xl font-medium text-foreground">
              {filteredSalesCount} <span className="text-sm font-sans text-muted font-normal">conversões</span>
            </p>
          </div>
          <p className="text-[10px] text-muted uppercase tracking-wider">
            Do total de {filteredLeadsContactados} leads contactados
          </p>
        </div>

        {/* KPI 3: Ticket Médio */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between min-h-[140px]">
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-letitia-gold" style={{ color: GOLD_COLOR }} /> Ticket Médio
          </span>
          <div className="my-2">
            <p className="font-serif text-3xl font-medium text-foreground">
              R$ {filteredTicketMedio.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
            </p>
          </div>
          <p className="text-[10px] text-muted uppercase tracking-wider">
            Média por conversão ganha no período
          </p>
        </div>

        {/* KPI 4: Meta e Necessário */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between min-h-[140px]">
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted flex items-center gap-1.5">
            <Target className="h-4 w-4 text-letitia-gold" style={{ color: GOLD_COLOR }} /> Meta Comercial
          </span>
          <div className="my-2">
            <p className="font-serif text-2xl font-medium text-foreground">
              R$ {activeMonthMeta.toLocaleString("pt-BR")}
            </p>
            {filteredRevenue >= activeMonthMeta ? (
              <p className="text-xs text-green-600 font-medium mt-1">✓ Meta Batida!</p>
            ) : (
              <p className="text-[11px] text-muted mt-1">
                Faltam <span className="font-bold text-foreground">R$ {(activeMonthMeta - filteredRevenue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </p>
            )}
          </div>
          <p className="text-[10px] text-muted uppercase tracking-wider">
            Meta Ajustada para o Período
          </p>
        </div>
      </div>

      {/* ─── GRÁFICO: META TOTAL X QUANTIDADE DE VENDA ────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted mb-5 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Target className="h-4 w-4 text-letitia-gold" style={{ color: GOLD_COLOR }} />
            Meta Total X Quantidade de Venda
          </span>
          <span className="text-[10px] font-sans font-normal text-muted lowercase">
            meta: R$ {activeMonthMeta.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </h3>

        {/* Barra consolidada - Meta Total */}
        <div className="h-[90px] mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={metaTotalChartData}
              layout="vertical"
              margin={{ top: 5, right: 80, left: 100, bottom: 5 }}
            >
              <XAxis
                type="number"
                domain={[0, activeMonthMeta * 1.05]}
                tick={{ fontSize: 10, fill: "var(--muted)" }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                axisLine={{ stroke: "var(--border)" }}
              />
              <YAxis
                dataKey="label"
                type="category"
                tick={{ fontSize: 11, fill: "var(--foreground)", fontWeight: 600 }}
                width={100}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "11px",
                  color: "var(--foreground)"
                }}
                formatter={(value: any, name: any) => [
                  `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                  name === "vendido" ? "Vendido" : "Faltante"
                ]}
              />
              <Bar dataKey="vendido" stackId="meta" fill="#B6D7A8" radius={[0, 0, 0, 0]} name="vendido">
                <LabelList
                  dataKey="vendido"
                  position="insideLeft"
                  formatter={(v: any) => `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                  style={{ fontSize: "12px", fill: "#1A1A1A", fontWeight: 700 }}
                  offset={12}
                />
              </Bar>
              <Bar dataKey="faltante" stackId="meta" fill="#8B3A2A" radius={[0, 4, 4, 0]} name="faltante">
                <LabelList
                  dataKey="faltante"
                  position="insideRight"
                  formatter={(v: any) => Number(v) > 0 ? `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : ""}
                  style={{ fontSize: "11px", fill: "#FFFFFF", fontWeight: 700 }}
                  offset={8}
                />
              </Bar>
              <ReferenceLine x={activeMonthMeta} stroke={CHARCOAL_COLOR} strokeDasharray="3 3" strokeWidth={1.5} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Progresso semanal */}
        <div className="border-t border-border/50 pt-5">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted mb-4 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-letitia-gold" style={{ color: GOLD_COLOR }} />
            Progresso Semanal da Meta
          </h4>

          {weeklyMetaData.length === 0 ? (
            <p className="text-xs text-muted italic">Selecione um mês específico para ver o detalhamento semanal.</p>
          ) : (
            <div className="space-y-3">
              {weeklyMetaData.map((week, idx) => {
                const isMetaReached = week.vendido >= week.meta;
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">{week.semana}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-muted">
                          Meta: R$ {week.meta.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                        <span className={`text-[10px] font-bold ${isMetaReached ? "text-green-600" : "text-foreground"}`}>
                          {isMetaReached ? "✓ " : ""}R$ {week.vendido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{
                          backgroundColor: isMetaReached ? "rgba(34,197,94,0.1)" : week.percentual > 50 ? "rgba(196,164,124,0.15)" : "rgba(139,58,42,0.1)",
                          color: isMetaReached ? "#16a34a" : week.percentual > 50 ? GOLD_COLOR : "#8B3A2A"
                        }}>
                          {week.percentual.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-foreground/5 rounded-full h-3 overflow-hidden relative">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${Math.min(100, week.percentual)}%`,
                          backgroundColor: isMetaReached ? "#22c55e" : week.percentual > 50 ? "#B6D7A8" : "#D4A88C"
                        }}
                      />
                      {!isMetaReached && (
                        <div
                          className="absolute top-0 h-full rounded-r-full transition-all duration-700"
                          style={{
                            left: `${Math.min(100, week.percentual)}%`,
                            width: `${Math.min(100 - week.percentual, 100)}%`,
                            backgroundColor: "#8B3A2A",
                            opacity: 0.25
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Resumo totais semanais */}
              <div className="flex items-center justify-between pt-3 border-t border-border/30 text-xs">
                <span className="text-muted font-semibold uppercase tracking-wider text-[10px]">
                  Total Vendido no Mês
                </span>
                <span className="font-serif font-semibold text-foreground">
                  R$ {filteredRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  <span className="text-muted font-sans font-normal ml-2">
                    / R$ {activeMonthMeta.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── FILTROS COM DATA PERSONALIZADA E OPÇÕES OPERACIONAIS ─────────── */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-muted">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-letitia-gold" style={{ color: GOLD_COLOR }} />
            <span className="text-xs font-semibold uppercase tracking-wider">Filtros de Período e Qualificação</span>
          </div>
          {(startDate || endDate || vendedoraFilter !== "all" || origemFilter !== "all" || produtoFilter !== "all" || resultadoFilter !== "all" || search) && (
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setVendedoraFilter("all");
                setOrigemFilter("all");
                setProdutoFilter("all");
                setResultadoFilter("all");
                setSearch("");
                setCurrentPage(1);
              }}
              className="text-[10px] font-bold uppercase tracking-wider text-letitia-gold hover:underline"
              style={{ color: GOLD_COLOR }}
            >
              Limpar Filtros ✕
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {/* Custom Date: Start */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold uppercase tracking-widest text-muted block">Data Início</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setMonthFilter("all"); setCurrentPage(1); }}
              className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-letitia-gold focus:outline-none"
            />
          </div>

          {/* Custom Date: End */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold uppercase tracking-widest text-muted block">Data Fim</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setMonthFilter("all"); setCurrentPage(1); }}
              className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-letitia-gold focus:outline-none"
            />
          </div>

          {/* Busca Textual */}
          <div className="space-y-1 md:col-span-1">
            <label className="text-[9px] font-bold uppercase tracking-widest text-muted block">Buscar Contato</label>
            <div className="relative">
              <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted" />
              <input
                type="text"
                placeholder="Nome, origem..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full rounded-md border border-border bg-background pl-7 pr-2.5 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-letitia-gold focus:outline-none"
              />
            </div>
          </div>

          {/* Vendedora */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold uppercase tracking-widest text-muted block">Vendedora</label>
            <select
              value={vendedoraFilter}
              onChange={(e) => { setVendedoraFilter(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-letitia-gold focus:outline-none"
            >
              <option value="all">Todas ({vendedorasUnicas.length})</option>
              {vendedorasUnicas.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          {/* Origem */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold uppercase tracking-widest text-muted block">Origem (Fonte)</label>
            <select
              value={origemFilter}
              onChange={(e) => { setOrigemFilter(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-letitia-gold focus:outline-none"
            >
              <option value="all">Todas Fontes ({origensUnicas.length})</option>
              {origensUnicas.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          {/* Produto */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold uppercase tracking-widest text-muted block">Produto</label>
            <select
              value={produtoFilter}
              onChange={(e) => { setProdutoFilter(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-letitia-gold focus:outline-none"
            >
              <option value="all">Todos ({produtosUnicos.length})</option>
              {produtosUnicos.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Resultado */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold uppercase tracking-widest text-muted block">Resultado</label>
            <select
              value={resultadoFilter}
              onChange={(e) => { setResultadoFilter(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-letitia-gold focus:outline-none"
            >
              <option value="all">Todos</option>
              <option value="ganha">Venda Ganha</option>
              <option value="perdida">Venda Perdida</option>
              <option value="conversando">Em Andamento</option>
            </select>
          </div>

          {/* Seletor Dropdown de Mês extra */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold uppercase tracking-widest text-muted block">Filtro de Aba</label>
            <select
              value={monthFilter}
              onChange={(e) => { setMonthFilter(e.target.value); setStartDate(""); setEndDate(""); setCurrentPage(1); }}
              className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-letitia-gold focus:outline-none uppercase"
            >
              <option value="all">Todas as Abas</option>
              {MONTHS_METADATA.map((month) => (
                <option key={month.label} value={month.label}>{month.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ─── FUNIL DE CONVERSÃO DINÂMICO ─────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-letitia-gold" style={{ color: GOLD_COLOR }} /> Funil de Conversão Comercial Dinâmico
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-background/40 p-4 rounded-lg border border-border/50">
            <p className="text-[10px] font-semibold text-muted uppercase tracking-widest">1. Contatados</p>
            <p className="font-serif text-2xl font-medium text-foreground mt-1">{filteredLeadsContactados}</p>
            <p className="text-[10px] text-muted mt-1">100% dos Leads</p>
          </div>
          <div className="bg-background/40 p-4 rounded-lg border border-border/50">
            <p className="text-[10px] font-semibold text-muted uppercase tracking-widest">2. Calls Agendadas</p>
            <p className="font-serif text-2xl font-medium text-foreground mt-1">
              {filteredCallsAgendadas}
            </p>
            <p className="text-[10px] text-muted mt-1 font-medium">
              {filteredLeadsContactados > 0
                ? ((filteredCallsAgendadas / filteredLeadsContactados) * 100).toFixed(1)
                : "0"}% Taxa de Agenda
            </p>
          </div>
          <div className="bg-background/40 p-4 rounded-lg border border-border/50">
            <p className="text-[10px] font-semibold text-muted uppercase tracking-widest">3. Calls Realizadas</p>
            <p className="font-serif text-2xl font-medium text-foreground mt-1">
              {filteredCallsRealizadas}
            </p>
            <p className="text-[10px] text-muted mt-1 font-medium">
              {filteredCallsAgendadas > 0
                ? ((filteredCallsRealizadas / filteredCallsAgendadas) * 100).toFixed(0)
                : "0"}% Presença
            </p>
          </div>
          <div className="bg-background/40 p-4 rounded-lg border border-border/50">
            <p className="text-[10px] font-semibold text-muted uppercase tracking-widest">4. Vendas Ganhas</p>
            <p className="font-serif text-2xl font-medium text-foreground mt-1">{filteredSalesCount}</p>
            <p className="text-[10px] text-muted mt-1 font-bold text-letitia-gold" style={{ color: GOLD_COLOR }}>
              {filteredConversionRate.toFixed(1)}% Conversão Geral
            </p>
          </div>
        </div>
      </div>

      {/* ─── SEÇÃO DE GRÁFICOS ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico 1: Evolução Mensal/Diária */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted mb-4 flex items-center justify-between">
            <span>Evolução do Faturamento e Vendas Acumuladas</span>
            <span className="text-[10px] font-sans font-normal text-muted lowercase">período ativo</span>
          </h3>
          <div className="h-72">
            {timelineData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted italic">
                Sem dados de vendas para os filtros aplicados.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={GOLD_COLOR} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={GOLD_COLOR} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                  <XAxis dataKey="data" tick={{ fontSize: 10, fill: "var(--muted)" }} minTickGap={30} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--muted)" }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      fontSize: "11px",
                      color: "var(--foreground)"
                    }}
                    formatter={(value: any, name: any) => [
                      `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                      name === "faturamento" ? "Faturamento Dia" : "Faturamento Acumulado"
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: "10px", marginTop: "10px" }} />
                  <Area
                    type="monotone"
                    dataKey="acumulado"
                    stroke={GOLD_COLOR}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorFaturamento)"
                    name="Faturamento Acumulado"
                  />
                  <Bar dataKey="faturamento" fill={CHARCOAL_COLOR} name="Faturamento Dia" opacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Gráfico 2: Faturamento por Produto */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted mb-4">
            Participação no Faturamento por Produto
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="h-64">
              {productData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted italic">
                  Sem dados de produtos.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={productData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {productData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        fontSize: "11px"
                      }}
                      formatter={(value) => `R$ ${Number(value).toLocaleString("pt-BR")}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            {/* Legenda detalhada */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted">Detalhamento Financeiro</h4>
              <div className="max-h-52 overflow-y-auto space-y-2 pr-2">
                {productData.map((item, idx) => (
                  <div key={item.name} className="flex flex-col text-xs border-b border-border/30 pb-1.5 last:border-0">
                    <div className="flex items-center justify-between font-medium">
                      <span className="flex items-center gap-2 truncate">
                        <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                        <span className="truncate">{item.name || "Outros"}</span>
                      </span>
                      <span>R$ {item.value.toLocaleString("pt-BR")}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-muted ml-4">
                      <span>{item.vendas} vendas ganhas</span>
                      <span>{filteredRevenue > 0 ? ((item.value / filteredRevenue) * 100).toFixed(0) : "0"}% do total</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico 3: Faturamento por Origem (Lead Source) */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted mb-4 flex items-center justify-between">
            <span>Volume de Leads e Faturamento por Fonte de Captação</span>
          </h3>
          <div className="h-72">
            {sourceData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted italic">
                Sem dados de origens.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceData.slice(0, 7)} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 9, fill: "var(--muted)" }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="origem" type="category" tick={{ fontSize: 9, fill: "var(--muted)" }} width={120} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      fontSize: "11px"
                    }}
                    formatter={(value: any, name: any) => [
                      name === "faturamento" ? `R$ ${Number(value).toLocaleString("pt-BR")}` : `${value} leads`,
                      name === "faturamento" ? "Faturamento Ganho" : "Leads Gerados"
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                  <Bar dataKey="faturamento" fill={GOLD_COLOR} name="Faturamento Ganho" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="leads" fill={CLAY_COLOR} name="Leads Gerados" radius={[0, 4, 4, 0]} opacity={0.4} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Gráfico 4: Performance Vendedoras + Motivos de Perda */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted mb-4">
              Comparativo de Eficiência Comercial (Vendedoras)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sellerData.map((sd) => (
                <div key={sd.vendedora} className="bg-background/30 border border-border p-4 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-lg font-medium text-foreground">{sd.vendedora}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-letitia-gold/10 text-letitia-gold" style={{ color: GOLD_COLOR }}>
                      {sd.conversao}% Conv.
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="border-r border-border/50">
                      <p className="text-[9px] uppercase tracking-wider text-muted">Contatos</p>
                      <p className="font-semibold text-foreground mt-0.5">{sd.leads}</p>
                    </div>
                    <div className="border-r border-border/50">
                      <p className="text-[9px] uppercase tracking-wider text-muted">Vendas</p>
                      <p className="font-semibold text-foreground mt-0.5">{sd.vendas}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-muted">Ticket Médio</p>
                      <p className="font-semibold text-foreground mt-0.5">R$ {sd.ticketMedio.toLocaleString("pt-BR")}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border/30 flex justify-between items-center text-xs">
                    <span className="text-muted text-[10px] uppercase font-semibold">Total Faturado:</span>
                    <span className="font-serif font-semibold text-foreground">R$ {sd.faturamento.toLocaleString("pt-BR")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-border">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-letitia-gold" style={{ color: GOLD_COLOR }} /> Análise dos Principais Motivos de Perda de Vendas
            </h4>
            <div className="space-y-2">
              {lossData.length === 0 ? (
                <p className="text-xs text-muted italic">Sem perdas registradas para este filtro.</p>
              ) : (
                lossData.map((item) => (
                  <div key={item.motivo} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-foreground">
                      <span>{item.motivo}</span>
                      <span className="text-muted">{item.quantidade} leads ({((item.quantidade / Math.max(1, filteredLeadsContactados - filteredSalesCount)) * 100).toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-foreground/5 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-muted h-full rounded-full transition-all duration-300"
                        style={{ width: `${(item.quantidade / Math.max(1, lossData[0].quantidade)) * 100}%`, backgroundColor: CLAY_COLOR }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ─── GRÁFICO: ORIGEM DO LEAD (%) ────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted mb-4 flex items-center justify-between">
          <span>Origem do Lead (%)</span>
          <span className="text-[10px] font-sans font-normal text-muted lowercase">
            {totalLeadsForPercent} leads no período
          </span>
        </h3>
        <div className="h-[420px]">
          {origemPercentData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted italic">
              Sem dados de origens para os filtros aplicados.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={origemPercentData}
                margin={{ top: 30, right: 10, left: 10, bottom: 120 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} vertical={false} />
                <XAxis
                  dataKey="origem"
                  tick={{ fontSize: 9, fill: "var(--muted)" }}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  height={120}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--muted)" }}
                  tickFormatter={(v) => v.toFixed(2).replace(".", ",")}
                  domain={[0, "auto"]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "11px",
                    color: "var(--foreground)"
                  }}
                  formatter={(value: any, _name: any, props: any) => [
                    `${Number(value).toFixed(2).replace(".", ",")}% (${props.payload.leads} leads)`,
                    props.payload.origemFull
                  ]}
                  labelFormatter={(label) => `Origem: ${label}`}
                />
                <Bar
                  dataKey="percentual"
                  fill="#8B3A2A"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={45}
                >
                  <LabelList
                    dataKey="percentual"
                    position="top"
                    formatter={(v: any) => `${Number(v).toFixed(2).replace(".", ",")}%`}
                    style={{
                      fontSize: "9px",
                      fill: "var(--foreground)",
                      fontWeight: 600
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ─── TABELA DE LEADS DETALHADA E PAGINADA ─────────────────────────── */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border p-4 bg-background/25 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-serif text-xl font-medium text-foreground">Relatório Analítico de Contatos</h3>
            <p className="text-xs text-muted mt-0.5">Mostrando {filteredLeads.length} de {allLeads.length} leads</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Legenda status:</span>
            <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-700">Ganha</span>
            <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-700">Perdida</span>
            <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-700">Em aberto</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-background/10 text-left">
                {["Aba", "Data", "Nome Cliente", "Vendedora", "Origem (Fonte)", "Produto", "Resultado", "Valor"].map((h) => {
                  const headerToKeyMap: Record<string, keyof LeadRecord> = {
                    "Aba": "mes",
                    "Data": "dataEntrada",
                    "Nome Cliente": "nome",
                    "Vendedora": "vendedora",
                    "Origem (Fonte)": "origem",
                    "Produto": "produto",
                    "Resultado": "resultado",
                    "Valor": "valorVenda"
                  };
                  const key = headerToKeyMap[h];
                  const isSorted = sortConfig?.key === key;
                  const isAsc = sortConfig?.direction === "asc";

                  return (
                    <th
                      key={h}
                      onClick={() => handleSort(key)}
                      className={cn(
                        "px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted cursor-pointer hover:bg-background/20 select-none transition-colors",
                        h === "Valor" ? "text-right" : "text-left"
                      )}
                    >
                      <div className={cn("flex items-center gap-1.5", h === "Valor" && "justify-end")}>
                        <span>{h}</span>
                        {isSorted ? (
                          isAsc ? (
                            <ArrowUp className="h-3 w-3 text-letitia-gold" style={{ color: GOLD_COLOR }} />
                          ) : (
                            <ArrowDown className="h-3 w-3 text-letitia-gold" style={{ color: GOLD_COLOR }} />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-30 hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted italic">
                    Nenhum registro encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((l, index) => {
                  const isGanha = l.resultado === "Venda Ganha";
                  const isPerdida = l.resultado === "Venda Perdida";
                  
                  return (
                    <tr
                      key={index}
                      onClick={() => setSelectedLead(l)}
                      className="border-b border-border last:border-0 hover:bg-background/40 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-[10px] font-bold text-letitia-gold uppercase tracking-wider whitespace-nowrap">
                        {l.mes.split("/")[0]}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">{l.dataEntrada}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-foreground">
                        {l.nome || "Cliente Sem Nome"}
                        {l.detalhes && (
                          <span className="block font-normal text-[10px] text-muted truncate max-w-[180px]">
                            {l.detalhes}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">{l.vendedora}</td>
                      <td className="px-4 py-3 text-xs text-muted truncate max-w-[140px]">{l.origem}</td>
                      <td className="px-4 py-3 text-xs text-foreground font-medium whitespace-nowrap">
                        {l.produto || <span className="text-[10px] text-muted italic">Nenhum</span>}
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        {isGanha ? (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-700">
                            Venda Ganha
                          </span>
                        ) : isPerdida ? (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-700">
                            Venda Perdida
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-700">
                            {l.pipeline || "Em aberto"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-semibold text-foreground whitespace-nowrap">
                        {l.valorVenda > 0
                          ? `R$ ${l.valorVenda.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                          : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINAÇÃO */}
        {totalPages > 1 && (
          <div className="border-t border-border px-4 py-3 bg-background/10 flex items-center justify-between">
            <span className="text-xs text-muted">
              Página <span className="font-bold text-foreground">{currentPage}</span> de <span className="font-bold">{totalPages}</span> ({filteredLeads.length} leads no total)
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded border border-border bg-card text-muted hover:text-foreground hover:bg-foreground/5 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 rounded border border-border bg-card text-muted hover:text-foreground hover:bg-foreground/5 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── SIDE MODAL / DRAWER COM DETALHES DO LEAD SELECIONADO ─────────── */}
      {selectedLead && (
        <div className="modal-overlay items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg modal-content relative">
            <button
              onClick={() => setSelectedLead(null)}
              className="absolute right-4 top-4 rounded-full p-1 hover:bg-foreground/10 transition-colors text-muted"
            >
              <ChevronRight className="h-5 w-5 transform rotate-90" />
            </button>
            
            <div className="flex items-center gap-2 mb-4">
              <span className="px-2 py-0.5 rounded bg-letitia-gold/10 text-letitia-gold text-[9px] font-bold uppercase tracking-wider">
                Detalhes do Registro
              </span>
              <span className="text-xs text-muted">• Entrada: {selectedLead.dataEntrada} em {selectedLead.mes}</span>
            </div>

            <h3 className="font-serif text-2xl font-medium text-foreground pr-8 mb-4 border-b border-border/50 pb-2">
              {selectedLead.nome || "Cliente Sem Nome"}
            </h3>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-bold text-muted uppercase tracking-wider text-[9px]">Vendedora</p>
                  <p className="font-medium text-foreground mt-0.5 text-sm">{selectedLead.vendedora || "Não atribuída"}</p>
                </div>
                <div>
                  <p className="font-bold text-muted uppercase tracking-wider text-[9px]">Contato Telefone</p>
                  <p className="font-medium text-foreground mt-0.5 text-sm">{selectedLead.telefone || "Sem telefone"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-bold text-muted uppercase tracking-wider text-[9px]">Origem (Fonte)</p>
                  <p className="font-medium text-foreground mt-0.5">{selectedLead.origem || "Não informada"}</p>
                </div>
                <div>
                  <p className="font-bold text-muted uppercase tracking-wider text-[9px]">Status (Pipeline)</p>
                  <p className="font-medium text-foreground mt-0.5">{selectedLead.pipeline || "Em aberto"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-bold text-muted uppercase tracking-wider text-[9px]">Produto Oferecido</p>
                  <p className="font-medium text-foreground mt-0.5 font-semibold">{selectedLead.produto || "Nenhum"}</p>
                </div>
                <div>
                  <p className="font-bold text-muted uppercase tracking-wider text-[9px]">Resultado</p>
                  <p className="font-medium text-foreground mt-0.5">
                    {selectedLead.resultado === "Venda Ganha" ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-500/10 text-green-700">Venda Ganha</span>
                    ) : selectedLead.resultado === "Venda Perdida" ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-700">Venda Perdida</span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-700">Em andamento</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-border/30 pt-3">
                <div>
                  <p className="font-bold text-muted uppercase tracking-wider text-[9px]">Valor da Venda</p>
                  <p className="font-medium text-foreground mt-0.5 text-sm font-semibold">
                    {selectedLead.valorVenda > 0 ? `R$ ${selectedLead.valorVenda.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "R$ 0,00"}
                  </p>
                </div>
                <div>
                  <p className="font-bold text-muted uppercase tracking-wider text-[9px]">Valor de Entrada</p>
                  <p className="font-medium text-foreground mt-0.5">
                    {selectedLead.valorEntrada > 0 ? `R$ ${selectedLead.valorEntrada.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "R$ 0,00"}
                  </p>
                </div>
              </div>

              <div className="border-t border-border/30 pt-3 grid grid-cols-2 gap-4">
                <div>
                  <p className="font-bold text-muted uppercase tracking-wider text-[9px]">Call Agendada?</p>
                  <p className="font-medium text-foreground mt-0.5">{selectedLead.callAgendada || "Não"}</p>
                </div>
                <div>
                  <p className="font-bold text-muted uppercase tracking-wider text-[9px]">Data da Call</p>
                  <p className="font-medium text-foreground mt-0.5">{selectedLead.dataCall || "—"}</p>
                </div>
              </div>

              {selectedLead.detalhes && (
                <div className="bg-foreground/5 p-3 rounded-md border border-border/50">
                  <p className="font-bold text-muted uppercase tracking-widest text-[9px] mb-1">Qualificação / Detalhes</p>
                  <p className="text-xs text-foreground italic">"{selectedLead.detalhes}"</p>
                </div>
              )}

              {selectedLead.motivoPerda && (
                <div className="bg-red-500/5 p-3 rounded-md border border-red-500/10">
                  <p className="font-bold text-red-800 uppercase tracking-widest text-[9px] mb-1">Motivo de Perda</p>
                  <p className="text-xs text-red-900 font-medium">"{selectedLead.motivoPerda}"</p>
                </div>
              )}

              {selectedLead.obs && (
                <div className="border-t border-border/30 pt-3">
                  <p className="font-bold text-muted uppercase tracking-wider text-[9px] mb-1">Observações (OBS)</p>
                  <p className="text-xs text-foreground bg-background/50 p-2.5 rounded border border-border/30">{selectedLead.obs}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-border/50 mt-6">
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="rounded-md border border-border bg-card px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted hover:text-foreground transition-all"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}

      {/* ─── ABA: LEADS RECENTES ──────────────────────────────────────────── */}
      {mainTab === "leads-recentes" && (
      <>
        {/* Filtro de Mês - Leads Recentes */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted mb-3 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-letitia-gold" style={{ color: GOLD_COLOR }} /> Filtrar por mês
          </h3>
          {/* Dropdown no Mobile */}
          <div className="block sm:hidden">
            <select
              value={recentMonthFilter}
              onChange={(e) => { setRecentMonthFilter(e.target.value); setRecentPage(1); }}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-letitia-gold focus:outline-none uppercase font-semibold"
            >
              <option value="all">Todos os Meses ({recentLeads.length} leads)</option>
              {recentMonths.map((m) => (
                <option key={m.label} value={m.label}>{m.label} ({m.count} leads)</option>
              ))}
            </select>
          </div>
          {/* Abas no Desktop */}
          <div className="hidden sm:flex items-center overflow-x-auto pb-1 gap-2 scrollbar-none">
            <button
              onClick={() => { setRecentMonthFilter("all"); setRecentPage(1); }}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-semibold tracking-wider transition-all whitespace-nowrap border border-border/80 uppercase",
                recentMonthFilter === "all"
                  ? "bg-letitia-gold text-white shadow-sm border-letitia-gold"
                  : "bg-background hover:bg-foreground/5 text-foreground/80"
              )}
              style={recentMonthFilter === "all" ? { backgroundColor: GOLD_COLOR } : {}}
            >
              Todos ({recentLeads.length})
            </button>
            {recentMonths.map((m) => (
              <button
                key={m.label}
                onClick={() => { setRecentMonthFilter(m.label); setRecentPage(1); }}
                className={cn(
                  "px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wider transition-all whitespace-nowrap border uppercase flex items-center gap-1.5",
                  recentMonthFilter === m.label
                    ? "bg-letitia-gold text-white shadow-sm border-letitia-gold"
                    : "bg-background hover:bg-foreground/5 text-foreground/80 border-border/80"
                )}
                style={recentMonthFilter === m.label ? { backgroundColor: GOLD_COLOR, borderColor: GOLD_COLOR } : {}}
              >
                {m.label.split("/")[0]}
                <span className="text-[9px] px-1.5 py-0.25 rounded-full bg-foreground/10 text-foreground/70 font-normal">
                  {m.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* KPIs de Leads Recentes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between min-h-[130px]">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted flex items-center gap-1.5">
              <Users className="h-4 w-4 text-letitia-gold" style={{ color: GOLD_COLOR }} /> Total de Leads
            </span>
            <p className="font-serif text-3xl font-medium text-foreground mt-2">
              {filteredRecentLeads.length}
            </p>
            <p className="text-[10px] text-muted uppercase tracking-wider mt-1">
              {recentMonthFilter !== "all" ? `Leads em ${recentMonthFilter}` : "Leads captados em todos os funis"}
            </p>
          </div>

          {recentByFunil.slice(0, 3).map((item, idx) => (
            <div key={item.funil} className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between min-h-[130px]">
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                {item.funil}
              </span>
              <p className="font-serif text-3xl font-medium text-foreground mt-2">
                {item.quantidade}
              </p>
              <p className="text-[10px] text-muted uppercase tracking-wider mt-1">
                {filteredRecentLeads.length > 0 ? ((item.quantidade / filteredRecentLeads.length) * 100).toFixed(1) : "0"}% do total
              </p>
            </div>
          ))}
        </div>

        {/* Gráficos: Pie chart por funil + Timeline diário */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribuição por Funil */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
              <Target className="h-4 w-4 text-letitia-gold" style={{ color: GOLD_COLOR }} />
              Distribuição por Funil
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="h-64">
                {recentPieData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted italic">Sem dados.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={recentPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {recentPieData.map((_, index) => (
                          <Cell key={`cell-rl-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                          fontSize: "11px"
                        }}
                        formatter={(value: any) => [`${value} leads`, "Quantidade"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="space-y-2">
                {recentPieData.map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between text-xs border-b border-border/30 pb-1.5 last:border-0">
                    <span className="flex items-center gap-2 font-medium">
                      <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      {item.name}
                    </span>
                    <span className="text-muted">
                      {item.value} leads ({item.percent}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline diário */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-letitia-gold" style={{ color: GOLD_COLOR }} />
                Evolução Diária de Captação
              </span>
              <span className="text-[10px] font-sans font-normal text-muted lowercase">
                {filteredRecentLeads.length} leads
              </span>
            </h3>
            <div className="h-72">
              {recentByDate.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted italic">Sem dados.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={recentByDate.slice(-30)} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} vertical={false} />
                    <XAxis
                      dataKey="data"
                      tick={{ fontSize: 9, fill: "var(--muted)" }}
                      angle={-45}
                      textAnchor="end"
                      interval={0}
                      height={60}
                      tickFormatter={(v) => { const p = v.split("/"); return `${p[0]}/${p[1]}`; }}
                    />
                    <YAxis tick={{ fontSize: 10, fill: "var(--muted)" }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        fontSize: "11px",
                        color: "var(--foreground)"
                      }}
                      formatter={(value: any) => [`${value} leads`, "Quantidade"]}
                    />
                    <Bar dataKey="quantidade" fill={GOLD_COLOR} radius={[3, 3, 0, 0]} maxBarSize={30}>
                      <LabelList
                        dataKey="quantidade"
                        position="top"
                        style={{ fontSize: "9px", fill: "var(--foreground)", fontWeight: 600 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Resumo por Funil - Cards detalhados */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-letitia-gold" style={{ color: GOLD_COLOR }} />
            Detalhamento por Funil
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentByFunil.map((item, idx) => {
              // Leads mais recentes deste funil
              const funilLeads = recentLeads.filter((l) => (l.produto || "Sem funil") === item.funil);
              const latestLead = funilLeads[funilLeads.length - 1];
              // Unique dates for this funnel
              const uniqueDates = new Set(funilLeads.map((l) => l.dataFormatada));

              return (
                <div key={item.funil} className="bg-background/30 border border-border p-4 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="font-serif text-lg font-medium text-foreground">{item.funil}</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-letitia-gold/10 text-letitia-gold" style={{ color: GOLD_COLOR }}>
                      {recentLeads.length > 0 ? ((item.quantidade / recentLeads.length) * 100).toFixed(1) : "0"}%
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="border-r border-border/50">
                      <p className="text-[9px] uppercase tracking-wider text-muted">Leads</p>
                      <p className="font-semibold text-foreground mt-0.5">{item.quantidade}</p>
                    </div>
                    <div className="border-r border-border/50">
                      <p className="text-[9px] uppercase tracking-wider text-muted">Dias Ativos</p>
                      <p className="font-semibold text-foreground mt-0.5">{uniqueDates.size}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-muted">Média/Dia</p>
                      <p className="font-semibold text-foreground mt-0.5">
                        {uniqueDates.size > 0 ? (item.quantidade / uniqueDates.size).toFixed(1) : "0"}
                      </p>
                    </div>
                  </div>
                  {latestLead && (
                    <div className="pt-2 border-t border-border/30 text-xs text-muted">
                      <span className="text-[9px] uppercase font-semibold tracking-wider">Último lead: </span>
                      <span className="text-foreground font-medium">{latestLead.nome}</span>
                      <span className="text-muted"> • {latestLead.dataFormatada}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Filtros e Tabela de Leads Recentes */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="border-b border-border p-4 bg-background/25 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-serif text-xl font-medium text-foreground">Leads Recentes — Tabela Completa</h3>
              <p className="text-xs text-muted mt-0.5">
                {filteredRecentLeads.length} de {recentLeads.length} leads
                {recentFunilFilter !== "all" && (
                  <span className="ml-1 font-medium text-foreground">• Filtro: {recentFunilFilter}</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted" />
                <input
                  type="text"
                  placeholder="Buscar nome, email..."
                  value={recentSearch}
                  onChange={(e) => { setRecentSearch(e.target.value); setRecentPage(1); }}
                  className="rounded-md border border-border bg-background pl-7 pr-3 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-letitia-gold focus:outline-none w-[200px]"
                />
              </div>
              {/* Filtro por funil */}
              <select
                value={recentFunilFilter}
                onChange={(e) => { setRecentFunilFilter(e.target.value); setRecentPage(1); }}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-letitia-gold focus:outline-none"
              >
                <option value="all">Todos os Funis ({recentFunis.length})</option>
                {recentFunis.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              {(recentSearch || recentFunilFilter !== "all") && (
                <button
                  onClick={() => { setRecentSearch(""); setRecentFunilFilter("all"); setRecentPage(1); }}
                  className="text-[10px] font-bold uppercase tracking-wider text-letitia-gold hover:underline"
                  style={{ color: GOLD_COLOR }}
                >
                  Limpar ✕
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-background/10 text-left">
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted">Data</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted">Funil / Produto</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted">Nome</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted">Email</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted">Telefone</th>
                </tr>
              </thead>
              <tbody>
                {recentPaginatedLeads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted italic">
                      Nenhum lead encontrado para os filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  recentPaginatedLeads.map((l, index) => {
                    const funilIdx = recentFunis.indexOf(l.produto);
                    const funilColor = COLORS[(funilIdx >= 0 ? funilIdx : 0) % COLORS.length];

                    return (
                      <tr
                        key={`rl-${index}`}
                        className="border-b border-border last:border-0 hover:bg-background/40 transition-colors"
                      >
                        <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">{l.data}</td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: funilColor }} />
                            <span className="font-medium text-foreground">{l.produto || "—"}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-foreground">{l.nome || "—"}</td>
                        <td className="px-4 py-3 text-xs text-muted truncate max-w-[220px]">{l.email || "—"}</td>
                        <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">{l.telefone || "—"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {recentTotalPages > 1 && (
            <div className="border-t border-border px-4 py-3 bg-background/10 flex items-center justify-between">
              <span className="text-xs text-muted">
                Página <span className="font-bold text-foreground">{recentPage}</span> de <span className="font-bold">{recentTotalPages}</span> ({filteredRecentLeads.length} leads)
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={recentPage === 1}
                  onClick={() => setRecentPage((p) => Math.max(1, p - 1))}
                  className="p-1 rounded border border-border bg-card text-muted hover:text-foreground hover:bg-foreground/5 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  disabled={recentPage === recentTotalPages}
                  onClick={() => setRecentPage((p) => Math.min(recentTotalPages, p + 1))}
                  className="p-1 rounded border border-border bg-card text-muted hover:text-foreground hover:bg-foreground/5 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </>
      )}
    </div>
  );
}
