import { useState, useEffect } from "react";
import { getApplications, updateApplicationStatus, createApplication, type DBApplication } from "@/services/wayService";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Lock, Loader2, Plus, X } from "lucide-react";

const pipelineColumns = [
  { id: "recebida" as const, label: "Recebida", color: "border-t-gray-400" },
  { id: "triagem" as const, label: "Triagem", color: "border-t-blue-400" },
  { id: "call_leticia" as const, label: "Call Letícia", color: "border-t-amber-400" },
  { id: "aprovada" as const, label: "Aprovada", color: "border-t-green-400" },
  { id: "contratada" as const, label: "Contratada", color: "border-t-letitia-gold" },
  { id: "em_mentoria" as const, label: "Em Mentoria", color: "border-t-pilar-interior" },
];

export function PipelineTheWay() {
  const [aplicacoes, setAplicacoes] = useState<DBApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfidencial, setShowConfidencial] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchApps();
  }, []);

  async function fetchApps() {
    try {
      const data = await getApplications();
      setAplicacoes(data);
    } catch (error) {
      console.error("Erro ao buscar aplicações:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateApplicationStatus(id, status);
      fetchApps();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

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
        <div>
          <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground">Pipeline THE WAY</h2>
          <p className="mt-1 text-sm text-muted">Processo seletivo da mentoria — {aplicacoes.length} candidatas</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all flex items-center gap-2 self-start"
          >
            <Plus className="h-4 w-4" /> Nova Aplicação
          </button>
          
          <button
            onClick={() => setShowConfidencial(!showConfidencial)}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all self-start",
              showConfidencial
                ? "bg-letitia-clay/10 text-letitia-clay border border-letitia-clay/20"
                : "bg-card border border-border text-muted hover:text-foreground"
            )}
          >
            {showConfidencial ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showConfidencial ? "Ocultar Notas" : "Notas Confidenciais"}
          </button>
        </div>
      </div>

      {/* Pipeline Kanban */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-[1200px]">
          {pipelineColumns.map((col) => {
            const colApps = aplicacoes.filter((a) => a.status === col.id || (col.id === 'recebida' && a.status === 'pendente'));
            return (
              <div key={col.id} className="flex-1 min-w-[200px]">
                <div className={cn("rounded-t-lg border-t-2 bg-card border border-border px-3 py-2.5 flex items-center justify-between", col.color)}>
                  <h3 className="text-xs font-semibold text-foreground">{col.label}</h3>
                  <span className="text-[10px] font-medium text-muted bg-background px-1.5 py-0.5 rounded-full">
                    {colApps.length}
                  </span>
                </div>
                <div className="bg-background/30 border border-t-0 border-border rounded-b-lg p-2 space-y-2 min-h-[250px]">
                  {colApps.map((app) => (
                    <div key={app.id} className="relative group">
                      <AplicacaoCard
                        aplicacao={app}
                        showConfidencial={showConfidencial}
                      />
                      <select 
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-card border border-border rounded text-[8px] cursor-pointer"
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value)}
                      >
                        {pipelineColumns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isModalOpen && (
        <NovoAplicacaoModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => { setIsModalOpen(false); fetchApps(); }} 
        />
      )}
    </div>
  );
}

function AplicacaoCard({ aplicacao, showConfidencial }: { aplicacao: DBApplication; showConfidencial: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">{aplicacao.cliente_nome}</p>
          <p className="text-[10px] text-muted mt-0.5">{aplicacao.email}</p>
        </div>
        <span className="text-[10px] text-muted whitespace-nowrap">
          {new Date(aplicacao.data_aplicacao + 'T00:00:00').toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
        </span>
      </div>

      <p className="text-xs text-muted mt-2 line-clamp-2">WhatsApp: {aplicacao.whatsapp}</p>

      {showConfidencial && (
        <div className="mt-2 px-2 py-1.5 rounded bg-red-500/5 border border-red-500/10">
          <div className="flex items-center gap-1 mb-1">
            <Lock className="h-3 w-3 text-red-500" />
            <span className="text-[10px] font-semibold text-red-500">Nota Confidencial</span>
          </div>
          <p className="text-[10px] text-red-400">Dados reais carregados do banco.</p>
        </div>
      )}
    </div>
  );
}

function NovoAplicacaoModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cliente_nome: "",
    email: "",
    whatsapp: "",
    status: "recebida",
    data_aplicacao: new Date().toISOString().split("T")[0]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createApplication(formData);
      onSuccess();
    } catch (error) {
      console.error("Erro ao criar aplicação:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg modal-content">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif text-2xl font-medium text-foreground">Nova Candidata</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-foreground/10 transition-colors">
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Nome da Candidata</label>
            <input
              required
              value={formData.cliente_nome}
              onChange={e => setFormData({ ...formData, cliente_nome: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
              placeholder="Nome completo"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">E-mail</label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
                placeholder="candidata@email.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">WhatsApp</label>
              <input
                required
                value={formData.whatsapp}
                onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Data da Aplicação</label>
            <input
              required
              type="date"
              value={formData.data_aplicacao}
              onChange={e => setFormData({ ...formData, data_aplicacao: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
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
              Salvar Candidata
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
