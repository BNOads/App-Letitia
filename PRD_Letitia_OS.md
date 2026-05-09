# LETITIA OS — Product Requirements Document

> **Sistema operacional interno da Letícia Cazarré**
> Plataforma de gestão exclusiva para a Letícia e seu time interno.

**Versão:** 2.0
**Data:** Maio de 2026
**Autor:** Equipe BNOads em parceria com Letitia
**Status:** Rascunho aprovado para arquitetura

> **Mudança v2.0:** Escopo reduzido para gestão interna apenas. Não inclui plataforma de entrega de cursos, área de aluna, comunidade pra mentoradas ou qualquer interface pública pra cliente final. Cursos e mentorias continuam sendo entregues nas plataformas atuais (Hotmart, Substack, áreas externas) — o LetitiAPP é onde a equipe **opera a empresa**.

---

## 0. Sumário Executivo

A **LetitiAPP** é a plataforma interna de gestão da Letícia Cazarré: um sistema operacional que centraliza a rotina do time, dos lançamentos, do conteúdo, do financeiro, do CRM e do processo seletivo da mentoria THE WAY.

O escopo é deliberadamente **interno**. A entrega dos cursos (Workshop Plano A, Você Dirige) continua na Hotmart e nas plataformas atuais. A newsletter Petit Journal continua no Substack. O grupo de WhatsApp da THE WAY continua no WhatsApp. **O LetitiAPP não substitui essas ferramentas finais — ele substitui as planilhas, os post-its e os silos que a equipe usa pra fazer tudo isso acontecer.**

A inspiração vem de duas referências comprovadas — o **BORAnaOBRA Hub** e o **BNOads App** —, mas reposicionada com a estética editorial da marca Letícia Cazarré e com o foco rigorosamente operacional: tarefas, reuniões, calendário editorial, vendas, processo seletivo, lançamentos, equipe, financeiro.

O roadmap é dividido em três fases: **MVP (3 meses)**, **V1 (6 meses)**, **V2 (12 meses)**. A stack é Supabase + React + Edge Functions, com RLS rígido, integrações com Hotmart, Asaas, Brevo, WhatsApp, Google Calendar, Substack, Meta Ads e IA Gemini.

---

## 1. Contexto e Visão

### 1.1. O negócio da Letícia hoje

Letícia Cazarré opera um portfólio editorial baseado na **Filosofia dos Três Pilares** — Pessoal, Profissional e Interior. A escada de produtos vai de gratuito a alto-ticket: o conteúdo orgânico (Instagram, Vai Por Mim Podcast, Petit Journal) alimenta a base, o Workshop Plano A (R$ 97) é a porta de entrada paga, o Você Dirige (R$ 960) é o produto intermediário, e a THE WAY Mentoria é o programa anual exclusivo no topo. Em paralelo, existe a Livraria Cazarré.

Por trás desse portfólio existe uma equipe enxuta que precisa coordenar lançamentos, atendimento, conteúdo, financeiro, processo seletivo da mentoria, gestão de pautas e a vida real da Letícia (mãe de seis, com agenda comprometida). A operação não pode parar.

### 1.2. O problema (recorte interno)

Hoje a equipe opera em silos: Hotmart pra venda, Substack pra newsletter, Google Drive pra arquivo, WhatsApp pra atendimento, planilha pra financeiro, Trello/Notion pra tarefa, e-mail pra processo seletivo. O preço aparece em três lugares:

**Para a equipe:** atendimento responde a mesma pergunta dez vezes porque não tem CRM unificado. Lançamento depende de planilha que ninguém atualiza. Processo seletivo da THE WAY (formulário → triagem → call com Letícia) vive entre Typeform, WhatsApp e e-mail. Métricas de venda chegam atrasadas.

**Para a Letícia:** ela não enxerga, em um lugar só, o que está acontecendo. Vendas estão em uma planilha. Próximas calls em outro calendário. Aplicações da mentoria em uma pasta de e-mail. Pautas de conteúdo em um Notion. Lidera no escuro.

**Para o crescimento:** sem dado consolidado e sem fluxo padronizado, escalar significa adicionar pessoas — não eficiência. A operação fica refém da memória das pessoas que estão lá.

### 1.3. A visão da LetitiAPP

Construir o **escritório digital** da Letícia: um lugar onde a equipe abre o navegador, faz login com Google, e vê tudo que importa em uma tela só. Onde uma venda na Hotmart aparece em 30 segundos no CRM da equipe. Onde uma aplicação THE WAY chega via formulário público e vira card no kanban da equipe automaticamente. Onde a Letícia olha o app no celular e vê as 3 vendas que aconteceram, as 2 calls da semana, o post que precisa de aprovação dela e o gráfico do mês.

Não é um app que a aluna usa. É **a sala de máquinas da empresa**. A aluna nunca vê.

### 1.4. Princípios de produto

**Elegância editorial.** Toda interface respira como uma revista — espaço em branco generoso, tipografia com hierarquia clara, paleta sóbria. Não é um dashboard corporativo genérico. Mesmo sendo interno, a equipe da Letícia usa esse sistema todo dia — ele precisa parecer uma extensão da marca.

**Profundidade real.** Cada tela responde uma pergunta de verdade. Nada de KPI decorativo. Se um número aparece, é porque a equipe age sobre ele.

**Confidencialidade absoluta.** A mentoria THE WAY tem confidencialidade contratual com cada mentorada. Mesmo sendo um sistema interno, anotações da Letícia sobre cada mentorada são tratadas com nível extra de RLS. Roles bem definidas: nem todo colaborador acessa tudo.

**Os Três Pilares como categorização.** Conteúdos, leads e relatórios podem ser etiquetados por pilar (Pessoal/Profissional/Interior). Isso dá dado pra Letícia entender em qual pilar a comunidade mais engaja.

