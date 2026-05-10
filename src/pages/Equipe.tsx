import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getProfiles, updateProfile } from "@/services/profileService";
import { 
  UserPlus, Shield, Mail, Phone, 
  Trash2, Edit2, X,
  Search, Loader2, Camera
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const ROLES = ["CEO", "Diretoria", "Parceiro", "Vendas", "Suporte"];

export function Equipe() {
  const { user: currentUser } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>("Suporte");

  useEffect(() => {
    fetchData();
    fetchCurrentUserRole();
  }, [currentUser]);

  async function fetchCurrentUserRole() {
    if (!currentUser) return;
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single();
    if (data) setCurrentUserRole(data.role);
  }

  async function fetchData() {
    try {
      const data = await getProfiles();
      setProfiles(data);
    } catch (error) {
      console.error("Erro ao buscar equipe:", error);
    } finally {
      setLoading(false);
    }
  }

  const isAdmin = currentUserRole === "CEO" || currentUserRole === "Diretoria";

  const filtrados = profiles.filter(p => 
    p.full_name?.toLowerCase().includes(busca.toLowerCase()) ||
    p.email?.toLowerCase().includes(busca.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm("Tem certeza que deseja remover este membro?")) return;

    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      setProfiles(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error("Erro ao deletar:", error);
    }
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
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground">Gestão da Equipe</h2>
          <p className="mt-1 text-sm text-muted">Gerencie permissões e membros do LaetitiAPP.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" /> Novo Membro
          </button>
        )}
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-md border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
            placeholder="Buscar por nome ou e-mail..."
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted">Membro</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted">Cargo / Nível</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted">Contato</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtrados.map((p) => (
                <tr key={p.id} className="hover:bg-background/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-letitia-gold/10 border border-letitia-gold/20 flex items-center justify-center overflow-hidden">
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-letitia-gold">
                            {p.full_name?.charAt(0) || p.email?.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{p.full_name || "Membro sem nome"}</p>
                        <p className="text-xs text-muted">ID: {p.id.substring(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                      p.role === "CEO" ? "bg-letitia-gold/10 text-letitia-gold border-letitia-gold/20" :
                      p.role === "Diretoria" ? "bg-purple-500/10 text-purple-600 border-purple-200" :
                      "bg-gray-100 text-gray-600 border-gray-200"
                    )}>
                      {p.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <Mail className="h-3 w-3" /> {p.email}
                      </div>
                      {p.phone && (
                        <div className="flex items-center gap-2 text-xs text-muted">
                          <Phone className="h-3 w-3" /> {p.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isAdmin && (
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => { setSelectedUser(p); setIsEditModalOpen(true); }}
                          className="p-2 rounded-md hover:bg-foreground/5 text-muted hover:text-foreground transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id)}
                          disabled={p.id === currentUser?.id}
                          className="p-2 rounded-md hover:bg-red-500/10 text-muted hover:text-red-500 transition-colors disabled:opacity-30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && <AddMemberModal onClose={() => setIsModalOpen(false)} onSuccess={() => { setIsModalOpen(false); fetchData(); }} />}
      {isEditModalOpen && <EditMemberModal user={selectedUser} onClose={() => setIsEditModalOpen(false)} onSuccess={() => { setIsEditModalOpen(false); fetchData(); }} />}
    </div>
  );
}

function AddMemberModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("Suporte");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let avatarUrl = "";
      
      // 1. Upload da foto se houver
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `new-user-${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        
        avatarUrl = publicUrl;
      }

      // 2. Criar conta (usando instância secundária para não deslogar o admin)
      // Nota: Em produção, o ideal é usar uma Edge Function, 
      // mas aqui usaremos o signUp com persistSession: false.
      const tempSupabase = (await import('@supabase/supabase-js')).createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        { auth: { persistSession: false } }
      );

      const { data: authData, error: authError } = await tempSupabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            avatar_url: avatarUrl,
            role: role
          }
        }
      });

      if (authError) throw authError;

      // 3. Garantir que o perfil existe (o trigger do banco geralmente cuida disso, 
      // mas vamos forçar os campos extras)
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            avatar_url: avatarUrl,
            role: role,
            email: email
          })
          .eq('id', authData.user.id);
        
        if (profileError) console.error("Erro ao atualizar perfil:", profileError);
      }

      alert("Membro criado com sucesso! Ele já pode fazer login.");
      onSuccess();
    } catch (error: any) {
      alert("Erro ao criar membro: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-serif font-medium">Cadastrar Novo Membro</h3>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Foto Preview & Upload */}
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="h-24 w-24 rounded-full bg-letitia-gold/5 border-2 border-dashed border-letitia-gold/30 flex items-center justify-center overflow-hidden relative group">
              {avatarFile ? (
                <img src={URL.createObjectURL(avatarFile)} alt="" className="h-full w-full object-cover" />
              ) : (
                <Camera className="h-8 w-8 text-letitia-gold/40" />
              )}
              <input 
                type="file" 
                accept="image/*"
                onChange={e => setAvatarFile(e.target.files?.[0] || null)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Foto de Perfil</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">Nome Completo</label>
              <input 
                required
                type="text" 
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-letitia-gold outline-none transition-all"
                placeholder="Ex: João Silva"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">E-mail</label>
              <input 
                required
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-letitia-gold outline-none transition-all"
                placeholder="email@equipe.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">Senha Inicial</label>
              <input 
                required
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-letitia-gold outline-none transition-all"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">Nível de Permissão</label>
              <select 
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-letitia-gold outline-none transition-all appearance-none"
              >
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-letitia-gold/5 border border-letitia-gold/20 p-4 rounded-xl flex gap-3">
            <Shield className="h-5 w-5 text-letitia-gold flex-shrink-0" />
            <p className="text-[11px] text-letitia-clay leading-relaxed">
              O membro será criado imediatamente. Informe a ele o e-mail e a senha cadastrados para que ele possa acessar o sistema.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-6 py-2.5 text-sm font-bold text-muted hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-letitia-gold text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-letitia-gold/20 hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {loading ? "Criando..." : "Finalizar Cadastro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditMemberModal({ user, onClose, onSuccess }: { user: any, onClose: () => void, onSuccess: () => void }) {
  const [role, setRole] = useState(user.role);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(user.id, { role });
      onSuccess();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-serif font-medium">Editar Permissões</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-muted" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">Membro</label>
            <p className="text-sm font-medium">{user.full_name || user.email}</p>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">Nível de Permissão</label>
            <select 
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-letitia-gold outline-none"
            >
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-muted">Cancelar</button>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
