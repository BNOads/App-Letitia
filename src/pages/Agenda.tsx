import { useState, useEffect } from "react";
import { getEvents, type DBEvent } from "@/services/agendaService";
import { Calendar as CalIcon, Video, Users, Mic, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const dias = ["seg", "ter", "qua", "qui", "sex"];
const diasLabel: Record<string, string> = { 
  seg: "Segunda", 
  ter: "Terça", 
  qua: "Quarta", 
  qui: "Quinta", 
  sex: "Sexta" 
};

const tipoConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  reuniao: { icon: <Users className="h-3.5 w-3.5" />, color: "border-l-blue-400 bg-blue-500/5" },
  call_theway: { icon: <Video className="h-3.5 w-3.5" />, color: "border-l-letitia-gold bg-letitia-gold/5" },
  podcast: { icon: <Mic className="h-3.5 w-3.5" />, color: "border-l-pilar-profissional bg-pilar-profissional/5" },
  one_on_one: { icon: <Users className="h-3.5 w-3.5" />, color: "border-l-pilar-pessoal bg-pilar-pessoal/5" },
  live: { icon: <Video className="h-3.5 w-3.5" />, color: "border-l-pilar-interior bg-pilar-interior/5" },
};

export function Agenda() {
  const [eventos, setEventos] = useState<DBEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      const data = await getEvents();
      setEventos(data);
    } catch (error) {
      console.error("Erro ao buscar eventos:", error);
    } finally {
      setLoading(false);
    }
  }

  const getWeekdayShort = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const days = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
    return days[date.getDay()];
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
      <div>
        <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground">Agenda</h2>
        <p className="mt-1 text-sm text-muted">Acompanhe as reuniões e compromissos do time.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {dias.map((dia) => {
          const evts = eventos.filter((e) => getWeekdayShort(e.data_evento) === dia);
          return (
            <div key={dia} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-background/50">
                <p className="text-sm font-semibold text-foreground capitalize">{diasLabel[dia]}</p>
              </div>
              <div className="p-2 space-y-2 min-h-[200px]">
                {evts.length === 0 ? (
                  <p className="text-[10px] text-muted italic text-center py-8">Sem eventos</p>
                ) : (
                  evts.map((evt) => {
                    const tipo = tipoConfig[evt.tipo] || tipoConfig.reuniao;
                    return (
                      <div key={evt.id} className={cn("rounded-lg border-l-2 p-3 cursor-pointer hover:shadow-sm transition-shadow", tipo.color)}>
                        <div className="flex items-center gap-1.5 text-muted mb-1">
                          {tipo.icon}
                          <span className="text-[10px] font-medium">{evt.hora_inicio.substring(0, 5)}</span>
                        </div>
                        <p className="text-xs font-medium text-foreground leading-snug">{evt.titulo}</p>
                        <div className="flex gap-1 mt-2">
                          {evt.participantes?.map((p) => (
                            <span key={p} className="flex h-5 w-5 items-center justify-center rounded-full bg-background border border-border text-[8px] font-medium text-foreground">{p}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