**Velocidade brutal.** A Letícia opera em alta velocidade. Login com Google em 1 clique, busca global por Cmd+K, atalhos de teclado em tudo. Mobile bom o suficiente pra revisar entre reuniões.

**Sistema interno, mas não feio.** O fato de ninguém de fora ver o app não é desculpa pra UI corporativa genérica. A equipe da Letícia é a primeira embaixadora da marca — o ambiente onde ela trabalha precisa refletir isso.

---

## 2. Identidade Visual e Design System

### 2.1. Marca

**Nome do sistema:** LetitiAPP (interno).

**Tagline interna:** *"O sistema que sustenta o sistema."*

**Inspiração estética:** Petit Journal (newsletter da Letícia), revistas editoriais (Kinfolk, The Gentlewoman), elegância serena com bastante respiro.

### 2.2. Paleta de cores

Extraída diretamente da identidade dos sites (leticiacazarre.com.br, the-way-2026, voce-dirige):

**Primárias:**
- `letitia-cream` — `#F5F1EA` (off-white quente, fundo principal)
- `letitia-bone` — `#EFEAE0` (variação mais escura para cards)
- `letitia-ink` — `#1A1A1A` (texto, headers fortes)

**Destaque:**
- `letitia-gold` — `#C4A47C` (CTAs, acentos premium)
- `letitia-clay` — `#A66B4A` (variação quente para badges e hovers)
- `letitia-sage` — `#7A8B6F` (verde sálvia, sucesso)
- `letitia-stone` — `#8A8275` (texto secundário, bordas)

**Os Três Pilares (categorização semântica):**
- `pilar-pessoal` — `#B8956A` (dourado quente)
- `pilar-profissional` — `#5C6B5A` (verde profundo)
- `pilar-interior` — `#7A6457` (marrom contemplativo)

Modo escuro existe e mantém a sobriedade: fundo carvão `#1F1C18` mantendo o dourado.

### 2.3. Tipografia

**Display / Títulos:** *Playfair Display* (serifa editorial) ou *Cormorant Garamond* — H1/H2, nomes em fichas, citações.

**UI / Corpo:** *Inter* ou *Söhne* — interface, formulários, tabelas, botões.

**Quote:** *Italiana* ou itálico de Playfair, pra frases-chave.

Pesos: 300 / 400 / 500 / 700. Nada de extra-bold.

### 2.4. Componentes (Design System)

Base: **shadcn/ui + Radix**, customizado com a paleta.

**Cards:** borda sutil (`1px solid letitia-stone/20`), radius `12px`, padding 24px+. Sombra mínima (`0 1px 2px rgba(0,0,0,0.04)`).

**Botões:** primário `letitia-ink` com texto cream; secundário `letitia-gold`; fantasma com borda fina. Altura 44px.

**Inputs:** linha embaixo (estilo editorial), focus com underline dourado.

**Avatares:** circulares com fallback em iniciais sobre `letitia-bone`.

**Tabelas:** alinhamento à esquerda, dividers `letitia-stone/10`, header em uppercase com letter-spacing largo.

**Loading:** ornamento sutil de florãozinho (`✦`, igual o do site da THE WAY), nunca spinner genérico.

### 2.5. Layout e densidade

Sidebar à esquerda com logo Letitia no topo. Navegação vertical. Conteúdo em colunas com max-width 1280px. Densidade média — legibilidade acima de quantidade. Desktop-first (a equipe trabalha no notebook), com mobile responsivo bom o suficiente pra Letícia revisar no celular.

---

## 3. Personas (apenas internas)

**Letícia (Dona / Founder).** Aprovação final em tudo. Quer ver o panorama em 30 segundos. Acesso total. Usa muito mobile entre reuniões. Lê e aprova conteúdo, cita mentoradas, escreve notas confidenciais.

**Equipe de Relacionamento (atendimento + processo seletivo).** Triagem das aplicações THE WAY, atendimento WhatsApp, follow-up de boletos, suporte a alunas via chat. Vive no CRM e no pipeline.

**Gestão de Conteúdo.** Roda calendário editorial (Instagram, podcast, newsletter, lives), controla pautas, edita peças, envia pra Letícia revisar.

**Operação / Lançamentos.** Coordena cada novo lançamento (reabertura do Você Dirige, Black Friday do Plano A, novas turmas da THE WAY), controla cronograma, métricas de funil, criativos, tráfego.

**Financeiro.** Concilia Hotmart + Asaas + receitas externas, gerencia comissões de afiliados, projeção mensal, relatórios de fechamento.

**Webdesigner / Editor de Vídeo (terceirizados ou internos).** Acesso restrito, focado em entregáveis (criativos, edição de podcast, página de captura).

**Convidados / Fornecedores externos.** Acesso pontual, somente leitura, escopo mínimo (ex.: contador vê só financeiro).

---

## 4. Arquitetura de Módulos

Quatro **camadas** internas. Cada módulo tem prioridade (P0 = MVP, P1 = V1, P2 = V2).

### 4.1. Camada 1 — Operação Interna

**Dashboard Home (P0).** Tela inicial com cards arrastáveis: vendas do mês, próximas calls da Letícia, novas aplicações THE WAY, tarefas do dia, aniversários da equipe, próximas publicações de conteúdo. Filtros por pilar (visualizar só Pessoal, Profissional ou Interior).

**Tarefas (P0).** Kanban + lista, com prioridade, prazo, responsável, subtarefas, comentários, anexos, recorrência (próximo dia útil), markdown, atribuição múltipla, vinculação a leads/lançamentos/conteúdos. Lembretes diários por WhatsApp pra cada colaboradora.

**Reuniões (P0).** Editor rich-text (Tiptap colaborativo via Yjs) com blocos conversíveis em tarefa. Gravações com upload, transcrição via Whisper local em WASM. Anotações automáticas via Gemini (opt-in). Atas de reunião semanais de conteúdo, lançamento, financeiro, equipe.

