import { useState } from "react";
import { aplicacoesMock, type AplicacaoTheWay } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Lock } from "lucide-react";

const pipelineColumns = [
  { id: "recebida" as const, label: "Recebida", color: "border-t-gray-400" },
  { id: "triagem" as const, label: "Triagem", color: "border-t-blue-400" },
  { id: "call_leticia" as const, label: "Call Letícia", color: "border-t-amber-400" },
  { id: "aprovada" as const, label: "Aprovada", color: "border-t-green-400" },
  { id: "contratada" as const, label: "Contratada", color: "border-t-letitia-gold" },
  { id: "em_mentoria" as const, label: "Em Mentoria", color: "border-t-pilar-interior" },
];

export function PipelineTheWay() {
  const [aplicacoes] = useState<AplicacaoTheWay[]>(aplicacoesMock);
  const [showConfidencial, setShowConfidencial] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground">Pipeline THE WAY</h2>
          <p className="mt-1 text-sm text-muted">Processo seletivo da mentoria — {aplicacoes.length} candidatas</p>
        </div>
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

      {/* Pipeline Kanban */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-[1200px]">
          {pipelineColumns.map((col) => {
            const colApps = aplicacoes.filter((a) => a.status === col.id);
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
                    <AplicacaoCard
                      key={app.id}
                      aplicacao={app}
                      showConfidencial={showConfidencial}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AplicacaoCard({ aplicacao, showConfidencial }: { aplicacao: AplicacaoTheWay; showConfidencial: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">{aplicacao.nome}</p>
          <p className="text-[10px] text-muted mt-0.5">{aplicacao.email}</p>
        </div>
        <span className="text-[10px] text-muted whitespace-nowrap">
          {new Date(aplicacao.dataAplicacao).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
        </span>
      </div>

      <p className="text-xs text-muted mt-2 line-clamp-2">{aplicacao.resumo}</p>

      {aplicacao.observacoes && (
        <div className="mt-2 px-2 py-1.5 rounded bg-letitia-gold/5 border border-letitia-gold/10">
          <p className="text-[10px] text-letitia-gold">{aplicacao.observacoes}</p>
        </div>
      )}

      {aplicacao.notaConfidencial && showConfidencial && (
        <div className="mt-2 px-2 py-1.5 rounded bg-red-500/5 border border-red-500/10">
          <div className="flex items-center gap-1 mb-1">
            <Lock className="h-3 w-3 text-red-500" />
            <span className="text-[10px] font-semibold text-red-500">Nota Confidencial</span>
          </div>
          <p className="text-[10px] text-red-400">{aplicacao.notaConfidencial}</p>
        </div>
      )}
    </div>
  );
}
