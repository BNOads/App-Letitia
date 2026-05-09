import { useState, useEffect } from "react";
import { getTickets, updateTicketStatus, createTicket, type DBTicket } from "@/services/supportService";
import { getProfiles, type DBProfile } from "@/services/profileService";
import { Search, Plus, Clock, AlertCircle, CheckCircle2, Ticket as TicketIcon, RefreshCw, ExternalLink, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { UserSelector } from "@/components/UserSelector";

const prioridadeColors: Record<string, string> = {
  Baixa: "text-muted",
  Normal: "text-foreground font-medium",
  Alta: "text-amber-500 font-semibold",
  Urgente: "text-red-500 font-bold",
};

const statusColors: Record<string, string> = {
  Aberto: "bg-blue-500/10 text-blue-600",
  "Em atendimento": "bg-amber-500/10 text-amber-600",
  Resolvido: "bg-green-500/10 text-green-600",
  Fechado: "bg-gray-500/10 text-gray-500",
};

export function Suporte() {
  const { user } = useAuth();
  const [busca, setBusca] = useState("");
  const [tickets, setTickets] = useState<DBTicket[]>([]);
  const [profiles, setProfiles] = useState<DBProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [meusTickets, setMeusTickets] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [ticketsData, profilesData] = await Promise.all([
        getTickets(), 
        getProfiles({ id: user?.id || "", full_name: user?.user_metadata?.full_name })
      ]);
      setTickets(ticketsData);
      setProfiles(profilesData);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTickets() {
    try {
      const data = await getTickets();
      setTickets(data);
    } catch (error) {
      console.error("Erro ao buscar tickets:", error);
    }
  }

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await updateTicketStatus(id, newStatus);
      fetchTickets();
    } catch (error) {
      console.error("Erro ao atualizar status do ticket:", error);
    }
  };

  const filtrados = tickets.filter(t => {
    const matchBusca = t.cliente_nome.toLowerCase().includes(busca.toLowerCase()) || 
                       t.cliente_email.toLowerCase().includes(busca.toLowerCase());
    
    if (meusTickets) {
      return matchBusca && t.responsavel_id === user?.id;
    }
    return matchBusca;
  });

  const abertos = tickets.filter(t => t.status === "Aberto" || t.status === "Em atendimento").length;
  const atrasados = tickets.filter(t => t.prazo_sla && new Date(t.prazo_sla) < new Date()).length;
  const resolvidos = tickets.filter(t => t.status === "Resolvido").length;
  const total = tickets.length;

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-letitia-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-letitia-gold/10">
            <TicketIcon className="h-5 w-5 text-letitia-gold" />
          </div>
          <div>
            <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground">Central de Suporte</h2>
            <p className="mt-0.5 text-sm text-muted">Gerencie tickets e acompanhe as demandas do time.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all flex items-center gap-2 self-start"
        >
          <Plus className="h-4 w-4" /> Novo Ticket
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={<TicketIcon className="h-4 w-4 text-foreground" />} label="Total" value={String(total)} color="border-foreground border-l-4" />
        <KPICard icon={<Clock className="h-4 w-4 text-blue-500" />} label="Em aberto" value={String(abertos)} color="border-blue-500 border-l-4" />
        <KPICard icon={<AlertCircle className="h-4 w-4 text-red-500" />} label="Atrasados" value={String(atrasados)} color="border-red-500 border-l-4" />
        <KPICard icon={<CheckCircle2 className="h-4 w-4 text-green-500" />} label="Resolvidos" value={String(resolvidos)} color="border-green-500 border-l-4" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setMeusTickets(!meusTickets)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className={cn("w-10 h-5 rounded-full relative transition-colors", meusTickets ? "bg-letitia-gold" : "bg-border")}>
              <div className={cn("w-4 h-4 rounded-full bg-card absolute top-0.5 transition-transform", meusTickets ? "left-5" : "left-0.5")} />
            </div>
            <span className="text-sm font-medium">Meus tickets</span>
          </button>
          <button 
            onClick={() => fetchTickets()}
            className="text-sm font-medium text-muted hover:text-foreground flex items-center gap-1.5 border border-border px-3 py-1.5 rounded-md"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Atualizar
          </button>
        </div>
        <p className="text-xs text-muted font-medium">{filtrados.length} tickets filtrados</p>
      </div>

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
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">#</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Cliente</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Categoria</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Prioridade</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Responsável</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted italic">Nenhum ticket encontrado.</td>
                </tr>
              ) : (
                filtrados.map((t) => {
                  const iniciais = t.profiles?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || "??";
                  return (
                    <tr key={t.id} className="border-b border-border last:border-0 hover:bg-background/50 transition-colors cursor-pointer group">
                      <td className="px-4 py-4 text-sm font-medium text-muted">
                        <div className="flex items-center gap-1">
                          {t.numero}
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-bold text-foreground uppercase tracking-wide">{t.cliente_nome}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-muted">{t.cliente_email}</span>
                          {t.cliente_instagram && <span className="text-[11px] text-pink-500 font-medium">{t.cliente_instagram}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-foreground capitalize">{t.categoria}</td>
                      <td className="px-4 py-4">
                        <span className={cn("text-[11px] bg-background/50 px-2 py-1 rounded", prioridadeColors[t.prioridade] || "text-muted")}>
                          {t.prioridade}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background border border-border text-[9px] font-medium text-foreground">{iniciais}</span>
                          <span className="text-xs text-foreground font-medium">{t.profiles?.full_name || "Sem atribuição"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <select 
                          className={cn("text-xs font-semibold px-2 py-1 rounded appearance-none cursor-pointer outline-none border border-transparent hover:border-border", statusColors[t.status] || "bg-gray-100")}
                          value={t.status}
                          onChange={(e) => handleStatusUpdate(t.id, e.target.value)}
                        >
                          <option value="Aberto">Aberto</option>
                          <option value="Em atendimento">Em atendimento</option>
                          <option value="Resolvido">Resolvido</option>
                          <option value="Fechado">Fechado</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <NovoTicketModal 
          profiles={profiles}
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => { setIsModalOpen(false); fetchTickets(); }} 
        />
      )}
    </div>
  );
}

function NovoTicketModal({ profiles, onClose, onSuccess }: { profiles: DBProfile[]; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cliente_nome: "",
    cliente_email: "",
    cliente_instagram: "",
    categoria: "Dúvida",
    prioridade: "Normal",
    status: "Aberto",
    responsavel_id: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createTicket(formData);
      onSuccess();
    } catch (error) {
      console.error("Erro ao criar ticket:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif text-2xl font-medium text-foreground">Novo Ticket</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-foreground/10 transition-colors">
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Nome do Cliente</label>
            <input
              required
              value={formData.cliente_nome}
              onChange={e => setFormData({ ...formData, cliente_nome: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
              placeholder="Nome completo da aluna"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">E-mail</label>
              <input
                required
                type="email"
                value={formData.cliente_email}
                onChange={e => setFormData({ ...formData, cliente_email: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
                placeholder="aluna@email.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Instagram</label>
              <input
                value={formData.cliente_instagram}
                onChange={e => setFormData({ ...formData, cliente_instagram: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
                placeholder="@usuario"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Categoria</label>
              <select
                value={formData.categoria}
                onChange={e => setFormData({ ...formData, categoria: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
              >
                <option value="Dúvida">Dúvida</option>
                <option value="Acesso">Acesso</option>
                <option value="Pagamento">Pagamento</option>
                <option value="Reclamação">Reclamação</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Prioridade</label>
              <select
                value={formData.prioridade}
                onChange={e => setFormData({ ...formData, prioridade: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
              >
                <option value="Baixa">Baixa</option>
                <option value="Normal">Normal</option>
                <option value="Alta">Alta</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>
          </div>

          <UserSelector
            label="Atribuir a"
            users={profiles}
            selectedId={formData.responsavel_id}
            onSelect={(id) => setFormData({ ...formData, responsavel_id: id })}
          />

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all flex items-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Abrir Ticket
            </button>
          </div>
        </form>
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