**Agenda (P0).** Calendário ano/mês/semana, sincronização Google Calendar + Cal.com. Eventos com participantes geram tarefas automáticas. Visualização especial pra calls da Letícia (aplicação THE WAY, gravação podcast, reuniões internas).

**Equipe / Gestão de Usuários (P0).** Perfis com avatar, role (admin / dono / equipe-relacionamento / conteudo / lancamentos / financeiro / fornecedor / convidado), departamentos, reset de senha. Login com Google OAuth.

**1x1 e Conversa Franca (P1).** Templates estruturados de reunião 1x1 da Letícia/líderes com cada colaboradora. Histórico de cada um, pautas pendentes, follow-ups.

**OKRs (P1).** Ciclos trimestrais com objetivos e key results. Cada colaboradora vê os seus + os da empresa.

**PDIs (P1).** Plano de Desenvolvimento Individual por colaboradora — aulas internas, aulas externas, prazos, progresso visual.

**Notas Flutuantes (P1).** Ícone que abre uma nota global persistente — tipo um caderno digital.

**Senhas Compartilhadas (P1).** Cofre criptografado com RLS por equipe. Acesso à Hotmart, Asaas, Brevo, etc.

**Busca Global Cmd+K (P0).** Acessa qualquer lead, contato, tarefa, reunião, conteúdo, transcrição em ≤200ms.

**Aniversários e Cultura (P1).** Aniversários da equipe no dashboard. Missão, visão, valores acessíveis a todos. "Time em campo" — quem está atendendo qual cliente/aluna agora.

### 4.2. Camada 2 — CRM, Vendas e Mentoria (visão interna)

**CRM de Contatos (P0).** Hub unificado de toda mulher que já entrou em contato com a marca. Matching por e-mail e telefone com pg_trgm (alta precisão). Cada contato tem timeline interna: entrou na newsletter → comprou Plano A → fez Você Dirige → aplicou pra THE WAY. **Visualização exclusiva da equipe** — a aluna não acessa.

**Pipeline THE WAY (P0).** Kanban dedicado ao processo seletivo. Colunas: Aplicação Recebida → Triagem → Call com Letícia → Aprovada → Recusada (gentilmente) → Contratada → Em Mentoria. Cada card mostra: trecho da aplicação, observações da equipe, status do pagamento, anotações privadas da Letícia. **Pipeline 100% interno** — a aluna recebe e-mails e mensagens, mas não vê o sistema.

**Pipelines Customizáveis (P1).** Pipeline de afiliados, pipeline de patrocínios, pipeline de imprensa, pipeline de reativação de aluna inativa. Colunas customizáveis por pipeline.

**Vendas (P0).** Importação automática Hotmart e Asaas (via webhooks + sync agendado). Cadastro manual (mentoria fechada por contrato). Comissões de afiliados, parcelamento, vendedor responsável, funil de origem (UTM). Export PDF de relatórios.

**Cobranças (P1).** Follow-up multi-stage de boleto/Pix em aberto, com métricas de recuperação. Templates editoriais por estágio (1º lembrete, 2º, último aviso). A equipe dispara, mas o tom é da marca.

**Sessão Estratégica / Calls da Letícia (P1).** Tela dedicada às próximas calls de aplicação THE WAY que a Letícia vai fazer. Lista cronológica com link Zoom, ficha resumida da candidata, espaço pra anotação ao vivo. Após a call, marca aprovado/recusado/aguardar.

**Anotações Confidenciais da Mentoria (P0).** Ficha por mentorada ativa da THE WAY (visível só pra Letícia + 1-2 pessoas autorizadas). Notas ao longo do ano, observações pessoais, evolução percebida, momentos importantes. **Tabela com RLS extra reforçado.**

**Lista de Mentoradas Ativas (P0).** Visualização interna das mentoradas da turma corrente — nome, contato, contrato ativo, mês na mentoria, próximo encontro presencial, status financeiro. Não é uma área de membro pra mentorada — é uma lista pra equipe operar.

### 4.3. Camada 3 — Conteúdo, Marketing e Lançamentos

**Calendário Editorial (P0).** Pautas de Instagram, podcast Vai Por Mim, newsletter Petit Journal, YouTube. Cada peça tem pilar (Pessoal/Profissional/Interior), formato (post, carrossel, reels, episódio, edição), status (rascunho → revisão Letícia → aprovado → publicado), responsável e data. Visão calendário, kanban e lista.

**Pautas e Roteiros (P0).** Editor rich-text colaborativo (Tiptap + Yjs) por pauta. Letícia edita comentários inline, aprova versão final. Histórico de versões.

**Vai Por Mim Podcast (P1).** Cadastro de episódios com áudio, transcrição automática (Whisper local), capa, descrição, links das plataformas (Spotify, YouTube, Apple). Métrica de plays via integrações.

**Petit Journal — Métricas (P1).** Integração read-only com Substack para puxar dados (assinantes, open rate, click rate por edição). A newsletter continua sendo escrita e enviada no Substack.

**Conteúdo Social — Tracking (P1).** Cadastro de posts Instagram/TikTok/Shorts já publicados, com link, métricas (likes, salvos, alcance) puxadas via Meta API quando possível. Não é editor de post — é tracking interno.

**Captions com IA (P2).** Geração assistida de copy seguindo o tom de voz da Letícia (corpus treinado a partir das newsletters dela). Saída sempre revisada antes de publicar.

**Funis de Lançamento (P0).** Cadastro de cada novo lançamento (Você Dirige Setembro 2026, Workshop Plano A Black Friday, Reabertura THE WAY 2027). Cada lançamento tem: cronograma Gantt, orçamento de tráfego, checklist de readiness, criativos, métricas (CPL, CPM, CTR, ROI), diário de bordo, equipe alocada.

