import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardStats } from "@/services/dashboardService";
import { 
  TrendingUp, Users, CheckSquare, FileText, Clock, 
  ArrowUpRight, AlertCircle, Loader2, ChevronRight, Youtube, Camera
} from "lucide-react";
import { cn } from "@/lib/utils";

type Stats = {
  totalVendas: number;
  pendentesTheWay: number;
  tarefasHoje: number;
  pautas: any[];
};

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Letícia";
  const hour = new Date().getHours();
  const saudacao = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-letitia-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground">{saudacao}, {userName}</h2>
        <p className="mt-1 text-sm text-muted">Aqui está o panorama de hoje na LetitiAPP.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard 
          icon={<TrendingUp className="h-5 w-5" />} 
          label="Vendas do Mês" 
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.totalVendas || 0)} 
          subtext="+12% vs. abril" 
          subtextColor="text-letitia-sage" 
        />
        <KPICard 
          icon={<Users className="h-5 w-5" />} 
          label="Aplicações THE WAY" 
          value={String(stats?.pendentesTheWay || 0)} 
          subtext="aguardando triagem" 
          subtextColor="text-letitia-clay" 
        />
        <KPICard 
          icon={<CheckSquare className="h-5 w-5" />} 
          label="Tarefas Pendentes" 
          value={String(stats?.tarefasHoje || 0)} 
          subtext="vencendo hoje" 
          subtextColor="text-muted" 
        />
        <KPICard 
          icon={<FileText className="h-5 w-5" />} 
          label="Próximas Pautas" 
          value={String(stats?.pautas.length || 0)} 
          subtext="agendadas" 
          subtextColor="text-letitia-gold" 
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Próximas Pautas */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Próximas Publicações</h3>
            <a href="/conteudo" className="text-xs text-letitia-gold hover:underline flex items-center gap-1">
              Ver calendário <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
          <div className="space-y-2">
            {stats?.pautas.length === 0 ? (
              <p className="text-sm text-muted italic">Nenhuma pauta agendada.</p>
            ) : (
              stats?.pautas.map((pauta) => (
                <div key={pauta.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50 hover:shadow-sm transition-shadow">
                  <span className="text-xl">
                    {pauta.formato === 'youtube' ? <Youtube className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{pauta.titulo}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted uppercase tracking-wider">{pauta.pilar}</span>
                      <span className="text-xs text-muted">{new Date(pauta.data_prevista).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ações Prioritárias (Placeholder for now) */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Ações Prioritárias</h3>
          </div>
          <div className="space-y-3">
             <div className="flex items-center justify-between rounded-lg border border-border bg-background/50 p-3 opacity-50">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted" />
                  <p className="text-sm text-muted">Módulo de tarefas reais em breve...</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon, label, value, subtext, subtextColor }: {
  icon: React.ReactNode; label: string; value: string; subtext: string; subtextColor: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 text-muted mb-3">{icon}<h3 className="text-xs font-semibold uppercase tracking-wider">{label}</h3></div>
      <p className="font-serif text-2xl font-medium text-foreground">{value}</p>
      <p className={`mt-1 text-xs ${subtextColor}`}>{subtext}</p>
    </div>
  );
}

