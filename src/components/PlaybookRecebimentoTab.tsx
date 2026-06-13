import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Shield,
  Info,
  Sparkles,
  Zap,
  Target,
  CreditCard,
  Banknote,
  ArrowDown,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Crown,
  BookOpen,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── DADOS DOS PRODUTOS (Playbook) ─────────────────────────────────────────
interface ProdutoPlaybook {
  nome: string;
  valor: number;
  tipo: "high" | "low";
  cartao: number;
  entrada: number;
  restante: number;
  parc10: number;
}

const PRODUTOS_PLAYBOOK: ProdutoPlaybook[] = [
  { nome: "THE WAY Anual", valor: 80000, tipo: "high", cartao: 6667, entrada: 40000, restante: 40000, parc10: 4000 },
  { nome: "THE WAY Semestral", valor: 45000, tipo: "high", cartao: 3750, entrada: 22500, restante: 22500, parc10: 2250 },
  { nome: "THE WAY Trimestral", valor: 30000, tipo: "high", cartao: 2500, entrada: 15000, restante: 15000, parc10: 1500 },
  { nome: "VCN — Vida, Carreira e Negócios", valor: 20000, tipo: "high", cartao: 1667, entrada: 10000, restante: 10000, parc10: 1000 },
  { nome: "Sessão Individual", valor: 5000, tipo: "low", cartao: 417, entrada: 2500, restante: 2500, parc10: 250 },
  { nome: "A Estrategista (Gravado)", valor: 2000, tipo: "low", cartao: 167, entrada: 1000, restante: 1000, parc10: 100 },
  { nome: "Curso Você Dirige", valor: 970, tipo: "low", cartao: 81, entrada: 485, restante: 485, parc10: 48 },
  { nome: "Workshop Plano A", valor: 97, tipo: "low", cartao: 8, entrada: 48, restante: 49, parc10: 5 },
];

const brl = (n: number) => "R$ " + n.toLocaleString("pt-BR");

// ─── SEÇÕES COLAPSÁVEIS ─────────────────────────────────────────────────────
function Section({
  id,
  eyebrow,
  title,
  children,
  defaultOpen = true,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section id={id} className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 md:p-6 hover:bg-foreground/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3 text-left">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-letitia-gold">{eyebrow}</p>
            <h2 className="font-serif text-lg md:text-xl font-semibold text-foreground mt-0.5">{title}</h2>
          </div>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-5 md:px-6 pb-5 md:pb-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </section>
  );
}

// ─── NOTE BOX ────────────────────────────────────────────────────────────────
function NoteBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-letitia-gold/5 border border-letitia-gold/20 px-4 py-3">
      <p className="text-xs text-muted leading-relaxed">{children}</p>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ───────────────────────────────────────────────────
