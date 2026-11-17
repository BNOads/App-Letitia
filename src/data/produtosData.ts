// ─── CATÁLOGO DE PRODUTOS LETITIA (fonte única de verdade) ──────────────────
// Usado em: Comissões, Playbook, Produtos (público)
// Última atualização: 2026-11-16 — alinhado aos playbooks (doc "Correções do App de Produtos x Playbooks")

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
  /** Se false, não oferece a opção "Entrada + parcelas" */
  temEntradaParcelas?: boolean;
  /** Parcelamento no cartão tem juros, mas o valor da parcela não foi informado */
  cartaoParcelaAConfirmar?: boolean;
  /** Porta de entrada da escada (só o Plano A) */
  portaDeEntrada?: boolean;
  /** Texto da garantia exibido no card */
  garantia: string;
  /** Observações exibidas em destaque (ex.: lista de espera, processo seletivo) */
  avisos?: string[];
  entregaveis: string[];
  pdfUrl?: string;
  /** Link da página de pagamento/checkout */
  checkoutUrl?: string;
  /** PDFs adicionais (ex.: playbooks) */
  arquivos?: { titulo: string; url: string }[];
}

const THE_WAY_BASE = [
  "Encontros semanais ao vivo com a Letícia e as mentoradas",
  "Suporte diário no WhatsApp: Letícia no grupo todos os dias e conversas individuais quando necessário",
  "Acompanhamento 1:1",
  "2 imersões presenciais inclusas",
  "1 sessão de Personal Styling (1h individual)",
  "Plataforma de membros: gravações, materiais escritos, frameworks e checklists — acervo permanente",
  "Comunidade exclusiva e confidencial de mulheres de alta performance",
  "Método THE WAY: 3 pilares (vida pessoal, profissional e interior) e 4 princípios (conhecimentos, hábitos, ferramentas e virtudes)",
  "4 fases: Diagnóstico e Fundação · Integração e Sistemas · Otimização e Refinamento · Maestria e Sustentabilidade",
  "Confidencialidade é território sagrado",
];

const THE_WAY_AVISOS = [
  "Entrada por processo seletivo: aplicação, triagem com a equipe e call com a Letícia",
];

const THE_WAY_GARANTIA = "Sem garantia — decisão adulta, comprometimento real";

