import { useState, useEffect, useMemo } from "react";
import {
  Target,
  Plus,
  Search,
  DollarSign,
  X,
  Pencil,
  Trash2,
  ChevronDown,
  Trophy,
  Layers,
  Settings2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  CalendarDays,
  CalendarClock,
  Clock,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { fetchLiveSalesData, type LeadRecord } from "@/data/salesData";

// ─── PRODUTO CATALOG (reutilizado de Comissoes.tsx) ─────────────────────────
interface Produto {
  id: string;
  nome: string;
  valor: number;
  emoji: string;
}

const PRODUTOS: Produto[] = [
  { id: "plano-a", nome: "Workshop Plano A", valor: 97.0, emoji: "📋" },
  { id: "voce-dirige", nome: "Curso Você Dirige", valor: 970.0, emoji: "🚗" },
  { id: "the-way-anual", nome: "THE WAY Mentoria (Anual)", valor: 72000.0, emoji: "✦" },
  { id: "the-way-semestral", nome: "THE WAY Mentoria (Semestral)", valor: 40000.0, emoji: "✦" },
  { id: "the-way-trimestral", nome: "THE WAY Mentoria (Trimestral)", valor: 30000.0, emoji: "✦" },
  { id: "estrategista", nome: "A Estrategista (Gravado)", valor: 2000.0, emoji: "🎯" },
  { id: "lacademia", nome: "L'Acadèmia", valor: 2997.0, emoji: "🏛️" },
  { id: "vcn", nome: "Vida, Carreira e Negócios (VCN)", valor: 20000.0, emoji: "🏅" },
  { id: "bno-experience", nome: "BNO Experience 2026", valor: 3000.0, emoji: "🌟" },
];

// ─── TYPES ──────────────────────────────────────────────────────────────────
interface FaixaEscalonamento {
  min_vendas: number;
  bonus: number;
}

type Periodicidade = 'diaria' | 'semanal' | 'mensal';

interface Meta {
  id: string;
  nome: string;
  produto_id: string;
  escalonamento: boolean;
  faixas: FaixaEscalonamento[];
  min_vendas: number;
  bonus: number;
  descricao: string | null;
  ativo: boolean;
  periodicidade: Periodicidade;
  created_at: string;
  updated_at: string;
}

// ─── MAPEAMENTO PRODUTO_ID → NOMES NA PLANILHA DE VENDAS ────────────────────
const PRODUCT_ID_TO_SALES_NAMES: Record<string, string[]> = {
  "plano-a": ["WORKSHOP PLANO A", "Workshop Plano A"],
  "voce-dirige": ["VOCÊ DIRIGE", "VOCÃ DIRIGE", "Você Dirige", "Curso Você Dirige"],
  "the-way-anual": ["THE WAY", "THE WAY Mentoria", "The Way"],
  "the-way-semestral": ["THE WAY", "THE WAY Mentoria", "The Way"],
  "the-way-trimestral": ["THE WAY", "THE WAY Mentoria", "The Way"],
  "estrategista": ["A Estrategista", "A ESTRATEGISTA", "Estrategista"],
  "lacademia": ["L'Acadèmia", "LACADEMIA", "Lacademia", "L'Acadèmia"],
  "vcn": ["VCN", "Vida, Carreira e Negócios"],
  "bno-experience": ["BNO Experience", "BNO EXPERIENCE", "BNO Experience 2026"],
};

const PERIODICIDADE_CONFIG: Record<Periodicidade, { label: string; icon: typeof CalendarDays; color: string; bgColor: string }> = {
  diaria: { label: "Diária", icon: Clock, color: "text-blue-600", bgColor: "bg-blue-500/10 border-blue-500/20" },
  semanal: { label: "Semanal", icon: CalendarClock, color: "text-emerald-600", bgColor: "bg-emerald-500/10 border-emerald-500/20" },
  mensal: { label: "Mensal", icon: CalendarDays, color: "text-amber-600", bgColor: "bg-amber-500/10 border-amber-500/20" },
};



// ─── COMPONENTE PRINCIPAL ───────────────────────────────────────────────────
export function MetasTab() {
  // State
  const [metas, setMetas] = useState<Meta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todas" | "ativas" | "inativas">("todas");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMeta, setEditingMeta] = useState<Meta | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showRegistrarBatida, setShowRegistrarBatida] = useState(false);

  // Form states
  const [formNome, setFormNome] = useState("");
  const [formProduto, setFormProduto] = useState("");
  const [formEscalonamento, setFormEscalonamento] = useState(false);
  const [formFaixas, setFormFaixas] = useState<FaixaEscalonamento[]>([
    { min_vendas: 2, bonus: 50 },
    { min_vendas: 3, bonus: 100 },
  ]);
  const [formMinVendas, setFormMinVendas] = useState(1);
  const [formBonus, setFormBonus] = useState(0);
  const [formDescricao, setFormDescricao] = useState("");
  const [saving, setSaving] = useState(false);
  const [formPeriodicidade, setFormPeriodicidade] = useState<Periodicidade>('mensal');

  // Sales data for progress tracking
  const [salesData, setSalesData] = useState<LeadRecord[]>([]);
  const [salesLoading, setSalesLoading] = useState(true);

  // Registrar batida states
  const [batidaMetaId, setBatidaMetaId] = useState("");
  const [batidaObs, setBatidaObs] = useState("");
  const [savingBatida, setSavingBatida] = useState(false);

  // ─── DATA LOADING ─────────────────────────────────────────────────────────
  const fetchMetas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("metas")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMetas(data || []);
    } catch (err) {
      console.error("Erro ao carregar metas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetas();
    loadSalesData();
  }, []);

  const loadSalesData = async () => {
    setSalesLoading(true);
    try {
      const leads = await fetchLiveSalesData();
      setSalesData(leads);
    } catch (err) {
      console.warn("Erro ao carregar dados de vendas para progresso:", err);
    } finally {
      setSalesLoading(false);
    }
  };

  // ─── FAIXA COLORS (for escalonamento tiers) ────────────────────────────────
  const FAIXA_COLORS = [
    { bg: 'bg-amber-500', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800 border-amber-200/60', label: '🥉' },
    { bg: 'bg-sky-500', text: 'text-sky-700', badge: 'bg-sky-100 text-sky-800 border-sky-200/60', label: '🥈' },
    { bg: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200/60', label: '🥇' },
    { bg: 'bg-violet-500', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-800 border-violet-200/60', label: '💎' },
    { bg: 'bg-rose-500', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-800 border-rose-200/60', label: '🏆' },
  ];

  const getFaixaColor = (idx: number) => FAIXA_COLORS[idx % FAIXA_COLORS.length];

  // ─── PROGRESS CALCULATION ─────────────────────────────────────────────────
  const calcularProgresso = (meta: Meta) => {
    if (!salesData.length) return {
      vendas: 0,
      alvo: meta.escalonamento && meta.faixas?.length ? meta.faixas.sort((a, b) => a.min_vendas - b.min_vendas)[0].min_vendas : (meta.min_vendas || 1),
      percentual: 0,
      faixaAtingida: null as FaixaEscalonamento | null,
      sortedFaixas: meta.escalonamento && meta.faixas?.length ? [...meta.faixas].sort((a, b) => a.min_vendas - b.min_vendas) : [],
      currentFaixaIdx: -1,
      nextFaixaIdx: 0,
    };

    const produtoNames = PRODUCT_ID_TO_SALES_NAMES[meta.produto_id] || [];
    const now = new Date();

    // Helper: parse DD/MM/YYYY to Date
    const parseDate = (d: string) => {
      if (!d) return null;
      const parts = d.split("/");
      if (parts.length !== 3) return null;
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    };

    // Filter by period
    const isInPeriod = (dateStr: string) => {
      const d = parseDate(dateStr);
      if (!d) return false;

      if (meta.periodicidade === 'diaria') {
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
      } else if (meta.periodicidade === 'semanal') {
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
        monday.setHours(0, 0, 0, 0);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        return d >= monday && d <= sunday;
      } else {
        // mensal
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      }
    };

    // Count sales matching product + period + "Venda Ganha"
    const vendasNoPeriodo = salesData.filter(lead => {
      if (lead.resultado !== "Venda Ganha") return false;
      if (!isInPeriod(lead.dataEntrada)) return false;
      if (produtoNames.length === 0) return false;
      const leadProduto = (lead.produto || "").trim();
      return produtoNames.some(name => name.toLowerCase() === leadProduto.toLowerCase());
    }).length;

    if (meta.escalonamento && meta.faixas && meta.faixas.length > 0) {
      const sortedFaixas = [...meta.faixas].sort((a, b) => a.min_vendas - b.min_vendas);

      // Determine which faixas are achieved and what the next target is
      let currentFaixaIdx = -1; // last achieved faixa index
      for (let i = 0; i < sortedFaixas.length; i++) {
        if (vendasNoPeriodo >= sortedFaixas[i].min_vendas) {
          currentFaixaIdx = i;
        }
      }

      // Next faixa to pursue
      const nextFaixaIdx = currentFaixaIdx + 1 < sortedFaixas.length ? currentFaixaIdx + 1 : currentFaixaIdx;

      // The target is always the NEXT faixa to achieve (or current if all achieved)
      const alvo = currentFaixaIdx >= sortedFaixas.length - 1
        ? sortedFaixas[sortedFaixas.length - 1].min_vendas  // all achieved
        : sortedFaixas[nextFaixaIdx].min_vendas;             // next target

      const faixaAtingida = currentFaixaIdx >= 0 ? sortedFaixas[currentFaixaIdx] : null;

      return {
        vendas: vendasNoPeriodo,
        alvo,
        percentual: Math.min(100, alvo > 0 ? (vendasNoPeriodo / alvo) * 100 : 0),
        faixaAtingida,
        sortedFaixas,
        currentFaixaIdx,
        nextFaixaIdx,
      };
    } else {
      const alvo = meta.min_vendas || 1;
      return {
        vendas: vendasNoPeriodo,
        alvo,
        percentual: Math.min(100, (vendasNoPeriodo / alvo) * 100),
        faixaAtingida: null,
        sortedFaixas: [] as FaixaEscalonamento[],
        currentFaixaIdx: -1,
        nextFaixaIdx: 0,
      };
    }
  };

  // ─── COMPUTED VALUES ──────────────────────────────────────────────────────
  const filteredMetas = useMemo(() => {
    return metas.filter((meta) => {
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const produtoNome = PRODUTOS.find((p) => p.id === meta.produto_id)?.nome || "";
        if (
          !meta.nome.toLowerCase().includes(q) &&
          !produtoNome.toLowerCase().includes(q) &&
          !(meta.descricao || "").toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      // Status filter
      if (statusFilter === "ativas" && !meta.ativo) return false;
      if (statusFilter === "inativas" && meta.ativo) return false;
      return true;
    });
  }, [metas, searchQuery, statusFilter]);

  const totalMetas = metas.length;
  const metasAtivas = metas.filter((m) => m.ativo).length;
  const bonusMaxAtivas = useMemo(() => {
    return metas
      .filter((m) => m.ativo)
      .reduce((acc, m) => {
        if (m.escalonamento && m.faixas && m.faixas.length > 0) {
          const maxFaixa = Math.max(...m.faixas.map((f) => f.bonus));
          return acc + maxFaixa;
        }
        return acc + Number(m.bonus);
      }, 0);
  }, [metas]);

  // ─── CRUD OPERATIONS ─────────────────────────────────────────────────────
  const resetForm = () => {
    setFormNome("");
    setFormProduto("");
    setFormEscalonamento(false);
    setFormFaixas([
      { min_vendas: 2, bonus: 50 },
      { min_vendas: 3, bonus: 100 },
    ]);
    setFormMinVendas(1);
    setFormBonus(0);
    setFormDescricao("");
    setFormPeriodicidade('mensal');
  };

  const openCreateModal = () => {
    resetForm();
    setEditingMeta(null);
    setShowCreateModal(true);
  };

  const openEditModal = (meta: Meta) => {
    setFormNome(meta.nome);
    setFormProduto(meta.produto_id);
    setFormEscalonamento(meta.escalonamento);
    setFormFaixas(
      meta.faixas && meta.faixas.length > 0
        ? meta.faixas
        : [
            { min_vendas: 2, bonus: 50 },
            { min_vendas: 3, bonus: 100 },
          ]
    );
    setFormMinVendas(meta.min_vendas);
    setFormBonus(Number(meta.bonus));
    setFormDescricao(meta.descricao || "");
    setFormPeriodicidade(meta.periodicidade || 'mensal');
    setEditingMeta(meta);
    setShowCreateModal(true);
  };

  const handleSaveMeta = async () => {
    if (!formNome.trim() || !formProduto) return;
    setSaving(true);

    const payload = {
      nome: formNome.trim(),
      produto_id: formProduto,
      escalonamento: formEscalonamento,
      faixas: formEscalonamento ? formFaixas : [],
      min_vendas: formEscalonamento ? 0 : formMinVendas,
      bonus: formEscalonamento ? 0 : formBonus,
      descricao: formDescricao.trim() || null,
      periodicidade: formPeriodicidade,
      updated_at: new Date().toISOString(),
    };

    try {
      if (editingMeta) {
        const { error } = await supabase
          .from("metas")
          .update(payload)
          .eq("id", editingMeta.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("metas").insert([payload]);
        if (error) throw error;
      }
      await fetchMetas();
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      console.error("Erro ao salvar meta:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAtivo = async (meta: Meta) => {
    try {
      const { error } = await supabase
        .from("metas")
        .update({ ativo: !meta.ativo, updated_at: new Date().toISOString() })
        .eq("id", meta.id);
      if (error) throw error;
      setMetas((prev) =>
        prev.map((m) => (m.id === meta.id ? { ...m, ativo: !m.ativo } : m))
      );
    } catch (err) {
      console.error("Erro ao toggle ativo:", err);
    }
  };

  const handleDeleteMeta = async (id: string) => {
    try {
      const { error } = await supabase.from("metas").delete().eq("id", id);
      if (error) throw error;
      setMetas((prev) => prev.filter((m) => m.id !== id));
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error("Erro ao deletar meta:", err);
    }
  };

  const handleRegistrarBatida = async () => {
    if (!batidaMetaId) return;
    setSavingBatida(true);
    try {
      const { error } = await supabase.from("metas_batidas").insert([
        {
          meta_id: batidaMetaId,
          observacao: batidaObs.trim() || null,
        },
      ]);
      if (error) throw error;
      setShowRegistrarBatida(false);
      setBatidaMetaId("");
      setBatidaObs("");
    } catch (err) {
      console.error("Erro ao registrar meta batida:", err);
    } finally {
      setSavingBatida(false);
    }
  };

  // ─── HELPERS ──────────────────────────────────────────────────────────────
  const getProdutoNome = (produtoId: string) => {
    return PRODUTOS.find((p) => p.id === produtoId)?.nome || produtoId;
  };

  const getProdutoEmoji = (produtoId: string) => {
    return PRODUTOS.find((p) => p.id === produtoId)?.emoji || "📦";
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  // Add faixa
  const addFaixa = () => {
    const lastFaixa = formFaixas[formFaixas.length - 1];
    setFormFaixas([
      ...formFaixas,
      { min_vendas: (lastFaixa?.min_vendas || 1) + 1, bonus: (lastFaixa?.bonus || 50) + 50 },
    ]);
  };

  const removeFaixa = (index: number) => {
    if (formFaixas.length <= 1) return;
    setFormFaixas(formFaixas.filter((_, i) => i !== index));
  };

  const updateFaixa = (index: number, field: keyof FaixaEscalonamento, value: number) => {
    setFormFaixas(
      formFaixas.map((f, i) => (i === index ? { ...f, [field]: value } : f))
    );
  };

  // ─── LOADING STATE ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-2 border-letitia-gold/30 animate-pulse" />
          <Target className="h-5 w-5 text-letitia-gold absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-sm text-muted">Carregando metas...</p>
      </div>
    );
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ─── HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center border border-amber-500/20">
            <Target className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2 className="font-serif text-xl md:text-2xl font-semibold text-foreground tracking-tight">
              Gerenciamento de Metas
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Crie metas personalizadas com bônus fixo ou escalonado
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRegistrarBatida(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-foreground/5 transition-all shadow-sm"
          >
            <Trophy className="h-4 w-4 text-amber-500" />
            Registrar Meta Batida
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Nova Meta
          </button>
        </div>
      </div>

      {/* ─── KPI CARDS ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total de Metas */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm relative overflow-hidden group hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Total de Metas</p>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Settings2 className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <p className="font-serif text-4xl font-medium text-foreground">{totalMetas}</p>
          <p className="text-xs text-muted mt-1">{metasAtivas} ativas</p>
          <div className="absolute -bottom-3 -right-3 h-20 w-20 rounded-full bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors" />
        </div>

        {/* Metas Ativas */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm relative overflow-hidden group hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Metas Ativas</p>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Target className="h-4 w-4 text-amber-600" />
            </div>
          </div>
          <p className="font-serif text-4xl font-medium text-amber-600">{metasAtivas}</p>
          <p className="text-xs text-muted mt-1">Disponíveis para registro</p>
          <div className="absolute -bottom-3 -right-3 h-20 w-20 rounded-full bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors" />
        </div>

        {/* Bônus Máx. */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Bônus Máx. (Ativas)</p>
            <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
          </div>
          <p className="font-serif text-4xl font-medium text-green-600">
            {formatCurrency(bonusMaxAtivas)}
          </p>
          <p className="text-xs text-muted mt-1">Soma dos bônus máximos</p>
          <div className="absolute -bottom-3 -right-3 h-20 w-20 rounded-full bg-green-500/5 group-hover:bg-green-500/10 transition-colors" />
        </div>
      </div>

      {/* ─── SEARCH & FILTERS ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Buscar metas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:ring-2 focus:ring-letitia-gold/30 focus:border-letitia-gold focus:outline-none transition-all"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="appearance-none rounded-lg border border-border bg-card pl-4 pr-10 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold/30 focus:border-letitia-gold focus:outline-none transition-all cursor-pointer"
          >
            <option value="todas">Todas</option>
            <option value="ativas">Ativas</option>
            <option value="inativas">Inativas</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
        </div>
      </div>

      {/* ─── METAS TABLE ───────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border/50 flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-muted" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted">
            Metas Cadastradas
          </h3>
        </div>

        {filteredMetas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
              <Target className="h-7 w-7 text-amber-500" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              {searchQuery || statusFilter !== "todas"
                ? "Nenhuma meta encontrada"
                : "Nenhuma meta cadastrada ainda"}
            </p>
            <p className="text-xs text-muted max-w-xs">
              {searchQuery || statusFilter !== "todas"
                ? "Tente ajustar os filtros para encontrar metas."
                : "Clique em \"+ Nova Meta\" para criar a primeira meta de comissão."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-foreground/[0.02]">
                  <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted">
                    Nome
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted">
                    Produto
                  </th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-muted">
                    Período
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted">
                    Metas de Vendas / Bônus
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted min-w-[200px]">
                    Progresso
                  </th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-muted">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted hidden sm:table-cell">
                    Criada em
                  </th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-muted">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMetas.map((meta) => (
                  <tr
                    key={meta.id}
                    className="border-b border-border/50 last:border-0 hover:bg-foreground/[0.015] transition-colors group"
                  >
                    {/* Nome */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                          <Target className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{meta.nome}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {meta.escalonamento && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 text-[9px] font-bold uppercase tracking-wider">
                                <Layers className="h-2.5 w-2.5" /> Escalonada
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Produto */}
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-800 text-[11px] font-semibold border border-amber-500/15">
                        {getProdutoEmoji(meta.produto_id)} {getProdutoNome(meta.produto_id)}
                      </span>
                    </td>

                    {/* Periodicidade */}
                    <td className="px-4 py-4 text-center">
                      {(() => {
                        const config = PERIODICIDADE_CONFIG[meta.periodicidade || 'mensal'];
                        const Icon = config.icon;
                        return (
                          <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border", config.bgColor, config.color)}>
                            <Icon className="h-3 w-3" />
                            {config.label}
                          </span>
                        );
                      })()}
                    </td>

                    {/* Metas de Vendas / Bônus */}
                    <td className="px-4 py-4">
                      {meta.escalonamento && meta.faixas && meta.faixas.length > 0 ? (
                        <div className="space-y-1">
                          {[...meta.faixas].sort((a, b) => a.min_vendas - b.min_vendas).map((faixa, idx) => {
                            const color = getFaixaColor(idx);
                            const progresso = calcularProgresso(meta);
                            const isAchieved = progresso.vendas >= faixa.min_vendas;
                            return (
                              <div
                                key={idx}
                                className={cn(
                                  "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-semibold border w-full",
                                  isAchieved
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                                    : color.badge
                                )}
                              >
                                {isAchieved ? (
                                  <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                                ) : (
                                  <span className="flex-shrink-0">{color.label}</span>
                                )}
                                <span>
                                  Faça {faixa.min_vendas} venda{faixa.min_vendas !== 1 ? 's' : ''} → ganhe {formatCurrency(faixa.bonus)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="text-sm font-medium text-foreground">
                            {formatCurrency(Number(meta.bonus))}
                          </span>
                          <p className="text-[10px] text-muted">
                            Faça {meta.min_vendas} venda{meta.min_vendas !== 1 ? 's' : ''} para ganhar
                          </p>
                        </div>
                      )}
                    </td>

                    {/* Progresso */}
                    <td className="px-4 py-4">
                      {(() => {
                        const progresso = calcularProgresso(meta);

                        if (salesLoading) {
                          return (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-3 w-3 animate-spin text-muted" />
                              <span className="text-[10px] text-muted">Carregando...</span>
                            </div>
                          );
                        }

                        // For escalonamento metas: progressive display
                        if (meta.escalonamento && progresso.sortedFaixas.length > 0) {
                          const allAchieved = progresso.currentFaixaIdx >= progresso.sortedFaixas.length - 1;
                          const nextFaixa = progresso.sortedFaixas[progresso.nextFaixaIdx];
                          const barColor = allAchieved
                            ? 'bg-emerald-500'
                            : progresso.currentFaixaIdx >= 0
                              ? getFaixaColor(progresso.nextFaixaIdx).bg
                              : 'bg-amber-500';
                          const pctToNext = allAchieved
                            ? 100
                            : Math.min(100, nextFaixa.min_vendas > 0 ? (progresso.vendas / nextFaixa.min_vendas) * 100 : 0);

                          return (
                            <div className="space-y-1.5 min-w-[180px]">
                              {/* Current target */}
                              <div className="flex items-center justify-between">
                                <span className={cn("text-[11px] font-semibold", allAchieved ? 'text-emerald-600' : progresso.vendas > 0 ? getFaixaColor(progresso.nextFaixaIdx).text : 'text-muted')}>
                                  {progresso.vendas} de {progresso.alvo} vendas
                                </span>
                                {allAchieved && (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                )}
                              </div>
                              {/* Progress bar */}
                              <div className="w-full bg-foreground/5 rounded-full h-2 overflow-hidden">
                                <div
                                  className={cn("h-full rounded-full transition-all duration-700 ease-out", barColor)}
                                  style={{ width: `${Math.max(pctToNext, 2)}%` }}
                                />
                              </div>
                              {/* Tier indicators */}
                              <div className="flex items-center gap-1 flex-wrap">
                                {progresso.sortedFaixas.map((faixa, idx) => {
                                  const isAchieved = progresso.vendas >= faixa.min_vendas;
                                  const color = getFaixaColor(idx);
                                  return (
                                    <span
                                      key={idx}
                                      className={cn(
                                        "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold",
                                        isAchieved
                                          ? "bg-emerald-100 text-emerald-700"
                                          : `${color.badge} opacity-60`
                                      )}
                                      title={`${faixa.min_vendas} vendas → ${formatCurrency(faixa.bonus)}`}
                                    >
                                      {isAchieved ? '✓' : color.label} {faixa.min_vendas}v
                                    </span>
                                  );
                                })}
                              </div>
                              {/* Achievement message */}
                              {progresso.faixaAtingida && (
                                <p className="text-[9px] text-emerald-600 font-semibold flex items-center gap-1">
                                  <TrendingUp className="h-2.5 w-2.5" />
                                  {allAchieved ? 'Todas as metas batidas!' : `${progresso.faixaAtingida.min_vendas} vendas atingidas → ${formatCurrency(progresso.faixaAtingida.bonus)}`}
                                </p>
                              )}
                            </div>
                          );
                        }

                        // Non-escalonamento (fixed bonus)
                        const barColor = progresso.percentual >= 100
                          ? 'bg-emerald-500'
                          : progresso.percentual > 0
                            ? 'bg-amber-500'
                            : 'bg-gray-300';
                        const textColor = progresso.percentual >= 100
                          ? 'text-emerald-600'
                          : progresso.percentual > 0
                            ? 'text-amber-600'
                            : 'text-muted';

                        return (
                          <div className="space-y-1.5 min-w-[160px]">
                            <div className="flex items-center justify-between">
                              <span className={cn("text-[11px] font-semibold", textColor)}>
                                {progresso.vendas} de {progresso.alvo} venda{progresso.alvo !== 1 ? 's' : ''}
                              </span>
                              {progresso.percentual >= 100 && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                              )}
                            </div>
                            <div className="w-full bg-foreground/5 rounded-full h-2 overflow-hidden">
                              <div
                                className={cn("h-full rounded-full transition-all duration-700 ease-out", barColor)}
                                style={{ width: `${Math.max(progresso.percentual, 2)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </td>

                    {/* Status Toggle */}
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => handleToggleAtivo(meta)}
                        className={cn(
                          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-letitia-gold/30",
                          meta.ativo ? "bg-emerald-500" : "bg-gray-300"
                        )}
                      >
                        <span
                          className={cn(
                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                            meta.ativo ? "translate-x-6" : "translate-x-1"
                          )}
                        />
                      </button>
                    </td>

                    {/* Data */}
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <p className="text-xs text-muted">{formatDate(meta.created_at)}</p>
                    </td>

                    {/* Ações */}
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditModal(meta)}
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-foreground/5 transition-all"
                          title="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(meta.id)}
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-muted hover:text-red-600 hover:bg-red-50 transition-all"
                          title="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: CRIAR / EDITAR META
         ═══════════════════════════════════════════════════════════════════════ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowCreateModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-amber-600" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-foreground">
                  {editingMeta ? "Editar Meta" : "Criar Nova Meta"}
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-foreground/5 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Nome da Meta <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder='Ex: "Meta Bronze", "Meta Ouro Março"...'
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:outline-none transition-all"
                />
              </div>

              {/* Produto */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Produto <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formProduto}
                    onChange={(e) => setFormProduto(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="">Selecione o produto...</option>
                    {PRODUTOS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.emoji} {p.nome}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
                </div>
              </div>

              {/* Periodicidade */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Periodicidade <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(PERIODICIDADE_CONFIG) as Periodicidade[]).map((key) => {
                    const config = PERIODICIDADE_CONFIG[key];
                    const Icon = config.icon;
                    const isActive = formPeriodicidade === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormPeriodicidade(key)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border-2 transition-all text-center",
                          isActive
                            ? cn("border-current shadow-sm", config.color, config.bgColor)
                            : "border-border bg-background hover:bg-foreground/[0.02] text-muted"
                        )}
                      >
                        <Icon className={cn("h-5 w-5", isActive ? config.color : "text-muted")} />
                        <span className={cn("text-xs font-semibold", isActive ? config.color : "text-muted")}>{config.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Escalonamento Toggle */}
              <div className="rounded-xl border border-border bg-foreground/[0.015] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
                      <Layers className="h-4 w-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Bônus por Escalonamento</p>
                      <p className="text-[11px] text-muted">
                        Defina faixas de vendas com bônus diferentes
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFormEscalonamento(!formEscalonamento)}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                      formEscalonamento ? "bg-violet-500" : "bg-gray-300"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                        formEscalonamento ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>

                {/* Escalonamento Faixas */}
                {formEscalonamento && (
                  <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    {formFaixas.map((faixa, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-bold uppercase tracking-widest text-muted mb-1">
                              Mín. Vendas
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={faixa.min_vendas}
                              onChange={(e) =>
                                updateFaixa(idx, "min_vendas", parseInt(e.target.value) || 1)
                              }
                              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 focus:outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold uppercase tracking-widest text-muted mb-1">
                              Bônus (R$)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={faixa.bonus}
                              onChange={(e) =>
                                updateFaixa(idx, "bonus", parseFloat(e.target.value) || 0)
                              }
                              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 focus:outline-none transition-all"
                            />
                          </div>
                        </div>
                        {formFaixas.length > 1 && (
                          <button
                            onClick={() => removeFaixa(idx)}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted hover:text-red-600 hover:bg-red-50 transition-all mt-5"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addFaixa}
                      className="w-full rounded-lg border border-dashed border-violet-300 bg-violet-50/50 px-4 py-2 text-xs font-medium text-violet-600 hover:bg-violet-50 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Adicionar Faixa
                    </button>
                  </div>
                )}
              </div>

              {/* Modo Fixo */}
              {!formEscalonamento && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Mínimo de Vendas <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formMinVendas}
                      onChange={(e) => setFormMinVendas(parseInt(e.target.value) || 1)}
                      className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Bônus (R$) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formBonus}
                      onChange={(e) => setFormBonus(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Descrição <span className="text-xs text-muted font-normal">(opcional)</span>
                </label>
                <textarea
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  placeholder="Detalhes sobre a meta..."
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:outline-none transition-all resize-y"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-5 py-2.5 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-foreground/5 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveMeta}
                disabled={saving || !formNome.trim() || !formProduto}
                className={cn(
                  "px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all flex items-center gap-2 shadow-sm",
                  saving || !formNome.trim() || !formProduto
                    ? "bg-amber-400 cursor-not-allowed opacity-70"
                    : "bg-amber-500 hover:bg-amber-600"
                )}
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingMeta ? "Salvar Alterações" : "Criar Meta"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: REGISTRAR META BATIDA
         ═══════════════════════════════════════════════════════════════════════ */}
      {showRegistrarBatida && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowRegistrarBatida(false)}
          />
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/10 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-emerald-600" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-foreground">
                  Registrar Meta Batida
                </h3>
              </div>
              <button
                onClick={() => setShowRegistrarBatida(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-foreground/5 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Meta selecionada */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Meta Atingida <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={batidaMetaId}
                    onChange={(e) => setBatidaMetaId(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="">Selecione a meta...</option>
                    {metas
                      .filter((m) => m.ativo)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nome} — {getProdutoNome(m.produto_id)}
                        </option>
                      ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
                </div>
              </div>

              {/* Observação */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Observação <span className="text-xs text-muted font-normal">(opcional)</span>
                </label>
                <textarea
                  value={batidaObs}
                  onChange={(e) => setBatidaObs(e.target.value)}
                  placeholder="Detalhes do atingimento..."
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-none transition-all resize-y"
                />
              </div>

              {/* Selected meta preview */}
              {batidaMetaId && (() => {
                const selectedMeta = metas.find((m) => m.id === batidaMetaId);
                if (!selectedMeta) return null;
                return (
                  <div className="rounded-xl border border-emerald-200/50 bg-emerald-50/50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                        Resumo da Meta
                      </p>
                    </div>
                    <p className="text-sm font-medium text-foreground">{selectedMeta.nome}</p>
                    <p className="text-xs text-muted mt-1">
                      Produto: {getProdutoNome(selectedMeta.produto_id)}
                    </p>
                    {selectedMeta.escalonamento && selectedMeta.faixas.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedMeta.faixas.map((f, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-semibold">
                            {f.min_vendas}v → {formatCurrency(f.bonus)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-emerald-700 mt-1 font-medium">
                        Bônus: {formatCurrency(Number(selectedMeta.bonus))} (mín. {selectedMeta.min_vendas} vendas)
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button
                onClick={() => setShowRegistrarBatida(false)}
                className="px-5 py-2.5 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-foreground/5 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegistrarBatida}
                disabled={savingBatida || !batidaMetaId}
                className={cn(
                  "px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all flex items-center gap-2 shadow-sm",
                  savingBatida || !batidaMetaId
                    ? "bg-emerald-400 cursor-not-allowed opacity-70"
                    : "bg-emerald-600 hover:bg-emerald-700"
                )}
              >
                {savingBatida && <Loader2 className="h-4 w-4 animate-spin" />}
                Registrar Meta Batida
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          DIALOG: CONFIRMAR EXCLUSÃO
         ═══════════════════════════════════════════════════════════════════════ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowDeleteConfirm(null)}
          />
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-6 text-center">
              <div className="h-14 w-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-7 w-7 text-red-500" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-foreground mb-2">
                Excluir Meta?
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                Esta ação não pode ser desfeita. A meta e todos os registros de batida
                associados serão removidos permanentemente.
              </p>
            </div>
            <div className="flex items-center gap-3 px-6 py-4 border-t border-border">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-foreground/5 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteMeta(showDeleteConfirm)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-all shadow-sm"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
