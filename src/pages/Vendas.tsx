import { useState, useEffect } from "react";
import { getVendas, type DBVenda } from "@/services/vendasService";
import { statusVendaColors } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { TrendingUp, ShoppingBag, DollarSign, Loader2 } from "lucide-react";

export function Vendas() {
  const [vendas, setVendas] = useState<DBVenda[]>([]);
  const [loading, setLoading] = useState(true);

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
    const month = new Date(v.data_venda).toLocaleDateString('pt-BR', { month: 'short' });
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
      <div>
        <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground">Vendas</h2>
        <p className="mt-1 text-sm text-muted">Acompanhamento de vendas por produto e período.</p>
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
              <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--foreground)", fontSize: "12px" }} formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, "Vendas"]} />
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
                  const s = statusVendaColors.paga; // Default para simplificar
                  return (
                    <tr key={v.id} className="border-b border-border last:border-0 hover:bg-background/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-muted">{new Date(v.data_venda).toLocaleDateString("pt-BR",{day:"2-digit",month:"short"})}</td>
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

