import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Calculator,
  Percent,
  DollarSign,
  TrendingUp,
  Shield,
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles,
  ArrowRight,
  ShoppingBag,
  Zap,
  Target,
  Plus,
  Pencil,
  Trash2,
  X,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { MetasTab } from "@/components/MetasTab";
import { PlaybookRecebimentoTab } from "@/components/PlaybookRecebimentoTab";

// ─── PRODUTO CATALOG (extraído dos documentos da Letitia) ──────────────────
interface Produto {
  id: string;
  nome: string;
  valor: number;
  descricao: string;
  categoria: "curso" | "mentoria" | "sessao" | "workshop";
  emoji: string;
}

const PRODUTOS_INICIAIS: Produto[] = [
  {
    id: "plano-a",
    nome: "Workshop Plano A",
    valor: 97.0,
    descricao: "Porta de entrada paga — workshop prático",
    categoria: "workshop",
    emoji: "📋",
  },
  {
    id: "voce-dirige",
    nome: "Curso Você Dirige",
    valor: 970.0,
    descricao: "Produto intermediário — curso completo",
    categoria: "curso",
    emoji: "🚗",
  },
  {
    id: "the-way-anual",
    nome: "THE WAY Mentoria (Anual)",
    valor: 80000.0,
    descricao: "Mentoria anual premium — programa exclusivo",
    categoria: "mentoria",
    emoji: "✦",
  },
  {
    id: "the-way-semestral",
    nome: "THE WAY Mentoria (Semestral)",
    valor: 45000.0,
    descricao: "Downsell — 6 meses com entregas quinzenais e 1 encontro presencial",
    categoria: "mentoria",
    emoji: "✦",
  },
  {
    id: "estrategista",
    nome: "A Estrategista (Gravado)",
    valor: 2000.0,
    descricao: "Curso gravado de estratégia de vida e negócios",
    categoria: "curso",
    emoji: "🎯",
  },
  {
    id: "vcn",
    nome: "Vida, Carreira e Negócios (VCN)",
    valor: 20000.0,
    descricao: "Programa completo de transformação — vida, carreira e negócios",
    categoria: "mentoria",
    emoji: "🏅",
  },
  {
    id: "sessao-individual",
    nome: "Sessão Individual",
    valor: 5000.0,
    descricao: "Sessão estratégica individual com Letícia",
    categoria: "sessao",
    emoji: "💡",
  },
];

// ─── FAIXAS DE COMISSÃO (Faixa 1+2 mescladas em 15%) ───────────────────────
interface FaixaComissao {
  id: number;
  nome: string;
  percentual: number;
  valorMin: number;
  valorMax: number;
  icon: string;
  cor: string;
}

const FAIXAS: FaixaComissao[] = [
  {
    id: 1,
    nome: "FAIXA 1",
    percentual: 15,
    valorMin: 0,
    valorMax: 500,
    icon: "⚡",
    cor: "#C4A47C",
  },
  {
    id: 2,
    nome: "FAIXA 2",
    percentual: 10,
    valorMin: 501,
    valorMax: 1000,
    icon: "🎯",
    cor: "#A88B63",
  },
  {
    id: 3,
    nome: "FAIXA 3",
    percentual: 7.5,
    valorMin: 1001,
    valorMax: 2000,
    icon: "💰",
    cor: "#8A8275",
  },
  {
    id: 4,
    nome: "FAIXA 4",
    percentual: 5,
    valorMin: 2000,
    valorMax: Infinity,
    icon: "🏆",
    cor: "#5C564D",
  },
];

// ─── COMISSÃO THE WAY (regras especiais da Mônica) ──────────────────────────
interface TheWayComissao {
  tipo: string;
  descricao: string;
  valor: string;
}

