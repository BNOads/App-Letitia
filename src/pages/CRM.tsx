import { useState, useEffect } from "react";
import { getContacts, createContact, type DBContact } from "@/services/crmService";
import { pilarColors } from "@/data/mockData";
import { Search, Plus, Mail, Phone, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function CRM() {
  const [contatos, setContatos] = useState<DBContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  async function fetchContacts() {
    try {
      const data = await getContacts();
      setContatos(data);
    } catch (error) {
      console.error("Erro ao buscar contatos:", error);
    } finally {
      setLoading(false);
    }
  }

  const filtrados = contatos.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.email.toLowerCase().includes(busca.toLowerCase()) ||
    (c.telefone && c.telefone.includes(busca))
  );

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-letitia-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground">CRM de Contatos</h2>
          <p className="mt-1 text-sm text-muted">{contatos.length} contatos cadastrados</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all flex items-center gap-2 self-start"
        >
          <Plus className="h-4 w-4" />
          Novo Contato
        </button>
      </div>

      {/* Busca */}
      <div className="relative max-w-md">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-4 w-4 text-muted" />
        </div>
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="block w-full rounded-md border border-border bg-card px-3 py-2 pl-10 text-sm text-foreground placeholder:text-muted focus:ring-2 focus:ring-letitia-gold focus:outline-none"
          placeholder="Buscar por nome, e-mail ou telefone..."
        />
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Nome</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted hidden md:table-cell">Contato</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted hidden lg:table-cell">Pilar</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted hidden lg:table-cell">Tags</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted hidden md:table-cell">Produtos</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Origem</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted italic">Nenhum contato encontrado.</td>
                </tr>
              ) : (
                filtrados.map((contato) => (
                  <tr key={contato.id} className="border-b border-border last:border-0 hover:bg-background/50 transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background border border-border text-xs font-medium text-foreground">
                          {contato.nome.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{contato.nome}</p>
                          <p className="text-xs text-muted md:hidden">{contato.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="space-y-1">
                        <p className="text-xs text-muted flex items-center gap-1"><Mail className="h-3 w-3" /> {contato.email}</p>
                        {contato.telefone && <p className="text-xs text-muted flex items-center gap-1"><Phone className="h-3 w-3" /> {contato.telefone}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {contato.pilar ? (
                        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", pilarColors[contato.pilar as keyof typeof pilarColors]?.bg || "bg-gray-100", pilarColors[contato.pilar as keyof typeof pilarColors]?.text || "text-gray-600")}>
                          {pilarColors[contato.pilar as keyof typeof pilarColors]?.label || contato.pilar}
                        </span>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {contato.tags?.slice(0, 2).map((tag) => (
                          <span key={tag} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-foreground/5 text-muted">{tag}</span>
                        ))}
                        {contato.tags?.length > 2 && (
                          <span className="text-[10px] text-muted">+{contato.tags.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {contato.produtos?.length > 0 ? contato.produtos.map((p) => (
                          <span key={p} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-letitia-gold/10 text-letitia-gold">{p}</span>
                        )) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted">{contato.origem}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <NovoContatoModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => { setIsModalOpen(false); fetchContacts(); }} 
        />
      )}
    </div>
  );
}

function NovoContatoModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    pilar: "pessoal",
    origem: "manual",
    tags: [] as string[],
    produtos: [] as string[]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createContact(formData);
      onSuccess();
    } catch (error) {
      console.error("Erro ao criar contato:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg modal-content">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif text-2xl font-medium text-foreground">Novo Contato</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-foreground/10 transition-colors">
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Nome Completo</label>
            <input
              required
              value={formData.nome}
              onChange={e => setFormData({ ...formData, nome: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
              placeholder="Ex: Maria Oliveira"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">E-mail</label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
                placeholder="maria@email.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Telefone/WhatsApp</label>
              <input
                value={formData.telefone}
                onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Pilar de Interesse</label>
              <select
                value={formData.pilar}
                onChange={e => setFormData({ ...formData, pilar: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
              >
                <option value="pessoal">Pessoal</option>
                <option value="profissional">Profissional</option>
                <option value="interior">Interior</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Origem</label>
              <input
                value={formData.origem}
                onChange={e => setFormData({ ...formData, origem: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
                placeholder="Ex: Instagram, Indicação"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all flex items-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Salvar Contato
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
