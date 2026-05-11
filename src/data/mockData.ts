// ============================================================
// Mock Data — Dados de demonstração para todas as telas do MVP
// ============================================================

export type Tarefa = {
  id: string;
  titulo: string;
  descricao?: string;
  responsavel: { nome: string; iniciais: string };
  prioridade: "alta" | "media" | "baixa";
  prazo: string;
  status: "fazer" | "progresso" | "revisao" | "concluido";
  subtarefas?: { titulo: string; concluida: boolean }[];
};

export type Contato = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  pilar: "pessoal" | "profissional" | "interior" | null;
  tags: string[];
  origem: string;
  ultimaInteracao: string;
  produtos: string[];
};

export type AplicacaoTheWay = {
  id: string;
  nome: string;
  email: string;
  dataAplicacao: string;
  status: "recebida" | "triagem" | "call_leticia" | "aprovada" | "recusada" | "contratada" | "em_mentoria";
  resumo: string;
  observacoes?: string;
  notaConfidencial?: string;
};

export type Venda = {
  id: string;
  produto: string;
  valor: number;
  data: string;
  cliente: string;
  fonte: string;
  status: "paga" | "pendente" | "reembolsada";
  parcelas?: number;
};

export type PautaConteudo = {
  id: string;
  titulo: string;
  pilar: "pessoal" | "profissional" | "interior";
  formato: "post" | "carrossel" | "reels" | "episodio" | "newsletter" | "youtube";
  status: "rascunho" | "revisao_leticia" | "aprovado" | "publicado";
  responsavel: string;
  dataPrevista: string;
  plataforma: string;
};

// ─── TAREFAS ────────────────────────────────────────────────

export const tarefasMock: Tarefa[] = [
  {
    id: "t1",
    titulo: "Revisar copy do e-mail de lançamento VD",
    responsavel: { nome: "Ana Beatriz", iniciais: "AB" },
    prioridade: "alta",
    prazo: "2026-05-10",
    status: "fazer",
    subtarefas: [
      { titulo: "Escrever rascunho", concluida: true },
      { titulo: "Revisão de tom de voz", concluida: false },
      { titulo: "Aprovação Letícia", concluida: false },
    ],
  },
  {
    id: "t2",
    titulo: "Gravar episódio 47 do Vai Por Mim",
    responsavel: { nome: "Letícia Cazarré", iniciais: "LC" },
    prioridade: "alta",
    prazo: "2026-05-11",
    status: "fazer",
  },
  {
    id: "t3",
    titulo: "Criar criativos para Instagram — semana 20",
    responsavel: { nome: "Mariana Costa", iniciais: "MC" },
    prioridade: "media",
    prazo: "2026-05-12",
    status: "progresso",
  },
  {
    id: "t4",
    titulo: "Follow-up boletos em aberto — Maio",
    responsavel: { nome: "Juliana Reis", iniciais: "JR" },
    prioridade: "media",
    prazo: "2026-05-09",
    status: "progresso",
  },
  {
    id: "t5",
    titulo: "Triagem das 3 novas aplicações THE WAY",
    responsavel: { nome: "Juliana Reis", iniciais: "JR" },
    prioridade: "alta",
    prazo: "2026-05-10",
    status: "revisao",
  },
  {
    id: "t6",
    titulo: "Fechar relatório financeiro Abril",
    responsavel: { nome: "Camila Duarte", iniciais: "CD" },
    prioridade: "media",
    prazo: "2026-05-08",
    status: "concluido",
  },
  {
    id: "t7",
    titulo: "Publicar carrossel — Pilar Interior",
    responsavel: { nome: "Mariana Costa", iniciais: "MC" },
    prioridade: "baixa",
    prazo: "2026-05-09",
    status: "concluido",
  },
  {
    id: "t8",
    titulo: "Agendar call com mentorada Renata",
    responsavel: { nome: "Letícia Cazarré", iniciais: "LC" },
    prioridade: "media",
    prazo: "2026-05-13",
    status: "fazer",
  },
];

// ─── CRM CONTATOS ───────────────────────────────────────────

