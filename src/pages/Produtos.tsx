import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Package,
  CheckCircle2,
  CreditCard,
  Banknote,
  ArrowDown,
  ExternalLink,
  FileText,
  Link2,
  Globe,
  Loader2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PRODUTOS_CATALOGO, brl, type ProdutoCatalogo } from "@/data/produtosData";
import { getLinksWithProduto, type DBLink } from "@/services/linksService";

// ─── BADGE DE CATEGORIA ─────────────────────────────────────────────────────
const catBadge: Record<string, { bg: string; text: string; label: string }> = {
  mentoria: { bg: "bg-violet-100", text: "text-violet-700", label: "Mentoria" },
  curso: { bg: "bg-blue-100", text: "text-blue-700", label: "Curso" },
  workshop: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Workshop" },
};

// ─── COMPONENTE PRINCIPAL ───────────────────────────────────────────────────
export function Produtos() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [links, setLinks] = useState<DBLink[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(true);

  useEffect(() => {
    fetchLinks();
  }, []);

  async function fetchLinks() {
    try {
      const data = await getLinksWithProduto();
      setLinks(data);
    } catch (err) {
      console.error("Erro ao buscar links:", err);
    } finally {
      setLoadingLinks(false);
    }
  }

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const getLinksForProduct = (produtoId: string) =>
    links.filter((l) => l.produto_id === produtoId);

  return (
    <div className="min-h-screen bg-[#FDFCF9] selection:bg-[#C4A47C]/20">
      {/* ─── HEADER ─────────────────────────────────────────────────────── */}
      <header className="border-b border-[rgba(138,130,117,0.2)] bg-white/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#C4A47C]/10 flex items-center justify-center">
              <Package className="h-5 w-5 text-[#C4A47C]" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-tight font-sans">
                LaetitiAPP
              </h1>
              <p className="text-[10px] text-[#8A8275] font-medium uppercase tracking-widest">
                Catálogo de Produtos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-100">
            <Globe className="h-3.5 w-3.5 text-green-600" />
            <span className="text-[10px] font-bold text-green-700 uppercase tracking-tight">
              Público
            </span>
          </div>
        </div>
      </header>

      {/* ─── HERO ───────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 pt-10 pb-6">
        <div className="relative overflow-hidden rounded-2xl border border-[rgba(138,130,117,0.2)] bg-gradient-to-br from-[#8E1B1B] via-[#7A1717] to-[#5C1111] p-8 md:p-10 shadow-lg">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/5" />
            <div className="absolute -left-6 -bottom-6 h-36 w-36 rounded-full bg-white/5" />
            <span className="absolute right-10 bottom-8 text-[120px] font-bold text-white/[0.04] leading-none select-none hidden md:block font-serif">
              L
            </span>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="font-serif text-3xl md:text-4xl font-semibold text-white tracking-tight">
                  Nossos Produtos
                </h2>
                <p className="text-white/60 text-sm mt-0.5">
                  Conheça todos os programas e cursos da Letícia Cazarré
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-[11px] font-semibold backdrop-blur-sm">
                <Package className="h-3 w-3" /> {PRODUTOS_CATALOGO.length} produtos
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-[11px] font-semibold backdrop-blur-sm">
                <CreditCard className="h-3 w-3" /> Múltiplas formas de pagamento
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── PRODUTOS ACCORDION ─────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 pb-16 space-y-4">
        {PRODUTOS_CATALOGO.map((produto) => {
          const isOpen = openId === produto.id;
          const badge = catBadge[produto.categoria] || catBadge.curso;
          const productLinks = getLinksForProduct(produto.id);

          return (
            <div
              key={produto.id}
              className={cn(
                "rounded-2xl border bg-white shadow-sm overflow-hidden transition-all",
                isOpen
                  ? "border-[#C4A47C]/40 shadow-md"
                  : "border-[rgba(138,130,117,0.15)] hover:border-[#C4A47C]/25 hover:shadow"
              )}
            >
              {/* Accordion Header */}
              <button
                onClick={() => toggle(produto.id)}
                className="w-full flex items-center justify-between p-5 md:p-6 text-left group"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="h-12 w-12 rounded-xl bg-[#FDFCF9] border border-[rgba(138,130,117,0.15)] flex items-center justify-center text-2xl flex-shrink-0">
                    {produto.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-serif text-lg md:text-xl font-semibold text-[#1A1A1A] leading-tight">
                        {produto.nome}
                      </h3>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex-shrink-0",
                          badge.bg,
                          badge.text
                        )}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-sm text-[#8A8275] mt-0.5 hidden sm:block">
                      {produto.descricao}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                  <div className="text-right hidden sm:block">
                    {produto.valorOriginal && (
                      <p className="text-xs text-[#8A8275] line-through mb-0.5">
                        De {brl(produto.valorOriginal)}
                      </p>
                    )}
                    <p className="font-serif text-xl md:text-2xl font-semibold text-[#1A1A1A]">
                      {produto.valorOriginal ? `Por ${brl(produto.valor).replace('R$ ', '')}` : brl(produto.valor)}
                      {produto.valorOriginal && <span className="text-xs font-normal text-emerald-600 ml-1">à vista</span>}
                    </p>
                    {produto.tipo === "high" && (
                      <p className="text-[10px] text-[#8A8275]">
                        ou até 12x de {brl(produto.cartao12x)}
                      </p>
                    )}
                  </div>
                  <div
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center transition-all",
                      isOpen
                        ? "bg-[#C4A47C]/15 text-[#C4A47C]"
                        : "bg-[#FDFCF9] text-[#8A8275] group-hover:text-[#C4A47C]"
                    )}
                  >
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </button>

              {/* Mobile price (visible only on small screens) */}
              {!isOpen && (
                <div className="px-5 pb-4 -mt-2 sm:hidden">
                  {produto.valorOriginal && (
                    <p className="text-xs text-[#8A8275] line-through">
                      De {brl(produto.valorOriginal)}
                    </p>
                  )}
                  <p className="font-serif text-xl font-semibold text-[#1A1A1A]">
                    {produto.valorOriginal ? `Por ${brl(produto.valor).replace('R$ ', '')}` : brl(produto.valor)}
                    {produto.valorOriginal && <span className="text-xs font-normal text-emerald-600 ml-1">à vista</span>}
                  </p>
                  {produto.tipo === "high" && (
                    <p className="text-[10px] text-[#8A8275]">
                      ou até 12x de {brl(produto.cartao12x)}
                    </p>
                  )}
                </div>
              )}

              {/* Accordion Body */}
              {isOpen && (
                <div className="border-t border-[rgba(138,130,117,0.12)] px-5 md:px-6 pb-6 pt-5 space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Mobile price */}
                  <div className="sm:hidden">
                    {produto.valorOriginal && (
                      <p className="text-xs text-[#8A8275] line-through">
                        De {brl(produto.valorOriginal)}
                      </p>
                    )}
                    <p className="font-serif text-2xl font-semibold text-[#1A1A1A]">
                      {produto.valorOriginal ? `Por ${brl(produto.valor).replace('R$ ', '')}` : brl(produto.valor)}
                      {produto.valorOriginal && <span className="text-xs font-normal text-emerald-600 ml-1">à vista</span>}
                    </p>
                    <p className="text-xs text-[#8A8275] mt-0.5">{produto.descricao}</p>
                  </div>

                  {/* ── ENTREGÁVEIS ──────────────────────────────────── */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="h-4 w-4 text-[#C4A47C]" />
                      <h4 className="text-xs font-bold uppercase tracking-widest text-[#8A8275]">
                        O que está incluso
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {produto.entregaveis.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2.5 rounded-lg bg-[#FDFCF9] border border-[rgba(138,130,117,0.1)] p-3"
                        >
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-[#1A1A1A] leading-snug">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── FORMAS DE PAGAMENTO ──────────────────────────── */}
                  <PaymentSection produto={produto} />

                  {/* ── LINKS ÚTEIS ──────────────────────────────────── */}
                  {!loadingLinks && productLinks.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Link2 className="h-4 w-4 text-[#C4A47C]" />
                        <h4 className="text-xs font-bold uppercase tracking-widest text-[#8A8275]">
                          Links Úteis
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {productLinks.map((link) => (
                          <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 rounded-lg bg-[#FDFCF9] border border-[rgba(138,130,117,0.1)] p-3 hover:border-[#C4A47C]/30 hover:shadow-sm transition-all group"
                          >
                            <div className="h-8 w-8 rounded-lg border border-[rgba(138,130,117,0.15)] bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                              <img
                                src={`https://www.google.com/s2/favicons?domain=${link.url}&sz=64`}
                                alt=""
                                className="h-5 w-5 object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${link.titulo}&background=f1f1f1&color=666&size=64`;
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#1A1A1A] truncate group-hover:text-[#C4A47C] transition-colors">
                                {link.titulo}
                              </p>
                              <p className="text-[10px] text-[#8A8275] truncate">
                                {link.url.replace(/^https?:\/\//, "")}
                              </p>
                            </div>
                            <ExternalLink className="h-3.5 w-3.5 text-[#8A8275] group-hover:text-[#C4A47C] flex-shrink-0 transition-colors" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {loadingLinks && (
                    <div className="flex items-center gap-2 text-[#8A8275]">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-xs">Carregando links...</span>
                    </div>
                  )}

                  {/* ── PDF DA PROPOSTA ──────────────────────────────── */}
                  {produto.pdfUrl && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-4 w-4 text-[#C4A47C]" />
                        <h4 className="text-xs font-bold uppercase tracking-widest text-[#8A8275]">
                          Proposta em PDF
                        </h4>
                      </div>
                      <a
                        href={produto.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#8E1B1B] to-[#A52828] px-5 py-3 text-white hover:opacity-90 transition-all shadow-sm hover:shadow group"
                      >
                        <FileText className="h-5 w-5" />
                        <div>
                          <p className="text-sm font-semibold">Abrir Proposta</p>
                          <p className="text-[10px] text-white/60">Visualizar PDF completo</p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-white/60 group-hover:text-white transition-colors ml-2" />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </main>

      {/* ─── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-[rgba(138,130,117,0.15)] bg-white/30">
        <div className="max-w-5xl mx-auto px-4 py-10 text-center">
          <p className="text-sm text-[#8A8275] mb-4 font-serif italic">
            Letícia Cazarré — Transformação de vida, carreira e negócios
          </p>
          <div className="flex items-center justify-center gap-6">
            <a
              href="https://leticiacazarre.com.br"
              className="text-xs text-[#8A8275] hover:text-[#C4A47C] transition-colors"
            >
              Site Oficial
            </a>
            <a
              href="https://instagram.com/leticiacazarre"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#8A8275] hover:text-[#C4A47C] transition-colors"
            >
              Instagram
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── SEÇÃO DE FORMAS DE PAGAMENTO ───────────────────────────────────────────
function PaymentSection({ produto }: { produto: ProdutoCatalogo }) {
  const isHigh = produto.tipo === "high";

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <CreditCard className="h-4 w-4 text-[#C4A47C]" />
        <h4 className="text-xs font-bold uppercase tracking-widest text-[#8A8275]">
          Formas de Pagamento
        </h4>
        {isHigh && (
          <span className="px-2 py-0.5 rounded-full bg-[#8E1B1B]/10 text-[#8E1B1B] text-[8px] font-bold uppercase tracking-wider">
            Escada do recebimento
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        {/* 1 — Pix à vista */}
        <div className="flex items-stretch rounded-xl border-2 border-[#C4A47C]/40 bg-white overflow-hidden shadow-sm">
          <div className="flex-shrink-0 w-12 bg-gradient-to-b from-[#9A6E12] to-[#C9A24B] flex flex-col items-center justify-center">
            <span className="text-white font-serif text-lg font-bold">1</span>
          </div>
          <div className="flex-1 p-3.5">
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-[#C4A47C]" />
                <h5 className="text-sm font-semibold text-[#1A1A1A]">Pix à vista</h5>
                <span className="px-1.5 py-0.5 rounded bg-[#C4A47C]/15 text-[#9A6E12] text-[8px] font-bold uppercase tracking-wider">
                  melhor opção
                </span>
              </div>
              <span className="text-base font-bold text-[#1A1A1A] font-serif">{brl(produto.valor)}</span>
            </div>
            <p className="text-[11px] text-[#8A8275] mt-1">
              100% do valor à vista via Pix. Sem taxa de cartão.
            </p>
          </div>
        </div>

        {/* 2 — Cartão de crédito */}
        <div className="flex items-stretch rounded-xl border border-[rgba(138,130,117,0.15)] bg-white overflow-hidden">
          <div className="flex-shrink-0 w-12 bg-[#8E1B1B] flex flex-col items-center justify-center">
            <span className="text-white font-serif text-lg font-bold">2</span>
          </div>
          <div className="flex-1 p-3.5">
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-[#8A8275]" />
                <h5 className="text-sm font-semibold text-[#1A1A1A]">Cartão de crédito</h5>
              </div>
              <span className="text-base font-bold text-[#1A1A1A] font-serif">
                até 12x {brl(produto.cartao12x)}
              </span>
            </div>
            <p className="text-[11px] text-[#8A8275] mt-1">
              Parcelamento padrão no cartão de crédito. Valor total: {brl(produto.valor)}.
            </p>
          </div>
        </div>

        {/* 3 — Entrada + parcelas (só high-ticket) */}
        {isHigh && (
          <div className="flex items-stretch rounded-xl border border-[rgba(138,130,117,0.15)] bg-white overflow-hidden">
            <div className="flex-shrink-0 w-12 bg-[#8E1B1B] flex flex-col items-center justify-center">
              <span className="text-white font-serif text-lg font-bold">3</span>
            </div>
            <div className="flex-1 p-3.5">
              <div className="flex items-baseline justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <ArrowDown className="h-4 w-4 text-[#8A8275]" />
                  <h5 className="text-sm font-semibold text-[#1A1A1A]">Entrada + parcelas</h5>
                </div>
                <span className="text-base font-bold text-[#1A1A1A] font-serif">
                  {brl(produto.entrada35)} + 6x {brl(produto.parc6)}
                </span>
              </div>
              <p className="text-[11px] text-[#8A8275] mt-1">
                Entrada de 35% ({brl(produto.entrada35)}) via Pix ou cartão + restante em até 6x no
                cartão.
              </p>
            </div>
          </div>
        )}

        {/* Note for low-ticket */}
        {!isHigh && (
          <div className="rounded-lg bg-[#C4A47C]/5 border border-[#C4A47C]/15 px-4 py-3">
            <p className="text-[11px] text-[#8A8275]">
              Produto de entrada: pagamento <strong className="text-[#1A1A1A]">à vista</strong> no
              Pix ou cartão (até 12x de {brl(produto.cartao12x)}).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
