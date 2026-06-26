import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, CheckCircle2, FileText, Percent, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DBContent } from "@/services/contentService";
import type { SocialProfile } from "@/services/socialProfileService";

interface InsightsPanelProps {
  pautas: DBContent[];
  socialProfiles: SocialProfile[];
}

export function InsightsPanel({ pautas, socialProfiles }: InsightsPanelProps) {
  const [filtroDataDe, setFiltroDataDe] = useState("");
  const [filtroDataAte, setFiltroDataAte] = useState("");

  // Filter by date range
  const pautasFiltradas = useMemo(() => {
    return pautas.filter((p) => {
      const matchDe = !filtroDataDe || p.data_prevista >= filtroDataDe;
      const matchAte = !filtroDataAte || p.data_prevista <= filtroDataAte;
      return matchDe && matchAte;
    });
  }, [pautas, filtroDataDe, filtroDataAte]);

  // Computed stats
  const totalConteudos = pautasFiltradas.length;
  const postadosTotal = pautasFiltradas.filter((p) => p.status === "postado").length;
  const cancelados = pautasFiltradas.filter((p) => p.status === "cancelado").length;
  const aproveitamento = totalConteudos > 0 ? Math.round((postadosTotal / (totalConteudos - cancelados || 1)) * 100) : 0;

  // Per-profile breakdown
  const perProfile = useMemo(() => {
    const map = new Map<string, { total: number; postados: number; profile: SocialProfile }>();

    socialProfiles.forEach((sp) => {
      map.set(sp.nome, { total: 0, postados: 0, profile: sp });
    });

    pautasFiltradas.forEach((p) => {
      // Main platform
      const main = map.get(p.plataforma);
      if (main) {
        main.total++;
        if (p.status === "postado") main.postados++;
      }

      // Collab platforms
      if (p.collab_plataformas) {
        p.collab_plataformas.forEach((collab) => {
          const entry = map.get(collab);
          if (entry) {
            entry.total++;
            if (p.status === "postado") entry.postados++;
          }
        });
      }
    });

    return Array.from(map.values())
      .filter((v) => v.total > 0)
      .sort((a, b) => b.postados - a.postados);
  }, [pautasFiltradas, socialProfiles]);

  const maxPostados = Math.max(...perProfile.map((p) => p.postados), 1);

  // Chart data
  const chartData = perProfile.map((p) => ({
    name: p.profile.nome,
    postados: p.postados,
    total: p.total,
    cor: p.profile.cor,
  }));

  // Monthly timeline data
  const monthlyData = useMemo(() => {
    const months = new Map<string, number>();
    pautasFiltradas
      .filter((p) => p.status === "postado")
      .forEach((p) => {
        const key = p.data_prevista.substring(0, 7); // YYYY-MM
        months.set(key, (months.get(key) || 0) + 1);
      });

    return Array.from(months.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => {
        const [y, m] = month.split("-");
        const label = new Date(Number(y), Number(m) - 1).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
        return { month: label, postados: count };
      });
  }, [pautasFiltradas]);

  // Presets
  const setPreset = (preset: string) => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");

    if (preset === "mes") {
      setFiltroDataDe(`${yyyy}-${mm}-01`);
      const lastDay = new Date(yyyy, today.getMonth() + 1, 0).getDate();
      setFiltroDataAte(`${yyyy}-${mm}-${String(lastDay).padStart(2, "0")}`);
    } else if (preset === "trimestre") {
      const qStart = Math.floor(today.getMonth() / 3) * 3;
      const startMonth = String(qStart + 1).padStart(2, "0");
      const endMonth = String(qStart + 3).padStart(2, "0");
      const lastDay = new Date(yyyy, qStart + 3, 0).getDate();
      setFiltroDataDe(`${yyyy}-${startMonth}-01`);
      setFiltroDataAte(`${yyyy}-${endMonth}-${String(lastDay).padStart(2, "0")}`);
    } else if (preset === "ano") {
      setFiltroDataDe(`${yyyy}-01-01`);
      setFiltroDataAte(`${yyyy}-12-31`);
    } else {
      setFiltroDataDe("");
      setFiltroDataAte("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4 text-letitia-gold" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Período</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { id: "todos", label: "Tudo" },
            { id: "mes", label: "Este mês" },
            { id: "trimestre", label: "Trimestre" },
            { id: "ano", label: "Este ano" },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPreset(p.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all border",
                !filtroDataDe && !filtroDataAte && p.id === "todos"
                  ? "bg-foreground text-primary-foreground border-foreground shadow-sm"
                  : "bg-card border-border text-muted hover:text-foreground hover:border-foreground/20"
              )}
            >
              {p.label}
            </button>
          ))}
          <div className="flex items-center gap-1.5 ml-1">
            <input
              type="date"
              value={filtroDataDe}
              onChange={(e) => setFiltroDataDe(e.target.value)}
              className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
            />
            <span className="text-[10px] text-muted">até</span>
            <input
              type="date"
              value={filtroDataAte}
              onChange={(e) => setFiltroDataAte(e.target.value)}
              className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Posts Publicados"
          value={postadosTotal}
          accent="text-green-600"
          bgAccent="bg-green-50"
        />
        <KpiCard
          icon={<FileText className="h-5 w-5" />}
          label="Total de Conteúdos"
          value={totalConteudos}
          accent="text-letitia-gold"
          bgAccent="bg-amber-50"
        />
        <KpiCard
          icon={<Percent className="h-5 w-5" />}
          label="Aproveitamento"
          value={`${aproveitamento}%`}
          accent="text-blue-600"
          bgAccent="bg-blue-50"
        />
        <KpiCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Perfis Ativos"
          value={perProfile.length}
          accent="text-purple-600"
          bgAccent="bg-purple-50"
        />
      </div>

      {/* Main Grid: Table + Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Per-Profile Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-card">
            <h3 className="font-serif text-lg font-medium text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Posts por Perfil
            </h3>
            <p className="text-[11px] text-muted mt-0.5">Quantidade de conteúdos publicados por perfil social</p>
          </div>

          {perProfile.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-muted">Nenhum conteúdo encontrado neste período.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {perProfile.map((entry) => {
                const pct = maxPostados > 0 ? (entry.postados / maxPostados) * 100 : 0;
                return (
                  <div key={entry.profile.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-foreground/[0.02] transition-colors">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {entry.profile.avatar_url ? (
                        <img
                          src={entry.profile.avatar_url}
                          alt=""
                          className="h-9 w-9 rounded-full border-2 object-cover shadow-sm"
                          style={{ borderColor: entry.profile.cor }}
                        />
                      ) : (
                        <div
                          className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
                          style={{ backgroundColor: entry.profile.cor }}
                        >
                          {entry.profile.nome.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Name + Bar */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-foreground truncate">{entry.profile.nome}</span>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                          <span className="text-lg font-bold tabular-nums" style={{ color: entry.profile.cor }}>
                            {entry.postados}
                          </span>
                          <span className="text-[10px] text-muted">/ {entry.total}</span>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="h-2 w-full bg-foreground/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: entry.profile.cor,
                            opacity: 0.8,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Total row */}
          {perProfile.length > 0 && (
            <div className="px-5 py-3.5 border-t border-border bg-foreground/[0.02]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Total Geral</span>
                <span className="text-xl font-bold text-letitia-gold">{postadosTotal}</span>
              </div>
            </div>
          )}
        </div>

        {/* Charts Column */}
        <div className="space-y-6">
          {/* Bar Chart — Posts by Profile */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-serif text-lg font-medium text-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-letitia-gold" />
                Distribuição por Perfil
              </h3>
            </div>
            <div className="p-5">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={Math.max(chartData.length * 52, 120)}>
                  <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: "var(--foreground)" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value, name) => [value, name === "postados" ? "Publicados" : "Total"]}
                      labelStyle={{ fontWeight: 600 }}
                    />
                    <Bar dataKey="postados" name="Publicados" radius={[0, 6, 6, 0]} barSize={24}>
                      {chartData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.cor} fillOpacity={0.85} />
                      ))}
                    </Bar>
                    <Bar dataKey="total" name="Total" radius={[0, 6, 6, 0]} barSize={24} fillOpacity={0.15}>
                      {chartData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.cor} fillOpacity={0.2} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted text-center py-8">Sem dados no período selecionado.</p>
              )}
            </div>
          </div>

          {/* Monthly Timeline */}
          {monthlyData.length > 1 && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="font-serif text-lg font-medium text-foreground flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-letitia-gold" />
                  Evolução Mensal
                </h3>
              </div>
              <div className="p-5">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value) => [value, "Posts publicados"]}
                    />
                    <Bar dataKey="postados" name="Publicados" fill="#C4A47C" radius={[4, 4, 0, 0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-serif text-lg font-medium text-foreground">Resumo por Status</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-border">
          {[
            { id: "legenda", label: "Escrever Legenda", emoji: "🟠", color: "text-orange-600" },
            { id: "ajuste", label: "Precisa Ajuste", emoji: "⚠️", color: "text-yellow-600" },
            { id: "pronto", label: "Pronto p/ Postar", emoji: "🔵", color: "text-blue-600" },
            { id: "programado", label: "Programado", emoji: "⏰", color: "text-purple-600" },
            { id: "postado", label: "Postado", emoji: "✅", color: "text-green-600" },
            { id: "cancelado", label: "Cancelado", emoji: "❌", color: "text-red-500" },
          ].map((s) => {
            const count = pautasFiltradas.filter((p) => p.status === s.id).length;
            return (
              <div key={s.id} className="px-4 py-4 text-center">
                <p className="text-2xl font-bold tabular-nums">{count}</p>
                <p className="text-[10px] text-muted mt-1 leading-tight">
                  {s.emoji} {s.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── KPI Card ─────────────────────────────────────────────── */
function KpiCard({ icon, label, value, accent, bgAccent }: { icon: React.ReactNode; label: string; value: string | number; accent: string; bgAccent: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={cn("p-2.5 rounded-xl", bgAccent, accent)}>{icon}</div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</p>
        <p className={cn("text-2xl font-bold mt-0.5 tabular-nums", accent)}>{value}</p>
      </div>
    </div>
  );
}
