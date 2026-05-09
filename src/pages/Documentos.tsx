import { useState } from "react";
import { cn } from "@/lib/utils";
import { Search, Plus, FolderOpen, Star, FileText, ChevronDown, ChevronRight, Bold, Italic, Underline, List, ListOrdered, Link2, Type, Heading1, Heading2, Heading3 } from "lucide-react";

type Pasta = { id: string; nome: string; favorita: boolean; docs: Documento[] };
type Documento = { id: string; titulo: string; conteudo: string; pasta: string; favorito: boolean; publico: boolean; criadoEm: string };

const pastasIniciais: Pasta[] = [
  {
    id: "p1", nome: "Atas de Reunião", favorita: true,
    docs: [
      { id: "d1", titulo: "Reunião Semanal de Conteúdo — 05/05", conteudo: "## Pauta\n\n1. Review das publicações da semana\n2. Aprovação dos criativos para semana 20\n3. Calendário editorial de junho\n\n## Decisões\n\n- **Carrossel Pilar Interior** aprovado com ajustes na copy final\n- Reels de bastidores adiado para semana 21\n- Newsletter #42 pronta para revisão da Letícia\n\n## Próximos Passos\n\n- [ ] Mariana: finalizar criativos até quarta\n- [ ] Ana: agendar gravação do podcast ep. 47\n- [ ] Letícia: revisar Petit Journal #42", pasta: "p1", favorito: true, publico: false, criadoEm: "2026-05-05" },
      { id: "d2", titulo: "Reunião Financeira Mensal — Abril", conteudo: "## Resumo Financeiro\n\n- Receita: R$ 31.500\n- Despesas: R$ 26.400\n- Lucro: R$ 5.100\n\n## Pontos de Atenção\n\n- Aumento de 18% no custo de tráfego pago\n- 3 boletos em aberto (VD parcelado)\n\n## Ações\n\n- [ ] Juliana: follow-up nos inadimplentes\n- [ ] Camila: renegociar contrato Meta Ads", pasta: "p1", favorito: false, publico: false, criadoEm: "2026-05-02" },
    ],
  },
  {
    id: "p2", nome: "POPs — Processos", favorita: false,
    docs: [
      { id: "d3", titulo: "Como verificar as métricas do cliente", conteudo: "## 📋 Objetivo\n\nEstabelecer processo padronizado para análise e verificação das métricas médias de performance dos clientes.\n\n## 🎯 Quando executar\n\n- **Frequência:** Semanal (toda sexta-feira)\n- **Responsável:** Traffic Manager + CS\n- **Duração:** 30-45 minutos\n\n## 📊 Métricas a Analisar\n\n### 1. Métricas de Tráfego\n- **Impressões médias**\n- **CTR (Click-Through Rate)**\n- **CPC (Custo por Clique)**\n- **CPM (Custo por Mil)**\n\n### 2. Métricas de Conversão\n- **Taxa de conversão da LP**\n- **Custo por lead**\n- **Custo por venda**\n\n### 3. Passos\n1. Acessar o painel de analytics\n2. Filtrar pelo período da semana\n3. Exportar relatório\n4. Comparar com semana anterior\n5. Registrar anomalias", pasta: "p2", favorito: false, publico: true, criadoEm: "2026-04-20" },
      { id: "d4", titulo: "Checklist de Onboarding — Nova Colaboradora", conteudo: "## Dia 1\n\n- [ ] Apresentar a equipe\n- [ ] Entregar acessos (e-mail, Slack, Supabase)\n- [ ] Tour pelo LetitiAPP\n- [ ] Ler POPs da área\n\n## Semana 1\n\n- [ ] Acompanhar reunião semanal\n- [ ] Primeiro 1x1 com Letícia\n- [ ] Completar treinamento da plataforma\n\n## Mês 1\n\n- [ ] Feedback 30 dias\n- [ ] Definir OKRs do trimestre", pasta: "p2", favorito: false, publico: false, criadoEm: "2026-04-15" },
      { id: "d5", titulo: "Fluxo de Publicação de Conteúdo", conteudo: "## Fluxo\n\n1. **Criação** — Responsável cria a pauta no calendário\n2. **Produção** — Design e copy são feitos\n3. **Revisão Letícia** — Enviar para aprovação\n4. **Agendamento** — Agendar na plataforma\n5. **Publicação** — Confirmar que foi ao ar\n6. **Métricas** — Coletar resultados após 48h", pasta: "p2", favorito: true, publico: true, criadoEm: "2026-04-10" },
    ],
  },
];

