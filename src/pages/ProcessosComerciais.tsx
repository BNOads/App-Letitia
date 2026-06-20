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
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Types ────────────────────────────────────────────── */

type TabId = "fluxo" | "cx" | "renovacao" | "equipe" | "inadimplencia";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

const tabs: Tab[] = [
  { id: "fluxo", label: "Fluxo de Venda", icon: Handshake },
  { id: "cx", label: "CX & Protocolos", icon: HeadphonesIcon },
  { id: "renovacao", label: "Renovações", icon: RefreshCw },
  { id: "equipe", label: "Equipe", icon: Users },
  { id: "inadimplencia", label: "Inadimplência", icon: AlertTriangle },
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
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════ */

export function ProcessosComerciais() {
  const [activeTab, setActiveTab] = useState<TabId>("fluxo");

  return (
    <div className="min-h-full">
      {/* Page Header */}
      <div className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-letitia-gold mb-1">
          Laetitia Educação · LaCademia
        </p>
        <h1 className="font-serif text-2xl md:text-3xl font-semibold text-foreground">
          Processos Comerciais
        </h1>
        <p className="text-sm text-muted mt-1 italic">
          Venda · CX · Mentoradas · Renovações · Inadimplência
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
        {activeTab === "fluxo" && <PanelFluxo />}
        {activeTab === "cx" && <PanelCX />}
        {activeTab === "renovacao" && <PanelRenovacao />}
        {activeTab === "equipe" && <PanelEquipe />}
        {activeTab === "inadimplencia" && <PanelInadimplencia />}
      </div>
    </div>
  );
}
