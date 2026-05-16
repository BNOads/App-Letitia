import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { type DBProfile } from "@/services/profileService";

interface UserSelectorProps {
  users: DBProfile[];
  selectedIds: string | string[];
  onSelect: (userIds: string | string[]) => void;
  label?: string;
  placeholder?: string;
  multiple?: boolean;
}

export function UserSelector({ users, selectedIds, onSelect, label, placeholder = "Selecionar...", multiple = false }: UserSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedIdArray = Array.isArray(selectedIds) ? selectedIds : [selectedIds].filter(Boolean);
  const selectedUsers = users.filter((u) => selectedIdArray.includes(u.id));

  const filteredUsers = users.filter((u) =>
    (u.full_name || "").toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (userId: string) => {
    if (multiple) {
      const newSelection = selectedIdArray.includes(userId)
        ? selectedIdArray.filter(id => id !== userId)
        : [...selectedIdArray, userId];
      onSelect(newSelection);
    } else {
      onSelect(userId);
      setIsOpen(false);
    }
    setSearch("");
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      {label && <label className="block text-xs font-semibold uppercase tracking-wider text-muted">{label}</label>}
      
      <div className="relative">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex w-full min-h-[40px] items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground transition-all hover:border-letitia-gold/50 cursor-pointer focus-within:ring-2 focus-within:ring-letitia-gold",
            isOpen && "border-letitia-gold ring-2 ring-letitia-gold"
          )}
        >
          <div className="flex flex-wrap items-center gap-1.5 overflow-hidden">
            {selectedUsers.length > 0 ? (
              selectedUsers.map(u => (
                <div key={u.id} className={cn(
                  "flex items-center gap-2 rounded-full px-2 py-0.5 text-sm font-medium",
                  multiple ? "bg-letitia-gold/10 text-letitia-gold border border-letitia-gold/20" : ""
                )}>
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-letitia-gold/20 text-[9px] font-bold">
                      {(u.full_name || "??").split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="truncate">{u.full_name || "Usuário"}</span>
                  {multiple && (
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-letitia-clay" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(u.id);
                      }} 
                    />
                  )}
                </div>
              ))
            ) : (
              <span className="text-muted">{placeholder}</span>
            )}
          </div>
          <ChevronDown className={cn("h-4 w-4 text-muted transition-transform ml-2 flex-shrink-0", isOpen && "rotate-180")} />
        </div>

        {isOpen && (
          <div className="absolute z-[100] mt-1 w-full min-w-[280px] rounded-lg border border-border bg-card p-1.5 shadow-xl modal-content">
            <div className="relative mb-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent border-b border-border pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none"
                placeholder="Pesquisar..."
              />
            </div>
            
            <div className="max-h-60 overflow-y-auto overflow-x-hidden">
              {filteredUsers.length === 0 ? (
                <p className="px-3 py-4 text-center text-xs text-muted italic">Nenhum usuário encontrado.</p>
              ) : (
                filteredUsers.map((u) => {
                  const initials = (u.full_name || "??").split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                  const isSelected = selectedIdArray.includes(u.id);
                  
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(u.id);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-2.5 py-2.5 text-sm transition-colors hover:bg-letitia-gold/10 group",
                        isSelected && "bg-letitia-gold/5 text-letitia-gold font-medium"
                      )}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors flex-shrink-0",
                            isSelected ? "bg-letitia-gold text-white" : "bg-letitia-gold/10 text-letitia-gold group-hover:bg-letitia-gold group-hover:text-white"
                          )}>
                            {initials}
                          </div>
                        )}
                        <div className="flex flex-col items-start overflow-hidden text-left">
                          <span className="text-sm font-medium truncate w-full">{u.full_name || "Usuário"}</span>
                          <span className="text-[10px] text-muted truncate uppercase tracking-wider">{u.role}</span>
                        </div>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-letitia-gold" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