export function Documentos() {
  const [pastas] = useState<Pasta[]>(pastasIniciais);
  const [docSelecionado, setDocSelecionado] = useState<Documento | null>(pastasIniciais[0].docs[0]);
  const [busca, setBusca] = useState("");
  const [pastasAbertas, setPastasAbertas] = useState<Record<string, boolean>>({ p1: true, p2: true });

  const todosDocs = pastas.flatMap((p) => p.docs);
  const favoritos = todosDocs.filter((d) => d.favorito);

  const togglePasta = (id: string) => setPastasAbertas((prev) => ({ ...prev, [id]: !prev[id] }));

  const filtrados = busca
    ? todosDocs.filter((d) => d.titulo.toLowerCase().includes(busca.toLowerCase()))
    : null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground">Documentos</h2>
        <p className="mt-1 text-sm text-muted">Atas de reunião, processos e documentação interna.</p>
      </div>

      <div className="flex gap-4 h-[calc(100vh-220px)]">
        {/* Sidebar de documentos */}
        <div className="w-72 flex-shrink-0 border border-border rounded-xl bg-card overflow-hidden flex flex-col">
          {/* Actions */}
          <div className="p-3 border-b border-border flex gap-2">
            <button className="flex-1 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 transition-all flex items-center justify-center gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Novo
            </button>
            <button className="rounded-md border border-border px-3 py-2 text-xs font-medium text-muted hover:text-foreground transition-colors flex items-center gap-1.5">
              <FolderOpen className="h-3.5 w-3.5" /> Pasta
            </button>
          </div>

          {/* Search */}
          <div className="px-3 py-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full rounded-md border border-border bg-background pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:ring-1 focus:ring-letitia-gold focus:outline-none"
                placeholder="Buscar documento..."
              />
            </div>
          </div>

          {/* Document list */}
          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-3">
            {busca && filtrados ? (
              <div className="space-y-0.5">
                {filtrados.map((doc) => (
                  <DocItem key={doc.id} doc={doc} selected={docSelecionado?.id === doc.id} onClick={() => { setDocSelecionado(doc); setBusca(""); }} />
                ))}
              </div>
            ) : (
              <>
                {/* Favoritos */}
                {favoritos.length > 0 && (
                  <div>
                    <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted">Favoritos</p>
                    {favoritos.map((doc) => (
                      <DocItem key={doc.id} doc={doc} selected={docSelecionado?.id === doc.id} onClick={() => setDocSelecionado(doc)} />
                    ))}
                  </div>
                )}

                {/* Pastas */}
                {pastas.map((pasta) => (
                  <div key={pasta.id}>
                    <button onClick={() => togglePasta(pasta.id)} className="flex items-center gap-1.5 px-2 py-1 w-full text-left hover:bg-foreground/5 rounded-md transition-colors">
                      {pastasAbertas[pasta.id] ? <ChevronDown className="h-3 w-3 text-muted" /> : <ChevronRight className="h-3 w-3 text-muted" />}
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">{pasta.nome}</span>
                    </button>
                    {pastasAbertas[pasta.id] && (
                      <div className="ml-2 space-y-0.5">
                        {pasta.docs.map((doc) => (
                          <DocItem key={doc.id} doc={doc} selected={docSelecionado?.id === doc.id} onClick={() => setDocSelecionado(doc)} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Área de conteúdo */}
        <div className="flex-1 border border-border rounded-xl bg-card overflow-hidden flex flex-col">
          {docSelecionado ? (
            <>
              {/* Doc header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="h-5 w-5 text-letitia-clay" />
                  <h3 className="text-lg font-semibold text-foreground">{docSelecionado.titulo}</h3>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-muted bg-background px-2 py-0.5 rounded">{pastas.find(p => p.id === docSelecionado.pasta)?.nome}</span>
                  <button className="text-xs text-muted hover:text-letitia-gold transition-colors flex items-center gap-1">
                    <Star className={cn("h-3 w-3", docSelecionado.favorito ? "fill-letitia-gold text-letitia-gold" : "")} /> Favorito
                  </button>
                  <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", docSelecionado.publico ? "bg-green-500/10 text-green-600" : "bg-gray-500/10 text-gray-500")}>
                    {docSelecionado.publico ? "Público" : "Privado"}
                  </span>
                </div>
              </div>

              {/* Toolbar */}
              <div className="px-4 py-2 border-b border-border flex items-center gap-1 flex-wrap">
                {[Heading1, Heading2, Heading3].map((Icon, i) => (
                  <button key={i} className="p-1.5 rounded hover:bg-foreground/5 text-muted hover:text-foreground transition-colors"><Icon className="h-4 w-4" /></button>
                ))}
                <div className="w-px h-5 bg-border mx-1" />
                {[Bold, Italic, Underline].map((Icon, i) => (
                  <button key={i} className="p-1.5 rounded hover:bg-foreground/5 text-muted hover:text-foreground transition-colors"><Icon className="h-4 w-4" /></button>
                ))}
                <div className="w-px h-5 bg-border mx-1" />
                {[List, ListOrdered, Link2].map((Icon, i) => (
                  <button key={i} className="p-1.5 rounded hover:bg-foreground/5 text-muted hover:text-foreground transition-colors"><Icon className="h-4 w-4" /></button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="prose prose-sm max-w-none">
                  {docSelecionado.conteudo.split("\n").map((line, i) => {
                    if (line.startsWith("### ")) return <h3 key={i} className="text-base font-semibold text-foreground mt-4 mb-2">{line.replace("### ", "")}</h3>;
                    if (line.startsWith("## ")) return <h2 key={i} className="text-lg font-semibold text-foreground mt-5 mb-2">{line.replace("## ", "")}</h2>;
                    if (line.startsWith("# ")) return <h1 key={i} className="text-xl font-bold text-foreground mt-6 mb-3">{line.replace("# ", "")}</h1>;
                    if (line.startsWith("- [ ] ")) return <div key={i} className="flex items-center gap-2 py-0.5"><input type="checkbox" className="rounded border-border" /><span className="text-sm text-foreground">{line.replace("- [ ] ", "")}</span></div>;
                    if (line.startsWith("- [x] ")) return <div key={i} className="flex items-center gap-2 py-0.5"><input type="checkbox" checked readOnly className="rounded border-border" /><span className="text-sm text-muted line-through">{line.replace("- [x] ", "")}</span></div>;
                    if (line.startsWith("- **")) return <li key={i} className="text-sm text-foreground ml-4 list-disc">{renderBold(line.replace("- ", ""))}</li>;
                    if (line.startsWith("- ")) return <li key={i} className="text-sm text-foreground ml-4 list-disc">{line.replace("- ", "")}</li>;
                    if (line.match(/^\d+\. /)) return <li key={i} className="text-sm text-foreground ml-4 list-decimal">{renderBold(line.replace(/^\d+\. /, ""))}</li>;
                    if (line.trim() === "") return <div key={i} className="h-2" />;
                    return <p key={i} className="text-sm text-foreground leading-relaxed">{renderBold(line)}</p>;
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted text-sm">
              Selecione um documento para visualizar
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DocItem({ doc, selected, onClick }: { doc: Documento; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-2.5 py-2 rounded-md text-sm transition-colors flex items-center gap-2",
        selected ? "bg-letitia-gold/10 text-foreground font-medium" : "text-muted hover:bg-foreground/5 hover:text-foreground"
      )}
    >
      <FileText className="h-3.5 w-3.5 flex-shrink-0" />
      <span className="truncate text-xs">{doc.titulo}</span>
    </button>
  );
}

function renderBold(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
      : part
  );
}
