import { useState } from "react";
import { cn } from "@/lib/utils";
import { Search, Plus, Play, Filter, BookOpen, Users } from "lucide-react";

type Categoria = "Analytics" | "Criativos" | "Ferramentas" | "Processos" | "Atendimento";
type Nivel = "Iniciante" | "Intermediário" | "Avançado";

type Curso = {
  id: string;
  titulo: string;
  descricao: string;
  categoria: Categoria;
  nivel: Nivel;
  aulas: number;
  duracao: string;
  instrutor: string;
  progresso: number;
};

const categoriaCores: Record<Categoria, string> = {
  Analytics: "bg-blue-500",
  Criativos: "bg-orange-500",
  Ferramentas: "bg-amber-500",
  Processos: "bg-purple-500",
  Atendimento: "bg-green-500",
};

const cardGradients: Record<Categoria, string> = {
  Analytics: "from-blue-400 to-cyan-400",
  Criativos: "from-orange-400 to-rose-400",
  Ferramentas: "from-amber-400 to-orange-400",
  Processos: "from-purple-400 to-indigo-400",
  Atendimento: "from-green-400 to-emerald-400",
};

const nivelCores: Record<Nivel, string> = {
  Iniciante: "bg-green-500/10 text-green-600",
  Intermediário: "bg-amber-500/10 text-amber-600",
  Avançado: "bg-red-500/10 text-red-600",
};

const cursosMock: Curso[] = [
  { id: "c1", titulo: "Curso de IA para Marketing", descricao: "Desvende o potencial da inteligência artificial para impulsionar suas campanhas de marketing! Aprenda a usar Claude, ChatGPT e ferramentas de automação.", categoria: "Ferramentas", nivel: "Iniciante", aulas: 12, duracao: "4h30", instrutor: "Letícia Cazarré", progresso: 75 },
  { id: "c2", titulo: "Criação de Conteúdo Visual", descricao: "Desbloqueie o poder da criação visual com Canva, Figma e ferramentas de edição. Aprenda a criar carrosséis, stories e thumbnails profissionais.", categoria: "Criativos", nivel: "Iniciante", aulas: 8, duracao: "3h", instrutor: "Mariana Costa", progresso: 100 },
  { id: "c3", titulo: "Gestão de Tráfego Pago", descricao: "Domine Meta Ads e Google Ads do zero. Aprenda a criar campanhas, otimizar investimentos e analisar resultados.", categoria: "Analytics", nivel: "Intermediário", aulas: 15, duracao: "6h", instrutor: "Camila Duarte", progresso: 30 },
  { id: "c4", titulo: "Atendimento ao Cliente THE WAY", descricao: "Processo completo de atendimento às candidatas da mentoria THE WAY, desde o primeiro contato até o onboarding.", categoria: "Atendimento", nivel: "Iniciante", aulas: 6, duracao: "2h", instrutor: "Juliana Reis", progresso: 0 },
  { id: "c5", titulo: "Método de Vendas Consultivas", descricao: "Aprenda a vender com empatia e estratégia. Processo de vendas da marca Letícia Cazarré aplicado a todos os produtos.", categoria: "Processos", nivel: "Intermediário", aulas: 10, duracao: "4h", instrutor: "Letícia Cazarré", progresso: 50 },
  { id: "c6", titulo: "Edição de Vídeo para Reels", descricao: "Técnicas de edição para criar Reels e TikToks que engajam. CapCut, transições e tendências de formato.", categoria: "Criativos", nivel: "Avançado", aulas: 8, duracao: "3h30", instrutor: "Mariana Costa", progresso: 0 },
];

type Tab = "cursos" | "pdis";

export function Treinamentos() {
  const [tab, setTab] = useState<Tab>("cursos");
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<Categoria | "todas">("todas");

  const filtrados = cursosMock.filter((c) => {
    const matchBusca = c.titulo.toLowerCase().includes(busca.toLowerCase()) || c.descricao.toLowerCase().includes(busca.toLowerCase());
    const matchCategoria = filtroCategoria === "todas" || c.categoria === filtroCategoria;
    return matchBusca && matchCategoria;
  });

  const categorias: Categoria[] = ["Analytics", "Criativos", "Ferramentas", "Processos", "Atendimento"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground">Treinamentos</h2>
          <p className="mt-1 text-sm text-muted">Desenvolva habilidades com cursos completos e tutoriais passo-a-passo.</p>
        </div>
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all flex items-center gap-2 self-start">
          <Plus className="h-4 w-4" /> Novo Curso
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-0.5 w-fit">
        <button onClick={() => setTab("cursos")} className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2", tab === "cursos" ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground")}>
          <Play className="h-3.5 w-3.5" /> Cursos
        </button>
        <button onClick={() => setTab("pdis")} className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2", tab === "pdis" ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground")}>
          <Users className="h-3.5 w-3.5" /> PDIs da Equipe
        </button>
      </div>

      {tab === "cursos" ? (
        <>
          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full rounded-md border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted focus:ring-2 focus:ring-letitia-gold focus:outline-none"
                placeholder="Buscar cursos e aulas..."
              />
            </div>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value as Categoria | "todas")}
              className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
            >
              <option value="todas">Todas categorias</option>
              {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Cursos Disponíveis */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted" /> Cursos Disponíveis
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtrados.map((curso) => (
                <CursoCard key={curso.id} curso={curso} />
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-border bg-card p-16 text-center">
          <Users className="h-8 w-8 text-muted mx-auto mb-3" />
          <p className="text-sm text-muted">Planos de Desenvolvimento Individual em construção.</p>
        </div>
      )}
    </div>
  );
}

function CursoCard({ curso }: { curso: Curso }) {
  const gradient = cardGradients[curso.categoria];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
      {/* Card Header com gradiente */}
      <div className={cn("relative h-28 bg-gradient-to-br p-4 flex flex-col justify-between", gradient)}>
        <div className="flex items-center justify-between">
          <span className={cn("text-[10px] font-semibold text-white px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm")}>
            {curso.categoria}
          </span>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white group-hover:scale-110 transition-transform">
          <Play className="h-5 w-5 ml-0.5" />
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4">
        <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">{curso.titulo}</h4>
        <p className="text-xs text-muted mt-2 line-clamp-3">{curso.descricao}</p>

        {/* Progress */}
        {curso.progresso > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted">{curso.progresso}% completo</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
              <div className={cn("h-full rounded-full transition-all", curso.progresso === 100 ? "bg-green-500" : "bg-letitia-gold")} style={{ width: `${curso.progresso}%` }} />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase", nivelCores[curso.nivel])}>
            {curso.nivel}
          </span>
          <span className="text-[10px] text-muted">{curso.aulas} aulas · {curso.duracao}</span>
        </div>
      </div>
    </div>
  );
}