export const PRODUTOS_CATALOGO: ProdutoCatalogo[] = [
  {
    id: "the-way-anual",
    nome: "THE WAY Mentoria (Anual)",
    valor: 72000,
    valorOriginal: 90000,
    descricao: "Mentoria de 12 meses com encontros semanais, acompanhamento 1:1 e imersões inclusas",
    categoria: "mentoria",
    emoji: "✦",
    tipo: "high",
    cartao12x: 6000,
    entrada35: 25200,
    restante: 46800,
    parc6: 7800,
    garantia: THE_WAY_GARANTIA,
    avisos: THE_WAY_AVISOS,
    entregaveis: ["12 meses de mentoria", ...THE_WAY_BASE],
    pdfUrl: "/propostas/Proposta-TheWay-SemPreco.pdf",
  },
  {
    id: "the-way-semestral",
    nome: "THE WAY Mentoria (Semestral)",
    valor: 40000,
    valorOriginal: 50000,
    descricao: "6 meses de mentoria com encontros semanais e acompanhamento 1:1",
    categoria: "mentoria",
    emoji: "✦",
    tipo: "high",
    cartao12x: 4167,
    entrada35: 14000,
    restante: 26000,
    parc6: 4333.33,
    garantia: THE_WAY_GARANTIA,
    avisos: THE_WAY_AVISOS,
    entregaveis: ["6 meses de mentoria", ...THE_WAY_BASE],
    pdfUrl: "/propostas/Proposta-TheWay-SemPreco.pdf",
  },
  {
    id: "the-way-trimestral",
    nome: "THE WAY Mentoria (Trimestral)",
    valor: 30000,
    valorOriginal: 36000,
    descricao: "3 meses de mentoria com encontros semanais e acompanhamento 1:1",
    categoria: "mentoria",
    emoji: "✦",
    tipo: "high",
    cartao12x: 2917,
    entrada35: 10500,
    restante: 19500,
    parc6: 3250,
    garantia: THE_WAY_GARANTIA,
    avisos: THE_WAY_AVISOS,
    entregaveis: ["3 meses de mentoria", ...THE_WAY_BASE],
    pdfUrl: "/propostas/Proposta-TheWay-SemPreco.pdf",
  },
  {
    id: "vcn",
    checkoutUrl: "https://letciacazarre.herospark.co/vida-carreira-e-negocios-leticia-cazarre",
    nome: "Vida, Carreira e Negócios (VCN)",
    valor: 25000,
    valorOriginal: 41500,
    descricao: "Um processo de clareza — pare de escolher entre ambição e vida pessoal",
    categoria: "mentoria",
    emoji: "🏅",
    tipo: "high",
    cartao12x: 2083,
    entrada35: 0,
    restante: 0,
    parc6: 0,
    temEntradaParcelas: false,
    garantia: "7 dias",
    avisos: [
      "Vagas limitadas (acompanhamento próximo e individual)",
      "Sem turma prevista no momento — entrar na lista de espera",
    ],
    entregaveis: [
      "6 encontros intensivos ao vivo, em 3 fases: Diagnóstico e Clareza · Estratégia de Carreira e Negócios · Integração e Movimento",
      "Acesso direto e personalizado à Letícia: ela conhece o seu caso, te ouve e te direciona",
      "3 pilares: Vida, Carreira e Negócios",
      "Acesso vitalício às gravações",
      "Kit de ferramentas e frameworks",
      "Suporte ativo dedicado",
      "Comunidade VCN de networking",
    ],
    pdfUrl: "/propostas/Proposta-VCN.pdf",
  },
  {
    id: "lacademia",
    checkoutUrl: "https://letciacazarre.herospark.co/lacademia",
    pdfUrl: "/propostas/Playbook-LAcademia.pdf",
    nome: "L'ACADEMIA",
    valor: 6000,
    descricao: "Academia de Formação Humana Integral — formar pessoas insubstituíveis na Era da IA por meio da formação humana, das artes liberais e da filosofia aplicada",
    categoria: "curso",
    emoji: "🏛️",
    tipo: "low",
    cartao12x: 500,
    cartaoParcelaAConfirmar: true,
    entrada35: 0,
    restante: 0,
    parc6: 0,
    temEntradaParcelas: false,
    garantia: "7 dias",
    avisos: [
      "Assinatura anual, renovada a cada ano",
      "Para empresários, executivos, juristas, médicos, artistas, pais e mães",
      "Mentoradas THE WAY: R$ 2.997",
    ],
    entregaveis: [
      "Cursos editoriais bimestrais: um módulo temático a cada dois meses — todos os alunos acessam todos os módulos, inclusive os anteriores",
      "Cursos completos com professores renomados: Rodrigo Gurgel, Rafael Brodbeck, Rafael Nogueira, Dante Gallian, Mariana Tondati, além de Letícia e Juliano",
      "Aulas ao vivo com a Letícia (mentoria e acompanhamento com os fundadores)",
      "Magister Box: produtos feitos sob medida para cada edição e livros selecionados, entregues em casa com frete incluso, a partir da assinatura",
      "Comunidade Ágora: círculo social de alto nível",
      "Clube do Livro: encontros guiados de análise e debate de grandes obras",
      "Acesso preferencial às L'ACADEMIA Talks (ingressos em primeira mão)",
      "Acervo de palestras e eventos (O Farol e A Forja)",
      "4 governanças: da Mente, Pessoal, Profissional, do Lar e da Família",
      "Fundadores: Letícia Cazarré (fundadora) e Juliano Cazarré (cofundador)",
    ],
  },
  {
    id: "estrategista-online",
    arquivos: [
      { titulo: "Playbook 1 — O ponto de partida para uma vida intencional", url: "/propostas/Estrategista-Playbook-1-Ponto-de-Partida.pdf" },
      { titulo: "Playbook 2 — O pré-planejamento: Diagnóstico e verdade brutal", url: "/propostas/Estrategista-Playbook-2-Pre-Planejamento.pdf" },
    ],
    nome: "A Estrategista Encontros Online",
    valor: 20000,
    descricao: "Programa intensivo de visão e ação estratégica: \"A vida que você sonha não acontece por acaso. Acontece por design.\"",
    categoria: "mentoria",
    emoji: "🧭",
    tipo: "high",
    cartao12x: 2083.33,
    entrada35: 0,
    restante: 0,
    parc6: 0,
    temEntradaParcelas: false,
    garantia: "A confirmar",
    avisos: [
      "Entrada por formulário de aplicação — a equipe entra em contato para confirmar a vaga",
      "Vagas limitadas",
    ],
    entregaveis: [
      "8 encontros online ao vivo com a Letícia, semanais, com microfone aberto (ela orienta o caso de cada aluna)",
      "3 pilares: Clareza e Visão · Estratégia e Execução · Mentalidade e Autonomia",
      "Gravações vitalícias",
      "Grupo exclusivo no WhatsApp",
      "Kit de ferramentas: One Page Plan, Matriz de Eisenhower, Ideal Day, métodos de decisão",
    ],
  },
  {
    id: "estrategista",
    checkoutUrl: "https://letciacazarre.herospark.co/curso-a-estrategista",
    nome: "A Estrategista (Gravado)",
    valor: 2000,
    valorOriginal: 5000,
    descricao: "Curso gravado de planejamento de vida — você como CEO da própria vida",
    categoria: "curso",
    emoji: "🎯",
    tipo: "low",
    cartao12x: 206.8,
    entrada35: 700,
    restante: 1300,
    parc6: 217,
    garantia: "A confirmar",
    entregaveis: [
      "Curso 100% gravado — assista no seu ritmo",
      "Life Design: planejamento como identidade (\"você como CEO da própria vida\"), valores inegociáveis, visualização de alta performance e hierarquia de prioridades",
      "Diagnóstico de 3 perguntas, One Page e plano tático do anual ao semanal",
      "Método em 5 etapas: Diagnosticar, Definir visão, Quebrar (mês), Executar (semana), Revisar e ajustar",
      "Ferramentas: One Page (máx. 10 a 12 metas em 3 áreas), Lei do Sacrifício, Foco Único Semanal e Morning Manifesto",
      "Exercícios e reflexões em cada aula",
      "Acesso vitalício ao conteúdo",
    ],
  },
  {
    id: "voce-dirige",
    checkoutUrl: "https://letciacazarre.herospark.co/voce-dirige",
    nome: "Curso Você Dirige",
    valor: 960,
    valorOriginal: 1597,
    descricao: "Curso gravado — Método dos 3 pilares: pessoal, profissional e interior",
    categoria: "curso",
    emoji: "🚗",
    tipo: "low",
    cartao12x: 99.3,
    entrada35: 340,
    restante: 630,
    parc6: 105,
    garantia: "7 dias",
    entregaveis: [
      "Método dos 3 pilares: pessoal, profissional e interior",
      "8 semanas · 8 módulos de 3 a 4 aulas de até 20 min, gravadas em estúdio (celular ou computador)",
      "Acesso imediato após o pagamento e acesso permanente",
      "Exercícios práticos: cada aula traz um passo concreto para aplicar na semana",
      "Suporte contínuo da equipe",
      "🎁 Bônus: Diário de Transformação",
      "🎁 Bônus: Curadoria Letícia Cazarré (livros, filmes e músicas)",
    ],
    pdfUrl: "/propostas/Proposta-VoceDirige.pdf",
  },
  {
    id: "plano-a",
    checkoutUrl: "https://letciacazarre.herospark.co/workshop-plano-a-2026",
    nome: "Workshop Plano A",
    valor: 97,
    descricao: "Porta de entrada — workshop gravado em estúdio",
    categoria: "workshop",
    emoji: "📋",
    tipo: "low",
    cartao12x: 10,
    entrada35: 34,
    restante: 63,
    parc6: 11,
    portaDeEntrada: true,
    garantia: "7 dias",
    entregaveis: [
      "Workshop gravado em estúdio (1h40)",
      "Planejar do macro ao micro (5 anos, 3 anos, 1 ano, mês, semana, dia) e criar horários dinâmicos",
      "Caderno de Exercícios (Pomodoro, Time Blocking)",
      "One Page de Visão de Vida (Pessoal, Profissional, Interior)",
      "Acesso por 1 ano",
    ],
  },
];

// ─── HELPERS ────────────────────────────────────────────────────────────────

/** Formatar valor em BRL */
export const brl = (n: number) =>
  "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