export function PlaybookRecebimentoTab() {
  const [selectedProduct, setSelectedProduct] = useState(0);

  const produto = useMemo(() => PRODUTOS_PLAYBOOK[selectedProduct], [selectedProduct]);
  const isHigh = produto.tipo === "high";

  return (
    <div className="space-y-5">
      {/* ─── HERO HEADER ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-[#8E1B1B] via-[#7A1717] to-[#6E1212] p-6 md:p-8 shadow-lg">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="absolute -left-4 -bottom-4 h-32 w-32 rounded-full bg-white/5" />
          <span className="absolute right-8 bottom-6 text-[100px] font-bold text-white/5 leading-none select-none hidden md:block font-serif">$</span>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-11 w-11 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-2xl md:text-3xl font-semibold text-white tracking-tight">
                Playbook de Recebimento
              </h1>
              <p className="text-white/70 text-sm mt-0.5">
                Fluxo ideal do Closer — formas de pagamento, coleta e parcelamento inteligente
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-[11px] font-semibold backdrop-blur-sm">
              <Zap className="h-3 w-3" /> Maximize o cash collected
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-[11px] font-semibold backdrop-blur-sm">
              <Shield className="h-3 w-3" /> Confidencial · Uso interno
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-[11px] font-semibold backdrop-blur-sm">
              <Sparkles className="h-3 w-3" /> Time comercial Letícia
            </span>
          </div>
        </div>
      </div>

      {/* ─── OBJETIVO ─────────────────────────────────────────────────── */}
      <Section id="pb-objetivo" eyebrow="Princípio" title="O objetivo é maximizar o cash collected.">
        <p className="text-sm text-muted leading-relaxed">
          Sempre ofereça na ordem definida. <strong className="text-foreground">Cada opção tem melhor caixa imediato que a seguinte.</strong> O closer não pergunta "como você quer pagar?" — ele <em>conduz</em> pela escada, do melhor recebimento para o último recurso.
        </p>
        <NoteBox>
          <strong className="text-foreground">Vale para os produtos high-ticket</strong> (THE WAY Anual, Semestral, Trimestral, VCN). Produtos de entrada — Sessão Individual, A Estrategista, Você Dirige, Workshop — são à vista direto (Pix ou cartão), sem escada de parcelamento.
        </NoteBox>
      </Section>

      {/* ─── SIMULADOR ────────────────────────────────────────────────── */}
      <Section id="pb-simulador" eyebrow="Escolha o produto" title="Formas de pagamento por produto.">
        <p className="text-sm text-muted leading-relaxed mb-4">
          Selecione o produto e veja na hora as condições daquele valor — Pix à vista, cartão e entrada + parcelas.
        </p>

        <div className="rounded-xl border border-border bg-background p-5 space-y-5">
          {/* Select */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-2">
              Produto
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-base font-serif font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-letitia-gold/30 focus:border-letitia-gold"
            >
              {PRODUTOS_PLAYBOOK.map((p, i) => (
                <option key={i} value={i}>
                  {p.nome} — {brl(p.valor)}
                </option>
              ))}
            </select>
          </div>

          {/* Resultado */}
          <div className="space-y-4">
            {/* Valor e tipo */}
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="font-serif text-3xl md:text-4xl font-medium text-foreground">{brl(produto.valor)}</span>
              <span
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  isHigh
                    ? "bg-red-50 text-[#8E1B1B]"
                    : "bg-emerald-50 text-emerald-700"
                )}
              >
                {isHigh ? "High-ticket · escada completa" : "Produto de entrada · à vista direto"}
              </span>
            </div>

            {/* Formas de pagamento */}
            <div className="flex flex-col gap-3">
              {/* 1 - Pix */}
              <div className="flex items-stretch rounded-xl border border-letitia-gold/30 bg-card overflow-hidden shadow-sm">
                <div className="flex-shrink-0 w-12 bg-gradient-to-b from-[#9A6E12] to-[#C9A24B] flex items-center justify-center">
                  <span className="text-white font-serif text-lg font-bold">1</span>
                </div>
                <div className="flex-1 p-3.5">
                  <div className="flex items-baseline justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4 text-letitia-gold" />
                      <h4 className="text-sm font-semibold text-foreground">Pix à vista</h4>
                      <span className="px-1.5 py-0.5 rounded bg-letitia-gold/15 text-letitia-gold text-[8px] font-bold uppercase tracking-wider">
                        melhor opção
                      </span>
                    </div>
                    <span className="text-base font-bold text-foreground">{brl(produto.valor)}</span>
                  </div>
                  <p className="text-[11px] text-muted mt-1">100% do caixa imediato. Ofereça sempre primeiro.</p>
                </div>
              </div>

              {/* 2 - Cartão */}
              <div className="flex items-stretch rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex-shrink-0 w-12 bg-[#8E1B1B] flex items-center justify-center">
                  <span className="text-white font-serif text-lg font-bold">2</span>
                </div>
                <div className="flex-1 p-3.5">
                  <div className="flex items-baseline justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted" />
                      <h4 className="text-sm font-semibold text-foreground">Cartão de crédito</h4>
                    </div>
                    <span className="text-base font-bold text-foreground">até 12x {brl(produto.cartao)}</span>
                  </div>
                  <p className="text-[11px] text-muted mt-1">Parcelamento padrão. Confirme o limite do lead antes de oferecer.</p>
                </div>
              </div>

              {/* 3 - Entrada + Parcelas (só high-ticket) */}
              {isHigh && (
                <div className="flex items-stretch rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex-shrink-0 w-12 bg-[#8E1B1B] flex items-center justify-center">
                    <span className="text-white font-serif text-lg font-bold">3</span>
                  </div>
                  <div className="flex-1 p-3.5">
                    <div className="flex items-baseline justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <ArrowDown className="h-4 w-4 text-muted" />
                        <h4 className="text-sm font-semibold text-foreground">Entrada + parcelas</h4>
                      </div>
                      <span className="text-base font-bold text-foreground">{brl(produto.entrada)} + 10x {brl(produto.parc10)}</span>
                    </div>
                    <p className="text-[11px] text-muted mt-1">
                      Entrada mínima de <strong className="text-foreground">50%</strong> (Pix, cartão ou os dois juntos via <strong className="text-foreground">Asaas</strong>) + restante em até 10x.
                    </p>
                  </div>
                </div>
              )}

              {/* 4 - Financiamento (só high-ticket) */}
              {isHigh && (
                <div className="flex items-stretch rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex-shrink-0 w-12 bg-[#8E1B1B] flex items-center justify-center">
                    <span className="text-white font-serif text-lg font-bold">4</span>
                  </div>
                  <div className="flex-1 p-3.5">
                    <div className="flex items-baseline justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted" />
                        <h4 className="text-sm font-semibold text-foreground">Financiamento</h4>
                      </div>
                      <span className="text-base font-bold text-foreground">último recurso</span>
                    </div>
                    <p className="text-[11px] text-muted mt-1">Para quem não tem limite no cartão. TMB, PrincipiaPay e outras (a contratar).</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {isHigh ? (
              <p className="text-xs text-muted">
                Entrada mínima de 50% = <strong className="text-foreground">{brl(produto.entrada)}</strong>. Qualquer condição além disso (entrada menor, mais de 10x, exceções) → consultar a gestão.
              </p>
            ) : (
              <div className="rounded-lg bg-letitia-gold/5 border border-letitia-gold/20 px-4 py-3">
                <p className="text-xs text-muted">
                  Produto de entrada: cobrança <strong className="text-foreground">à vista</strong> no Pix ou cartão (até 12x {brl(produto.cartao)}). Sem escada de parcelamento customizado.
                </p>
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* ─── ORDEM DE OFERECIMENTO ─────────────────────────────────────── */}
      <Section id="pb-ordem" eyebrow="A regra mais importante" title="A ordem de oferecimento.">
        <p className="text-sm text-muted leading-relaxed">
          Decore esta sequência. É sempre nesta ordem, uma de cada vez, da melhor para a última:
        </p>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-[#8E1B1B]">
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white text-left">#</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white text-left">Forma</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white text-left">Por quê</th>
              </tr>
            </thead>
            <tbody>
              {[
                { num: "1º", forma: "Pix à vista", porque: "100% do caixa na hora. Ofereça SEMPRE primeiro." },
                { num: "2º", forma: "Cartão de crédito (até 12x)", porque: "Parcelamento padrão. Recebimento garantido, com antecipação possível." },
                { num: "3º", forma: "Entrada + parcelas", porque: "Entrada mínima no Pix + restante no cartão. Protege o caixa." },
                { num: "4º", forma: "Financiamento", porque: "Último recurso. Para quem não tem limite no cartão." },
              ].map((row) => (
                <tr key={row.num} className="border-b border-border/50 last:border-0 hover:bg-background/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-bold text-foreground">{row.num}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-foreground">{row.forma}</td>
                  <td className="px-4 py-3 text-xs text-muted">{row.porque}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <NoteBox>
          <strong className="text-foreground">Vá sempre na ordem.</strong> Não jogue todas as opções de uma vez. Ofereça a 1ª; só desça para a próxima se a anterior não fechar.
        </NoteBox>
      </Section>

      {/* ─── FLUXO (ESCADA VISUAL) ─────────────────────────────────────── */}
      <Section id="pb-fluxo" eyebrow="A escada do recebimento" title="As 4 formas, em detalhe.">
        <p className="text-sm text-muted leading-relaxed">
          Exemplo com o <strong className="text-foreground">THE WAY Anual (R$ 80.000)</strong>. A mesma lógica vale para os outros high-ticket — ver a tabela por produto na seção "Parcelamento inteligente".
        </p>

        <div className="flex flex-col gap-3 mt-2">
          {/* Opção 1 - Best */}
          <div className="flex items-stretch rounded-xl border-2 border-letitia-gold bg-card overflow-hidden shadow-sm">
            <div className="flex-shrink-0 w-14 bg-gradient-to-b from-[#9A6E12] to-[#C9A24B] flex flex-col items-center justify-center">
              <span className="text-white font-serif text-xl font-bold">1</span>
              <span className="text-white/80 text-[7px] uppercase tracking-wider mt-0.5">caixa total</span>
            </div>
            <div className="flex-1 p-4">
              <div className="flex items-baseline justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-semibold text-foreground">Pix à vista</h4>
                  <span className="px-2 py-0.5 rounded-full bg-letitia-gold/15 text-[#9A6E12] text-[9px] font-bold uppercase tracking-wider">
                    melhor opção
                  </span>
                </div>
                <span className="text-lg font-bold text-foreground">R$ 80.000</span>
              </div>
              <p className="text-xs text-muted mt-1">100% do caixa imediato, sem taxa de cartão. Ofereça primeiro, sempre. Sem desconto — a vantagem é o recebimento na hora e zero risco.</p>
            </div>
          </div>

          {/* Opção 2 */}
          <div className="flex items-stretch rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex-shrink-0 w-14 bg-[#8E1B1B] flex flex-col items-center justify-center">
              <span className="text-white font-serif text-xl font-bold">2</span>
              <span className="text-white/80 text-[7px] uppercase tracking-wider mt-0.5">caixa alto</span>
            </div>
            <div className="flex-1 p-4">
              <div className="flex items-baseline justify-between flex-wrap gap-2">
                <h4 className="text-base font-semibold text-foreground">Cartão de crédito</h4>
                <span className="text-lg font-bold text-foreground">até 12x R$ 6.667</span>
              </div>
              <p className="text-xs text-muted mt-1">Parcelamento padrão no cartão. Recebimento em ~30 dias ou antecipado. Confirme o limite do lead antes de oferecer.</p>
            </div>
          </div>

          {/* Opção 3 */}
          <div className="flex items-stretch rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex-shrink-0 w-14 bg-[#8E1B1B] flex flex-col items-center justify-center">
              <span className="text-white font-serif text-xl font-bold">3</span>
              <span className="text-white/80 text-[7px] uppercase tracking-wider mt-0.5">caixa médio</span>
            </div>
            <div className="flex-1 p-4">
              <div className="flex items-baseline justify-between flex-wrap gap-2">
                <h4 className="text-base font-semibold text-foreground">Entrada + parcelas</h4>
                <span className="text-lg font-bold text-foreground">R$ 40.000 + 10x R$ 4.000</span>
              </div>
              <p className="text-xs text-muted mt-1">
                Entrada mínima de <strong className="text-foreground">50%</strong> (Pix, cartão ou os dois juntos via <strong className="text-foreground">Asaas</strong>) + restante em até 10x no cartão. Combina caixa imediato com fôlego de parcela.
              </p>
            </div>
          </div>

          {/* Opção 4 */}
          <div className="flex items-stretch rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex-shrink-0 w-14 bg-[#8E1B1B] flex flex-col items-center justify-center">
              <span className="text-white font-serif text-xl font-bold">4</span>
              <span className="text-white/80 text-[7px] uppercase tracking-wider mt-0.5">último recurso</span>
            </div>
            <div className="flex-1 p-4">
              <div className="flex items-baseline justify-between flex-wrap gap-2">
                <h4 className="text-base font-semibold text-foreground">Financiamento</h4>
                <span className="text-lg font-bold text-foreground">aprovação rápida</span>
              </div>
              <p className="text-xs text-muted mt-1">Para leads sem limite no cartão. A empresa recebe à vista. Ferramentas: <strong className="text-foreground">TMB, PrincipiaPay</strong> e outras do mercado <em>(a contratar)</em>.</p>
            </div>
          </div>
        </div>
      </Section>

      {/* ─── QUANTO COLETAR ───────────────────────────────────────────── */}
      <Section id="pb-coletar" eyebrow="O número que protege a venda" title="Quanto a gente precisa coletar.">
        <p className="text-sm text-muted leading-relaxed">
          Em qualquer parcelamento customizado, a <strong className="text-foreground">entrada mínima é de 50% do valor do produto</strong>, paga no ato. A entrada pode ser no Pix, no cartão, ou <strong className="text-foreground">os dois juntos via Asaas</strong>. Isso garante caixa e mede o comprometimento real do lead.
        </p>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-[#8E1B1B]">
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white text-left">Produto</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white text-right">Valor cheio</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white text-right">Entrada mín. (50%)</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white text-right">Restante</th>
              </tr>
            </thead>
            <tbody>
              {PRODUTOS_PLAYBOOK.filter(p => p.tipo === "high").map((p) => (
                <tr key={p.nome} className="border-b border-border/50 last:border-0 hover:bg-background/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-semibold text-foreground">{p.nome}</td>
                  <td className="px-4 py-3 text-sm text-foreground text-right">{brl(p.valor)}</td>
                  <td className="px-4 py-3 text-sm text-letitia-gold font-semibold text-right">{brl(p.entrada)}</td>
                  <td className="px-4 py-3 text-sm text-muted text-right">{brl(p.restante)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <NoteBox>
          <strong className="text-foreground">O teste dos 50%:</strong> se o lead não consegue dar a entrada mínima, questione (com elegância) a real capacidade financeira dele para o programa. Entrada baixa = caixa frágil e risco de inadimplência.<br /><br />
          <strong className="text-foreground">Qualquer condição além disso — entrada menor que 50%, mais de 10 parcelas, ou qualquer exceção — precisa ser consultada com a gestão antes de prometer ao lead.</strong>
        </NoteBox>
      </Section>

      {/* ─── PARCELAMENTO INTELIGENTE ──────────────────────────────────── */}
      <Section id="pb-parcelamento" eyebrow="Como montar o parcelamento" title="Parcelamento inteligente.">
        <p className="text-sm text-muted leading-relaxed">
          "Inteligente" = combinar instrumentos para fechar sem destruir o caixa. A lógica é sempre: <strong className="text-foreground">maior entrada possível no Pix</strong> + o restante no cartão, no menor número de parcelas que o lead aguenta.
        </p>

        <h3 className="font-serif text-base font-semibold text-foreground mt-2">As combinações que a gente aceita</h3>
        <div className="space-y-2">
          {[
            { icon: <Banknote className="h-3.5 w-3.5 text-letitia-gold" />, title: "Pix cheio:", desc: "tudo à vista. Sempre a primeira tentativa." },
            { icon: <CreditCard className="h-3.5 w-3.5 text-letitia-gold" />, title: "Cartão cheio:", desc: "100% no cartão em até 12x, se o limite cobrir." },
            { icon: <Sparkles className="h-3.5 w-3.5 text-letitia-gold" />, title: "Entrada + cartão:", desc: "entrada de 50%+ (Pix, cartão, ou Pix + cartão juntos via Asaas) e o restante em até 10x no cartão. A combinação mais usada." },
            { icon: <Zap className="h-3.5 w-3.5 text-letitia-gold" />, title: "Entrada combinada (Asaas):", desc: "quando o limite do cartão não cobre os 50% sozinho, o Asaas permite somar Pix + cartão na mesma entrada." },
            { icon: <ArrowDown className="h-3.5 w-3.5 text-letitia-gold" />, title: "Entrada maior = menos parcelas:", desc: "quanto maior a entrada, melhor o caixa e menor o risco. Incentive sempre subir a entrada." },
            { icon: <Shield className="h-3.5 w-3.5 text-letitia-gold" />, title: "Financiamento:", desc: "só quando o cartão não comporta. Empresa recebe à vista." },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-background p-3">
              <div className="flex-shrink-0 mt-0.5">{item.icon}</div>
              <p className="text-xs text-muted leading-relaxed">
                <strong className="text-foreground">{item.title}</strong> {item.desc}
              </p>
            </div>
          ))}
        </div>

        <NoteBox>
          <strong className="text-foreground">Limite do que o closer pode oferecer sozinho:</strong> entrada de 50%+ (Pix/cartão/Asaas) e restante em até 10x. <strong className="text-foreground">Qualquer coisa além disso — entrada menor, mais parcelas, prazos especiais — só com aval da gestão.</strong>
        </NoteBox>

        <h3 className="font-serif text-base font-semibold text-foreground mt-2">Tabela de parcelamento por produto</h3>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-[#8E1B1B]">
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white text-left">Produto</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white text-right">Pix à vista</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white text-right">Cartão 12x</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white text-right">Entrada 50% + 10x</th>
              </tr>
            </thead>
            <tbody>
              {PRODUTOS_PLAYBOOK.filter(p => p.tipo === "high").map((p) => (
                <tr key={p.nome} className="border-b border-border/50 last:border-0 hover:bg-background/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-semibold text-foreground">{p.nome}</td>
                  <td className="px-4 py-3 text-sm text-foreground text-right">{brl(p.valor)}</td>
                  <td className="px-4 py-3 text-sm text-foreground text-right">{brl(p.cartao)}/mês</td>
                  <td className="px-4 py-3 text-sm text-foreground text-right">{brl(p.entrada)} + 10x {brl(p.parc10)}</td>
                </tr>
              ))}
              {PRODUTOS_PLAYBOOK.filter(p => p.tipo === "low").slice(0, 2).map((p) => (
                <tr key={p.nome} className="border-b border-border/50 last:border-0 hover:bg-background/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-muted">{p.nome}</td>
                  <td className="px-4 py-3 text-sm text-foreground text-right">{brl(p.valor)}</td>
                  <td className="px-4 py-3 text-sm text-foreground text-right">{brl(p.cartao)}/mês</td>
                  <td className="px-4 py-3 text-sm text-muted text-right italic">à vista (Pix/cartão)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <NoteBox>
          <strong className="text-foreground">Regra de bolso:</strong> maximize a entrada (Pix, cartão ou Pix+cartão via Asaas) e jogue o restante no cartão. Valores de parcela são referência — confirme as taxas vigentes do cartão/Asaas/financiamento antes de prometer.
        </NoteBox>
      </Section>

      {/* ─── ANCORAGEM DE VALOR ────────────────────────────────────────── */}
      <Section id="pb-ancoragem" eyebrow="Antes de falar o preço" title="Ancoragem de valor.">
        <p className="text-sm text-muted leading-relaxed">
          Nunca mostre o investimento antes de ancorar o valor. Primeiro o lead enxerga o tamanho da entrega; só então o número parece pequeno diante do que recebe.
        </p>

        <div className="rounded-xl border border-dashed border-[#B23A3A]/40 bg-background p-5 space-y-3">
          <p className="text-sm text-foreground italic leading-relaxed">
            <strong className="not-italic text-[#8E1B1B]">[ao chegar no slide de preço]</strong><br />
            "Olha, se você fosse contratar cada uma dessas entregas separadamente — os encontros, as imersões, as sessões individuais, todo o método — o investimento passaria de muito mais do que isso. No programa, tudo está reunido por <strong>[valor do produto]</strong>. À vista no Pix você fecha hoje; no cartão, em até 12x."
          </p>
          <p className="text-sm text-foreground italic">
            <strong className="not-italic text-[#8E1B1B]">[pausa — deixe o lead processar. Não preencha o silêncio.]</strong>
          </p>
          <p className="text-sm text-foreground italic">
            "Qual dessas formas funciona melhor pra você?"
          </p>
        </div>

        <NoteBox>
          <strong className="text-foreground">Sequência:</strong> SPIN completo → construir a dor → mostrar todas as entregas → "quanto isso vale pra você?" → só então abrir o investimento com a ancoragem. Preço sem valor ancorado vira objeção.
        </NoteBox>
      </Section>

      {/* ─── OBJEÇÕES FINANCEIRAS ──────────────────────────────────────── */}
      <Section id="pb-objecoes" eyebrow="Quando trava no dinheiro" title="Contorno de objeções financeiras.">
        <p className="text-sm text-muted leading-relaxed">
          A objeção de dinheiro quase nunca é "não tenho" — é "não está claro como caber". Sua função é apresentar a próxima opção da escada, não baixar o preço.
        </p>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-[#8E1B1B]">
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white text-left">O lead diz…</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white text-left">Você responde com…</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  lead: "\"Não tenho o valor à vista\"",
                  resposta: "Suba para o cartão em até 12x. \"Sem problema — dá pra diluir em até 12x no cartão, fica R$ X por mês.\""
                },
                {
                  lead: "\"Meu limite não cobre tudo\"",
                  resposta: "Ofereça entrada (Pix + cartão via Asaas) + restante no cartão. \"A gente monta a entrada juntando Pix e cartão no Asaas e parcela o restante, assim não estoura o limite.\""
                },
                {
                  lead: "\"Não consigo nem os 50% de entrada\"",
                  resposta: "Verifique o perfil do lead: se for um lead bom e comprometido, consulte a gestão sobre a possibilidade de uma condição diferenciada. Não prometa nada por conta própria — leve o caso com contexto para a gestão avaliar."
                },
                {
                  lead: "\"Não tenho limite nenhum\"",
                  resposta: "Financiamento (TMB / PrincipiaPay / a contratar). \"Tem uma linha de financiamento com aprovação rápida — a empresa recebe à vista e você parcela lá.\""
                },
                {
                  lead: "\"Não tenho limite nenhum e nem a entrada\"",
                  resposta: "Ofereça outros produtos do portfólio que se encaixem na realidade financeira do lead. Apresente opções como Sessão Individual, A Estrategista ou Você Dirige — produtos de entrada que entregam valor e podem ser o primeiro passo antes do high-ticket."
                },
                {
                  lead: "\"Preciso pensar / sem urgência\"",
                  resposta: "Descubra o real: \"O que te falta ver pra decidir hoje?\" + custo da inércia: \"O que acontece com seu objetivo se nada mudar nos próximos 6 meses?\""
                },
              ].map((row, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-background/50 transition-colors align-top">
                  <td className="px-4 py-3 text-xs font-medium text-foreground w-1/3">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-3.5 w-3.5 text-[#8E1B1B] flex-shrink-0 mt-0.5" />
                      {row.lead}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{row.resposta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ─── CARTAS NA MANGA ──────────────────────────────────────────── */}
      <Section id="pb-cartas" eyebrow="Recursos de fechamento" title="Cartas na manga.">
        <p className="text-sm text-muted leading-relaxed">
          Use quando o lead está na beira da decisão e precisa do empurrão final. <strong className="text-foreground">Uma por vez, na ordem.</strong> Não jogue tudo de uma vez.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Carta 1 */}
          <div className="rounded-xl border border-border bg-background p-5 space-y-3 hover:border-letitia-gold/30 transition-all">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#B23A3A]">Carta 1</span>
            <h4 className="font-serif text-base font-semibold text-foreground">Acompanhamento de verdade</h4>
            <p className="text-xs text-muted leading-relaxed">
              Não é um curso solto. É acompanhamento real ao longo do programa, com encontros e suporte direto. Tempo para transformar de fato.
            </p>
            <div className="rounded-lg bg-card border border-border px-3 py-2">
              <p className="text-[11px] text-foreground">
                Quando usar: <strong className="text-[#8E1B1B]">"não sei se é suficiente / rápido demais"</strong>
              </p>
            </div>
          </div>

          {/* Carta 2 */}
          <div className="rounded-xl border border-letitia-gold/30 bg-background p-5 space-y-3 hover:border-letitia-gold/50 transition-all">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#B23A3A]">Carta 2</span>
              <span className="px-1.5 py-0.5 rounded bg-letitia-gold/15 text-letitia-gold text-[8px] font-bold uppercase tracking-wider">
                a mais forte
              </span>
            </div>
            <h4 className="font-serif text-base font-semibold text-foreground flex items-center gap-2">
              <Crown className="h-4 w-4 text-letitia-gold" />
              Sessão diagnóstica com a Letícia
            </h4>
            <p className="text-xs text-muted leading-relaxed">
              Sessão individual de diagnóstico direto com a Letícia. Não é call de vendas — é estratégia real com quem conduz o método.
            </p>
            <div className="rounded-lg bg-card border border-border px-3 py-2">
              <p className="text-[11px] text-foreground">
                Quando usar: <strong className="text-[#8E1B1B]">lead de alto potencial precisando do empurrão final</strong>
              </p>
            </div>
          </div>
        </div>

        <NoteBox>
          <strong className="text-foreground">A sessão com a Letícia é o recurso mais poderoso.</strong> Reserve para leads de alto potencial a um passo de fechar. Não ofereça para todos — é o que perde força se for banalizado.
        </NoteBox>
      </Section>

      {/* ─── REGRAS DE OURO ───────────────────────────────────────────── */}
      <Section id="pb-regras" eyebrow="Não-negociáveis" title="Regras de ouro do recebimento.">
        <div className="space-y-3">
          {/* Regras Absolutas */}
          {[
            { level: "Absoluta", color: "bg-red-50 text-[#8E1B1B]", title: "Sempre na ordem: Pix → Cartão → Entrada+Parcelas → Financiamento", desc: "Cada opção tem melhor caixa que a seguinte. Não pule etapas nem ofereça tudo de uma vez." },
            { level: "Absoluta", color: "bg-red-50 text-[#8E1B1B]", title: "Entrada mínima de 50% em qualquer parcelamento customizado", desc: "No ato — Pix, cartão ou os dois juntos via Asaas. Protege o caixa e mede comprometimento. Se não dá os 50%, questione a capacidade financeira." },
            { level: "Absoluta", color: "bg-red-50 text-[#8E1B1B]", title: "Qualquer condição além do padrão = consultar a gestão", desc: "O closer fecha sozinho até: entrada de 50%+ (Pix/cartão/Asaas) + restante em até 10x. Entrada menor, mais parcelas ou qualquer exceção só com aval da gestão." },
            { level: "Absoluta", color: "bg-red-50 text-[#8E1B1B]", title: "Nunca mostre o preço antes de ancorar o valor", desc: "SPIN completo → dor → todas as entregas → \"quanto vale?\" → só então o investimento com ancoragem." },
            { level: "Importante", color: "bg-letitia-gold/10 text-[#9A6E12]", title: "Entrada robusta (Pix/cartão/Asaas), restante no cartão", desc: "Use o Asaas para somar Pix + cartão e bater os 50% de entrada quando o limite não cobre sozinho. Restante sempre no cartão = recebimento garantido." },
            { level: "Importante", color: "bg-letitia-gold/10 text-[#9A6E12]", title: "Cartas na manga uma por vez, na ordem certa", desc: "Acompanhamento de verdade → Sessão com a Letícia. Cada carta é calibrada para uma objeção específica; a sessão com a Letícia é a mais forte, reserve para o fim." },
            { level: "Importante", color: "bg-letitia-gold/10 text-[#9A6E12]", title: "Saia da reunião com próximo passo: dia, hora e responsável", desc: "Se fechou, o próximo passo é o pagamento. Se não, é o follow-up. Nunca termine com \"depois eu te retorno\"." },
            { level: "Recomendado", color: "bg-emerald-50 text-emerald-700", title: "Incentive sempre a maior entrada possível", desc: "Quanto maior a entrada, melhor o caixa e menor o risco. Suba a entrada antes de aumentar o número de parcelas." },
            { level: "Recomendado", color: "bg-emerald-50 text-emerald-700", title: "Registre a forma de pagamento no CRM", desc: "Valor, forma, entrada, nº de parcelas e data de início. Se não está no CRM, não aconteceu." },
          ].map((rule, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-border bg-background p-4 hover:border-letitia-gold/20 transition-all">
              <span className={cn("flex-shrink-0 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider mt-0.5", rule.color)}>
                {rule.level}
              </span>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-foreground">{rule.title}</h4>
                <p className="text-[11px] text-muted mt-1 leading-relaxed">{rule.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── FOOTER ───────────────────────────────────────────────────── */}
      <div className="text-center pt-4 pb-2">
        <p className="text-[10px] text-muted">
          THE WAY · Playbook do Closer — Fluxo de Recebimento · Confidencial · uso interno do time comercial
        </p>
        <p className="text-[10px] text-muted mt-1">
          Valores e percentuais são parâmetros da gestão e podem ser ajustados. Confirme taxas de cartão/financiamento vigentes antes de prometer condições.
        </p>
      </div>
    </div>
  );
}