**UTM Creator (P0).** Geração de links curtos (6 chars) com UTM padronizado por lançamento/canal. Essencial pra atribuir vendas corretamente nas planilhas e dashboards.

**E-mail Marketing — Operação (P1).** Disparo de campanhas via Brevo (proxy edge function). Segmentação por produto consumido, pilar de interesse, estágio na escada. Editor com templates editoriais. Logs com retry e métricas.

**Automação de E-mail (P1).** Sequências automatizadas: boas-vindas, ascensão (Plano A → Você Dirige), reativação. Editor visual de fluxo com nodes (incluindo nó de WhatsApp).

**WhatsApp Marketing (P1).** Broadcasts em massa com intervalos randômicos. Lembretes de live, encontro de mentoria, abertura de lançamento. Integração com Evolution API ou Z-API.

**Chat Unificado / Atendimento (P1).** Chatwoot embedado pra atendimento centralizado de WhatsApp, e-mail e Instagram DM. Realtime, deep-linking pra ficha do contato no CRM, mensagens agendadas, quick replies, busca otimizada.

**Quiz dos Três Pilares (P1).** Cadastro do quiz interno (lógica de jump, análise por pilar). Quiz é hospedado fora do sistema mas resultados caem no CRM como leads classificados por pilar.

**Sales Page Tracker (P2).** Cadastro das páginas de vendas ativas com métricas (visitantes, conversão, abandono).

**Tráfego Pago (P1).** Sync Meta Ads pra ver gastos, CPC, CPM, CPL e CPA por campanha. Dashboard agregado por lançamento. Detalhamento por criativo.

### 4.4. Camada 4 — Financeiro, Conhecimento e Suporte Interno

**Dashboard Financeiro (P0).** Receita bruta mês, receita por produto, comissões, projeção, comparativo ano. Gráficos com Recharts. Filtros por produto, vendedor, fonte.

**Movimentações (P0).** Lançamento manual de receitas e despesas. Sync com planilha Google Sheets durante a transição.

**Comissões e Afiliados (P1).** Cadastro de afiliada, vendas atribuídas, comissão calculada, repasse, status de pagamento.

**Projeções (P1).** Editor de projeção mensal/trimestral/anual com cenários (conservador / esperado / otimista).

**Tickets Internos (P1).** A equipe abre ticket pra TI/operação interna (ex.: "Hotmart parou de sincronizar", "Asaas está dando erro X"). KPIs SLA, anexos.

**Treinamentos Internos (P1).** Cursos pra equipe: onboarding de nova colaboradora, treinamento de atendimento, treinamento de tom de voz da marca, manual da mentoria. Importação de POPs do Google Drive.

**Documentos / POPs (P1).** Editor de procedimentos. Cada POP tem versão, autor, data de revisão. Slug interno (não público).

**Bora News / Comunicado Interno (P1).** Newsletter interna semanal: o que vai acontecer, decisões, parabéns, métricas. Reduz ruído em WhatsApp da equipe.

**Transcrições (P1).** Whisper local em WASM (até 500MB) com fallback Google Drive. Transcreve áudios da Letícia, encontros internos, ligações com mentoradas (quando autorizado). Indexado na busca global.

**Relatórios com IA Executiva (P1).** Editor de relatórios com IA (Gemini). A Letícia pede "me dá o resumo de Outubro" e recebe: vendas + conteúdo publicado + sentimento de mentoradas + alertas. Pastas, anexos, export PDF.

**NPS Interno (P1).** A equipe registra os scores de NPS recebidos das alunas (via formulário externo) e o sistema agrega: dashboard por produto, alertas quando cai, insights via IA. Dado para a Letícia, não para a aluna.

**Gamificação Interna (P2).** Desafios trimestrais para a equipe interna. Pontuação, ranking, conquistas. Mantém o time engajado.

**Aceleradora / Eventos Presenciais (P1).** Cadastro dos encontros presenciais da THE WAY (lista de presença interna, fotos, depoimentos coletados, custos do evento, fornecedores). Operação interna.

### 4.5. Resumo de prioridade por fase

**MVP (Fase 1 — 3 meses):** Dashboard Home, Tarefas, Reuniões, Agenda, Equipe, Busca Global, CRM de Contatos, Pipeline THE WAY, Anotações Confidenciais Mentoria, Lista de Mentoradas Ativas, Vendas, Calendário Editorial, Pautas e Roteiros, Funis de Lançamento, UTM Creator, Dashboard Financeiro, Movimentações.

**V1 (Fase 2 — meses 4-6):** 1x1, OKRs, PDIs, Notas, Senhas, Pipelines Customizáveis, Cobranças, Sessão Estratégica, Petit Journal Métricas, Vai Por Mim, Conteúdo Social Tracking, E-mail Marketing, Automação, WhatsApp Marketing, Chat Unificado, Quiz, Tráfego Pago, Comissões, Projeções, Tickets, Treinamentos, POPs, Bora News, Transcrições, Relatórios IA, NPS Interno, Aceleradora.

**V2 (Fase 3 — meses 7-12):** Captions com IA, Sales Page Tracker, Gamificação Interna, Mobile App nativo, API interna pra parceiros, expansão de integrações.

---

## 5. Stack Técnica

### 5.1. Frontend

