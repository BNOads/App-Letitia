import { useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Users,
  Handshake,
  RefreshCw,
  AlertTriangle,
  HeadphonesIcon,
  MessageCircle,
  Sparkles,
  Eye,
  Megaphone,
  Wallet,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Types ────────────────────────────────────────────── */

type TabId = "cultura" | "gestao" | "fluxo" | "cx" | "mkt" | "design" | "financeiro" | "renovacao" | "equipe" | "inadimplencia";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

const tabs: Tab[] = [
  { id: "cultura", label: "Cultura", icon: Sparkles },
  { id: "gestao", label: "Gestão", icon: Eye },
  { id: "fluxo", label: "Comercial", icon: Handshake },
  { id: "cx", label: "CX", icon: HeadphonesIcon },
  { id: "mkt", label: "Marketing", icon: Megaphone },
  { id: "design", label: "Design", icon: Palette },
  { id: "financeiro", label: "Financeiro", icon: Wallet },
  { id: "renovacao", label: "Renovações", icon: RefreshCw },
  { id: "equipe", label: "Equipe", icon: Users },
  { id: "inadimplencia", label: "Inadimpl.", icon: AlertTriangle },
];

/* ─── Small Helpers ────────────────────────────────────── */

function Badge({ variant, children }: { variant: string; children: React.ReactNode }) {
  const colors: Record<string, string> = {
    cx: "bg-emerald-100/60 text-emerald-700",
    fin: "bg-amber-100/60 text-amber-700",
    gest: "bg-sky-100/60 text-sky-700",
    vendas: "bg-pink-100/60 text-pink-700",
    renovacao: "bg-violet-100/60 text-violet-700",
    alerta: "bg-red-100/60 text-red-700",
  };
  return (
    <span className={cn("inline-block text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full", colors[variant] || "bg-card text-muted")}>
      {children}
    </span>
  );
}

function Gatilho({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-2 text-letitia-gold">
      <div className="h-px w-8 bg-letitia-gold/30" />
      <span className="text-[10px] font-medium uppercase tracking-widest">{text}</span>
      <div className="h-px w-8 bg-letitia-gold/30" />
    </div>
  );
}

function MsgBox({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      {label && <p className="text-[9px] font-semibold uppercase tracking-wider text-muted mb-1">{label}</p>}
      <div className="bg-emerald-50/50 border-l-[3px] border-emerald-500/60 rounded-r-lg px-3 py-2.5 text-xs text-foreground/70 leading-relaxed italic">
        {children}
      </div>
      <p className="text-[9px] text-amber-600/80 mt-1.5 flex items-center gap-1">
        <span>⚠️</span> Modelo inicial — traga humanidade e pessoalidade para cada comunicação.
      </p>
    </div>
  );
}

function Nota({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber-50/50 border-l-[3px] border-letitia-gold rounded-r-lg px-3.5 py-2.5 text-xs text-foreground/70 leading-relaxed mb-4">
      {children}
    </div>
  );
}

function CanalPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 bg-card rounded-full px-2.5 py-0.5 text-[10px] font-medium text-muted mr-1.5 mb-1">
      {children}
    </span>
  );
}

/* ─── Collapsible Card (Etapa / Protocolo) ─────────────── */

function CollapsibleCard({
  children,
  header,
  defaultOpen = false,
}: {
  children: React.ReactNode;
  header: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className={cn(
        "bg-white rounded-xl border transition-all",
        open ? "border-letitia-gold/40 shadow-sm" : "border-border hover:shadow-sm"
      )}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <div className="flex-1">{header}</div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-letitia-gold flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-letitia-gold flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="border-t border-border/50 px-4 pb-4 pt-3">
          {children}
        </div>
      )}
    </div>
  );
}

/* ─── Arrow List Item ──────────────────────────────────── */

function ArrowItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-xs text-foreground/70 leading-relaxed py-0.5">
      <ArrowRight className="h-3 w-3 text-letitia-gold mt-0.5 flex-shrink-0" />
      <span>{children}</span>
    </li>
  );
}

/* ═══════════════════════════════════════════════════════════
   PANEL: FLUXO DE VENDA
   ═══════════════════════════════════════════════════════ */

