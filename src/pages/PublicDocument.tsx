import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { FileText, Globe, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Documento = {
  id: string;
  titulo: string;
  conteudo: string;
  publico: boolean;
};

export function PublicDocument() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<Documento | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDoc();
  }, [id]);

  async function fetchDoc() {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from("documentos")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (!data.publico) {
        setError("Este documento é privado e não pode ser visualizado publicamente.");
      } else {
        setDoc(data);
      }
    } catch (err: any) {
      console.error("Erro ao buscar documento:", err);
      setError("Documento não encontrado ou erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCF9] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-letitia-gold mx-auto" />
          <p className="text-sm text-muted">Carregando documento...</p>
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="min-h-screen bg-[#FDFCF9] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground mb-2">Acesso Restrito</h1>
            <p className="text-sm text-muted">{error || "Documento não disponível."}</p>
          </div>
          <button 
            onClick={() => window.location.href = '/'}
            className="text-sm font-medium text-letitia-gold hover:underline"
          >
            Voltar para o sistema
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF9] selection:bg-letitia-gold/20">
      {/* Header Público */}
      <header className="border-b border-border bg-white/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-letitia-gold/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-letitia-gold" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground uppercase tracking-tight">LaetitiAPP</h1>
              <p className="text-[10px] text-muted font-medium uppercase tracking-widest">Documento Público</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-100">
            <Globe className="h-3.5 w-3.5 text-green-600" />
            <span className="text-[10px] font-bold text-green-700 uppercase tracking-tight">Público</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <article className="bg-white border border-border rounded-2xl shadow-sm p-8 md:p-12 overflow-hidden">
          <div className="prose prose-slate prose-headings:font-serif max-w-none">
            {doc.conteudo?.split("\n").map((line, i) => {
              if (line.startsWith("### ")) return <h3 key={i} className="text-base font-bold text-foreground mt-8 mb-3 border-l-4 border-letitia-gold/30 pl-4">{line.replace("### ", "")}</h3>;
              if (line.startsWith("## ")) return <h2 key={i} className="text-2xl font-bold text-foreground mt-10 mb-5 border-b border-border pb-3">{line.replace("## ", "")}</h2>;
              if (line.startsWith("# ")) return <h1 key={i} className="text-4xl font-serif font-bold text-foreground mt-2 mb-8 leading-tight">{line.replace("# ", "")}</h1>;
              if (line.startsWith("- ")) return <li key={i} className="text-base text-foreground/80 ml-6 list-disc mb-2">{renderBold(line.replace("- ", ""))}</li>;
              if (line.match(/^\d+\. /)) return <li key={i} className="text-base text-foreground/80 ml-6 list-decimal mb-2">{renderBold(line.replace(/^\d+\. /, ""))}</li>;
              if (line.startsWith("|")) return <TableRow key={i} line={line} />;
              if (line.startsWith("---")) return <hr key={i} className="my-10 border-border" />;
              if (line.trim() === "") return <div key={i} className="h-6" />;
              return <p key={i} className="text-base text-foreground/70 leading-relaxed mb-6">{renderBold(line)}</p>;
            })}
          </div>
        </article>

        <footer className="mt-12 text-center border-t border-border pt-8 pb-12">
          <p className="text-sm text-muted mb-4 font-serif italic">Letitia Cazarré — Inteligência Operacional</p>
          <div className="flex items-center justify-center gap-6">
            <a href="https://leticiacazarre.com.br" className="text-xs text-muted hover:text-letitia-gold transition-colors">Site Oficial</a>
            <a href="#" className="text-xs text-muted hover:text-letitia-gold transition-colors">Suporte</a>
            <a href="#" className="text-xs text-muted hover:text-letitia-gold transition-colors">Termos</a>
          </div>
        </footer>
      </main>
    </div>
  );
}

function TableRow({ line }: { line: string }) {
  const cells = line.split("|").filter(c => c.trim() !== "").map(c => c.trim());
  if (cells.every(c => c.includes("---"))) return null;
  
  return (
    <div className="grid grid-cols-4 gap-4 py-3 border-b border-border/50 items-center">
      {cells.map((cell, i) => (
        <div key={i} className={cn("text-sm", i === 0 ? "font-bold text-foreground" : "text-muted")}>
          {renderBold(cell)}
        </div>
      ))}
    </div>
  );
}

function renderBold(text: string) {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = text.split(linkRegex);
  
  const content = [];
  for (let i = 0; i < parts.length; i++) {
    if (i % 3 === 0) {
      const boldParts = parts[i].split(/(\*\*.*?\*\*)/g);
      content.push(...boldParts.map((part, j) =>
        part.startsWith("**") && part.endsWith("**")
          ? <strong key={`${i}-${j}`} className="font-bold text-foreground">{part.slice(2, -2)}</strong>
          : part
      ));
    } else if (i % 3 === 1) {
      const url = parts[i+1];
      content.push(<a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-letitia-gold hover:underline font-medium">{parts[i]}</a>);
      i++;
    }
  }
  return <>{content}</>;
}