- **React 18 + TypeScript + Vite 7**
- **Tailwind CSS v3** com tema customizado (paleta + tipografia da marca)
- **shadcn/ui (Radix primitives)** customizado
- **React Router v6**
- **TanStack Query v5** (cache, server state)
- **Zustand 5** (state local de UI)
- **React Hook Form + Zod**
- **Tiptap 3 + Yjs + Hocuspocus** (editor colaborativo nas pautas e reuniões)
- **Lexical** (editor secundário com autolink/listas)
- **Recharts** (gráficos)
- **dnd-kit** (kanbans)
- **Framer Motion 12** (animações sutis)
- **date-fns** com timezone Brasil (BRT/UTC-3)
- **jsPDF + html2canvas** (export PDF)
- **xlsx** (import/export planilhas)
- **DOMPurify** (sanitização)
- **Sonner** (toasts)
- **Hugging Face Transformers.js** (Whisper local em WASM)

### 5.2. Backend

**Supabase (Lovable Cloud) como espinha:**

- **PostgreSQL 17** com Row Level Security em todas as tabelas críticas
- **Supabase Auth** (e-mail/senha + Google OAuth + magic link)
- **Supabase Storage** — buckets segregados: `avatars`, `tarefa-anexos`, `reuniao-gravacoes`, `criativos`, `relatorios-anexos`, `mentoria-confidencial` (RLS extra), `email-assets`, `pop-anexos`
- **Edge Functions (Deno)** — 30-40 funções serverless
- **pg_cron + pg_net** — jobs agendados
- **pg_trgm** — busca fuzzy (CRM, contatos, busca global)
- **Vault** — secrets

### 5.3. Integrações externas

| Integração | Uso |
|---|---|
| **Hotmart** | Sync de vendas (Plano A, Você Dirige, futuras ofertas) |
| **Asaas** | Sync de pagamentos recorrentes (mentoria THE WAY) |
| **Brevo** | E-mail transacional + campanhas |
| **Evolution API / Z-API** | WhatsApp (broadcasts, atendimento, lembretes) |
| **Substack** | Read-only de métricas da Petit Journal |
| **Google Calendar + Cal.com** | Agenda e agendamento de calls da Letícia |
| **Google Drive** | Sync de POPs, materiais, gravações |
| **Google Sheets** | Sync financeiro retroativo (até migrar) |
| **Meta Ads** | Sync de campanhas de tráfego |
| **Chatwoot** | Atendimento omnichannel |
| **Gemini AI** | IA executiva (resumos, anotações de reunião, relatórios) |
| **Spotify / YouTube** | Métricas de plays do podcast |

### 5.4. Edge Functions principais (~35)

**Sync e webhooks:** `webhook-hotmart`, `webhook-asaas`, `hotmart-sync`, `asaas-sync`, `webhook-aplicacao-theway`, `webhook-novo-lead`.

**Comunicação:** `send-email`, `send-internal-notification`, `brevo-proxy`, `chatwoot-proxy`, `evolution-proxy`, `whatsapp-broadcast`, `send-mentoria-reminder`.

**Cron:** `process-task-recurrence`, `process-whatsapp-queue`, `process-scheduled-emails`, `daily-team-digest`, `sync-substack-stats`, `weekly-financial-snapshot`, `sync-meta-ads`.

**IA:** `generate-meeting-summary`, `generate-report-summary`, `transcribe-audio`, `generate-three-pillars-tag`.

**Admin:** `create-user`, `delete-user`, `reset-password`, `bootstrap-admin`.

**Mentoria (interna):** `process-aplicacao-theway`, `move-pipeline-stage`, `notify-letitia-new-application`.

**Conteúdo:** `import-drive-pops`, `transcribe-podcast-episode`, `tag-content-by-pillar`.

### 5.5. Decisões arquiteturais

**Timezone Brasil padronizado** (`dateUtils.ts`).
**Edge functions de e-mail usam HTML cru** (não React Email).
**Service Workers proibidos.**
**Sem hardcode de URLs/IDs** — variáveis de ambiente.
**Brand: "Letitia"** com capitalização exata.
**Roles em tabela separada** (`user_roles` + enum `app_role`) com função `has_role()` SECURITY DEFINER.
**Tabela `mentoria_confidencial` com RLS reforçado** — acesso restrito a um conjunto explícito de user_ids autorizados.
**Auditoria em tabelas críticas** via JSONB.
**Triggers de proteção** em campos manuais (vendas, comissões).
**Auto-enrollment via trigger** quando nova venda chega: cria contato no CRM, dispara welcome e-mail, etc.
**Pilares são tags** — toda tabela de conteúdo, lead ou métrica permite classificação por Pessoal/Profissional/Interior.

---

## 6. Banco de Dados — Schema Resumido

Estimativa: **~80 tabelas** no `public` schema (mais enxuto que a versão anterior pois saíram ~40 tabelas de plataforma de aluno/comunidade/livraria/shipments).

### 6.1. Identidade e acesso

```text
profiles                  — perfil de colaboradora interna
user_roles                — role assignment
app_role (enum)           — admin, dono, equipe-relacionamento, conteudo, lancamentos, financeiro, fornecedor, convidado
departamentos
auth_audit_log
```

### 6.2. CRM (visão interna apenas)

```text
contatos                  — toda mulher conhecida pela marca
contato_emails            — múltiplos e-mails
contato_telefones         — múltiplos telefones
contato_pilar_tags        — score/tag por pilar
contato_origem            — UTM e fonte
contato_tags              — etiquetas livres
crm_pipelines             — pipelines customizáveis
crm_stages
crm_cards
crm_card_history
```

### 6.3. Mentoria THE WAY (operação interna)

```text
theway_aplicacoes         — formulários recebidos (via webhook)
theway_aplicacao_respostas
theway_turmas
theway_mentoradas         — vínculo contato ↔ turma
theway_encontros          — agenda de encontros (operação)
theway_presencas          — registro interno
mentoria_confidencial     — anotações privadas da Letícia (RLS extra)
mentoria_audit_log
```

### 6.4. Vendas

```text
produtos                  — catálogo dos infoprodutos
vendas
vendas_parcelas
vendas_audit_log
comissoes
afiliadas
afiliada_links
cobrancas
cobranca_estagios
```

