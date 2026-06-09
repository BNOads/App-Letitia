import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  ChevronLeft,
  ChevronRight,
  Layers,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { fetchLiveSalesData, type LeadRecord } from "@/data/salesData";

// ─── TYPES ──────────────────────────────────────────────────────────────────
interface FaixaEscalonamento {
  min_vendas: number;
  bonus: number;
}

type Periodicidade = "diaria" | "semanal" | "mensal";

interface Meta {
  id: string;
  nome: string;
  produto_id: string;
  escalonamento: boolean;
  faixas: FaixaEscalonamento[];
  min_vendas: number;
  bonus: number;
  ativo: boolean;
  periodicidade: Periodicidade;
}

const PRODUTOS_MAP: Record<string, string> = {
  "plano-a": "Plano A",
  "voce-dirige": "Você Dirige",
  "the-way-anual": "THE WAY (Anual)",
  "the-way-semestral": "THE WAY (Sem.)",
  "estrategista": "Estrategista",
  "vcn": "VCN",
  "sessao-individual": "Sessão Individual",
  "bno-experience": "BNO Experience",
};

const PRODUCT_ID_TO_SALES_NAMES: Record<string, string[]> = {
  "plano-a": ["WORKSHOP PLANO A", "Workshop Plano A"],
  "voce-dirige": ["VOCÊ DIRIGE", "VOCÃ DIRIGE", "Você Dirige", "Curso Você Dirige"],
  "the-way-anual": ["THE WAY", "THE WAY Mentoria", "The Way"],
  "the-way-semestral": ["THE WAY", "THE WAY Mentoria", "The Way"],
  "estrategista": ["A Estrategista", "A ESTRATEGISTA", "Estrategista"],
  "vcn": ["VCN", "Vida, Carreira e Negócios"],
  "sessao-individual": ["Sessão Individual", "SESSÃO INDIVIDUAL"],
  "bno-experience": ["BNO Experience", "BNO EXPERIENCE", "BNO Experience 2026"],
};

const PERIOD_LABEL: Record<Periodicidade, string> = {
  diaria: "Hoje",
  semanal: "Semana",
  mensal: "Mês",
};

// ─── PROGRESS ───────────────────────────────────────────────────────────────
function calcProgress(meta: Meta, salesData: LeadRecord[]) {
  const names = PRODUCT_ID_TO_SALES_NAMES[meta.produto_id] || [];
  const now = new Date();

  const parseDate = (d: string) => {
    if (!d) return null;
    const p = d.split("/");
    if (p.length !== 3) return null;
    return new Date(parseInt(p[2], 10), parseInt(p[1], 10) - 1, parseInt(p[0], 10));
  };

  const inPeriod = (ds: string) => {
    const d = parseDate(ds);
    if (!d) return false;
    if (meta.periodicidade === "diaria") {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    }
    if (meta.periodicidade === "semanal") {
      const dow = now.getDay();
      const off = dow === 0 ? -6 : 1 - dow;
      const mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() + off);
      mon.setHours(0, 0, 0, 0);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      sun.setHours(23, 59, 59, 999);
      return d >= mon && d <= sun;
    }
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  };

  const sold = salesData.filter((l) => {
    if (l.resultado !== "Venda Ganha") return false;
    if (!inPeriod(l.dataEntrada)) return false;
    if (names.length === 0) return false;
    return names.some((n) => n.toLowerCase() === (l.produto || "").trim().toLowerCase());
  }).length;

  const target = meta.escalonamento && meta.faixas?.length
    ? Math.max(...meta.faixas.map((f) => f.min_vendas))
    : meta.min_vendas || 1;

  // Max bonus for this meta
  let maxBonus = 0;
  if (meta.escalonamento && meta.faixas?.length) {
    maxBonus = Math.max(...meta.faixas.map((f) => f.bonus));
  } else {
    maxBonus = Number(meta.bonus) || 0;
  }

  return { sold, target, pct: Math.min(100, target > 0 ? (sold / target) * 100 : 0), maxBonus };
}

function fmtCurrency(v: number) {
  if (v >= 1000) return `R$${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`;
  return `R$${v.toFixed(0)}`;
}