const THEWAY_COMISSOES: TheWayComissao[] = [
  {
    tipo: "Lead qualificado + venda pela Letícia",
    descricao: "Mônica qualifica o lead, Letícia fecha a venda",
    valor: "R$ 500,00 por venda",
  },
  {
    tipo: "Venda direta — à vista",
    descricao: "Pagamento integral à vista",
    valor: "3%",
  },
  {
    tipo: "Venda direta — entrada + 3 parcelas",
    descricao: "Pagamento parcelado em até 3x",
    valor: "2,5%",
  },
  {
    tipo: "Venda direta — entrada + 4+ parcelas",
    descricao: "Pagamento parcelado em 4x ou mais",
    valor: "2%",
  },
];

// ─── CÁLCULO DE COMISSÃO COM PISO GARANTIDO ─────────────────────────────────
function calcularComissao(valorVenda: number): {
  percentualEfetivo: number;
  comissao: number;
  faixaAtual: FaixaComissao;
  usouPiso: boolean;
  pisoValor: number;
} {
  // Encontrar a faixa correspondente
  let faixaAtual = FAIXAS[0];
  for (const faixa of FAIXAS) {
    if (valorVenda >= faixa.valorMin && valorVenda <= faixa.valorMax) {
      faixaAtual = faixa;
      break;
    }
    if (valorVenda > faixa.valorMax) {
      faixaAtual = faixa;
    }
  }

  // Encontrar a faixa real
  for (const faixa of FAIXAS) {
    if (valorVenda >= faixa.valorMin && valorVenda <= faixa.valorMax) {
      faixaAtual = faixa;
      break;
    }
  }

  const comissaoCalculada = valorVenda * (faixaAtual.percentual / 100);

  // Calcular piso garantido (comissão no topo da faixa anterior)
  let pisoValor = 0;
  const faixaIndex = FAIXAS.findIndex((f) => f.id === faixaAtual.id);
  if (faixaIndex > 0) {
    const faixaAnterior = FAIXAS[faixaIndex - 1];
    pisoValor = faixaAnterior.valorMax * (faixaAnterior.percentual / 100);
  }

  const usouPiso = pisoValor > 0 && comissaoCalculada < pisoValor;
  const comissaoFinal = usouPiso ? pisoValor : comissaoCalculada;
  const percentualEfetivo = valorVenda > 0 ? (comissaoFinal / valorVenda) * 100 : 0;

  return {
    percentualEfetivo,
    comissao: comissaoFinal,
    faixaAtual,
    usouPiso,
    pisoValor,
  };
}