### 6.5. Conteúdo (calendário editorial interno)

```text
conteudo_pautas           — pautas Instagram/TikTok/Shorts/podcast/newsletter
conteudo_status_log
conteudo_pilar_tags
podcast_episodios         — Vai Por Mim
podcast_transcricoes
newsletter_metricas       — sync read-only Substack
linhas_editoriais
```

### 6.6. Operação interna

```text
tarefas
subtarefas
tarefa_comentarios
tarefa_anexos
tarefa_recorrencia
reunioes
reuniao_blocos
reuniao_gravacoes
reuniao_transcricoes
agendamentos
agendamento_participantes
um_a_um
um_a_um_pautas
okrs
okr_resultados_chave
pdis
pdi_aulas
notas_flutuantes
senhas_compartilhadas
```

### 6.7. Marketing e tráfego

```text
campanhas_email
email_logs
email_automacoes
email_automacao_nodes
whatsapp_broadcasts
whatsapp_logs
chat_threads              — mirror Chatwoot
chat_messages
quiz_diagnosticos         — Quiz dos Três Pilares (config)
quiz_respostas            — leads classificados
utm_links
lancamentos
lancamento_metricas
lancamento_diario_bordo
trafego_meta_ads_metricas
sales_pages
```

### 6.8. Financeiro

```text
financeiro_movimentacoes
financeiro_categorias
projecoes
projecoes_cenarios
```

### 6.9. Conhecimento e suporte interno

```text
tickets
ticket_mensagens
treinamentos              — cursos pra equipe interna
treinamento_aulas
pops                      — procedimentos operacionais
pop_versoes
bora_news
relatorios
relatorio_pastas
nps_respostas             — registro interno do que veio
aceleradora_eventos
```

### 6.10. Padrões de segurança (RLS)

- Roles em tabela separada (`user_roles`) — nunca em `profiles`. Função `has_role(user_id, role)` SECURITY DEFINER.
- Ownership via `auth.uid()` em entidades pessoais (notas, senhas, PDIs).
- Triggers de proteção em campos manuais (vendas, comissões).
- Auditoria via JSONB (`vendas_audit_log`, `mentoria_audit_log`).
- Tabela `mentoria_confidencial` com função `pode_ver_confidencial(user_id)` que valida lista explícita autorizada pela Letícia.
- Webhook triggers (pg_net) chamam edge functions em mudanças críticas.

---

## 7. Fluxos Críticos (Internos)

### 7.1. Nova venda Hotmart entrando no sistema

1. Aluna compra Workshop Plano A na Hotmart por R$ 97.
2. Hotmart dispara webhook → edge function `webhook-hotmart`.
3. Edge function:
   - Faz matching no CRM por e-mail+telefone (pg_trgm). Cria ou atualiza `contatos`.
   - Cria registro em `vendas`.
   - Notifica equipe-relacionamento via Slack/WhatsApp interno.
   - Atualiza dashboard financeiro em tempo real.
4. Equipe abre o app de manhã, vê 12 novas vendas no dashboard. Letícia vê o gráfico do dia subir.

A entrega do curso (link de acesso à área Hotmart) acontece pela própria Hotmart — o sistema só registra que aconteceu.

### 7.2. Nova aplicação THE WAY chegando

1. Mulher preenche formulário público (hospedado externamente, no site da Letícia).
2. Submit dispara webhook → edge function `webhook-aplicacao-theway`.
3. Edge function:
   - Cria `contatos` no CRM (matching por e-mail).
   - Cria registro em `theway_aplicacoes` + `theway_aplicacao_respostas`.
   - Cria card no Pipeline THE WAY na coluna "Aplicação Recebida".
   - Notifica equipe-relacionamento.
4. Equipe abre o pipeline, lê a aplicação, decide se passa pra triagem.
5. Equipe agenda call de triagem via Cal.com. Move o card pra "Triagem".
6. Após triagem, equipe move pra "Call com Letícia". Letícia abre o app de manhã, vê 4 calls pra hoje, lê o resumo de cada uma na sessão "Sessão Estratégica".
7. Após call, Letícia marca aprovado/recusado direto no card. Se aprovado:
   - Move pra "Aprovada".
   - Equipe gera contrato externo (Asaas).
   - Quando pagamento confirma, sistema move pra "Contratada" e cria `theway_mentoradas` na turma.
   - Letícia escreve as primeiras notas em `mentoria_confidencial`.

A aluna recebe e-mails e mensagens da equipe — mas **não loga em lugar nenhum** do LetitiAPP.

### 7.3. Reunião Semanal de Conteúdo

1. Toda segunda às 9h, equipe abre Reunião Semanal já criada no LetitiAPP.
2. Editor Tiptap colaborativo carrega:
   - Pautas do podcast da semana (puxadas do calendário editorial).
   - Edição da Petit Journal (status: rascunho/aprovado).
   - Pautas de Instagram aprovadas pela Letícia.
   - Métricas da semana anterior.
3. Durante a reunião, qualquer bloco vira tarefa com `/tarefa`.
4. Final: ata salva, gravação transcrita via Whisper local. Gemini resume os 5 principais pontos. Tarefas atribuídas.

### 7.4. Lançamento — Reabertura Você Dirige Setembro

1. Equipe-lançamentos cria novo lançamento "VD Setembro 2026" com cronograma Gantt: 21 dias, com checkpoints (criativos prontos, página no ar, e-mails agendados, tráfego ativo).
2. Sistema cria automaticamente as tarefas associadas a cada checkpoint, com responsáveis.
3. Cada criativo entra no módulo de tarefa com status (em produção / aprovação Letícia / aprovado / no ar).
4. Tráfego é sincronizado de Meta Ads diariamente. Dashboard mostra CPM, CPC, CPL, CPA por campanha.
5. UTM Creator gera links pra cada peça (e-mail, WhatsApp, Instagram).
6. Vendas Hotmart entram automáticas com UTM atribuído. Funil de origem é montado em tempo real.
7. Letícia abre o dashboard do lançamento no celular e vê: 47% da meta, CPL R$ 12, 3 dias até o final do carrinho.