export const contatosMock: Contato[] = [
  { id: "c1", nome: "Fernanda Oliveira", email: "fernanda@email.com", telefone: "(11) 99123-4567", pilar: "profissional", tags: ["VD Aluna", "Newsletter"], origem: "Instagram", ultimaInteracao: "2026-05-08", produtos: ["Você Dirige", "Plano A"] },
  { id: "c2", nome: "Beatriz Santos", email: "bia.santos@email.com", telefone: "(21) 98765-4321", pilar: "pessoal", tags: ["THE WAY Mentorada"], origem: "Indicação", ultimaInteracao: "2026-05-07", produtos: ["THE WAY 2026", "Você Dirige"] },
  { id: "c3", nome: "Carolina Mendes", email: "carol.mendes@email.com", telefone: "(31) 97654-3210", pilar: "interior", tags: ["Lead", "Newsletter"], origem: "Petit Journal", ultimaInteracao: "2026-05-05", produtos: ["Plano A"] },
  { id: "c4", nome: "Mariana Lopes", email: "mari.lopes@email.com", telefone: "(41) 96543-2109", pilar: "profissional", tags: ["VD Aluna"], origem: "Meta Ads", ultimaInteracao: "2026-05-04", produtos: ["Você Dirige"] },
  { id: "c5", nome: "Isabela Ferreira", email: "isa.f@email.com", telefone: "(51) 95432-1098", pilar: null, tags: ["Lead Frio"], origem: "Google", ultimaInteracao: "2026-04-28", produtos: [] },
  { id: "c6", nome: "Renata Alves", email: "renata.alves@email.com", telefone: "(11) 94321-0987", pilar: "pessoal", tags: ["THE WAY Mentorada", "Embaixadora"], origem: "Indicação", ultimaInteracao: "2026-05-09", produtos: ["THE WAY 2026", "Você Dirige", "Plano A"] },
  { id: "c7", nome: "Patrícia Costa", email: "pat.costa@email.com", telefone: "(21) 93210-9876", pilar: "profissional", tags: ["Newsletter"], origem: "Substack", ultimaInteracao: "2026-05-01", produtos: [] },
  { id: "c8", nome: "Luciana Ribeiro", email: "lu.ribeiro@email.com", telefone: "(31) 92109-8765", pilar: "interior", tags: ["VD Aluna", "Aplicante THE WAY"], origem: "Instagram", ultimaInteracao: "2026-05-06", produtos: ["Você Dirige", "Plano A"] },
];

// ─── PIPELINE THE WAY ───────────────────────────────────────

export const aplicacoesMock: AplicacaoTheWay[] = [
  { id: "a1", nome: "Luciana Ribeiro", email: "lu.ribeiro@email.com", dataAplicacao: "2026-05-06", status: "recebida", resumo: "Empresária, 34 anos. Busca realinhamento entre carreira e vida pessoal após burnout.", observacoes: "" },
  { id: "a2", nome: "Camila Albuquerque", email: "camila.alb@email.com", dataAplicacao: "2026-05-05", status: "recebida", resumo: "Advogada, transição de carreira para educação. Já fez Plano A e Você Dirige." },
  { id: "a3", nome: "Débora Nascimento", email: "debora.n@email.com", dataAplicacao: "2026-05-03", status: "triagem", resumo: "Psicóloga clínica, quer estruturar prática privada usando os 3 pilares.", observacoes: "Perfil muito forte. Priorizei." },
  { id: "a4", nome: "Tatiana Moura", email: "tati.moura@email.com", dataAplicacao: "2026-05-01", status: "call_leticia", resumo: "Dentista com consultório em SP, quer equilíbrio trabalho-família.", observacoes: "Call agendada pra 12/05 às 15h" },
  { id: "a5", nome: "Juliana Prado", email: "ju.prado@email.com", dataAplicacao: "2026-04-28", status: "aprovada", resumo: "Arquiteta, 2 filhos, já mentorada informal. Recomendação da Renata Alves.", observacoes: "Letícia aprovou com entusiasmo" },
  { id: "a6", nome: "Renata Alves", email: "renata.alves@email.com", dataAplicacao: "2026-01-15", status: "em_mentoria", resumo: "Empresária do ramo alimentício. Turma 2026.", notaConfidencial: "Evolução extraordinária no pilar interior. Momento delicado na relação com sócia — acompanhar de perto." },
  { id: "a7", nome: "Beatriz Santos", email: "bia.santos@email.com", dataAplicacao: "2026-01-10", status: "em_mentoria", resumo: "Consultora de RH, foco em liderança feminina. Turma 2026.", notaConfidencial: "Progresso constante no pilar profissional. Está criando curso próprio — orientar sobre posicionamento." },
];

// ─── VENDAS ─────────────────────────────────────────────────

