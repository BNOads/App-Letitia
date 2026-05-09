import { vendasMock, vendasPorMes, statusVendaColors } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { TrendingUp, ShoppingBag, DollarSign } from "lucide-react";

export function Vendas() {
  const totalMes = vendasMock
    .filter((v) => v.data.startsWith("2026-05") && v.status !== "reembolsada")
    .reduce((acc, v) => acc + v.valor, 0);
  const totalVendas = vendasMock.filter((v) => v.status === "paga").length;
  const ticketMedio = totalMes / (totalVendas || 1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground">Vendas</h2>
        <p className="mt-1 text-sm text-muted">Acompanhamento de vendas por produto e período.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPI icon={<DollarSign className="h-4 w-4" />} label="Total Maio" value={`R$ ${totalMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
        <KPI icon={<ShoppingBag className="h-4 w-4" />} label="Nº Vendas" value={String(totalVendas)} />
        <KPI icon={<TrendingUp className="h-4 w-4" />} label="Ticket Médio" value={`R$ ${ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
      </div>
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">Evolução Mensal</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={vendasPorMes}>
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
                {["Data","Produto","Cliente","Fonte","Valor","Status"].map(h => (
                  <th key={h} className={cn("px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted", h === "Valor" ? "text-right" : "text-left", ["Cliente","Fonte"].includes(h) && "hidden md:table-cell")}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vendasMock.map((v) => {
                const s = statusVendaColors[v.status];
                return (
                  <tr key={v.id} className="border-b border-border last:border-0 hover:bg-background/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-muted">{new Date(v.data).toLocaleDateString("pt-BR",{day:"2-digit",month:"short"})}</td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{v.produto}</td>
                    <td className="px-4 py-3 text-sm text-muted hidden md:table-cell">{v.cliente}</td>
                    <td className="px-4 py-3 text-sm text-muted hidden md:table-cell">{v.fonte}</td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-foreground">R$ {v.valor.toLocaleString("pt-BR",{minimumFractionDigits:2})}{v.parcelas && <span className="text-[10px] text-muted ml-1">({v.parcelas}x)</span>}</td>
                    <td className="px-4 py-3 text-center"><span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full",s.bg,s.text)}>{s.label}</span></td>
                  </tr>
                );
              })}
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
