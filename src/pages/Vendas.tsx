import { useState, useEffect } from "react";
import { getVendas, createVenda, type DBVenda } from "@/services/vendasService";
import { statusVendaColors } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { TrendingUp, ShoppingBag, DollarSign, Loader2, Plus, X } from "lucide-react";

export function Vendas() {
  const [vendas, setVendas] = useState<DBVenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchVendas();
  }, []);

  async function fetchVendas() {
    try {
      const data = await getVendas();
      setVendas(data);
    } catch (error) {
      console.error("Erro ao buscar vendas:", error);
    } finally {
      setLoading(false);
    }
  }

  const currentMonth = new Date().toISOString().substring(0, 7);
  const vendasMes = vendas.filter((v) => v.data_venda.startsWith(currentMonth));
  const totalMes = vendasMes.reduce((acc, v) => acc + Number(v.valor), 0);
  const totalVendasCount = vendas.length;
  const ticketMedio = totalVendasCount > 0 ? totalMes / (vendasMes.length || 1) : 0;

  // Processar dados para o gráfico (agrupar por mês)
  const chartData = vendas.reduce((acc: any[], v) => {
    const month = new Date(v.data_venda + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' });
    const existing = acc.find(i => i.mes === month);
    if (existing) {
      existing.valor += Number(v.valor);
    } else {
      acc.push({ mes: month, valor: Number(v.valor) });
    }
    return acc;
  }, []).reverse();

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
          <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground">Vendas</h2>
          <p className="mt-1 text-sm text-muted">Acompanhamento de vendas por produto e período.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all flex items-center gap-2 self-start"
        >
          <Plus className="h-4 w-4" /> Registrar Venda
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPI icon={<DollarSign className="h-4 w-4" />} label="Total Mês" value={`R$ ${totalMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
        <KPI icon={<ShoppingBag className="h-4 w-4" />} label="Nº Vendas" value={String(totalVendasCount)} />
        <KPI icon={<TrendingUp className="h-4 w-4" />} label="Ticket Médio" value={`R$ ${ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">Evolução Mensal</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.length > 0 ? chartData : [{mes: 'Sem dados', valor: 0}]}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "var(--muted)" }} />
              <YAxis tick={{ fontSize: 12, fill: "var(--muted)" }} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--foreground)", fontSize: "12px" }} formatter={(value: any) => [`R$ ${Number(value).toLocaleString("pt-BR")}`, "Vendas"]} />
              <Bar dataKey="valor" fill="#C4A47C" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Data","Produto","Cliente","Valor","Status"].map(h => (
                  <th key={h} className={cn("px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted", h === "Valor" ? "text-right" : "text-left", ["Cliente"].includes(h) && "hidden md:table-cell")}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vendas.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted italic">Nenhuma venda registrada.</td></tr>
              ) : (
                vendas.map((v) => {
                  const s = statusVendaColors.paga; 
                  return (
                    <tr key={v.id} className="border-b border-border last:border-0 hover:bg-background/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-muted">{new Date(v.data_venda + 'T00:00:00').toLocaleDateString("pt-BR",{day:"2-digit",month:"short"})}</td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{v.produto}</td>
                      <td className="px-4 py-3 text-sm text-muted hidden md:table-cell">{v.cliente_nome}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-foreground">R$ {Number(v.valor).toLocaleString("pt-BR",{minimumFractionDigits:2})}</td>
                      <td className="px-4 py-3 text-center"><span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full",s.bg,s.text)}>{s.label}</span></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <NovoVendaModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => { setIsModalOpen(false); fetchVendas(); }} 
        />
      )}
    </div>
  );
}

function NovoVendaModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cliente_nome: "",
    produto: "Você Dirige",
    valor: "",
    data_venda: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createVenda({ ...formData, valor: Number(formData.valor) });
      onSuccess();
    } catch (error) {
      console.error("Erro ao criar venda:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg modal-content">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif text-2xl font-medium text-foreground">Registrar Venda</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-foreground/10 transition-colors">
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Nome da Cliente</label>
            <input
              required
              value={formData.cliente_nome}
              onChange={e => setFormData({ ...formData, cliente_nome: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
              placeholder="Nome da cliente"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Produto</label>
            <select
              value={formData.produto}
              onChange={e => setFormData({ ...formData, produto: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
            >
              <option value="Workshop Plano A">Workshop Plano A</option>
              <option value="Você Dirige">Você Dirige</option>
              <option value="THE WAY Mentoria">THE WAY Mentoria</option>
              <option value="Livraria Cazarré">Livraria Cazarré</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Valor (R$)</label>
              <input
                required
                type="number"
                step="0.01"
                value={formData.valor}
                onChange={e => setFormData({ ...formData, valor: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
                placeholder="0,00"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Data da Venda</label>
              <input
                required
                type="date"
                value={formData.data_venda}
                onChange={e => setFormData({ ...formData, data_venda: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
              />
            </div>
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
              Confirmar Venda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function KPI({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 text-muted mb-2">{icon}<span className="text-xs font-semibold uppercase tracking-wider">{label}</span></div>
      <p className="font-serif text-2xl font-medium text-foreground">{value}</p>
    </div>
  );
}