### 7.5. Manhã da Letícia — Sexta às 7h

1. Abre o app no celular.
2. Dashboard mobile carrega:
   - **Card 1:** Vendas da semana (R$ X).
   - **Card 2:** Próximos eventos: 2 calls THE WAY hoje à tarde.
   - **Card 3:** 3 pautas aguardando aprovação dela.
   - **Card 4:** 4 novas aplicações THE WAY pra revisar.
   - **Card 5:** Métricas Petit Journal: 1.247 novas assinantes essa semana.
   - **Card 6:** Tarefas marcadas pra ela.
3. Toca em "Pautas" e aprova 2 carrosséis. Toca em "Aplicações THE WAY" e marca 2 com ✦ pra equipe priorizar.
4. Fecha em 6 minutos.

---

## 8. Roadmap

### Fase 1 — MVP (Meses 1-3)

**Objetivo:** tirar a operação interna do Excel/WhatsApp/Drive e centralizar o que importa.

- Setup infra (Supabase project, deploy, domínio `app.leticiacazarre.com.br`).
- Design System (paleta + tipografia + componentes).
- Auth + Equipe + Roles.
- Dashboard Home com cards.
- Tarefas, Reuniões, Agenda, Busca Global.
- CRM de Contatos.
- Pipeline THE WAY + Anotações Confidenciais.
- Lista de Mentoradas Ativas.
- Vendas (sync Hotmart + Asaas + manual).
- Calendário Editorial + Pautas/Roteiros.
- Funis de Lançamento.
- UTM Creator.
- Dashboard Financeiro + Movimentações.
- Edge functions críticas (webhooks, sync).

**Critério de aceite:** Letícia roda 1 mês de operação inteira no novo sistema sem voltar pras planilhas e Notions.

### Fase 2 — V1 (Meses 4-6)

**Objetivo:** cobrir marketing, lançamento profissional, suporte e ferramentas avançadas.

- 1x1, OKRs, PDIs.
- Notas, Senhas.
- Pipelines Customizáveis (afiliados, patrocínios, imprensa).
- Cobranças.
- Sessão Estratégica.
- Petit Journal Métricas + Vai Por Mim.
- Conteúdo Social Tracking.
- E-mail Marketing + Automações + WhatsApp Marketing.
- Chat Unificado.
- Quiz Três Pilares (registro de leads).
- Tráfego Pago (Meta Ads sync).
- Comissões + Projeções.
- Tickets, Treinamentos, POPs.
- Bora News.
- Transcrições.
- Relatórios IA.
- NPS Interno.
- Aceleradora / Eventos Presenciais.
- PWA (instalável no celular).

**Critério de aceite:** todo lançamento de produto é orquestrado dentro do app, do briefing à última métrica.

### Fase 3 — V2 (Meses 7-12)

**Objetivo:** escalar e abrir capacidades.

- Captions com IA.
- Sales Page Tracker.
- Gamificação Interna.
- Mobile App nativo.
- API interna pra parceiros.
- Sales Funnel automation avançada.
- BI dashboards executivos personalizáveis.

**Critério de aceite:** o sistema sustenta 5x o volume atual sem reescrita.

---

## 9. Métricas de Sucesso

**Operacionais (eficiência interna):**
- 100% das vendas (Hotmart + Asaas + manual) registradas no LetitiAPP — zero divergência com a planilha financeira.
- Tempo médio entre aplicação THE WAY e call com Letícia ≤7 dias.
- DAU interno >85% dos colaboradores ativos.
- Tempo médio de fechamento de tarefa cai 30% após 6 meses.

**Negócio (qualidade da execução):**
- Taxa de aprovação THE WAY (aplicação → mentorada) ≥40% nas calls.
- Lançamento previsto x realizado ≤10% de variação.
- Conteúdo aprovado pela Letícia em ≤24h após envio (vs. dias hoje).

**Produto (qualidade técnica):**
- Tempo de carga do dashboard ≤1.5s (p95).
- Busca global ≤200ms.
- Zero incidente de vazamento de anotação confidencial da mentoria.
- Disponibilidade ≥99.9%.

---

## 10. Riscos e Mitigações

**Risco: Migração das vendas existentes.** Histórico de 4-5 anos em Hotmart e planilha. Pode duplicar registros.
*Mitigação:* Importação com dry-run e relatório de conflitos. Algoritmo de matching por e-mail+telefone. Letícia aprova manualmente fusões duvidosas.

**Risco: Confidencialidade THE WAY.** Anotações da Letícia sobre mentoradas são radioativas se vazarem.
*Mitigação:* RLS extra em `mentoria_confidencial`. Lista explícita de user_ids autorizados (Letícia + 1-2 pessoas). Auditoria de acesso. Termo de confidencialidade assinado por toda colaboradora com acesso. Pen-test antes do go-live.

**Risco: Dependência de IA externa (Gemini).** Se cair ou virar caro, features quebram.
*Mitigação:* Fallback configurável (Claude/OpenAI). Whisper local pra transcrição. Cache de respostas frequentes.

**Risco: Substack continuar como fonte da newsletter.** Lock-in com fornecedor.
*Mitigação:* No escopo atual mantemos Substack — só sincronizamos métricas. Migração eventual fica pra V2+ (fora deste PRD).

**Risco: Performance com muitos contatos no CRM.**
*Mitigação:* Índices GIN. Paginação cursor-based. Materialização de agregados via cron.