// ─── COMPONENTE PRINCIPAL ───────────────────────────────────────────────────
export function Comissoes() {
  // States
  const [produtos, setProdutos] = useState<Produto[]>(() => {
    const saved = localStorage.getItem("@letitia:produtos");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return PRODUTOS_INICIAIS;
      }
    }
    return PRODUTOS_INICIAIS;
  });

  useEffect(() => {
    localStorage.setItem("@letitia:produtos", JSON.stringify(produtos));
  }, [produtos]);

  const [isProdutoModalOpen, setIsProdutoModalOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [prodForm, setProdForm] = useState<Partial<Produto>>({});

  const handleOpenAddProduto = () => {
    setEditingProduto(null);
    setProdForm({ categoria: "curso", emoji: "📦" });
    setIsProdutoModalOpen(true);
  };

  const handleOpenEditProduto = (p: Produto, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProduto(p);
    setProdForm(p);
    setIsProdutoModalOpen(true);
  };

  const handleDeleteProduto = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Deseja realmente excluir este produto?")) {
      setProdutos(prev => prev.filter(p => p.id !== id));
      if (produtoSelecionado === id) {
        setProdutoSelecionado("");
        setValorVenda("");
      }
    }
  };

  const handleSaveProduto = () => {
    if (!prodForm.nome || !prodForm.valor) return;
    
    const novoProduto: Produto = {
      id: editingProduto ? editingProduto.id : (prodForm.id || prodForm.nome.toLowerCase().replace(/\s+/g, '-')),
      nome: prodForm.nome || "",
      valor: Number(prodForm.valor) || 0,
      descricao: prodForm.descricao || "",
      categoria: (prodForm.categoria as any) || "curso",
      emoji: prodForm.emoji || "📦",
    };

    if (editingProduto) {
      setProdutos(prev => prev.map(p => p.id === editingProduto.id ? novoProduto : p));
      if (produtoSelecionado === editingProduto.id) {
         setValorVenda(novoProduto.valor.toFixed(2).replace(".", ","));
      }
    } else {
      setProdutos(prev => [...prev, novoProduto]);
    }
    setIsProdutoModalOpen(false);
  };

  const [valorVenda, setValorVenda] = useState<string>("");
  const [produtoSelecionado, setProdutoSelecionado] = useState<string>("");
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showTheWay, setShowTheWay] = useState(false);
  const [animateResult, setAnimateResult] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"comissoes" | "metas" | "playbook">(() => {
    const t = searchParams.get("tab");
    if (t === "metas") return "metas";
    if (t === "playbook") return "playbook";
    return "comissoes";
  });

  const handleTabChange = (tab: "comissoes" | "metas" | "playbook") => {
    setActiveTab(tab);
    setSearchParams(tab === "comissoes" ? {} : { tab }, { replace: true });
  };

  // Valor numérico parseado
  const valorNumerico = useMemo(() => {
    const cleaned = valorVenda.replace(/[^\d.,]/g, "").replace(",", ".");
    return parseFloat(cleaned) || 0;
  }, [valorVenda]);

  // Resultado da comissão
  const resultado = useMemo(() => {
    if (valorNumerico <= 0) return null;
    return calcularComissao(valorNumerico);
  }, [valorNumerico]);

  // Quando um produto é selecionado, preenche o valor
  const handleProdutoSelect = (produtoId: string) => {
    setProdutoSelecionado(produtoId);
    const produto = produtos.find((p) => p.id === produtoId);
    if (produto) {
      setValorVenda(produto.valor.toFixed(2).replace(".", ","));
      setAnimateResult(true);
      setTimeout(() => setAnimateResult(false), 600);
    }
  };

  // Quando digita valor manualmente
  const handleValorChange = (val: string) => {
    setValorVenda(val);
    setProdutoSelecionado("");
    setAnimateResult(true);
    setTimeout(() => setAnimateResult(false), 600);
  };

  // Tabela de exemplo de comissões por valor
  const exemploValores = [200, 500, 501, 1000, 1001, 2000, 2001, 3000, 5000];



  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* ─── TAB NAVIGATION ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-border">
        <button
          onClick={() => handleTabChange("comissoes")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-[1px]",
            activeTab === "comissoes"
              ? "border-letitia-gold text-foreground"
              : "border-transparent text-muted hover:text-foreground hover:border-border"
          )}
        >
          <Percent className="h-4 w-4" />
          Comissões
        </button>
        <button
          onClick={() => handleTabChange("metas")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-[1px]",
            activeTab === "metas"
              ? "border-letitia-gold text-foreground"
              : "border-transparent text-muted hover:text-foreground hover:border-border"
          )}
        >
          <Target className="h-4 w-4" />
          Metas
        </button>
        <button
          onClick={() => handleTabChange("playbook")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-[1px]",
            activeTab === "playbook"
              ? "border-letitia-gold text-foreground"
              : "border-transparent text-muted hover:text-foreground hover:border-border"
          )}
        >
          <BookOpen className="h-4 w-4" />
          Playbook
        </button>
      </div>

      {/* ─── TAB CONTENT ─────────────────────────────────────────────────── */}
      {activeTab === "metas" ? (
        <MetasTab />
      ) : activeTab === "playbook" ? (
        <PlaybookRecebimentoTab />
      ) : (
        <div className="space-y-6">
      {/* ─── HEADER ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-[#7c3aed] via-[#8b5cf6] to-[#a78bfa] p-6 md:p-8 shadow-lg">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="absolute -left-4 -bottom-4 h-32 w-32 rounded-full bg-white/5" />
          <span className="absolute right-8 bottom-6 text-[120px] font-bold text-white/5 leading-none select-none hidden md:block">%</span>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-11 w-11 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
              <Percent className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-2xl md:text-3xl font-semibold text-white tracking-tight">
                Tabela de Comissionamento
              </h1>
              <p className="text-white/70 text-sm mt-0.5">
                Comissão por faixa de valor com piso garantido
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-[11px] font-semibold backdrop-blur-sm">
              <Zap className="h-3 w-3" /> Automático ao associar venda
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-[11px] font-semibold backdrop-blur-sm">
              <Sparkles className="h-3 w-3" /> Vender mais sempre rende mais
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-[11px] font-semibold backdrop-blur-sm">
              <Shield className="h-3 w-3" /> Piso garante que a comissão nunca cai
            </span>
          </div>
        </div>
      </div>

      {/* ─── FAIXAS DE COMISSÃO ──────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <Info className="h-4 w-4 text-muted" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted">
            Faixas de Comissão
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FAIXAS.map((faixa) => (
            <div
              key={faixa.id}
              className="group relative rounded-xl border border-border bg-background p-5 hover:border-letitia-gold/30 transition-all hover:shadow-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{faixa.icon}</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                    {faixa.nome}
                  </p>
                  <p className="text-[10px] text-muted">
                    {faixa.valorMax === Infinity
                      ? `A partir de R$ ${faixa.valorMin.toLocaleString("pt-BR")}`
                      : `R$ ${faixa.valorMin.toLocaleString("pt-BR")} a R$ ${faixa.valorMax.toLocaleString("pt-BR")}`}
                  </p>
                </div>
              </div>
              <p className="font-serif text-4xl font-medium text-foreground">
                {faixa.percentual}
                <span className="text-lg text-muted ml-0.5">%</span>
              </p>
              <p className="text-[10px] text-muted mt-2">
                {faixa.valorMax === Infinity
                  ? `Vendas a partir de R$ ${faixa.valorMin.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                  : `Vendas de R$ ${faixa.valorMin.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} até R$ ${faixa.valorMax.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              </p>
              {/* Decorative bar */}
              <div
                className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl opacity-30 group-hover:opacity-60 transition-opacity"
                style={{ backgroundColor: faixa.cor }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ─── SELEÇÃO DE PRODUTO ──────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-muted" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted">
              Produtos da Letitia
            </h3>
          </div>
          <button 
            onClick={handleOpenAddProduto}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-letitia-gold text-white text-xs font-semibold hover:bg-letitia-gold/90 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Novo Produto
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {produtos.map((produto) => {
            const isSelected = produtoSelecionado === produto.id;
            const comissaoProd = calcularComissao(produto.valor);
            return (
              <button
                key={produto.id}
                onClick={() => handleProdutoSelect(produto.id)}
                className={cn(
                  "relative text-left rounded-xl border p-4 transition-all group",
                  isSelected
                    ? "border-letitia-gold bg-letitia-gold/5 shadow-sm ring-1 ring-letitia-gold/20"
                    : "border-border bg-background hover:border-letitia-gold/30 hover:bg-background/80"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xl">{produto.emoji}</span>
                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <span className="px-1.5 py-0.5 rounded bg-letitia-gold/20 text-letitia-gold text-[8px] font-bold uppercase tracking-wider">
                        Selecionado
                      </span>
                    )}
                    <button
                      onClick={(e) => handleOpenEditProduto(produto, e)}
                      className="p-1 text-muted hover:text-foreground transition-colors"
                      title="Editar"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteProduto(produto.id, e)}
                      className="p-1 text-muted hover:text-red-500 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <p className="text-sm font-medium text-foreground leading-tight mb-1">
                  {produto.nome}
                </p>
                <p className="font-serif text-lg font-medium text-foreground">
                  R$ {produto.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-muted mt-1 line-clamp-2">
                  {produto.descricao}
                </p>
                <div className="mt-3 pt-2 border-t border-border/50">
                  <p className="text-[9px] text-muted uppercase tracking-widest">Comissão</p>
                  <p className="text-sm font-semibold text-letitia-gold">
                    R$ {comissaoProd.comissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    <span className="text-[10px] text-muted font-normal ml-1">
                      ({comissaoProd.percentualEfetivo.toFixed(1)}%)
                    </span>
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── SIMULADOR DE COMISSÃO ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Input side */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Calculator className="h-4 w-4 text-muted" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted">
              Simulador de Comissão
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-2">
                Valor da Venda (R$)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  type="text"
                  value={valorVenda}
                  onChange={(e) => handleValorChange(e.target.value)}
                  placeholder="Ex: 2500"
                  className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-3 text-lg font-medium text-foreground focus:ring-2 focus:ring-letitia-gold/30 focus:border-letitia-gold focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Quick values */}
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted mb-2">
                Valores rápidos
              </p>
              <div className="flex flex-wrap gap-2">
                {[100, 500, 1000, 2000, 3000, 5000].map((val) => (
                  <button
                    key={val}
                    onClick={() => handleValorChange(String(val))}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-medium border transition-all",
                      valorNumerico === val
                        ? "bg-letitia-gold/10 border-letitia-gold/30 text-foreground"
                        : "border-border bg-background text-muted hover:text-foreground hover:border-letitia-gold/20"
                    )}
                  >
                    R$ {val.toLocaleString("pt-BR")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Result side */}
        <div className="lg:col-span-3 rounded-xl border border-border bg-card p-6 shadow-sm">
          {resultado ? (
            <div className={cn("space-y-5", animateResult && "animate-in fade-in slide-in-from-bottom-2 duration-300")}>
              {/* Main result */}
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">
                    Comissão Calculada
                  </p>
                  <p className="font-serif text-4xl md:text-5xl font-medium text-foreground">
                    R${" "}
                    {resultado.comissao.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-center px-4 py-2 rounded-lg bg-background border border-border">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted">Faixa</p>
                    <p className="text-sm font-semibold text-foreground">{resultado.faixaAtual.nome}</p>
                  </div>
                  <div className="text-center px-4 py-2 rounded-lg bg-background border border-border">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted">Percentual</p>
                    <p className="text-sm font-semibold text-foreground">
                      {resultado.percentualEfetivo.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Piso indicator */}
              {resultado.usouPiso && (
                <div className="flex items-center gap-3 rounded-lg bg-orange-50 border border-orange-200/50 px-4 py-3">
                  <Shield className="h-5 w-5 text-orange-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-orange-800">
                      Piso Garantido Ativado
                    </p>
                    <p className="text-[11px] text-orange-600">
                      O cálculo flat de {resultado.faixaAtual.percentual}% resultaria em R${" "}
                      {(valorNumerico * (resultado.faixaAtual.percentual / 100)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}, mas o piso de R${" "}
                      {resultado.pisoValor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} garante que a comissão nunca cai.
                    </p>
                  </div>
                </div>
              )}

              {/* Visual faixa indicator */}
              <div className="space-y-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted">
                  Posição na escala
                </p>
                <div className="flex gap-1">
                  {FAIXAS.map((faixa) => {
                    const isActive = faixa.id === resultado.faixaAtual.id;
                    return (
                      <div
                        key={faixa.id}
                        className={cn(
                          "flex-1 h-2 rounded-full transition-all",
                          isActive ? "opacity-100" : "opacity-20"
                        )}
                        style={{ backgroundColor: faixa.cor }}
                        title={`${faixa.nome}: ${faixa.percentual}%`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between text-[9px] text-muted">
                  <span>15%</span>
                  <span>10%</span>
                  <span>7.5%</span>
                  <span>5%</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
              <div className="h-16 w-16 rounded-full bg-letitia-gold/10 flex items-center justify-center mb-4">
                <Calculator className="h-6 w-6 text-letitia-gold" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Insira um valor ou selecione um produto
              </p>
              <p className="text-xs text-muted mt-1">
                O simulador calculará a comissão com piso garantido automaticamente
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─── COMO FUNCIONA ────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <button
          onClick={() => setShowHowItWorks(!showHowItWorks)}
          className="w-full flex items-center justify-between p-6 hover:bg-foreground/[0.02] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-muted" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted">
              Como Funciona
            </h3>
          </div>
          {showHowItWorks ? (
            <ChevronUp className="h-4 w-4 text-muted" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted" />
          )}
        </button>

        {showHowItWorks && (
          <div className="px-6 pb-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* O que é o piso garantido */}
            <div className="rounded-lg bg-violet-50/50 border border-violet-200/30 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-4 w-4 text-violet-600" />
                <p className="text-xs font-bold text-violet-800">
                  O que é o piso garantido?
                </p>
              </div>
              <p className="text-xs text-violet-700 leading-relaxed">
                Ao trocar de faixa, a comissão no percentual novo pode ser menor que a comissão no topo da faixa anterior. O <strong>piso garantido</strong> impede essa queda: se o cálculo flat resultar em valor menor que o topo da faixa anterior, a comissão é mantida no valor do piso até que o percentual da nova faixa supere naturalmente.
              </p>
            </div>

            {/* Exemplo de transição */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-3">
                  Exemplo: Transição R$ 500 → R$ 501
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted">R$ 500 × 15%</span>
                    <span className="font-semibold text-letitia-gold">= R$ 75,00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">R$ 501 × 10%</span>
                    <span className="font-semibold text-muted line-through">= R$ 50,10</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2">
                    <span className="text-muted">R$ 501 com piso</span>
                    <span className="font-bold text-orange-600 flex items-center gap-1">
                      <Shield className="h-3 w-3" /> R$ 75,00
                    </span>
                  </div>
                  <p className="text-[10px] text-muted italic mt-1">
                    O piso de R$ 75 se mantém até R$ 750 (quando 10% × 750 = R$ 75)
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-background p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-3">
                  Comissão nunca cai ✓
                </p>
                <div className="space-y-1.5 text-xs">
                  {exemploValores.map((val) => {
                    const res = calcularComissao(val);
                    return (
                      <div key={val} className="flex items-center justify-between">
                        <span className="text-muted">
                          R$ {val.toLocaleString("pt-BR")}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <ArrowRight className="h-3 w-3 text-muted" />
                          <span
                            className={cn(
                              "font-semibold",
                              res.usouPiso ? "text-orange-600" : "text-foreground"
                            )}
                          >
                            R$ {res.comissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                          {res.usouPiso && <Shield className="h-3 w-3 text-orange-500" />}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  step: 1,
                  title: "Vendedor associa a venda",
                  desc: "Ao cadastrar ou associar uma venda, o vendedor informa o valor total do produto.",
                },
                {
                  step: 2,
                  title: "Comissão é calculada com piso",
                  desc: "O sistema aplica o percentual da faixa correspondente, garantindo que nunca fique abaixo do piso.",
                },
                {
                  step: 3,
                  title: "Parcelas e comissões são geradas",
                  desc: "As parcelas da venda e as respectivas comissões são criadas com o percentual efetivo.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="rounded-lg border border-border bg-background p-4 flex items-start gap-3"
                >
                  <div className="h-8 w-8 rounded-full bg-letitia-gold/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-letitia-gold">
                      {item.step}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-muted mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── COMISSÕES THE WAY (regras especiais) ─────────────────────────── */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <button
          onClick={() => setShowTheWay(!showTheWay)}
          className="w-full flex items-center justify-between p-6 hover:bg-foreground/[0.02] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted">
              Comissões THE WAY — Regras Especiais
            </h3>
            <span className="px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 text-[8px] font-bold uppercase tracking-wider">
              Mentoria
            </span>
          </div>
          {showTheWay ? (
            <ChevronUp className="h-4 w-4 text-muted" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted" />
          )}
        </button>

        {showTheWay && (
          <div className="px-6 pb-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="rounded-lg bg-letitia-gold/5 border border-letitia-gold/20 p-4">
              <p className="text-xs text-muted leading-relaxed">
                As comissões do produto <strong>THE WAY Mentoria</strong> seguem regras especiais, diferenciando entre lead qualificado (venda pela Letícia) e venda direta. Comissão sobre <strong>Cash Collect</strong> — pagamento no mês seguinte ao efetivamento pelo cliente.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {THEWAY_COMISSOES.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-border bg-background p-4 hover:border-letitia-gold/20 transition-all"
                >
                  <p className="text-xs font-semibold text-foreground mb-1">
                    {item.tipo}
                  </p>
                  <p className="text-[10px] text-muted mb-2">{item.descricao}</p>
                  <p className="text-lg font-serif font-medium text-letitia-gold">
                    {item.valor}
                  </p>
                </div>
              ))}
            </div>

            <div className="text-[10px] text-muted italic border-t border-border pt-3">
              <p>
                <strong>Fixo da Mônica:</strong> R$ 2.000,00 + comissão de 10% sobre vendas de Você Dirige e demais produtos menores.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ─── TABELA COMPLETA DE SIMULAÇÃO ─────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="h-4 w-4 text-muted" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted">
            Tabela Completa de Simulação por Produto
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted text-left">
                  Produto
                </th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted text-right">
                  Valor
                </th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted text-center">
                  Faixa
                </th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted text-center">
                  % Efetivo
                </th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted text-right">
                  Comissão
                </th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted text-center hidden sm:table-cell">
                  Piso
                </th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((produto) => {
                const res = calcularComissao(produto.valor);
                return (
                  <tr
                    key={produto.id}
                    className="border-b border-border/50 last:border-0 hover:bg-background/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{produto.emoji}</span>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {produto.nome}
                          </p>
                          <p className="text-[10px] text-muted hidden md:block">
                            {produto.descricao}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-foreground whitespace-nowrap">
                      R$ {produto.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-foreground/5 text-[10px] font-semibold text-foreground">
                        {res.faixaAtual.nome}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-foreground">
                      {res.percentualEfetivo.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right font-serif text-base font-medium text-letitia-gold whitespace-nowrap">
                      R$ {res.comissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      {res.usouPiso ? (
                        <Shield className="h-4 w-4 text-orange-500 mx-auto" />
                      ) : (
                        <span className="text-[10px] text-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
        </div>
      )}

      {/* ─── MODAL DE PRODUTO ────────────────────────────────────────────── */}
      {isProdutoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                {editingProduto ? "Editar Produto" : "Novo Produto"}
              </h2>
              <button
                onClick={() => setIsProdutoModalOpen(false)}
                className="p-2 text-muted hover:text-foreground rounded-lg hover:bg-foreground/5 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Nome do Produto
                </label>
                <input
                  type="text"
                  value={prodForm.nome || ""}
                  onChange={(e) => setProdForm({ ...prodForm, nome: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-letitia-gold/30 focus:border-letitia-gold"
                  placeholder="Ex: Mentoria VIP"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={prodForm.valor || ""}
                    onChange={(e) => setProdForm({ ...prodForm, valor: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-letitia-gold/30 focus:border-letitia-gold"
                    placeholder="Ex: 997.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Emoji
                  </label>
                  <input
                    type="text"
                    value={prodForm.emoji || ""}
                    onChange={(e) => setProdForm({ ...prodForm, emoji: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-letitia-gold/30 focus:border-letitia-gold"
                    placeholder="Ex: 🚀"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Categoria
                </label>
                <select
                  value={prodForm.categoria || "curso"}
                  onChange={(e) => setProdForm({ ...prodForm, categoria: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-letitia-gold/30 focus:border-letitia-gold"
                >
                  <option value="curso">Curso</option>
                  <option value="mentoria">Mentoria</option>
                  <option value="sessao">Sessão</option>
                  <option value="workshop">Workshop</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Descrição Breve
                </label>
                <textarea
                  value={prodForm.descricao || ""}
                  onChange={(e) => setProdForm({ ...prodForm, descricao: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-letitia-gold/30 focus:border-letitia-gold resize-none"
                  rows={2}
                  placeholder="Ex: Produto de entrada focado em..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-5 border-t border-border bg-muted/20">
              <button
                onClick={() => setIsProdutoModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-muted hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProduto}
                disabled={!prodForm.nome || !prodForm.valor}
                className="px-4 py-2 rounded-lg bg-letitia-gold text-white text-sm font-semibold hover:bg-letitia-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
