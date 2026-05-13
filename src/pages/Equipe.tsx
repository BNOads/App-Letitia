import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getProfiles, updateProfile, ensureProfileExists, syncAuthUsersToProfiles } from "@/services/profileService";
import { 
  UserPlus, Shield, Mail, Phone, 
  Trash2, Edit2, X,
  Search, Loader2, Camera, CheckSquare, Square, AlertTriangle, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const ROLES = ["CEO", "Diretoria", "Parceiro", "Vendas", "Suporte"];

export function Equipe() {
  const { user: currentUser } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [busca, setBusca] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>("Suporte");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

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
      // Primeiro sincroniza Auth → Profiles (cria perfis faltantes)
      await syncAuthUsersToProfiles();
      const data = await getProfiles();
      setProfiles(data);
    } catch (error) {
      console.error("Erro ao buscar equipe:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleManualSync() {
    setSyncing(true);
    try {
      // Diagnóstico: buscar dados diretamente
      const { data: authUsers, error: authErr } = await supabase.rpc('get_auth_users');
      const { data: allProfiles, error: profErr } = await supabase.from('profiles').select('id, full_name, email');
      
      // Tentar RPC de profiles
      const { data: rpcProfiles, error: rpcProfErr } = await supabase.rpc('get_all_profiles');
      
      let diagnostico = `📊 DIAGNÓSTICO:\n\n`;
      diagnostico += `Auth Users (RPC): ${authErr ? '❌ ' + authErr.message : (authUsers?.length || 0) + ' usuários'}\n`;
      diagnostico += `Profiles (query direta): ${profErr ? '❌ ' + profErr.message : (allProfiles?.length || 0) + ' perfis'}\n`;
      diagnostico += `Profiles (RPC): ${rpcProfErr ? '❌ ' + rpcProfErr.message : (rpcProfiles?.length || 0) + ' perfis'}\n\n`;
      
      if (authUsers && !authErr) {
        diagnostico += `── Usuários no Auth ──\n`;
        authUsers.forEach((u: any) => {
          const name = u.raw_user_meta_data?.full_name || '(sem nome)';
          const hasProfile = allProfiles?.some((p: any) => p.id === u.id);
          const hasRpcProfile = rpcProfiles?.some((p: any) => p.id === u.id);
          diagnostico += `${hasProfile ? '✅' : '❌'} ${name} (${u.email}) ${!hasProfile ? ' → SEM PERFIL' : ''}${hasProfile && !hasRpcProfile ? ' → RPC não retorna' : ''}\n`;
        });
      }
      
      if (allProfiles && !profErr) {
        diagnostico += `\n── Perfis na tabela ──\n`;
        allProfiles.forEach((p: any) => {
          diagnostico += `• ${p.full_name || '(sem nome)'} - ${p.email || '(sem email)'} - ID: ${p.id.substring(0, 8)}\n`;
        });
      }

      // Executar sync
      const result = await syncAuthUsersToProfiles();
      const data = await getProfiles();
      setProfiles(data);
      
      diagnostico += `\n── Resultado do Sync ──\n`;
      diagnostico += `Sincronizados: ${result.synced}\n`;
      diagnostico += `Perfis carregados na tela: ${data.length}\n`;
      if (result.errors.length > 0) {
        diagnostico += `Erros: ${result.errors.join(', ')}\n`;
      }
      
      alert(diagnostico);
    } catch (error: any) {
      console.error("Erro ao sincronizar:", error);
      alert("❌ Erro ao sincronizar: " + error.message);
    } finally {
      setSyncing(false);
    }
  }

  const isAdmin = currentUserRole === "CEO" || currentUserRole === "Diretoria";

  const filtrados = profiles.filter(p => {
    if (!busca) return true; // Se não tem busca, mostra todos
    const termo = busca.toLowerCase();
    return (p.full_name || '').toLowerCase().includes(termo) ||
           (p.email || '').toLowerCase().includes(termo) ||
           p.id.toLowerCase().includes(termo);
  });

  // ─── Seleção em massa ─────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtrados.filter(p => p.id !== currentUser?.id).length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtrados.filter(p => p.id !== currentUser?.id).map(p => p.id)));
    }
  };

  const allSelected = filtrados.filter(p => p.id !== currentUser?.id).length > 0 &&
    selectedIds.size === filtrados.filter(p => p.id !== currentUser?.id).length;

  // ─── Exclusão total (Auth + Profile) ──────────────────────
  const deleteUserCompletely = async (id: string) => {
    // 1. Deletar o perfil da tabela profiles
    const { error: profileError } = await supabase.from('profiles').delete().eq('id', id);
    if (profileError) {
      console.error("Erro ao deletar perfil:", profileError);
    }

    // 2. Tentar deletar do Auth via RPC (requer função no banco)
    const { error: authError } = await supabase.rpc('delete_auth_user', { user_id: id });
    if (authError) {
      console.warn("Não foi possível deletar do Auth (RPC pode não existir):", authError.message);
      // Mesmo que o Auth não seja deletado, o perfil já foi — o usuário não aparecerá mais na equipe
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm("Tem certeza que deseja remover este membro COMPLETAMENTE?\n\nIsso irá:\n• Remover da equipe\n• Remover conta de acesso")) return;

    try {
      await deleteUserCompletely(id);
      setProfiles(prev => prev.filter(p => p.id !== id));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (error) {
      console.error("Erro ao deletar:", error);
    }
  };

  const handleBulkDelete = async () => {
    if (!isAdmin || selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (!confirm(`Tem certeza que deseja remover ${count} membro(s) COMPLETAMENTE?\n\nIsso irá:\n• Remover da equipe\n• Remover contas de acesso\n\nEsta ação não pode ser desfeita.`)) return;

    setDeleting(true);
    try {
      const idsToDelete = Array.from(selectedIds);
      for (const id of idsToDelete) {
        await deleteUserCompletely(id);
      }
      setProfiles(prev => prev.filter(p => !selectedIds.has(p.id)));
      setSelectedIds(new Set());
      alert(`✅ ${count} membro(s) removido(s) com sucesso.`);
    } catch (error) {
      console.error("Erro ao deletar em massa:", error);
      alert("Ocorreu um erro ao deletar alguns membros. Verifique o console.");
      fetchData(); // Recarrega para mostrar o estado real
    } finally {
      setDeleting(false);
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
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button 
              onClick={handleManualSync}
              disabled={syncing}
              className="rounded-md border border-border px-3 py-2 text-sm font-medium text-muted hover:text-foreground hover:bg-foreground/5 transition-all flex items-center gap-2 disabled:opacity-50"
              title="Sincronizar usuários do Supabase Auth com a equipe"
            >
              <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
              <span className="hidden sm:inline">Sincronizar</span>
            </button>
          )}
          {isAdmin && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" /> Novo Membro
            </button>
          )}
        </div>
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

        {/* Barra de ações em massa */}
        {isAdmin && selectedIds.size > 0 && (
          <div className="flex items-center gap-3 bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-2 animate-in fade-in slide-in-from-top-1">
            <span className="text-sm font-medium text-red-600">
              {selectedIds.size} selecionado(s)
            </span>
            <button
              onClick={handleBulkDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 bg-red-500 text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              {deleting ? "Excluindo..." : "Excluir Selecionados"}
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-muted hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {isAdmin && (
                  <th className="pl-4 pr-0 py-4 w-10">
                    <button onClick={toggleSelectAll} className="p-1 rounded hover:bg-foreground/10 transition-colors">
                      {allSelected ? (
                        <CheckSquare className="h-4 w-4 text-letitia-gold" />
                      ) : (
                        <Square className="h-4 w-4 text-muted" />
                      )}
                    </button>
                  </th>
                )}
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted">Membro</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted">Cargo / Nível</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted">Contato</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtrados.map((p) => {
                const isSelf = p.id === currentUser?.id;
                const isSelected = selectedIds.has(p.id);
                return (
                  <tr key={p.id} className={cn(
                    "transition-colors",
                    isSelected ? "bg-red-500/5" : "hover:bg-background/50"
                  )}>
                    {isAdmin && (
                      <td className="pl-4 pr-0 py-4 w-10">
                        {!isSelf ? (
                          <button onClick={() => toggleSelect(p.id)} className="p-1 rounded hover:bg-foreground/10 transition-colors">
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-red-500" />
                            ) : (
                              <Square className="h-4 w-4 text-muted" />
                            )}
                          </button>
                        ) : (
                          <div className="h-6 w-6" /> // Placeholder para não selecionar a si mesmo
                        )}
                      </td>
                    )}
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
                            disabled={isSelf}
                            className="p-2 rounded-md hover:bg-red-500/10 text-muted hover:text-red-500 transition-colors disabled:opacity-30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
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

  // Auto-preenche a senha com o e-mail para facilitar
  const handleEmailChange = (newEmail: string) => {
    setEmail(newEmail);
    if (!password || password === email) {
      setPassword(newEmail);
    }
  };

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
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
      const tempSupabase = (await import('@supabase/supabase-js')).createClient(
        import.meta.env.VITE_SUPABASE_URL,
        supabaseAnonKey,
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
          },
          emailRedirectTo: undefined
        }
      });

      if (authError) throw authError;

      // Verificar se o usuário foi realmente criado
      if (!authData.user) {
        throw new Error('Não foi possível criar o usuário. Verifique se o e-mail já está cadastrado.');
      }

      // 3. Garantir que o perfil existe usando ensureProfileExists (com retry/upsert)
      // Isso resolve o problema de timing entre o signUp e o trigger handle_new_user
      await ensureProfileExists(authData.user.id, {
        full_name: fullName,
        email: email,
        avatar_url: avatarUrl,
        role: role,
      });

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
                onChange={e => handleEmailChange(e.target.value)}
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
                type="text" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-letitia-gold outline-none transition-all"
                placeholder="Igual ao e-mail"
                minLength={6}
              />
              <p className="text-[10px] text-muted mt-1">Por padrão, a senha é igual ao e-mail.</p>
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
              O membro será criado imediatamente e sincronizado com a equipe. Informe a ele o e-mail e a senha cadastrados para que ele possa acessar o sistema.
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
  const [fullName, setFullName] = useState(user.full_name || "");
  const [email, setEmail] = useState(user.email || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [role, setRole] = useState(user.role || "Suporte");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar_url || null);
  const [loading, setLoading] = useState(false);

  const handleAvatarChange = (file: File | null) => {
    setAvatarFile(file);
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let avatarUrl = user.avatar_url;

      // Upload de nova foto se selecionada
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${user.id}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) {
          console.error("Erro no upload:", uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
          avatarUrl = `${publicUrl}?t=${Date.now()}`;
        }
      }

      await updateProfile(user.id, { 
        full_name: fullName || null,
        email: email || null,
        phone: phone || null,
        role,
        avatar_url: avatarUrl,
      });

      onSuccess();
    } catch (error: any) {
      alert("Erro ao salvar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const initials = (fullName || email || "??").split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-serif font-medium">Editar Membro</h3>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Foto de Perfil */}
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="h-24 w-24 rounded-full bg-letitia-gold/5 border-2 border-dashed border-letitia-gold/30 flex items-center justify-center overflow-hidden relative group cursor-pointer hover:border-letitia-gold/60 transition-colors">
              {avatarPreview ? (
                <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-letitia-gold/40">{initials}</span>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <input 
                type="file" 
                accept="image/*"
                onChange={e => handleAvatarChange(e.target.files?.[0] || null)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Clique para trocar a foto</p>
            {avatarPreview && (
              <button 
                type="button"
                onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
                className="text-[10px] text-red-500 hover:text-red-600 transition-colors"
              >
                Remover foto
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">Nome Completo</label>
              <input 
                type="text" 
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-letitia-gold outline-none transition-all"
                placeholder="Nome do membro"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">E-mail</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-letitia-gold outline-none transition-all"
                placeholder="email@exemplo.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">Telefone</label>
              <input 
                type="text" 
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-letitia-gold outline-none transition-all"
                placeholder="(00) 00000-0000"
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

          <div className="bg-foreground/5 border border-border p-3 rounded-xl">
            <p className="text-[10px] text-muted">
              <span className="font-bold uppercase tracking-widest">ID do membro:</span>{" "}
              <span className="font-mono text-foreground/60">{user.id}</span>
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
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
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit2 className="h-4 w-4" />}
              {loading ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