**Risco: Desalinhamento estético.** Botão genérico do shadcn fora do tom destrói a experiência mesmo em ambiente interno.
*Mitigação:* Design System próprio com tokens versionados. Designer dedicado revisa cada nova tela. Storybook documentando componentes.

**Risco: Equipe pequena, sistema grande.**
*Mitigação:* Documentação inline (JSDoc). Treinamento gravado de cada módulo. Fornecedor de manutenção (BNOads) com SLA.

**Risco: Esperar muito do MVP e atrasar.**
*Mitigação:* Disciplina de escopo. MVP é MVP. Feature creep vai pra V1.

---

## 11. Convenções Importantes

- **Timezone Brasil** padronizado (`dateUtils.ts`, BRT/UTC-3).
- **Edge functions de e-mail** usam HTML cru (não React Email).
- **Service Workers proibidos.**
- **Sem hardcode** — variáveis de ambiente.
- **Brand: "Letitia"** com capitalização exata. Dourado como destaque, Playfair display, Inter UI.
- **Pilares como tags** — toda tabela de conteúdo, contato ou métrica permite classificação por pilar.
- **Confidencialidade primeiro** — qualquer feature que toca dado da mentoria, RLS é primeiro item de PR review.
- **Performance é feature** — query >100ms vira issue.
- **Sistema é interno** — nenhuma rota deste app é pública. Exceção: webhooks (com validação de assinatura) e formulário de aplicação THE WAY (que é hospedado externamente e só dispara webhook). A aluna **nunca loga aqui**.

---

## 12. Anexos

### 12.1. O que NÃO está no escopo

Pra não deixar dúvida, o LetitiAPP **não** vai incluir:

- Plataforma de entrega de cursos (Workshop Plano A, Você Dirige) — segue na Hotmart.
- Área de membro pra aluna ou mentorada — não existe.
- Comunidade pra mentoradas THE WAY — segue no WhatsApp privado da turma.
- Newsletter Petit Journal nativa — segue no Substack (só puxamos métricas).
- Livraria Cazarré integrada — segue como e-commerce externo independente.
- Quiz dos Três Pilares como produto público — pode ser hospedado externamente; o sistema só recebe os leads.
- Página de vendas / landing pages — seguem no WordPress atual da Letícia.
- App pra cliente final / aluna — não existe app público.

### 12.2. Comparativo BORAhub × BNOads × LetitiAPP

| Aspecto | BORAhub | BNOads | LetitiAPP |
|---|---|---|---|
| Escopo | Misto (interno + cliente final) | Misto (interno + dashboards públicos) | **100% interno** |
| Volume estimado de tabelas | 139 | ~80 | ~80 |
| Edge functions | 50+ | 50+ | ~35 |
| Estética | Funcional + dourado | Funcional + premium | Editorial / sereno / sofisticado |
| Confidencialidade | Padrão | Padrão | **EXTRA** (mentoria) |
| Comunidade nativa | Não | Não | **Não** (sai do escopo) |
| Plataforma de aluno | Sim | Não | **Não** (sai do escopo) |
| Foco principal | Operação interna + venda | Gestão de agência | Gestão editorial + lançamento + mentoria |

### 12.3. Glossário de Pilares

- **Pilar Pessoal:** vida íntima, relações, saúde, autocuidado, família.
- **Pilar Profissional:** ofício, carreira, finanças, contribuição ao mundo.
- **Pilar Interior:** vida espiritual, sentido, paz, leitura, contemplação.

Conteúdos, leads e relatórios podem ser etiquetados por pilar — gera dado pra Letícia entender o que ressoa mais com a comunidade.

### 12.4. Tom de voz da marca (resumo)

A Letícia escreve como uma cientista que virou poetisa: precisa, bem-construída, mas com calor. Frases curtas convivem com longas reflexões. Usa metáforas (caminho, sistema, arquitetura, orquestra). Não usa gírias. Raramente usa exclamação. Usa itálico pra ênfase emocional.

Mesmo sendo um sistema interno, qualquer texto que a equipe dispara pra aluna a partir do app (e-mail de cobrança, mensagem WhatsApp, e-mail de aplicação aprovada) precisa respeitar esse tom. Os templates ficam no sistema e a equipe edita com preview.

### 12.5. Lista de domínios

- `leticiacazarre.com.br` — site principal (existente, fora do escopo)
- `app.leticiacazarre.com.br` — LetitiAPP (interno, login obrigatório)

Sem subdomínios públicos adicionais.

### 12.6. Inspirações de UI

- **Notion** — densidade e hierarquia tipográfica.
- **Linear** — performance e atalhos.
- **Substack** — estética editorial.
- **Stripe Dashboard** — clareza de números e tabelas.
- **Kit (ConvertKit)** — gestão editorial de e-mail.
- **The Browser Company / Arc** — animações sutis, deleite.

---

## 13. Próximos Passos

1. **Briefing visual com designer** — refinar paleta, tipografia, criar 3-5 telas de referência (Dashboard, CRM, Pipeline THE WAY, Calendário Editorial, Lançamento).
2. **Definição de fornecedor de desenvolvimento** — interno BNOads ou contratação dedicada.
3. **Setup técnico inicial** — Supabase project, deploy, GitHub repo, CI básico.
4. **Migração de dados** — auditoria do que existe hoje em planilhas, Hotmart e Notion. Mapear tabelas-alvo. Script de import com dry-run.
5. **Sprint 1 do MVP** — Auth + Equipe + Dashboard + Tarefas. 2 semanas.
6. **Reunião quinzenal de checkpoint** com Letícia pra validar visualmente cada novo módulo.

---

**Fim do documento.**

*Este PRD é vivo. Toda alteração deve ser registrada em changelog no topo, versionado em Git.*

> *"Você não precisa mudar de vida. Você precisa mudar de sistema."*
> — Letícia Cazarré
