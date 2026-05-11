import { useState, useRef, useEffect } from "react";
import { Search, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { type DBProfile } from "@/services/profileService";

interface ResponsavelPickerProps {
  profiles: DBProfile[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

export function ResponsavelPicker({ profiles, value, onChange, className }: ResponsavelPickerProps) {
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = profiles.find(p => p.id === value);

  const filtered = profiles.filter(p => {
    if (!busca) return true;
    const q = busca.toLowerCase();
    return (p.full_name || "").toLowerCase().includes(q) || (p.email || "").toLowerCase().includes(q);
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Selected display / trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 text-left bg-transparent hover:bg-foreground/5 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
      >
        {selected ? (
          <>
            <div className="h-7 w-7 rounded-full bg-letitia-gold/10 border border-letitia-gold/20 flex items-center justify-center overflow-hidden flex-shrink-0">
              {selected.avatar_url ? (
                <img src={selected.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-[10px] font-bold text-letitia-gold">
                  {(selected.full_name || "?").charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <span className="text-sm font-medium text-foreground truncate">{selected.full_name || selected.email}</span>
          </>
        ) : (
          <>
            <div className="h-7 w-7 rounded-full bg-foreground/5 border border-border flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] text-muted">?</span>
            </div>
            <span className="text-sm text-muted">Nenhum</span>
          </>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Search */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
              <input
                ref={inputRef}
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className="w-full pl-8 pr-8 py-2 text-xs bg-background rounded-lg border border-border focus:ring-2 focus:ring-letitia-gold focus:outline-none placeholder:text-muted/50"
                placeholder="Buscar por nome ou email..."
              />
              {busca && (
                <button
                  onClick={() => setBusca("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="max-h-52 overflow-y-auto py-1">
            {/* Nenhum option */}
            <button
              onClick={() => { onChange(""); setOpen(false); setBusca(""); }}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-foreground/5 transition-colors",
                !value && "bg-letitia-gold/5"
              )}
            >
              <div className="h-6 w-6 rounded-full bg-foreground/5 border border-border flex items-center justify-center flex-shrink-0">
                <X className="h-3 w-3 text-muted" />
              </div>
              <span className="text-xs text-muted">Nenhum</span>
              {!value && <Check className="h-3.5 w-3.5 text-letitia-gold ml-auto" />}
            </button>

            {filtered.map(p => (
              <button
                key={p.id}
                onClick={() => { onChange(p.id); setOpen(false); setBusca(""); }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-foreground/5 transition-colors",
                  value === p.id && "bg-letitia-gold/5"
                )}
              >
                <div className="h-6 w-6 rounded-full bg-letitia-gold/10 border border-letitia-gold/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[9px] font-bold text-letitia-gold">
                      {(p.full_name || "?").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{p.full_name || "Sem nome"}</p>
                  {p.email && <p className="text-[10px] text-muted truncate">{p.email}</p>}
                </div>
                {p.role && (
                  <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-foreground/5 text-muted flex-shrink-0">
                    {p.role}
                  </span>
                )}
                {value === p.id && <Check className="h-3.5 w-3.5 text-letitia-gold flex-shrink-0" />}
              </button>
            ))}

            {filtered.length === 0 && (
              <p className="text-xs text-muted text-center py-4 italic">Nenhum membro encontrado.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
