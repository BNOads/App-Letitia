import { Calendar as CalIcon, Video, Users, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

const eventos = [
  { id: "e1", titulo: "Reunião Semanal de Conteúdo", hora: "09:00", tipo: "reuniao", participantes: ["LC", "MC", "AB"], dia: "seg" },
  { id: "e2", titulo: "Call aplicante — Tatiana Moura", hora: "15:00", tipo: "call_theway", participantes: ["LC"], dia: "seg" },
  { id: "e3", titulo: "Gravação Podcast Ep. 47", hora: "10:00", tipo: "podcast", participantes: ["LC"], dia: "ter" },
  { id: "e4", titulo: "1x1 Letícia ↔ Ana Beatriz", hora: "14:00", tipo: "one_on_one", participantes: ["LC", "AB"], dia: "ter" },
  { id: "e5", titulo: "Review Lançamento VD Setembro", hora: "11:00", tipo: "reuniao", participantes: ["LC", "MC", "JR", "CD"], dia: "qua" },
  { id: "e6", titulo: "Call aplicante — Débora N.", hora: "16:00", tipo: "call_theway", participantes: ["LC"], dia: "qua" },
  { id: "e7", titulo: "Reunião Financeira Mensal", hora: "10:00", tipo: "reuniao", participantes: ["LC", "CD"], dia: "qui" },
  { id: "e8", titulo: "Live Instagram — Pilar Interior", hora: "20:00", tipo: "live", participantes: ["LC"], dia: "sex" },
];

const dias = ["seg", "ter", "qua", "qui", "sex"];
const diasLabel: Record<string, string> = { seg: "Segunda 12", ter: "Terça 13", qua: "Quarta 14", qui: "Quinta 15", sex: "Sexta 16" };

const tipoConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  reuniao: { icon: <Users className="h-3.5 w-3.5" />, color: "border-l-blue-400 bg-blue-500/5" },
  call_theway: { icon: <Video className="h-3.5 w-3.5" />, color: "border-l-letitia-gold bg-letitia-gold/5" },
  podcast: { icon: <Mic className="h-3.5 w-3.5" />, color: "border-l-pilar-profissional bg-pilar-profissional/5" },
  one_on_one: { icon: <Users className="h-3.5 w-3.5" />, color: "border-l-pilar-pessoal bg-pilar-pessoal/5" },
  live: { icon: <Video className="h-3.5 w-3.5" />, color: "border-l-pilar-interior bg-pilar-interior/5" },
};

export function Agenda() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground">Agenda</h2>
        <p className="mt-1 text-sm text-muted">Semana de 12 a 16 de maio de 2026</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {dias.map((dia) => {
          const evts = eventos.filter((e) => e.dia === dia);
          return (
            <div key={dia} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-background/50">
                <p className="text-sm font-semibold text-foreground">{diasLabel[dia]}</p>
              </div>
              <div className="p-2 space-y-2 min-h-[200px]">
                {evts.map((evt) => {
                  const tipo = tipoConfig[evt.tipo] || tipoConfig.reuniao;
                  return (
                    <div key={evt.id} className={cn("rounded-lg border-l-2 p-3 cursor-pointer hover:shadow-sm transition-shadow", tipo.color)}>
                      <div className="flex items-center gap-1.5 text-muted mb-1">
                        {tipo.icon}
                        <span className="text-[10px] font-medium">{evt.hora}</span>
                      </div>
                      <p className="text-xs font-medium text-foreground leading-snug">{evt.titulo}</p>
                      <div className="flex gap-1 mt-2">
                        {evt.participantes.map((p) => (
                          <span key={p} className="flex h-5 w-5 items-center justify-center rounded-full bg-background border border-border text-[8px] font-medium text-foreground">{p}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