function PanelFluxo() {
  const etapas = [
    {
      num: 1,
      color: "bg-pink-700",
      titulo: "Lead entra / Interesse confirmado",
      responsavel: "🎯 Mônica · Vendas",
      items: [
        "Lead vem de The Way, Hotmart, indicação ou orgânico",
        "Mônica faz o primeiro contato e qualifica o interesse",
        "Registra no CRM/planilha: nome, contato, origem, produto de interesse",
        "Agenda conversa ou envia proposta conforme o perfil",
      ],
      badges: [{ v: "vendas", t: "Vendas" }],
    },
    {
      num: 2,
      color: "bg-amber-700",
      titulo: "Venda fechada — Registro e notificação das áreas",
      responsavel: "🎯 Mônica → aciona Financeiro + CX + Gestão",
      items: [
        "Mônica preenche a ficha de venda: nome, produto, valor, forma de pgto, parcelas, 1º vencimento",
        "Notifica Carol (CX) para preparar boas-vindas",
        "Notifica o Financeiro com os dados de cobrança",
        "Gestão recebe resumo diário ou notificação em tempo real",
        "JP ativa o acesso da aluna na plataforma",
      ],
      badges: [
        { v: "vendas", t: "Vendas" },
        { v: "cx", t: "CX" },
        { v: "fin", t: "Financeiro" },
        { v: "gest", t: "Gestão" },
      ],
    },
    {
      num: 3,
      color: "bg-emerald-700",
      titulo: "Boas-vindas e onboarding",
      responsavel: "🎯 Carol · CX",
      items: [
        "Carol envia mensagem/e-mail de boas-vindas com dados de acesso",
        "Apresenta dinâmica do programa, grupos e canais de suporte",
        "Confirma que a aluna acessou a plataforma (checagem em até 48h)",
        "Registra a aluna como \"ativa\" no painel compartilhado",
        "Identifica o perfil da mentorada para personalizar o acompanhamento",
      ],
      badges: [{ v: "cx", t: "CX" }],
    },
    {
      num: 4,
      color: "bg-sky-700",
      titulo: "Controle financeiro e cobrança",
      responsavel: "🎯 Financeiro",
      items: [
        "Confirma recebimento do 1º pagamento e registra",
        "Monitora vencimentos das próximas parcelas",
        "Em caso de atraso, aciona protocolo de inadimplência",
        "Reporta status financeiro à gestão semanalmente",
      ],
      badges: [
        { v: "fin", t: "Financeiro" },
        { v: "gest", t: "Gestão" },
      ],
    },
    {
      num: 5,
      color: "bg-lime-700",
      titulo: "Acompanhamento, retenção e sinalização de renovação",
      responsavel: "🎯 Carol · CX",
      items: [
        "Carol faz check-in periódico (quinzenal ou mensal)",
        "Registra feedbacks, dificuldades e elogios",
        "Sinaliza à gestão clientes em risco de cancelamento",
        "30 dias antes do vencimento: aciona fluxo de renovação",
        "Captura depoimentos para autorização de imagem",
      ],
      badges: [
        { v: "cx", t: "CX" },
        { v: "renovacao", t: "Renovação" },
        { v: "gest", t: "Gestão" },
      ],
    },
  ];

  const gatilhos = [
    "gatilho · venda fechada",
    "gatilho · cliente ativada",
    "gatilho · pgto confirmado",
    "gatilho · acompanhamento contínuo",
  ];

  return (
    <div>
      <h2 className="font-serif text-xl font-semibold text-foreground mb-1">Do lead à cliente ativa</h2>
      <p className="text-xs text-muted leading-relaxed mb-5">
        Cada etapa tem responsável claro e um gatilho que aciona a próxima área.
      </p>

      <div className="space-y-1.5">
        {etapas.map((etapa, idx) => (
          <div key={etapa.num}>
            <CollapsibleCard
              header={
                <div className="flex items-center gap-3">
                  <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0", etapa.color)}>
                    {etapa.num}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-tight">{etapa.titulo}</p>
                    <p className="text-[10px] text-muted uppercase tracking-wide mt-0.5">{etapa.responsavel}</p>
                  </div>
                </div>
              }
            >
              <ul className="space-y-1 mb-3 pl-10">
                {etapa.items.map((item, i) => (
                  <ArrowItem key={i}>{item}</ArrowItem>
                ))}
              </ul>
              <div className="flex flex-wrap gap-1.5 pl-10">
                {etapa.badges.map((b) => (
                  <Badge key={b.v} variant={b.v}>{b.t}</Badge>
                ))}
              </div>
            </CollapsibleCard>

            {idx < gatilhos.length && <Gatilho text={gatilhos[idx]} />}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PANEL: CX & PROTOCOLOS
   ═══════════════════════════════════════════════════════ */

function PanelCX() {
  return (
    <div>
      <h2 className="font-serif text-xl font-semibold text-foreground mb-1">CX &amp; Protocolos de Atendimento</h2>
      <div className="text-xs text-muted leading-relaxed mb-5">
        Organizado por etapa da jornada e por tipo de situação. Canais:{" "}
        <CanalPill>📱 WhatsApp</CanalPill>
        <CanalPill>📧 E-mail</CanalPill>
        <CanalPill>👥 Grupo</CanalPill>
      </div>

      {/* POR ETAPA */}
      <div className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-letitia-gold mb-3 pb-1 border-b border-border">
          Por etapa da jornada
        </p>
        <div className="space-y-2">
          {/* Onboarding */}
          <CollapsibleCard
            header={
              <div className="flex items-center gap-2.5">
                <span className="text-lg">🌱</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Onboarding (primeiros 7 dias)</p>
                  <p className="text-[10px] text-muted">Mentorias individuais + LaCademia</p>
                </div>
              </div>
            }
          >
            <ul className="space-y-1 mb-2">
              <ArrowItem>Dia 0 — Boas-vindas com acesso, links e orientações iniciais</ArrowItem>
              <ArrowItem>Dia 2 — Checagem se a aluna acessou a plataforma</ArrowItem>
              <ArrowItem>Dia 5 — Mensagem de check-in: &quot;Como está sendo o início?&quot;</ArrowItem>
              <ArrowItem>Dia 7 — Confirmação de engajamento e dúvidas pendentes</ArrowItem>
            </ul>
            <MsgBox label="Modelo · Boas-vindas (WhatsApp)">
              &quot;Olá, [nome]! 🌸 Seja muito bem-vinda à [Mentoria/LaCademia]! Estou aqui para te acompanhar nessa jornada. Seu acesso já está ativo — qualquer dúvida, pode me chamar aqui. Que bom ter você com a gente! 🙏&quot;
            </MsgBox>
            <div className="mt-2"><Badge variant="cx">CX</Badge></div>
          </CollapsibleCard>

          {/* Meio da jornada */}
          <CollapsibleCard
            header={
              <div className="flex items-center gap-2.5">
                <span className="text-lg">🔥</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Meio da jornada (engajamento ativo)</p>
                  <p className="text-[10px] text-muted">Check-ins quinzenais ou mensais</p>
                </div>
              </div>
            }
          >
            <ul className="space-y-1 mb-2">
              <ArrowItem>Check-in quinzenal via WhatsApp individual</ArrowItem>
              <ArrowItem>Monitorar participação nos grupos e lives</ArrowItem>
              <ArrowItem>Registrar conquistas e dificuldades da mentorada no painel</ArrowItem>
              <ArrowItem>Celebrar marcos: primeiro módulo concluído, primeira aplicação prática</ArrowItem>
              <ArrowItem>Sinalizar à gestão mentoradas sem acesso há mais de 15 dias</ArrowItem>
            </ul>
            <MsgBox label="Modelo · Check-in quinzenal">
              &quot;Oi, [nome]! 💛 Passando pra saber como você está se sentindo com o programa. Tem algo que posso te ajudar a aproveitar melhor? Estou à disposição!&quot;
            </MsgBox>
            <div className="flex gap-1.5 mt-2">
              <Badge variant="cx">CX</Badge>
              <Badge variant="gest">Sinaliza Gestão</Badge>
            </div>
          </CollapsibleCard>

          {/* Reta final */}
          <CollapsibleCard
            header={
              <div className="flex items-center gap-2.5">
                <span className="text-lg">🏁</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Reta final / Encerramento de ciclo</p>
                  <p className="text-[10px] text-muted">30 dias antes do término</p>
                </div>
              </div>
            }
          >
            <ul className="space-y-1 mb-2">
              <ArrowItem>Avisar a mentorada sobre a proximidade do encerramento</ArrowItem>
              <ArrowItem>Coletar depoimento e autorização de imagem</ArrowItem>
              <ArrowItem>Apresentar opção de renovação (aciona fluxo de renovação)</ArrowItem>
              <ArrowItem>Registrar se renova, encerra ou está indecisa — e repassar à gestão</ArrowItem>
            </ul>
            <div className="flex gap-1.5 mt-2">
              <Badge variant="cx">CX</Badge>
              <Badge variant="renovacao">Renovação</Badge>
            </div>
          </CollapsibleCard>
        </div>
      </div>

      {/* POR SITUAÇÃO */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-letitia-gold mb-3 pb-1 border-b border-border">
          Por tipo de situação
        </p>
        <div className="space-y-2">
          {/* Dúvida */}
          <CollapsibleCard
            header={
              <div className="flex items-center gap-2.5">
                <span className="text-lg">❓</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Dúvida sobre o programa ou acesso</p>
                  <p className="text-[10px] text-muted">Resposta em até 24h úteis</p>
                </div>
              </div>
            }
          >
            <ul className="space-y-1 mb-2">
              <ArrowItem>Carol responde diretamente no canal onde a mentorada chamou</ArrowItem>
              <ArrowItem>Se for técnico (acesso, plataforma): aciona JP em paralelo</ArrowItem>
              <ArrowItem>Registrar a dúvida no painel — dúvidas repetidas viram FAQ</ArrowItem>
              <ArrowItem>Confirmar com a mentorada que o problema foi resolvido</ArrowItem>
            </ul>
            <Badge variant="cx">CX</Badge>
          </CollapsibleCard>

          {/* Insatisfação */}
          <CollapsibleCard
            header={
              <div className="flex items-center gap-2.5">
                <span className="text-lg">😔</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Insatisfação ou reclamação</p>
                  <p className="text-[10px] text-muted">Atenção máxima — não deixar sem resposta</p>
                </div>
              </div>
            }
          >
            <ul className="space-y-1 mb-2">
              <ArrowItem>Carol acolhe com empatia, sem defender nem prometer o que não pode cumprir</ArrowItem>
              <ArrowItem>Registra o relato completo no painel e escalona imediatamente para a gestão</ArrowItem>
              <ArrowItem>Gestão decide: solução, compensação ou encaminhamento</ArrowItem>
              <ArrowItem>Carol retorna à mentorada com a resposta da gestão</ArrowItem>
              <ArrowItem>Monitorar nos 15 dias seguintes se a insatisfação foi revertida</ArrowItem>
            </ul>
            <MsgBox label="Modelo · Acolhimento inicial">
              &quot;Oi, [nome]. Obrigada por trazer isso — levo muito a sério o que você está sentindo. Vou verificar agora com a equipe e retorno o mais breve possível com uma resposta para você. 🙏&quot;
            </MsgBox>
            <div className="flex gap-1.5 mt-2">
              <Badge variant="cx">CX</Badge>
              <Badge variant="gest">Escalonar Gestão</Badge>
            </div>
          </CollapsibleCard>

          {/* Cancelamento */}
          <CollapsibleCard
            header={
              <div className="flex items-center gap-2.5">
                <span className="text-lg">🚪</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Pedido de cancelamento</p>
                  <p className="text-[10px] text-muted">Ouvir antes de aceitar</p>
                </div>
              </div>
            }
          >
            <ul className="space-y-1 mb-2">
              <ArrowItem>Carol não cancela imediatamente — abre espaço para conversa</ArrowItem>
              <ArrowItem>Entende o motivo: financeiro, tempo, expectativa não atendida, ou outro</ArrowItem>
              <ArrowItem>Se financeiro: aciona gestão para avaliar pausa, desconto ou renegociação</ArrowItem>
              <ArrowItem>Se insatisfação: escalona para gestão antes de qualquer decisão</ArrowItem>
              <ArrowItem>Se confirmar cancelamento: processa conforme política, registra motivo e encerra com cuidado</ArrowItem>
            </ul>
            <div className="flex gap-1.5 mt-2">
              <Badge variant="cx">CX</Badge>
              <Badge variant="gest">Gestão decide</Badge>
              <Badge variant="fin">Financeiro processa</Badge>
            </div>
          </CollapsibleCard>

          {/* Sumida */}
          <CollapsibleCard
            header={
              <div className="flex items-center gap-2.5">
                <span className="text-lg">😶</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Mentorada sumida / sem acesso</p>
                  <p className="text-[10px] text-muted">Alerta de desengajamento</p>
                </div>
              </div>
            }
          >
            <ul className="space-y-1 mb-2">
              <ArrowItem>JP detecta inatividade na plataforma por mais de 15 dias e notifica Carol</ArrowItem>
              <ArrowItem>Carol envia mensagem de cuidado e reconexão</ArrowItem>
              <ArrowItem>Se não responder em 5 dias: segundo contato com abordagem diferente</ArrowItem>
              <ArrowItem>Se não responder em 10 dias: gestão tenta contato direto</ArrowItem>
              <ArrowItem>Registrar no painel como &quot;risco de cancelamento&quot;</ArrowItem>
            </ul>
            <MsgBox label="Modelo · Reconexão">
              &quot;Oi, [nome]! 💛 Senti sua falta por aqui. Tudo bem com você? Só queria saber como está sendo essa fase e se posso te ajudar em algo.&quot;
            </MsgBox>
            <div className="flex gap-1.5 mt-2">
              <Badge variant="cx">CX</Badge>
              <Badge variant="alerta">Alerta</Badge>
            </div>
          </CollapsibleCard>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PANEL: RENOVAÇÕES
   ═══════════════════════════════════════════════════════ */

function PanelRenovacao() {
  const timeline = [
    {
      day: "30d",
      color: "bg-violet-700",
      titulo: "Carol sinaliza: contrato/ciclo se encerra em 30 dias",
      desc: "Registra no painel e avisa a gestão. Nenhum contato com a mentorada ainda — apenas preparo interno.",
      quem: "👤 Carol → Gestão",
    },
    {
      day: "25d",
      color: "bg-violet-700",
      titulo: "Primeiro contato de renovação — Tom de cuidado",
      desc: "Carol abre a conversa valorizando a jornada da mentorada e apresenta a possibilidade de continuidade (ou upgrade para VCN, se aplicável).",
      quem: "👤 Carol · WhatsApp ou e-mail",
    },
    {
      day: "15d",
      color: "bg-amber-700",
      titulo: "Apresentação formal da proposta de renovação",
      desc: "Envia condições: valor, forma de pagamento, benefícios de continuar. Para quem responder com interesse, Mônica assume para fechar.",
      quem: "👤 Carol apresenta → Mônica fecha",
    },
    {
      day: "7d",
      color: "bg-red-800",
      titulo: "Último contato para quem ainda não decidiu",
      desc: "Tom de encerramento com cuidado. Sem pressão, mas deixando claro que o prazo se aproxima. Se houver objeção financeira, gestão avalia condição especial.",
      quem: "👤 Carol → escalonar Gestão se necessário",
    },
    {
      day: "0",
      color: "bg-foreground",
      titulo: "Encerramento ou renovação confirmada",
      desc: "Se renovou: Financeiro registra novo ciclo, JP mantém acesso, Carol envia mensagem de celebração. Se encerrou: Carol agradece e registra motivo — essas informações valem ouro para o produto.",
      quem: "👤 Carol + Financeiro + JP",
    },
  ];

  const modelos = [
    {
      titulo: "Abertura da conversa de renovação (25 dias antes)",
      msg: `"Oi, [nome]! 🌸 Olhando sua jornada aqui, fico tão feliz com o quanto você cresceu. Daqui a pouco chegamos ao fim desse ciclo — e quero te apresentar como você pode continuar essa caminhada. Posso te mandar mais detalhes?"`,
    },
    {
      titulo: "Apresentação da proposta (15 dias antes)",
      msg: `"Oi, [nome]! Segue a proposta de renovação pra você continuar com a gente 💛 [detalhes do produto, valor e condição especial para quem já é aluna]. Qualquer dúvida, estou aqui!"`,
    },
    {
      titulo: "Confirmação de renovação",
      msg: `"Que alegria, [nome]! 🎉 Fico feliz demais que você vai continuar! Seu acesso segue ativo e já estamos te esperando no próximo ciclo. Obrigada pela confiança 🙏"`,
    },
  ];

  return (
    <div>
      <h2 className="font-serif text-xl font-semibold text-foreground mb-1">Fluxo de Renovações</h2>
      <p className="text-xs text-muted leading-relaxed mb-4">
        Mentoria individual + LaCademia. A renovação começa 30 dias antes — não no último dia.
      </p>

      <Nota>
        <strong>Regra de ouro:</strong> A renovação é uma conversa de valor, não uma cobrança. A Carol posiciona a continuidade como conquista da mentorada, não como venda da empresa.
      </Nota>

      {/* Timeline */}
      <div className="space-y-0 mb-6">
        {timeline.map((step, idx) => (
          <div key={idx} className="flex gap-3">
            {/* Dot + conector */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white", step.color)}>
                {step.day}
              </div>
              {idx < timeline.length - 1 && <div className="w-0.5 flex-1 bg-border min-h-[16px]" />}
            </div>
            {/* Content */}
            <div className="bg-white rounded-lg border border-border px-3 py-2.5 flex-1 mb-2">
              <p className="text-xs font-semibold text-foreground">{step.titulo}</p>
              <p className="text-[11px] text-foreground/60 mt-1 leading-relaxed">{step.desc}</p>
              <p className="text-[10px] text-muted mt-1">{step.quem}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Modelos de mensagem */}
      <p className="text-[10px] font-semibold uppercase tracking-widest text-letitia-gold mb-3 pb-1 border-b border-border">
        Modelos de mensagem · Renovação
      </p>
      <div className="space-y-2">
        {modelos.map((m, idx) => (
          <CollapsibleCard
            key={idx}
            header={
              <div className="flex items-center gap-2.5">
                <MessageCircle className="h-4 w-4 text-letitia-gold flex-shrink-0" />
                <p className="text-sm font-semibold text-foreground">{m.titulo}</p>
              </div>
            }
          >
            <div className="bg-emerald-50/50 border-l-[3px] border-emerald-500/60 rounded-r-lg px-3 py-2.5 text-xs text-foreground/70 leading-relaxed italic">
              {m.msg}
            </div>
            <p className="text-[9px] text-amber-600/80 mt-1.5 flex items-center gap-1">
              <span>⚠️</span> Modelo inicial — traga humanidade e pessoalidade para cada comunicação.
            </p>
          </CollapsibleCard>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PANEL: EQUIPE
   ═══════════════════════════════════════════════════════ */

function PanelEquipe() {
  const membros = [
    {
      icon: "🎯",
      iconBg: "bg-pink-100/60",
      nome: "Mônica",
      desc: "Prospecção, qualificação e fechamento de vendas e renovações. Responsável por registrar 100% das vendas e acionar as demais áreas imediatamente.",
      badges: [
        { v: "vendas", t: "Vendas" },
        { v: "renovacao", t: "Fecha Renovações" },
      ],
    },
    {
      icon: "💛",
      iconBg: "bg-emerald-100/60",
      nome: "Carol",
      desc: "Onboarding, acompanhamento contínuo, protocolos de situação (dúvida, insatisfação, cancelamento, desengajamento) e abertura do fluxo de renovação. Ponto de contato principal da mentorada.",
      badges: [
        { v: "cx", t: "CX / Pós-venda" },
        { v: "renovacao", t: "Abre Renovações" },
      ],
    },
    {
      icon: "💰",
      iconBg: "bg-amber-100/60",
      nome: "Financeiro",
      desc: "Controle de recebimentos, emissão de cobranças, monitoramento de vencimentos e acionamento do protocolo de inadimplência. Registra renovações confirmadas.",
      badges: [{ v: "fin", t: "Financeiro" }],
    },
    {
      icon: "⚙️",
      iconBg: "bg-sky-100/60",
      nome: "JP",
      desc: "Ativação e suspensão de acessos, monitoramento de engajamento na plataforma, relatórios semanais e suporte técnico à equipe e às mentoradas.",
      badges: [{ v: "gest", t: "Sistemas" }],
    },
    {
      icon: "👁",
      iconBg: "bg-stone-100",
      nome: "Gestão (Lidiane)",
      desc: "Visão estratégica de todo o ciclo. Decide sobre exceções, cancelamentos, renegociações, condições especiais de renovação. Recebe relatório consolidado semanal.",
      badges: [{ v: "gest", t: "Gestão" }],
    },
    {
      icon: "📋",
      iconBg: "bg-violet-100/60",
      nome: "Andressa",
      desc: "Assistente da gestão. Apoio operacional e administrativo à Lidiane, organização de demandas, acompanhamento de prazos e suporte na comunicação entre áreas.",
      badges: [{ v: "gest", t: "Assistente Gestão" }],
    },
  ];

  return (
    <div>
      <h2 className="font-serif text-xl font-semibold text-foreground mb-1">Papéis e responsabilidades</h2>
      <p className="text-xs text-muted leading-relaxed mb-5">
        Cada pessoa tem uma zona clara. A sobreposição é intencional apenas nos pontos de passagem.
      </p>

      <div className="bg-white rounded-xl border border-border overflow-hidden mb-4">
        <div className="bg-foreground px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-letitia-gold">
            Equipe · Funções no Ecossistema
          </p>
        </div>
        {membros.map((m, idx) => (
          <div key={idx} className={cn("flex items-start gap-3 px-4 py-3.5", idx < membros.length - 1 && "border-b border-border/50")}>
            <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0", m.iconBg)}>
              {m.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">{m.nome}</p>
              <p className="text-[11px] text-foreground/60 leading-relaxed mt-1">{m.desc}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {m.badges.map((b) => (
                  <Badge key={b.t} variant={b.v}>{b.t}</Badge>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Nota>
        <strong>Regra de ouro:</strong> Nenhuma venda ou renovação existe se não estiver registrada. Nenhum cancelamento é processado sem passar pela gestão. Nenhum pagamento vence sem o Financeiro ter sido notificado antes.
      </Nota>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PANEL: INADIMPLÊNCIA
   ═══════════════════════════════════════════════════════ */

function PanelInadimplencia() {
  const steps = [
    {
      dia: "Dia 1",
      acao: "Financeiro verifica o não recebimento e registra o atraso no painel. Notifica gestão.",
      quem: "👤 Financeiro",
    },
    {
      dia: "Dia 2–3",
      acao: "Primeiro contato: mensagem leve e amigável lembrando o vencimento. Tom de cuidado, não de cobrança.",
      quem: "👤 Carol (CX) ou Financeiro",
    },
    {
      dia: "Dia 7",
      acao: "Segundo contato mais direto, com link de pagamento. Gestão é notificada formalmente.",
      quem: "👤 Financeiro → notifica Gestão",
    },
    {
      dia: "Dia 15",
      acao: "Gestão ou Financeiro tenta contato telefônico. Avalia renegociação. Prazo final voluntário.",
      quem: "👤 Gestão (Lidiane)",
    },
    {
      dia: "Dia 30+",
      acao: "Suspensão de acesso à plataforma. Caso encaminhado para avaliação jurídica conforme contrato.",
      quem: "👤 Gestão + JP + Jurídico",
    },
  ];

  return (
    <div>
      <h2 className="font-serif text-xl font-semibold text-foreground mb-1">Protocolo de Inadimplência</h2>
      <p className="text-xs text-muted leading-relaxed mb-5">
        Fluxo escalonado para recuperação de pagamentos, preservando o relacionamento.
      </p>

      <div className="bg-white rounded-xl border border-border overflow-hidden mb-4">
        <div className="bg-red-950 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-red-300">
            ⚠️ Quando o pagamento não cai no prazo
          </p>
        </div>
        {steps.map((s, idx) => (
          <div key={idx} className={cn("flex items-start gap-3 px-4 py-3", idx < steps.length - 1 && "border-b border-border/50")}>
            <span className="w-14 flex-shrink-0 text-[10px] font-bold text-red-700 uppercase tracking-wide pt-0.5">
              {s.dia}
            </span>
            <div className="flex-1">
              <p className="text-xs text-foreground/70 leading-relaxed">{s.acao}</p>
              <p className="text-[10px] text-muted mt-1">{s.quem}</p>
            </div>
          </div>
        ))}
      </div>

      <Nota>
        <strong>Importante:</strong> O contrato deve prever claramente prazo de carência, consequência do atraso e procedimento de suspensão de acesso — isso protege juridicamente antes de qualquer ação de cobrança.
      </Nota>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PANEL: CULTURA
   ═══════════════════════════════════════════════════════ */

function PanelCultura() {
  const valores = [
    {
      icon: "✦",
      titulo: "Excelência — não perfeição",
      sub: "Fazer o melhor possível com o que temos, sempre",
      principio: '"A excelência não é um padrão externo que nos pressiona. É uma expressão interna do respeito que temos por quem servimos."',
      items: [
        "Toda entrega — uma mensagem, uma arte, um relatório — merece atenção e cuidado",
        "Erros acontecem; o que define a excelência é a forma como respondemos a eles",
        'Antes de enviar qualquer comunicação à cliente: \"Isso honra quem ela é?\"',
        "Processos existem para libertar energia para o que importa — o cuidado humano",
      ],
    },
    {
      icon: "🌱",
      titulo: "Cuidado genuíno — não protocolo",
      sub: "A alma por trás de cada atendimento",
      principio: '"Protocolo diz o que fazer. Cultura diz por que fazer. O cuidado genuíno transforma uma mensagem em conexão."',
      items: [
        "Conhecer o nome, a história e o momento de cada cliente",
        "Celebrar conquistas dela como se fossem nossas — porque são",
        "Quando ela some, não interpretamos como inconveniente — investigamos com amor",
        "Toda insatisfação é um pedido de cuidado disfarçado",
      ],
    },
    {
      icon: "🕊️",
      titulo: "Presença — não automatismo",
      sub: "Estar de verdade em cada ponto de contato",
      principio: '"Automação é eficiência. Presença é diferencial. Usamos as duas — mas nunca deixamos a automação substituir o olhar humano."',
      items: [
        "Mensagens-modelo existem para não esquecer — mas sempre com personalização mínima",
        "Carol lê o que a pessoa responde de verdade, não só confirma o recebimento",
        "A gestão está próxima da operação — não distante dela",
        "Nenhuma cliente deve sentir que está falando com um sistema",
      ],
    },
    {
      icon: "🔑",
      titulo: "Integridade — em tudo, sempre",
      sub: "O que prometemos, entregamos",
      principio: '"Integridade não é apenas não mentir. É não prometer o que não pode ser entregue. É comunicar erros antes que a cliente perceba."',
      items: [
        "Prazos combinados com a cliente são sagrados",
        "Se algo falhar, a equipe avisa antes de ser cobrada",
        "Cobranças são feitas com respeito — nunca com constrangimento",
        "O contrato existe para proteger as duas partes — não para prender a cliente",
      ],
    },
    {
      icon: "🌟",
      titulo: "Propósito — a bússola de tudo",
      sub: "Por que existimos",
      principio: '"Quando a operação ficar pesada, quando o processo parecer burocrático, quando o dia estiver difícil — lembre-se: do outro lado há uma mulher que acreditou em nós."',
      items: [
        "A cliente não comprou um produto — investiu em si mesma",
        "Nosso resultado não é apenas a venda fechada — é a transformação entregue",
        "Cada pessoa que sai mais forte da mentoria é testemunho do nosso propósito",
        "Excelência sem propósito é vaidade. Com propósito, é missão.",
      ],
    },
  ];

  const perguntas = [
    { area: "Comercial", pergunta: '"Essa venda serve bem a essa pessoa?"' },
    { area: "CX", pergunta: '"Se eu fosse ela, me sentiria cuidada?"' },
    { area: "Marketing", pergunta: '"Esse conteúdo honra quem a Letícia é?"' },
    { area: "Financeiro", pergunta: '"Estou tratando o dinheiro dela com respeito?"' },
    { area: "Gestão", pergunta: '"Essa decisão está alinhada ao nosso propósito?"' },
    { area: "Design", pergunta: '"Essa peça é digna do que entregamos?"' },
  ];

  return (
    <div>
      <h2 className="font-serif text-xl font-semibold text-foreground mb-1">A Alma da Empresa</h2>
      <p className="text-xs text-muted leading-relaxed mb-5">
        Antes de qualquer processo, existe um propósito. É ele que define como fazemos tudo.
      </p>

      {/* Manifesto */}
      <div className="bg-gradient-to-br from-[#2A1E0E] to-[#3D2E1E] rounded-xl p-4 mb-5 border border-letitia-gold/30">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-letitia-gold mb-2">✦ Manifesto</p>
        <p className="font-serif text-sm text-letitia-gold/80 italic leading-[1.8]">
          &ldquo;Não vendemos cursos. Acompanhamos jornadas.<br />
          Não gerenciamos clientes. Cuidamos de almas.<br />
          Não executamos processos. Servimos com excelência.<br /><br />
          Cada pessoa que chega até nós traz uma história, uma dor e uma esperança.<br />
          Nosso trabalho é honrar isso em cada mensagem, cada entrega, cada detalhe.&rdquo;
        </p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {["Excelência", "Cuidado genuíno", "Presença", "Integridade", "Propósito"].map((v) => (
            <span key={v} className="text-[9px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-letitia-gold/15 text-letitia-gold/90 border border-letitia-gold/30">
              ✦ {v}
            </span>
          ))}
        </div>
      </div>

      {/* 5 Valores */}
      <p className="text-[10px] font-semibold uppercase tracking-widest text-letitia-gold mb-3 pb-1 border-b border-border">
        Os 5 valores que guiam cada decisão
      </p>
      <div className="space-y-2 mb-6">
        {valores.map((val) => (
          <CollapsibleCard
            key={val.titulo}
            header={
              <div className="flex items-center gap-2.5">
                <span className="text-lg">{val.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{val.titulo}</p>
                  <p className="text-[10px] text-muted">{val.sub}</p>
                </div>
              </div>
            }
          >
            <div className="bg-amber-50/50 border-l-[3px] border-letitia-gold rounded-r-md px-3 py-2 text-xs text-foreground/80 italic leading-relaxed mb-3 font-serif">
              {val.principio}
            </div>
            <ul className="space-y-1 mb-2">
              {val.items.map((item, i) => (
                <ArrowItem key={i}>{item}</ArrowItem>
              ))}
            </ul>
            <Badge variant="gest">Valor Central</Badge>
          </CollapsibleCard>
        ))}
      </div>

      {/* Perguntas de Ouro */}
      <p className="text-[10px] font-semibold uppercase tracking-widest text-letitia-gold mb-3 pb-1 border-b border-border">
        A pergunta de ouro de cada time
      </p>
      <CollapsibleCard
        header={
          <div className="flex items-center gap-2.5">
            <span className="text-lg">❓</span>
            <div>
              <p className="text-sm font-semibold text-foreground">Antes de qualquer ação, se pergunte:</p>
              <p className="text-[10px] text-muted">Perguntas que guiam cada área</p>
            </div>
          </div>
        }
      >
        <ul className="space-y-1">
          {perguntas.map((p) => (
            <ArrowItem key={p.area}>
              <strong>{p.area}:</strong> {p.pergunta}
            </ArrowItem>
          ))}
        </ul>
      </CollapsibleCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PANEL: GESTÃO
   ═══════════════════════════════════════════════════════ */

function PanelGestao() {
  return (
    <div>
      <div className="bg-gradient-to-r from-[#3D2E1E] to-[#6B4F35] rounded-xl p-4 mb-5 flex items-center gap-3">
        <span className="text-3xl">👁</span>
        <div>
          <h2 className="font-serif text-xl font-semibold text-white">Gestão Estratégica</h2>
          <p className="text-[11px] text-white/60 italic">Guardiã da cultura · Decisões · Visão do todo</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#2A1E0E] to-[#3D2E1E] rounded-xl p-4 mb-5 border border-letitia-gold/30">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-letitia-gold mb-2">✦ Cultura · Gestão</p>
        <p className="font-serif text-sm text-letitia-gold/80 italic leading-relaxed">
          &ldquo;A gestão não gerencia processos. Guarda a alma da empresa. É ela que decide quando o protocolo cede ao cuidado — e quando o cuidado exige um limite claro.&rdquo;
        </p>
      </div>

      <p className="text-[10px] font-semibold uppercase tracking-widest text-letitia-gold mb-3 pb-1 border-b border-border">
        Ritmo semanal
      </p>
      <div className="space-y-2 mb-6">
        <CollapsibleCard
          header={
            <div className="flex items-center gap-2.5">
              <span className="text-lg">📅</span>
              <div>
                <p className="text-sm font-semibold text-foreground">O que a gestão recebe toda semana</p>
                <p className="text-[10px] text-muted">Dados para decisão com propósito</p>
              </div>
            </div>
          }
        >
          <ul className="space-y-1 mb-2">
            <ArrowItem><strong>Segunda:</strong> Resumo de vendas (Mônica)</ArrowItem>
            <ArrowItem><strong>Quarta:</strong> Relatório financeiro — recebimentos, pendências (Financeiro)</ArrowItem>
            <ArrowItem><strong>Quinta:</strong> Status das clientes — engajamento, riscos, renovações (Carol)</ArrowItem>
            <ArrowItem><strong>Sexta:</strong> Desempenho de conteúdo e prévia da próxima grade (Marketing PJ)</ArrowItem>
            <ArrowItem>Decisões estratégicas tomadas na sexta para a semana seguinte</ArrowItem>
          </ul>
          <Badge variant="gest">Gestão</Badge>
        </CollapsibleCard>

        <CollapsibleCard
          header={
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🚨</span>
              <div>
                <p className="text-sm font-semibold text-foreground">O que escala para a gestão</p>
                <p className="text-[10px] text-muted">Apenas o que exige decisão ou julgamento humano</p>
              </div>
            </div>
          }
        >
          <ul className="space-y-1 mb-2">
            <ArrowItem>Cancelamentos — nenhum sem aval da gestão</ArrowItem>
            <ArrowItem>Renegociações financeiras ou condições especiais</ArrowItem>
            <ArrowItem>Insatisfações graves — a gestão entra pessoalmente quando necessário</ArrowItem>
            <ArrowItem>Mudanças de posicionamento ou grade de conteúdo</ArrowItem>
            <ArrowItem>Inadimplência acima de 15 dias</ArrowItem>
            <ArrowItem>Decisões jurídicas e contratuais</ArrowItem>
          </ul>
          <div className="bg-amber-50/50 border-l-[3px] border-letitia-gold rounded-r-md px-3 py-2 text-xs text-foreground/80 italic leading-relaxed mb-3 font-serif">
            &ldquo;Quando a equipe escala, confia que a gestão vai decidir com sabedoria — não apenas com eficiência.&rdquo;
          </div>
          <Badge variant="gest">Gestão</Badge>
        </CollapsibleCard>

        <CollapsibleCard
          header={
            <div className="flex items-center gap-2.5">
              <span className="text-lg">📊</span>
              <div>
                <p className="text-sm font-semibold text-foreground">Indicadores com alma</p>
                <p className="text-[10px] text-muted">Números que revelam a saúde do cuidado</p>
              </div>
            </div>
          }
        >
          <ul className="space-y-1 mb-2">
            <ArrowItem>Taxa de renovação — quanto as pessoas querem continuar</ArrowItem>
            <ArrowItem>Taxa de engajamento — quantas estão sendo genuinamente transformadas</ArrowItem>
            <ArrowItem>NPS informal — o que dizem quando ninguém está vendendo</ArrowItem>
            <ArrowItem>Depoimentos espontâneos — o melhor termômetro de impacto real</ArrowItem>
            <ArrowItem>Taxa de inadimplência — sinal de desalinhamento de expectativa ou dificuldade real</ArrowItem>
          </ul>
          <Badge variant="gest">Gestão</Badge>
        </CollapsibleCard>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PANEL: MARKETING
   ═══════════════════════════════════════════════════════ */

function PanelMarketing() {
  const etapasMkt = [
    {
      num: 1,
      titulo: "Briefing semanal — toda segunda-feira",
      responsavel: "Letícia + Gestão → Marketing PJ",
      items: [
        "Letícia envia ideias, temas e demandas da semana",
        "Gestão valida na mesma reunião — decisão imediata, sem espera",
        "Marketing PJ recebe briefing consolidado até segunda à tarde e já inicia a produção",
        "Demandas urgentes: mínimo 48h — qualidade não se negocia",
      ],
    },
    {
      num: 2,
      titulo: "Produção com identidade",
      responsavel: "Marketing PJ (2 pessoas)",
      items: [
        "Copy produz legendas, e-mails e roteiros com a voz da Letícia",
        'Pergunta antes de cada peça: \"Isso é digno do que entregamos?\"',
        "Peças enviadas para aprovação até sábado",
        "Designer recebe briefing do Marketing e produz artes alinhadas à identidade visual",
      ],
      principio: '"Design de excelência não é o mais bonito. É o que comunica com clareza e honra a marca que representa."',
    },
    {
      num: 3,
      titulo: "Aprovação e publicação",
      responsavel: "Gestão ou Letícia aprova → Marketing publica",
      items: [
        "Aprovação via drive ou ferramenta de gestão de conteúdo",
        "Marketing programa publicações nos canais e horários definidos",
        "E-mails: revisados pela gestão antes do disparo — sempre",
        "Stories espontâneos de Letícia: ela publica diretamente",
      ],
    },
    {
      num: 4,
      titulo: "Análise e aprendizado",
      responsavel: "Marketing PJ → Gestão",
      items: [
        "Relatório semanal: alcance, engajamento, salvamentos, leads",
        "O que tocou as pessoas? O que gerou ação? O que foi ignorado?",
        "Dados retroalimentam o briefing da semana seguinte",
        "Gestão usa os dados para direcionamento estratégico",
      ],
    },
  ];

  const grade = [
    { dia: "SEG", items: ["Feed: Post de valor / reflexão — abre a semana com intenção", "Stories: Bastidores ou rotina de Letícia"] },
    { dia: "TER", items: ["E-mail: Newsletter — conteúdo exclusivo para a base", "Stories: Enquete / interação genuína com a audiência"] },
    { dia: "QUA", items: ["Reels: Conteúdo de alcance / autoridade / provocação", "Stories: Depoimento de aluna — transformação real"] },
    { dia: "QUI", items: ["Feed: Case / resultado de mentorada (com autorização)", "Stories: Abertura para DMs — conexão direta"] },
    { dia: "SEX", items: ["Reels: Conteúdo leve — conexão pessoal de Letícia", "E-mail: CTA ou oferta (em períodos comerciais)"] },
    { dia: "SAB", items: ["Feed: Conteúdo de fé, propósito e vida — encerra a semana com sentido"] },
  ];

  const gatilhosMkt = [
    "gatilho · briefing aprovado",
    "gatilho · peças produzidas",
    "gatilho · conteúdo aprovado",
  ];

  return (
    <div>
      <div className="bg-gradient-to-r from-[#5B2E8A] to-[#7B4EAA] rounded-xl p-4 mb-5 flex items-center gap-3">
        <span className="text-3xl">📣</span>
        <div>
          <h2 className="font-serif text-xl font-semibold text-white">Marketing</h2>
          <p className="text-[11px] text-white/60 italic">Conteúdo que honra · Alcança · Transforma</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#2A1E0E] to-[#3D2E1E] rounded-xl p-4 mb-5 border border-letitia-gold/30">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-letitia-gold mb-2">✦ Cultura · Marketing</p>
        <p className="font-serif text-sm text-letitia-gold/80 italic leading-relaxed">
          &ldquo;Nosso conteúdo não é estratégia de alcance. É extensão do que acreditamos. Cada post, cada e-mail, cada arte precisa ser digno de quem vai receber — e fiel à voz da Letícia.&rdquo;
        </p>
      </div>

      <Nota>
        <strong>Como funciona:</strong> Letícia é a fonte e a voz. A empresa PJ transforma em peças. A gestão aprova. Demandas espontâneas de Letícia entram com prazo mínimo de 48h — a excelência não se faz com pressa.
      </Nota>

      <p className="text-[10px] font-semibold uppercase tracking-widest text-letitia-gold mb-3 pb-1 border-b border-border">
        Fluxo de produção
      </p>
      <div className="space-y-1.5 mb-6">
        {etapasMkt.map((etapa, idx) => (
          <div key={etapa.num}>
            <CollapsibleCard
              header={
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-violet-700 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                    {etapa.num}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-tight">{etapa.titulo}</p>
                    <p className="text-[10px] text-muted uppercase tracking-wide mt-0.5">{etapa.responsavel}</p>
                  </div>
                </div>
              }
            >
              <ul className="space-y-1 mb-3 pl-10">
                {etapa.items.map((item, i) => (
                  <ArrowItem key={i}>{item}</ArrowItem>
                ))}
              </ul>
              {etapa.principio && (
                <div className="bg-amber-50/50 border-l-[3px] border-letitia-gold rounded-r-md px-3 py-2 text-xs text-foreground/80 italic leading-relaxed mb-3 font-serif pl-10">
                  {etapa.principio}
                </div>
              )}
            </CollapsibleCard>
            {idx < gatilhosMkt.length && <Gatilho text={gatilhosMkt[idx]} />}
          </div>
        ))}
      </div>

      <p className="text-[10px] font-semibold uppercase tracking-widest text-letitia-gold mb-3 pb-1 border-b border-border">
        Grade semanal padrão
      </p>
      <div className="bg-white rounded-xl border border-border overflow-hidden mb-4">
        <div className="bg-[#3D1E4A] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-letitia-gold/90">
            📅 Grade Semanal · Referência
          </p>
        </div>
        {grade.map((g, idx) => (
          <div key={g.dia} className={cn("flex items-start gap-3 px-4 py-3", idx < grade.length - 1 && "border-b border-border/50")}>
            <span className="w-9 flex-shrink-0 text-[10px] font-bold text-foreground pt-0.5">{g.dia}</span>
            <div className="flex-1 space-y-1">
              {g.items.map((item, i) => (
                <p key={i} className="text-[11px] text-foreground/70 leading-relaxed">{item}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Nota>
        <strong>Flexibilidade com excelência:</strong> A grade é referência, não prisão. Em semanas de lançamento ou evento, o calendário comercial tem prioridade. Mas toda mudança de última hora tem um custo de qualidade — e isso precisa ser avaliado.
      </Nota>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PANEL: FINANCEIRO
   ═══════════════════════════════════════════════════════ */

function PanelFinanceiro() {
  return (
    <div>
      <div className="bg-gradient-to-r from-[#9B6A1A] to-[#C8922A] rounded-xl p-4 mb-5 flex items-center gap-3">
        <span className="text-3xl">💰</span>
        <div>
          <h2 className="font-serif text-xl font-semibold text-white">Financeiro</h2>
          <p className="text-[11px] text-white/60 italic">Integridade em cada centavo · Respeito em cada cobrança</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#2A1E0E] to-[#3D2E1E] rounded-xl p-4 mb-5 border border-letitia-gold/30">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-letitia-gold mb-2">✦ Cultura · Financeiro</p>
        <p className="font-serif text-sm text-letitia-gold/80 italic leading-relaxed">
          &ldquo;O financeiro é o ato de respeitar o investimento que a aluna fez em si mesma. Cobrar com dignidade e pagar fornecedores em dia são expressões da nossa integridade — não apenas obrigações.&rdquo;
        </p>
      </div>

      <p className="text-[10px] font-semibold uppercase tracking-widest text-letitia-gold mb-3 pb-1 border-b border-border">
        Rotina financeira
      </p>
      <div className="space-y-2 mb-4">
        <CollapsibleCard
          header={
            <div className="flex items-center gap-2.5">
              <span className="text-lg">📥</span>
              <div>
                <p className="text-sm font-semibold text-foreground">Registro de nova venda</p>
                <p className="text-[10px] text-muted">Cada venda é uma responsabilidade assumida</p>
              </div>
            </div>
          }
        >
          <ul className="space-y-1 mb-2">
            <ArrowItem>Recebe a ficha de venda de Mônica imediatamente após o fechamento</ArrowItem>
            <ArrowItem>Registra: produto, valor, forma de pgto, parcelas, vencimentos</ArrowItem>
            <ArrowItem>Confirma geração do link/boleto ou recebimento via plataforma</ArrowItem>
            <ArrowItem>Notifica gestão que a venda está registrada financeiramente</ArrowItem>
          </ul>
          <Badge variant="fin">Financeiro</Badge>
        </CollapsibleCard>

        <CollapsibleCard
          header={
            <div className="flex items-center gap-2.5">
              <span className="text-lg">📆</span>
              <div>
                <p className="text-sm font-semibold text-foreground">Controle semanal de vencimentos</p>
                <p className="text-[10px] text-muted">Antecipar é cuidar</p>
              </div>
            </div>
          }
        >
          <ul className="space-y-1 mb-2">
            <ArrowItem>Toda segunda: verifica vencimentos da semana e confirma recebimentos</ArrowItem>
            <ArrowItem>Concilia plataforma (Hotmart/Kiwify) com controle interno</ArrowItem>
            <ArrowItem>Identifica pendências antes que virem problemas</ArrowItem>
            <ArrowItem>Relatório enviado até domingo para entrar na pauta da reunião de segunda</ArrowItem>
          </ul>
          <div className="flex gap-1.5">
            <Badge variant="fin">Financeiro</Badge>
            <Badge variant="gest">→ Gestão</Badge>
          </div>
        </CollapsibleCard>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PANEL: DESIGN
   ═══════════════════════════════════════════════════════ */

function PanelDesign() {
  return (
    <div>
      <div className="bg-gradient-to-r from-[#2E7A8A] to-[#3DA0B0] rounded-xl p-4 mb-5 flex items-center gap-3">
        <span className="text-3xl">🎨</span>
        <div>
          <h2 className="font-serif text-xl font-semibold text-white">Design</h2>
          <p className="text-[11px] text-white/60 italic">Identidade visual · Artes · Comunicação visual com excelência</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#2A1E0E] to-[#3D2E1E] rounded-xl p-4 mb-5 border border-letitia-gold/30">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-letitia-gold mb-2">✦ Cultura · Design</p>
        <p className="font-serif text-sm text-letitia-gold/80 italic leading-relaxed">
          &ldquo;Design de excelência não é o mais bonito. É o que comunica com clareza e honra a marca que representa. Cada peça é uma extensão da identidade da Letícia — e merece o mesmo cuidado que damos às pessoas.&rdquo;
        </p>
      </div>

      <p className="text-[10px] font-semibold uppercase tracking-widest text-letitia-gold mb-3 pb-1 border-b border-border">
        Responsabilidades do Design
      </p>
      <div className="space-y-2 mb-6">
        <CollapsibleCard
          header={
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🖌️</span>
              <div>
                <p className="text-sm font-semibold text-foreground">Produção de artes e peças visuais</p>
                <p className="text-[10px] text-muted">Fidelidade à identidade visual da marca</p>
              </div>
            </div>
          }
        >
          <ul className="space-y-1 mb-2">
            <ArrowItem>Produz artes para Feed, Reels, Stories e materiais de apoio</ArrowItem>
            <ArrowItem>Segue rigorosamente o manual de identidade visual da Laetitia</ArrowItem>
            <ArrowItem>Sem improvisos — cada peça passa por revisão antes da entrega</ArrowItem>
            <ArrowItem>Trabalha em conjunto com o Marketing, recebendo o briefing e entregando as peças finalizadas</ArrowItem>
          </ul>
          <Badge variant="cx">Design</Badge>
        </CollapsibleCard>

        <CollapsibleCard
          header={
            <div className="flex items-center gap-2.5">
              <span className="text-lg">📐</span>
              <div>
                <p className="text-sm font-semibold text-foreground">Materiais institucionais e de produto</p>
                <p className="text-[10px] text-muted">Propostas, PDFs, apresentações e materiais de venda</p>
              </div>
            </div>
          }
        >
          <ul className="space-y-1 mb-2">
            <ArrowItem>Criação e atualização de propostas comerciais em PDF</ArrowItem>
            <ArrowItem>Materiais de apoio para mentoradas (templates, frameworks visuais)</ArrowItem>
            <ArrowItem>Apresentações para eventos e encontros presenciais</ArrowItem>
            <ArrowItem>Peças de e-mail marketing alinhadas ao tom da marca</ArrowItem>
          </ul>
          <Badge variant="cx">Design</Badge>
        </CollapsibleCard>

        <CollapsibleCard
          header={
            <div className="flex items-center gap-2.5">
              <span className="text-lg">✅</span>
              <div>
                <p className="text-sm font-semibold text-foreground">Fluxo de trabalho com Marketing</p>
                <p className="text-[10px] text-muted">Integração clara e prazos definidos</p>
              </div>
            </div>
          }
        >
          <ul className="space-y-1 mb-2">
            <ArrowItem>Marketing envia briefing consolidado na segunda-feira</ArrowItem>
            <ArrowItem>Design produz as peças ao longo da semana</ArrowItem>
            <ArrowItem>Entrega para aprovação até sábado</ArrowItem>
            <ArrowItem>Ajustes finais com prazo mínimo de 24h antes da publicação</ArrowItem>
            <ArrowItem>Demandas urgentes: mínimo 48h — qualidade não se negocia</ArrowItem>
          </ul>
          <div className="bg-amber-50/50 border-l-[3px] border-letitia-gold rounded-r-md px-3 py-2 text-xs text-foreground/80 italic leading-relaxed mb-3 font-serif">
            &ldquo;Pergunta antes de cada peça: Isso é digno do que entregamos?&rdquo;
          </div>
          <div className="flex gap-1.5">
            <Badge variant="cx">Design</Badge>
            <Badge variant="renovacao">Marketing</Badge>
          </div>
        </CollapsibleCard>
      </div>

      <Nota>
        <strong>Regra de ouro:</strong> A identidade visual é sagrada. Nenhuma peça sai sem estar alinhada ao manual da marca. Design e Marketing são parceiros — mas cada um tem sua zona de responsabilidade clara.
      </Nota>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════ */

export function ProcessosComerciais() {
  const [activeTab, setActiveTab] = useState<TabId>("cultura");

  return (
    <div className="min-h-full">
      {/* Page Header */}
      <div className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-letitia-gold mb-1">
          Laetitia Educação · LaCademia
        </p>
        <h1 className="font-serif text-2xl md:text-3xl font-semibold text-foreground">
          Processos da Empresa
        </h1>
        <p className="text-sm text-muted mt-1 italic">
          Cultura · Gestão · Comercial · CX · Marketing · Financeiro · Renovações · Inadimplência
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-6 -mx-1 px-1 scrollbar-hide">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                isActive
                  ? "bg-foreground text-primary-foreground shadow-sm"
                  : "bg-card text-muted hover:bg-card/80 hover:text-foreground"
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Panel content */}
      <div className="max-w-2xl">
        {activeTab === "cultura" && <PanelCultura />}
        {activeTab === "gestao" && <PanelGestao />}
        {activeTab === "fluxo" && <PanelFluxo />}
        {activeTab === "cx" && <PanelCX />}
        {activeTab === "mkt" && <PanelMarketing />}
        {activeTab === "design" && <PanelDesign />}
        {activeTab === "financeiro" && <PanelFinanceiro />}
        {activeTab === "renovacao" && <PanelRenovacao />}
        {activeTab === "equipe" && <PanelEquipe />}
        {activeTab === "inadimplencia" && <PanelInadimplencia />}
      </div>
    </div>
  );
}