export const vendasMock: Venda[] = [
  { id: "v1", produto: "Workshop Plano A", valor: 97, data: "2026-05-09", cliente: "Fernanda Oliveira", fonte: "Meta Ads", status: "paga" },
  { id: "v2", produto: "Workshop Plano A", valor: 97, data: "2026-05-09", cliente: "Amanda Souza", fonte: "Instagram", status: "paga" },
  { id: "v3", produto: "Você Dirige", valor: 960, data: "2026-05-08", cliente: "Carolina Mendes", fonte: "E-mail", status: "paga", parcelas: 6 },
  { id: "v4", produto: "Você Dirige", valor: 960, data: "2026-05-07", cliente: "Mariana Lopes", fonte: "Meta Ads", status: "pendente", parcelas: 12 },
  { id: "v5", produto: "Workshop Plano A", valor: 97, data: "2026-05-07", cliente: "Patricia Lima", fonte: "Substack", status: "paga" },
  { id: "v6", produto: "THE WAY Mentoria", valor: 18000, data: "2026-05-05", cliente: "Juliana Prado", fonte: "Indicação", status: "pendente", parcelas: 12 },
  { id: "v7", produto: "Workshop Plano A", valor: 97, data: "2026-05-04", cliente: "Isabela Ferreira", fonte: "Google", status: "reembolsada" },
  { id: "v8", produto: "Você Dirige", valor: 960, data: "2026-05-03", cliente: "Luciana Ribeiro", fonte: "Instagram", status: "paga", parcelas: 6 },
  { id: "v9", produto: "Workshop Plano A", valor: 97, data: "2026-05-02", cliente: "Renata Torres", fonte: "Meta Ads", status: "paga" },
  { id: "v10", produto: "Você Dirige", valor: 960, data: "2026-05-01", cliente: "Sofia Andrade", fonte: "E-mail", status: "paga", parcelas: 3 },
];

export const vendasPorMes = [
  { mes: "Jan", valor: 12400 },
  { mes: "Fev", valor: 18700 },
  { mes: "Mar", valor: 22100 },
  { mes: "Abr", valor: 31500 },
  { mes: "Mai", valor: 45230 },
];

// ─── CALENDÁRIO EDITORIAL ───────────────────────────────────

export const pautasMock: PautaConteudo[] = [
  { id: "p1", titulo: "Carrossel: 3 sinais de que você vive no automático", pilar: "interior", formato: "carrossel", status: "rascunho", responsavel: "Mariana Costa", dataPrevista: "2026-05-12", plataforma: "Instagram" },
  { id: "p2", titulo: "Reels: A regra dos 3 pilares em 60 segundos", pilar: "pessoal", formato: "reels", status: "revisao_leticia", responsavel: "Mariana Costa", dataPrevista: "2026-05-13", plataforma: "Instagram" },
  { id: "p3", titulo: "Episódio 47: Você não precisa mudar de vida", pilar: "profissional", formato: "episodio", status: "rascunho", responsavel: "Letícia Cazarré", dataPrevista: "2026-05-14", plataforma: "Spotify" },
  { id: "p4", titulo: "Post: Bastidores do encontro presencial THE WAY", pilar: "pessoal", formato: "post", status: "aprovado", responsavel: "Ana Beatriz", dataPrevista: "2026-05-10", plataforma: "Instagram" },
  { id: "p5", titulo: "Petit Journal #42: O preço da pressa", pilar: "interior", formato: "newsletter", status: "revisao_leticia", responsavel: "Letícia Cazarré", dataPrevista: "2026-05-11", plataforma: "Substack" },
  { id: "p6", titulo: "YouTube: Tour pelo meu escritório", pilar: "profissional", formato: "youtube", status: "rascunho", responsavel: "Mariana Costa", dataPrevista: "2026-05-16", plataforma: "YouTube" },
  { id: "p7", titulo: "Carrossel: 5 livros que mudaram minha visão de trabalho", pilar: "profissional", formato: "carrossel", status: "publicado", responsavel: "Mariana Costa", dataPrevista: "2026-05-08", plataforma: "Instagram" },
  { id: "p8", titulo: "Reels: Manhã de uma mãe de 6", pilar: "pessoal", formato: "reels", status: "publicado", responsavel: "Ana Beatriz", dataPrevista: "2026-05-07", plataforma: "Instagram" },
];

// ─── HELPERS ────────────────────────────────────────────────

export const pilarColors = {
  pessoal: { bg: "bg-pilar-pessoal/10", text: "text-pilar-pessoal", label: "Pessoal" },
  profissional: { bg: "bg-pilar-profissional/10", text: "text-pilar-profissional", label: "Profissional" },
  interior: { bg: "bg-pilar-interior/10", text: "text-pilar-interior", label: "Interior" },
};

export const prioridadeColors = {
  urgente: { bg: "bg-red-600/10", text: "text-red-700 dark:text-red-300", label: "Urgente" },
  alta: { bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400", label: "Alta" },
  media: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", label: "Média" },
  normal: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", label: "Normal" },
  baixa: { bg: "bg-green-500/10", text: "text-green-600 dark:text-green-400", label: "Baixa" },
};

export const statusVendaColors = {
  paga: { bg: "bg-green-500/10", text: "text-green-600 dark:text-green-400", label: "Paga" },
  pendente: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", label: "Pendente" },
  reembolsada: { bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400", label: "Reembolsada" },
};

export const formatoIcons: Record<string, string> = {
  post: "📸",
  carrossel: "🎠",
  reels: "🎬",
  episodio: "🎙️",
  newsletter: "✉️",
  youtube: "▶️",
};
