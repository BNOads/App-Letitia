// ─── CATÁLOGO DE PRODUTOS LETITIA (fonte única de verdade) ──────────────────
// Usado em: Comissões, Playbook, Produtos (público)

export interface ProdutoCatalogo {
  id: string;
  nome: string;
  valor: number;
  valorOriginal?: number; // "De R$ X" (riscado) — preço antes do desconto
  descricao: string;
  categoria: "curso" | "mentoria" | "workshop";
  emoji: string;
  tipo: "high" | "low";
  cartao12x: number;
  entrada35: number;
  restante: number;
  parc6: number;
  entregaveis: string[];
  pdfUrl?: string;
}

export const PRODUTOS_CATALOGO: ProdutoCatalogo[] = [
  {
    id: "the-way-anual",
    nome: "THE WAY Mentoria (Anual)",
    valor: 80000,
    valorOriginal: 90000,
    descricao: "Mentoria anual premium — programa exclusivo",
    categoria: "mentoria",
    emoji: "✦",
    tipo: "high",
    cartao12x: 7500,
    entrada35: 31500,
    restante: 58500,
    parc6: 9750,
    entregaveis: [
      "12 meses de acompanhamento contínuo",
      "Encontros quinzenais ao vivo com Letícia",
      "2 imersões presenciais exclusivas",
      "Sessões individuais de estratégia",
      "Acesso ao grupo VIP com suporte direto",
      "Método THE WAY completo — vida, carreira e negócios",
      "Material de apoio e frameworks exclusivos",
      "Networking com mentorandos de alto nível",
    ],
    pdfUrl: "/propostas/Proposta-TheWay-SemPreco.pdf",
  },
  {
    id: "the-way-semestral",
    nome: "THE WAY Mentoria (Semestral)",
    valor: 45000,
    valorOriginal: 54000,
    descricao: "Downsell — 6 meses com entregas quinzenais e 1 encontro presencial",
    categoria: "mentoria",
    emoji: "✦",
    tipo: "high",
    cartao12x: 4500,
    entrada35: 18900,
    restante: 35100,
    parc6: 5850,
    entregaveis: [
      "6 meses de acompanhamento contínuo",
      "Encontros quinzenais ao vivo com Letícia",
      "1 imersão presencial exclusiva",
      "Sessões individuais de estratégia",
      "Acesso ao grupo VIP com suporte direto",
      "Método THE WAY completo — vida, carreira e negócios",
      "Material de apoio e frameworks exclusivos",
    ],
    pdfUrl: "/propostas/Proposta-TheWay-SemPreco.pdf",
  },
  {
    id: "the-way-trimestral",
    nome: "THE WAY Mentoria (Trimestral)",
    valor: 30000,
    valorOriginal: 35000,
    descricao: "Versão trimestral intensiva da mentoria THE WAY",
    categoria: "mentoria",
    emoji: "✦",
    tipo: "high",
    cartao12x: 2917,
    entrada35: 12250,
    restante: 22750,
    parc6: 3792,
    entregaveis: [
      "3 meses de acompanhamento intensivo",
      "Encontros quinzenais ao vivo com Letícia",
      "Sessões individuais de estratégia",
      "Acesso ao grupo VIP com suporte direto",
      "Método THE WAY — módulos essenciais",
      "Material de apoio e frameworks exclusivos",
    ],
    pdfUrl: "/propostas/Proposta-TheWay-SemPreco.pdf",
  },
  {
    id: "vcn",
    nome: "Vida, Carreira e Negócios (VCN)",
    valor: 20000,
    valorOriginal: 24000,
    descricao: "Programa completo de transformação — vida, carreira e negócios",
    categoria: "mentoria",
    emoji: "🏅",
    tipo: "high",
    cartao12x: 2000,
    entrada35: 8400,
    restante: 15600,
    parc6: 2600,
    entregaveis: [
      "Programa completo de transformação pessoal e profissional",
      "Encontros em grupo com Letícia",
      "Sessões de estratégia de carreira",
      "Módulos sobre vida pessoal, carreira e negócios",
      "Comunidade exclusiva de alunos VCN",
      "Material de apoio completo",
    ],
    pdfUrl: "/propostas/Proposta-VCN.pdf",
  },

  {
    id: "estrategista",
    nome: "A Estrategista (Gravado)",
    valor: 2000,
    valorOriginal: 5000,
    descricao: "Curso gravado de estratégia de vida e negócios",
    categoria: "curso",
    emoji: "🎯",
    tipo: "low",
    cartao12x: 167,
    entrada35: 700,
    restante: 1300,
    parc6: 217,
    entregaveis: [
      "Curso 100% gravado — assista no seu ritmo",
      "Módulos de estratégia pessoal e profissional",
      "Exercícios práticos e templates",
      "Acesso vitalício ao conteúdo",
      "Comunidade de alunos",
    ],
  },
  {
    id: "voce-dirige",
    nome: "Curso Você Dirige",
    valor: 970,
    descricao: "Produto intermediário — curso completo",
    categoria: "curso",
    emoji: "🚗",
    tipo: "low",
    cartao12x: 81,
    entrada35: 340,
    restante: 630,
    parc6: 105,
    entregaveis: [
      "Curso completo sobre direcionamento de vida e carreira",
      "Aulas gravadas com Letícia",
      "Material de apoio e exercícios",
      "Acesso vitalício ao conteúdo",
    ],
    pdfUrl: "/propostas/Proposta-VoceDirige.pdf",
  },
  {
    id: "plano-a",
    nome: "Workshop Plano A",
    valor: 97,
    descricao: "Porta de entrada paga — workshop prático",
    categoria: "workshop",
    emoji: "📋",
    tipo: "low",
    cartao12x: 8,
    entrada35: 34,
    restante: 63,
    parc6: 11,
    entregaveis: [
      "Workshop ao vivo com Letícia",
      "Exercício prático de planejamento",
      "Material de apoio em PDF",
      "Gravação disponível por 7 dias",
    ],
  },
];

// ─── HELPERS ────────────────────────────────────────────────────────────────

/** Formatar valor em BRL */
export const brl = (n: number) => "R$ " + n.toLocaleString("pt-BR");

/** Buscar produto por id */
export function getProdutoById(id: string): ProdutoCatalogo | undefined {
  return PRODUTOS_CATALOGO.find((p) => p.id === id);
}

/** Categorias disponíveis para o select */
export const CATEGORIAS_PRODUTO: { value: ProdutoCatalogo["categoria"]; label: string }[] = [
  { value: "curso", label: "Curso" },
  { value: "mentoria", label: "Mentoria" },

  { value: "workshop", label: "Workshop" },
];

/** IDs dos produtos (para selects de link) */
export const PRODUTO_OPTIONS = PRODUTOS_CATALOGO.map((p) => ({
  id: p.id,
  nome: p.nome,
  emoji: p.emoji,
}));