// ─── COMPONENT ──────────────────────────────────────────────────────────────
export function SidebarMetasCarousel() {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [salesData, setSalesData] = useState<LeadRecord[]>([]);
  const [idx, setIdx] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [mr, ld] = await Promise.all([
          supabase.from("metas").select("*").eq("ativo", true).order("created_at", { ascending: false }),
          fetchLiveSalesData().catch(() => [] as LeadRecord[]),
        ]);
        if (mr.data) setMetas(mr.data);
        setSalesData(ld);
      } catch { /* silent */ } finally {
        setReady(true);
      }
    })();
  }, []);

  const prev = useCallback(() => setIdx((i) => (i === 0 ? metas.length - 1 : i - 1)), [metas.length]);
  const next = useCallback(() => setIdx((i) => (i === metas.length - 1 ? 0 : i + 1)), [metas.length]);

  if (!ready || metas.length === 0) return null;

  const meta = metas[idx];
  const p = calcProgress(meta, salesData);
  const remaining = Math.max(0, p.target - p.sold);
  const prodName = PRODUTOS_MAP[meta.produto_id] || meta.produto_id;
  const periodLabel = PERIOD_LABEL[meta.periodicidade || "mensal"];

  const barColor = p.pct >= 100 ? "bg-emerald-500" : p.pct > 0 ? "bg-amber-500" : "bg-gray-300";

  return (
    <div className="px-1 pb-2">
      <div className="rounded-xl bg-gradient-to-br from-amber-50/90 to-orange-50/50 border border-amber-200/50 px-3 py-2 shadow-sm">
        {/* Row 1: Header */}
        <div className="flex items-center gap-1.5 mb-1">
          <Trophy className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-700 truncate flex-1">
            {meta.nome}
          </span>
          {meta.escalonamento && (
            <Layers className="h-3 w-3 text-emerald-600 flex-shrink-0" title="Escalonada" />
          )}
        </div>

        {/* Row 2: Key info — what you can earn */}
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-[13px] font-bold text-emerald-700">{fmtCurrency(p.maxBonus)}</span>
          <span className="text-[9px] text-muted">de bônus</span>
          <span className="text-[9px] text-muted ml-auto">{prodName} · {periodLabel}</span>
        </div>

        {/* Row 3: Progress bar */}
        <div className="mb-1">
          <div className="w-full bg-foreground/5 rounded-full h-1.5 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-700 ease-out", barColor)}
              style={{ width: `${Math.max(p.pct, 3)}%` }}
            />
          </div>
        </div>

        {/* Row 4: Status text */}
        <div className="flex items-center justify-between mb-1.5">
          <span className={cn(
            "text-[9px] font-bold",
            p.pct >= 100 ? "text-emerald-600" : p.pct > 0 ? "text-amber-600" : "text-muted"
          )}>
            {p.pct >= 100 ? "✓ Meta batida!" : remaining > 0 ? `Faltam ${remaining} venda${remaining !== 1 ? "s" : ""}` : "Sem vendas"}
          </span>
          <span className="text-[9px] font-bold text-muted">{p.sold}/{p.target}</span>
        </div>

        {/* Row 5: Footer */}
        <div className="flex items-center justify-between">
          <Link
            to="/comissoes?tab=metas"
            className="text-[9px] font-bold text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-0.5"
          >
            Ver metas <ArrowRight className="h-2.5 w-2.5" />
          </Link>
          {metas.length > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={prev} className="h-4 w-4 rounded-full bg-white/80 border border-border/50 flex items-center justify-center text-muted hover:text-foreground transition-all">
                <ChevronLeft className="h-2.5 w-2.5" />
              </button>
              <div className="flex items-center gap-0.5">
                {metas.map((_, i) => (
                  <button key={i} onClick={() => setIdx(i)} className={cn("rounded-full transition-all", i === idx ? "h-1.5 w-3.5 bg-amber-500" : "h-1.5 w-1.5 bg-foreground/15")} />
                ))}
              </div>
              <button onClick={next} className="h-4 w-4 rounded-full bg-white/80 border border-border/50 flex items-center justify-center text-muted hover:text-foreground transition-all">
                <ChevronRight className="h-2.5 w-2.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
