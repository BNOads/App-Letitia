import { useState, useEffect } from "react";
import { 
  getTickets, updateTicketStatus, createTicket, updateTicket, deleteTicket, 
  getComments, createComment, transferTicket, resolveTicket, type DBTicket, type DBTicketComment 
} from "@/services/supportService";
import { getProfiles, type DBProfile } from "@/services/profileService";
import { notifyNewTicket } from "@/services/notificationService";
import { 
  Search, Plus, Clock, AlertCircle, CheckCircle2, Ticket as TicketIcon, 
  RefreshCw, ExternalLink, Loader2, X, Phone, Mail, Camera,
  MessageSquare, Send, ChevronRight, ChevronDown, Edit2, Trash2, Save,
  ArrowRightLeft, CheckCheck
} from "lucide-react";
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

type StatusFilter = "todos" | "abertos" | "atrasados" | "resolvidos";

export function Suporte() {
  const { user } = useAuth();
  const [busca, setBusca] = useState("");
  const [tickets, setTickets] = useState<DBTicket[]>([]);
  const [profiles, setProfiles] = useState<DBProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [meusTickets, setMeusTickets] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<DBTicket | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [ticketsData, profilesData] = await Promise.all([
        getTickets(), 
        getProfiles()
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
      if (selectedTicket) {
        const updated = data.find(t => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    } catch (error) {
      console.error("Erro ao buscar tickets:", error);
    }
  }

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    // Optimistic update
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    if (selectedTicket?.id === id) {
      setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : null);
    }
    try {
      await updateTicketStatus(id, newStatus);
    } catch (error) {
      console.error("Erro ao atualizar status do ticket:", error);
      fetchTickets(); // Revert on error
    }
  };

  const handleInlineUpdate = async (id: string, field: string, value: string) => {
    // Optimistic update
    setTickets(prev => prev.map(t => t.id === id ? { ...t, [field]: value || null } : t));
    if (selectedTicket?.id === id) {
      setSelectedTicket(prev => prev ? { ...prev, [field]: value || null } : null);
    }
    try {
      await updateTicket(id, { [field]: value || null } as Partial<DBTicket>);
    } catch (error) {
      console.error(`Erro ao atualizar ${field}:`, error);
      fetchTickets(); // Revert on error
    }
  };

  const handleDeleteTicket = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este ticket?")) return;
    // Optimistic update
    setTickets(prev => prev.filter(t => t.id !== id));
    setSelectedTicket(null);
    try {
      await deleteTicket(id);
    } catch (error) {
      console.error("Erro ao excluir ticket:", error);
      fetchTickets(); // Revert on error
    }
  };

  const abertos = tickets.filter(t => t.status === "Aberto" || t.status === "Em atendimento").length;
  const atrasados = tickets.filter(t => t.prazo_sla && new Date(t.prazo_sla) < new Date()).length;
  const resolvidos = tickets.filter(t => t.status === "Resolvido").length;
  const total = tickets.length;

  const filtrados = tickets.filter(t => {
    const matchBusca = t.cliente_nome.toLowerCase().includes(busca.toLowerCase()) || 
                       t.cliente_email.toLowerCase().includes(busca.toLowerCase()) ||
                       t.cliente_telefone?.includes(busca);
    
    if (meusTickets && t.responsavel_id !== user?.id) return false;
    if (!matchBusca) return false;

    switch (statusFilter) {
      case "abertos": return t.status === "Aberto" || t.status === "Em atendimento";
      case "atrasados": return t.prazo_sla ? new Date(t.prazo_sla) < new Date() : false;
      case "resolvidos": return t.status === "Resolvido";
      default: return true;
    }
  });

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-letitia-gold" />
      </div>
    );
  }

  return (
    <div className="relative h-full">
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
          <KPICard icon={<TicketIcon className="h-4 w-4 text-foreground" />} label="Total" value={String(total)} color="border-foreground border-l-4" active={statusFilter === "todos"} onClick={() => setStatusFilter(statusFilter === "todos" ? "todos" : "todos")} />
          <KPICard icon={<Clock className="h-4 w-4 text-blue-500" />} label="Em aberto" value={String(abertos)} color="border-blue-500 border-l-4" active={statusFilter === "abertos"} onClick={() => setStatusFilter(statusFilter === "abertos" ? "todos" : "abertos")} />
          <KPICard icon={<AlertCircle className="h-4 w-4 text-red-500" />} label="Atrasados" value={String(atrasados)} color="border-red-500 border-l-4" active={statusFilter === "atrasados"} onClick={() => setStatusFilter(statusFilter === "atrasados" ? "todos" : "atrasados")} />
          <KPICard icon={<CheckCircle2 className="h-4 w-4 text-green-500" />} label="Resolvidos" value={String(resolvidos)} color="border-green-500 border-l-4" active={statusFilter === "resolvidos"} onClick={() => setStatusFilter(statusFilter === "resolvidos" ? "todos" : "resolvidos")} />
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
              placeholder="Buscar por nome, e-mail ou telefone..."
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-background/50">
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
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted italic">Nenhum ticket encontrado.</td>
                  </tr>
                ) : (
                  filtrados.map((t) => {
                    return (
                      <tr 
                        key={t.id} 
                        onClick={() => setSelectedTicket(t)}
                        className={cn(
                          "border-b border-border last:border-0 hover:bg-background/50 transition-colors cursor-pointer group",
                          (t.status === 'Resolvido' || t.status === 'Fechado') && "bg-green-500/[0.03] shadow-[inset_0_0_0_1px_rgba(34,197,94,0.15)] hover:bg-green-500/[0.06]"
                        )}
                      >
                        <td className="px-4 py-4 text-sm font-medium text-muted">
                          <div className="flex items-center gap-1">
                            {t.numero}
                            <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className={cn("text-sm font-bold uppercase tracking-wide", (t.status === 'Resolvido' || t.status === 'Fechado') ? "text-muted line-through" : "text-foreground")}>{t.cliente_nome}</p>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="flex items-center gap-1 text-[11px] text-muted"><Mail className="h-3 w-3" /> {t.cliente_email}</span>
                            {t.cliente_telefone && <span className="flex items-center gap-1 text-[11px] text-muted"><Phone className="h-3 w-3" /> {t.cliente_telefone}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="relative inline-flex items-center">
                            <select
                              value={t.categoria}
                              onChange={(e) => handleInlineUpdate(t.id, "categoria", e.target.value)}
                              className="text-sm text-foreground capitalize bg-transparent border border-border/50 focus:ring-2 focus:ring-letitia-gold rounded-lg px-2.5 py-1.5 pr-7 cursor-pointer hover:bg-background/80 hover:border-letitia-gold/30 transition-colors outline-none appearance-none"
                            >
                              <option value="Dúvida">Dúvida</option>
                              <option value="Acesso">Acesso</option>
                              <option value="Pagamento">Pagamento</option>
                              <option value="Reclamação">Reclamação</option>
                              <option value="Outros">Outros</option>
                            </select>
                            <ChevronDown className="absolute right-1.5 h-3.5 w-3.5 text-muted pointer-events-none" />
                          </div>
                        </td>
                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="relative inline-flex items-center">
                            <select
                              value={t.prioridade}
                              onChange={(e) => handleInlineUpdate(t.id, "prioridade", e.target.value)}
                              className={cn("text-[11px] bg-background/50 px-2.5 py-1.5 pr-7 rounded-lg border border-border/50 focus:ring-2 focus:ring-letitia-gold cursor-pointer hover:bg-background/80 hover:border-letitia-gold/30 transition-colors outline-none appearance-none", prioridadeColors[t.prioridade] || "text-muted")}
                            >
                              <option value="Baixa">Baixa</option>
                              <option value="Normal">Normal</option>
                              <option value="Alta">Alta</option>
                              <option value="Urgente">Urgente</option>
                            </select>
                            <ChevronDown className="absolute right-1.5 h-3.5 w-3.5 text-muted pointer-events-none" />
                          </div>
                        </td>
                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="relative inline-flex items-center">
                            <select
                              value={t.responsavel_id || ""}
                              onChange={(e) => handleInlineUpdate(t.id, "responsavel_id", e.target.value)}
                              className="text-xs text-foreground font-medium bg-transparent border border-border/50 focus:ring-2 focus:ring-letitia-gold rounded-lg px-2.5 py-1.5 pr-7 cursor-pointer hover:bg-background/80 hover:border-letitia-gold/30 transition-colors outline-none appearance-none max-w-[150px]"
                            >
                              <option value="">Sem atribuição</option>
                              {profiles.map(p => (
                                <option key={p.id} value={p.id}>{p.full_name}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-1.5 h-3.5 w-3.5 text-muted pointer-events-none" />
                          </div>
                        </td>
                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="relative inline-flex items-center">
                            <select
                              value={t.status}
                              onChange={(e) => handleStatusUpdate(t.id, e.target.value)}
                              className={cn("text-[10px] font-bold uppercase tracking-tight px-2.5 py-1.5 pr-7 rounded-lg border border-transparent focus:ring-2 focus:ring-letitia-gold cursor-pointer transition-colors outline-none appearance-none hover:border-border/50", statusColors[t.status] || "bg-gray-100")}
                            >
                              <option value="Aberto">Aberto</option>
                              <option value="Em atendimento">Em atendimento</option>
                              <option value="Resolvido">Resolvido</option>
                              <option value="Fechado">Fechado</option>
                            </select>
                            <ChevronDown className="absolute right-1.5 h-3.5 w-3.5 text-muted/50 pointer-events-none" />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sidebar de Detalhes do Ticket */}
      {selectedTicket && (
        <TicketSidebar 
          ticket={selectedTicket} 
          profiles={profiles}
          onClose={() => setSelectedTicket(null)} 
          onStatusUpdate={handleStatusUpdate}
          onDelete={handleDeleteTicket}
          onEdit={() => setIsEditModalOpen(true)}
          onRefresh={fetchTickets}
        />
      )}

      {isModalOpen && (
        <NovoTicketModal 
          profiles={profiles}
          currentUserId={user?.id || ''}
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => { setIsModalOpen(false); fetchTickets(); }} 
        />
      )}

      {isEditModalOpen && selectedTicket && (
        <EditTicketModal 
          ticket={selectedTicket}
          profiles={profiles}
          onClose={() => setIsEditModalOpen(false)} 
          onSuccess={() => { setIsEditModalOpen(false); fetchTickets(); }} 
        />
      )}
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────────────── */

function TicketSidebar({ ticket, profiles: allProfiles, onClose, onStatusUpdate, onDelete, onEdit, onRefresh }: { 
  ticket: DBTicket; 
  profiles: DBProfile[];
  onClose: () => void;
  onStatusUpdate: (id: string, status: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit: () => void;
  onRefresh: () => void;
}) {
  const { user } = useAuth();
  const [comments, setComments] = useState<DBTicketComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferTo, setTransferTo] = useState("");
  const [transferMotivo, setTransferMotivo] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [ticket.id]);

  const fetchComments = async () => {
    try {
      const data = await getComments(ticket.id);
      setComments(data);
    } catch (error) {
      console.error("Erro ao buscar comentários:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || sending) return;
    setSending(true);
    try {
      await createComment({
        ticket_id: ticket.id,
        user_id: user?.id,
        conteudo: newComment.trim()
      });
      setNewComment("");
      fetchComments();
    } catch (error) {
      console.error("Erro ao enviar comentário:", error);
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async () => {
    if (!user) return;
    setResolving(true);
    try {
      const userName = allProfiles.find(p => p.id === user.id)?.full_name || "Usuário";
      await resolveTicket(ticket.id, user.id, userName);
      onRefresh();
      fetchComments();
    } catch (error) {
      console.error("Erro ao resolver ticket:", error);
    } finally {
      setResolving(false);
    }
  };

  const handleTransfer = async () => {
    if (!transferTo || !transferMotivo.trim() || !user) return;
    setTransferring(true);
    try {
      const fromName = allProfiles.find(p => p.id === user.id)?.full_name || "Usuário";
      const toName = allProfiles.find(p => p.id === transferTo)?.full_name || "Usuário";
      await transferTicket(ticket.id, user.id, transferTo, transferMotivo.trim(), fromName, toName);
      setShowTransfer(false);
      setTransferTo("");
      setTransferMotivo("");
      onRefresh();
      fetchComments();
    } catch (error) {
      console.error("Erro ao transferir ticket:", error);
    } finally {
      setTransferring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card border-l border-border shadow-lg flex flex-col modal-slide-right">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between bg-background/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-letitia-gold/10 flex items-center justify-center">
              <TicketIcon className="h-5 w-5 text-letitia-gold" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Ticket #{ticket.numero}</p>
              <h3 className="font-serif text-xl font-medium text-foreground">{ticket.cliente_nome}</h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onEdit}
              className="p-2 rounded-full hover:bg-foreground/10 text-muted hover:text-foreground transition-colors"
              title="Editar Ticket"
            >
              <Edit2 className="h-5 w-5" />
            </button>
            <button 
              onClick={() => onDelete(ticket.id)}
              className="p-2 rounded-full hover:bg-red-500/10 text-muted hover:text-red-500 transition-colors"
              title="Excluir Ticket"
            >
              <Trash2 className="h-5 w-5" />
            </button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-foreground/10 transition-colors">
              <X className="h-5 w-5 text-muted" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Info Básica */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Status</label>
              <select 
                className={cn("w-full text-xs font-bold uppercase tracking-tight px-3 py-2 rounded-lg border-none focus:ring-2 focus:ring-primary outline-none cursor-pointer", statusColors[ticket.status])}
                value={ticket.status}
                onChange={(e) => onStatusUpdate(ticket.id, e.target.value)}
              >
                <option value="Aberto">Aberto</option>
                <option value="Em atendimento">Em atendimento</option>
                <option value="Resolvido">Resolvido</option>
                <option value="Fechado">Fechado</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Prioridade</label>
              <div className={cn("text-xs font-bold uppercase tracking-tight px-3 py-2 rounded-lg bg-foreground/5", prioridadeColors[ticket.prioridade])}>
                {ticket.prioridade}
              </div>
            </div>
          </div>

          {/* Responsável */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Responsável</label>
            <select
              value={ticket.responsavel_id || ""}
              onChange={(e) => {
                onStatusUpdate(ticket.id, ticket.status); // keep status
                // Use inline update via parent
                updateTicket(ticket.id, { responsavel_id: e.target.value || null } as any).then(() => onRefresh());
              }}
              className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary outline-none cursor-pointer"
            >
              <option value="">Sem atribuição</option>
              {allProfiles.map(p => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {ticket.status !== "Resolvido" && ticket.status !== "Fechado" && (
              <button
                onClick={handleResolve}
                disabled={resolving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-500/10 text-green-700 hover:bg-green-500/20 transition-all text-xs font-semibold border border-green-500/20"
              >
                {resolving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
                Concluir Ticket
              </button>
            )}
            <button
              onClick={() => setShowTransfer(!showTransfer)}
              className={cn("flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold border transition-all", showTransfer ? "bg-violet-500/10 text-violet-700 border-violet-500/20" : "bg-foreground/5 text-foreground border-border hover:bg-foreground/10")}
            >
              <ArrowRightLeft className="h-4 w-4" />
              Transferir
            </button>
          </div>

          {/* Transfer Panel */}
          {showTransfer && (
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 space-y-3 modal-content">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-violet-600 flex items-center gap-1.5">
                <ArrowRightLeft className="h-3 w-3" /> Transferir Ticket
              </h4>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Transferir para</label>
                <select
                  value={transferTo}
                  onChange={e => setTransferTo(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground focus:ring-2 focus:ring-violet-500 focus:outline-none"
                >
                  <option value="">Selecione...</option>
                  {allProfiles.filter(p => p.id !== ticket.responsavel_id).map(p => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Motivo da transferência</label>
                <textarea
                  value={transferMotivo}
                  onChange={e => setTransferMotivo(e.target.value)}
                  placeholder="Explique por que está transferindo este ticket..."
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground focus:ring-2 focus:ring-violet-500 focus:outline-none min-h-[70px] resize-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowTransfer(false)} className="px-3 py-1.5 text-xs text-muted hover:text-foreground transition-colors">Cancelar</button>
                <button
                  onClick={handleTransfer}
                  disabled={!transferTo || !transferMotivo.trim() || transferring}
                  className="px-4 py-1.5 rounded-md bg-violet-600 text-white text-xs font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {transferring ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRightLeft className="h-3.5 w-3.5" />}
                  Transferir
                </button>
              </div>
            </div>
          )}

          {/* Contato */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted border-b border-border/50 pb-2">Informações de Contato</h4>
            <div className="space-y-3">
              <ContactItem icon={<Mail className="h-4 w-4" />} label="E-mail" value={ticket.cliente_email} />
              <ContactItem icon={<Phone className="h-4 w-4" />} label="Telefone" value={ticket.cliente_telefone || "Não informado"} />
              <ContactItem icon={<Camera className="h-4 w-4" />} label="Instagram" value={ticket.cliente_instagram || "Não informado"} />
            </div>
          </div>

          {/* Detalhes Demanda */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted border-b border-border/50 pb-2">Detalhes da Demanda</h4>
            <div className="space-y-4">
              {ticket.descricao && (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1 block">O que é a questão</label>
                  <div className="bg-foreground/[0.03] border border-border rounded-lg px-3 py-2">
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{ticket.descricao}</p>
                  </div>
                </div>
              )}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1 block">Categoria</label>
                <p className="text-sm font-medium text-foreground">{ticket.categoria}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1 block">Aberto em</label>
                <p className="text-sm text-foreground">{new Date(ticket.data_abertura).toLocaleString("pt-BR")}</p>
              </div>
            </div>
          </div>

          {/* Comentários */}
          <div className="space-y-4 pt-4 border-t border-border/50">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted flex items-center gap-2">
              <MessageSquare className="h-3 w-3" /> Comentários ({comments.length})
            </h4>
            
            {loadingComments ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted" />
              </div>
            ) : comments.length === 0 ? (
              <div className="py-8 text-center bg-foreground/[0.02] rounded-xl border border-dashed border-border">
                <p className="text-xs text-muted">Nenhuma conversa iniciada.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((c) => {
                  const isSystem = (c as any).is_system || c.conteudo.startsWith('🔄') || c.conteudo.startsWith('✅');
                  return (
                    <div key={c.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isSystem && <ArrowRightLeft className="h-3 w-3 text-violet-500" />}
                          <span className={cn("text-[10px] font-bold", isSystem ? "text-violet-600" : "text-foreground")}>{c.profiles?.full_name || "Sistema"}</span>
                          {isSystem && <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-500">sistema</span>}
                          <span className="text-[9px] text-muted">{new Date(c.created_at).toLocaleString("pt-BR")}</span>
                        </div>
                      </div>
                      <div className={cn("border rounded-lg px-3 py-2", isSystem ? "bg-violet-500/5 border-violet-500/20" : "bg-background border-border")}>
                        <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">{c.conteudo}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer: Input de Resposta */}
        <div className="p-6 border-t border-border bg-background/50">
          <div className="relative">
            <textarea 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escreva uma resposta interna ou para a aluna..."
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-xs focus:ring-2 focus:ring-primary focus:outline-none min-h-[100px] resize-none pr-12"
            />
            <button 
              onClick={handleSendComment}
              disabled={!newComment.trim() || sending}
              className="absolute bottom-3 right-3 h-8 w-8 flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-background hover:border-letitia-gold/30 transition-colors">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-foreground/5 flex items-center justify-center text-muted">
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted/60">{label}</p>
          <p className="text-xs font-medium text-foreground">{value}</p>
        </div>
      </div>
      <button className="p-1.5 rounded-lg hover:bg-foreground/5 text-muted transition-colors">
        <ExternalLink className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function NovoTicketModal({ profiles, currentUserId, onClose, onSuccess }: { profiles: DBProfile[]; currentUserId: string; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cliente_nome: "",
    cliente_email: "",
    cliente_telefone: "",
    cliente_instagram: "",
    descricao: "",
    categoria: "Dúvida",
    prioridade: "Normal",
    status: "Aberto",
    responsavel_id: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const created = await createTicket(formData);
      // Notify everyone about the new ticket
      if (created) {
        const userName = profiles.find(p => p.id === currentUserId)?.full_name || 'Alguém da equipe';
        notifyNewTicket(created.numero || 0, formData.cliente_nome, created.id, currentUserId, userName);
      }
      onSuccess();
    } catch (error) {
      console.error("Erro ao criar ticket:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg modal-content">
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Telefone</label>
              <input
                value={formData.cliente_telefone}
                onChange={e => setFormData({ ...formData, cliente_telefone: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Instagram</label>
              <input
                value={formData.cliente_instagram}
                onChange={e => setFormData({ ...formData, cliente_instagram: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
                placeholder="@usuario"
              />
            </div>
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
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">O que é a questão</label>
            <textarea
              value={formData.descricao}
              onChange={e => setFormData({ ...formData, descricao: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none min-h-[80px] resize-none"
              placeholder="Descreva o problema ou situação da aluna..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <UserSelector
              label="Atribuir a"
              users={profiles}
              selectedIds={formData.responsavel_id}
              onSelect={(id) => setFormData({ ...formData, responsavel_id: id as string })}
            />
          </div>

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

function KPICard({ icon, label, value, color, active, onClick }: { icon: React.ReactNode; label: string; value: string; color: string; active?: boolean; onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md cursor-pointer select-none",
        color,
        active && "ring-2 ring-letitia-gold ring-offset-2 ring-offset-card scale-[1.02] shadow-lg",
        !active && "opacity-80 hover:opacity-100"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</span>
        {active && <span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-letitia-gold bg-letitia-gold/10 px-1.5 py-0.5 rounded">filtro ativo</span>}
      </div>
      <div className="flex items-center gap-3">
        {icon}
        <p className="font-serif text-3xl font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function EditTicketModal({ ticket, profiles, onClose, onSuccess }: { ticket: DBTicket; profiles: DBProfile[]; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cliente_nome: ticket.cliente_nome,
    cliente_email: ticket.cliente_email,
    cliente_telefone: ticket.cliente_telefone || "",
    cliente_instagram: ticket.cliente_instagram || "",
    descricao: ticket.descricao || "",
    categoria: ticket.categoria,
    prioridade: ticket.prioridade,
    status: ticket.status,
    responsavel_id: ticket.responsavel_id || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateTicket(ticket.id, formData);
      onSuccess();
    } catch (error) {
      console.error("Erro ao atualizar ticket:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg modal-content">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif text-2xl font-medium text-foreground">Editar Ticket</h3>
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
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Telefone</label>
              <input
                value={formData.cliente_telefone}
                onChange={e => setFormData({ ...formData, cliente_telefone: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Instagram</label>
              <input
                value={formData.cliente_instagram}
                onChange={e => setFormData({ ...formData, cliente_instagram: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
              />
            </div>
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
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">O que é a questão</label>
            <textarea
              value={formData.descricao}
              onChange={e => setFormData({ ...formData, descricao: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none min-h-[80px] resize-none"
              placeholder="Descreva o problema ou situação da aluna..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <UserSelector
              label="Atribuir a"
              users={profiles}
              selectedIds={formData.responsavel_id}
              onSelect={(id) => setFormData({ ...formData, responsavel_id: id as string })}
            />
          </div>

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
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
