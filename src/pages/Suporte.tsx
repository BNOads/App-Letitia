import { useState } from "react";
import { Search, Plus, Clock, AlertCircle, CheckCircle2, Ticket as TicketIcon, Filter, ExternalLink, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type Ticket = {
  id: string;
  numero: number;
  cliente: { nome: string; email: string; instagram?: string };
  categoria: string;
  prioridade: "Baixa" | "Normal" | "Alta" | "Urgente";
  responsavel: { nome: string; avatar: string };
  status: "Aberto" | "Em atendimento" | "Resolvido" | "Fechado";
  sla: string;
  isAtrasado: boolean;
};

const mockTickets: Ticket[] = [
  { id: "t1", numero: 163, cliente: { nome: "Fernanda Oliveira", email: "fernanda@email.com", instagram: "@fer.oliveira" }, categoria: "Suporte", prioridade: "Baixa", responsavel: { nome: "Mariana Costa", avatar: "MC" }, status: "Aberto", sla: "cerca de 5 horas", isAtrasado: false },
  { id: "t2", numero: 162, cliente: { nome: "Beatriz Santos", email: "bia.santos@email.com" }, categoria: "Financeiro", prioridade: "Normal", responsavel: { nome: "Juliana Reis", avatar: "JR" }, status: "Aberto", sla: "Atrasado (2h)", isAtrasado: true },
  { id: "t3", numero: 160, cliente: { nome: "Amanda Aguiar", email: "amanda@email.com", instagram: "@amandaaguiar" }, categoria: "Suporte", prioridade: "Baixa", responsavel: { nome: "Mariana Costa", avatar: "MC" }, status: "Em atendimento", sla: "Atrasado (1d)", isAtrasado: true },
  { id: "t4", numero: 159, cliente: { nome: "Mariana Viega", email: "mariana.v@email.com" }, categoria: "Vendas", prioridade: "Normal", responsavel: { nome: "Juliana Reis", avatar: "JR" }, status: "Aberto", sla: "Atrasado (2d)", isAtrasado: true },
  { id: "t5", numero: 158, cliente: { nome: "Carolina Mendes", email: "carol.mendes@email.com" }, categoria: "Mentoria THE WAY", prioridade: "Alta", responsavel: { nome: "Letícia Cazarré", avatar: "LC" }, status: "Em atendimento", sla: "cerca de 1 dia", isAtrasado: false },
];

const prioridadeColors = {
  Baixa: "text-muted",
  Normal: "text-foreground font-medium",
  Alta: "text-amber-500 font-semibold",
  Urgente: "text-red-500 font-bold",
};

const statusColors = {
  Aberto: "bg-blue-500/10 text-blue-600",
  "Em atendimento": "bg-amber-500/10 text-amber-600",
  Resolvido: "bg-green-500/10 text-green-600",
  Fechado: "bg-gray-500/10 text-gray-500",
};

export function Suporte() {
  const [busca, setBusca] = useState("");
  const [tickets] = useState<Ticket[]>(mockTickets);
  const [meusTickets, setMeusTickets] = useState(false);
  
  const filtrados = tickets.filter(t => 
    t.cliente.nome.toLowerCase().includes(busca.toLowerCase()) || 
    t.cliente.email.toLowerCase().includes(busca.toLowerCase())
  );

  const abertos = tickets.filter(t => t.status === "Aberto" || t.status === "Em atendimento").length;
  const atrasados = tickets.filter(t => t.isAtrasado).length;
  const resolvidos = 151; // Mock fixo para espelhar a imagem
  const total = 159;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-letitia-gold/10">
            <TicketIcon className="h-5 w-5 text-letitia-gold" />
          </div>
          <div>
            <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground">Central de Suporte</h2>
            <p className="mt-0.5 text-sm text-muted">Gerencie tickets, acompanhe SLAs e resolva demandas com agilidade.</p>
          </div>
        </div>
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all flex items-center gap-2 self-start">
          <Plus className="h-4 w-4" /> Novo Ticket
        </button>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-1 border-b border-border pb-px">
        <button className="px-4 py-2 text-sm font-semibold border-b-2 border-foreground text-foreground">Tickets</button>
        <button className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-muted hover:text-foreground">Vendas</button>
        <button className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-muted hover:text-foreground">Dashboard</button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={<TicketIcon className="h-4 w-4 text-foreground" />} label="Total" value={String(total)} color="border-foreground border-l-4" />
        <KPICard icon={<Clock className="h-4 w-4 text-blue-500" />} label="Em aberto" value={String(abertos)} color="border-blue-500 border-l-4" />
        <KPICard icon={<AlertCircle className="h-4 w-4 text-red-500" />} label="Atrasados" value={String(atrasados)} color="border-red-500 border-l-4" />
        <KPICard icon={<CheckCircle2 className="h-4 w-4 text-green-500" />} label="Resolvidos" value={String(resolvidos)} color="border-green-500 border-l-4" />
      </div>

      {/* Toggles & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <div className={cn("w-10 h-5 rounded-full relative transition-colors", meusTickets ? "bg-letitia-gold" : "bg-border")}>
              <div className={cn("w-4 h-4 rounded-full bg-card absolute top-0.5 transition-transform", meusTickets ? "left-5" : "left-0.5")} />
            </div>
            <span className="text-sm font-medium">Meus tickets</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer opacity-50">
            <div className="w-10 h-5 rounded-full relative bg-border">
              <div className="w-4 h-4 rounded-full bg-card absolute top-0.5 left-0.5" />
            </div>
            <span className="text-sm font-medium">Criados por mim</span>
          </label>
          <button className="text-sm font-medium text-muted hover:text-foreground flex items-center gap-1.5 border border-border px-3 py-1.5 rounded-md">
            <RefreshCw className="h-3.5 w-3.5" /> Sincronizar Tarefas
          </button>
        </div>
        <p className="text-xs text-muted font-medium">{total} tickets</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-md border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted focus:ring-2 focus:ring-letitia-gold focus:outline-none"
            placeholder="Buscar por nome ou e-mail..."
          />
        </div>
        <select className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none">
          <option>Todos os status</option>
        </select>
        <select className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none">
          <option>Todas prioridades</option>
        </select>
        <select className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none">
          <option>Todas categorias</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="w-10 px-4 py-3"><input type="checkbox" className="rounded border-border" /></th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">#</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Cliente</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Categoria</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Prioridade</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Responsável</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Status</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">SLA</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-background/50 transition-colors cursor-pointer group">
                  <td className="px-4 py-4"><input type="checkbox" className="rounded border-border" /></td>
                  <td className="px-4 py-4 text-sm font-medium text-muted flex items-center gap-1">
                    {t.numero}
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-bold text-foreground uppercase tracking-wide">{t.cliente.nome}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-muted">{t.cliente.email}</span>
                      {t.cliente.instagram && <span className="text-[11px] text-pink-500 font-medium">{t.cliente.instagram}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-foreground capitalize">{t.categoria}</td>
                  <td className="px-4 py-4">
                    <span className={cn("text-[11px] bg-background/50 px-2 py-1 rounded", prioridadeColors[t.prioridade])}>
                      {t.prioridade}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background border border-border text-[9px] font-medium text-foreground">{t.responsavel.avatar}</span>
                      <span className="text-xs text-foreground font-medium">{t.responsavel.nome}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <select 
                      className={cn("text-xs font-semibold px-2 py-1 rounded appearance-none cursor-pointer outline-none", statusColors[t.status])}
                      value={t.status}
                      readOnly
                    >
                      <option>{t.status}</option>
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn("text-[11px] font-medium flex items-center gap-1", t.isAtrasado ? "text-red-500" : "text-muted")}>
                      {t.isAtrasado ? <AlertCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {t.sla}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md", color)}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {icon}
        <p className="font-serif text-3xl font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}
