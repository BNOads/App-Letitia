import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getProfile, updateProfile, uploadAvatar, changePassword, type DBProfile 
} from "@/services/profileService";
import { 
  User, Mail, Shield, Info, Camera, 
  Lock, Save, Loader2, CheckCircle2, AlertCircle, X, Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sendEmail, emailTemplates } from "@/services/emailService";


const ROLES = ["CEO", "Diretoria", "Parceiro", "Vendas", "Suporte"];

export function Perfil() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<DBProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Edit states
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "Suporte",
    receber_notificacoes_email: false,
    metadata: {
      bio: "",
      departamento: "",
      aniversario: ""
    }
  });

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: ""
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  async function fetchProfile() {
    try {
      const data = await getProfile(user!.id);
      setProfile(data);
      setFormData({
        full_name: data.full_name || "",
        email: data.email || user?.email || "",
        phone: data.phone || "",
        role: data.role || "Suporte",
        receber_notificacoes_email: data.receber_notificacoes_email || false,
        metadata: {
          bio: data.metadata?.bio || "",
          departamento: data.metadata?.departamento || "",
          aniversario: data.metadata?.aniversario || ""
        }
      });
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setSaving(true);
      const url = await uploadAvatar(user.id, file);
      setProfile(prev => prev ? { ...prev, avatar_url: url } : null);
      await refreshUser(); // Update Sidebar and other components
      setMessage({ type: 'success', text: 'Foto de perfil atualizada!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao subir imagem' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);
      
      const enabledNotificationsNow = !profile?.receber_notificacoes_email && formData.receber_notificacoes_email;
      
      await updateProfile(user.id, formData);
      await refreshUser(); // Sync name
      
      if (enabledNotificationsNow && formData.email) {
        // Send email confirming that notifications were enabled
        await sendEmail({
          to: formData.email,
          subject: 'Notificações por E-mail Ativadas',
          html: emailTemplates.notificationsEnabled(formData.full_name)
        }).catch(err => console.error('Erro ao enviar email de notificação', err));
      }
      
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      fetchProfile();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao salvar perfil' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      setMessage({ type: 'error', text: 'As senhas não coincidem' });
      return;
    }

    try {
      setSaving(true);
      await changePassword(passwords.new);
      
      if (formData.email) {
        await sendEmail({
          to: formData.email,
          subject: 'Senha alterada com sucesso',
          html: emailTemplates.passwordChanged(formData.full_name)
        }).catch(err => console.error('Erro ao enviar email de senha', err));
      }
      
      setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao trocar senha' });
    } finally {
      setSaving(false);
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
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <header>
        <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground">Meu Perfil</h2>
        <p className="mt-1 text-sm text-muted">Gerencie suas informações e permissões no LaetitiAPP.</p>
      </header>

      {message && (
        <div 
          className={cn(
            "p-4 rounded-xl border flex items-center justify-between",
            message.type === 'success' ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
          )}
        >
          <div className="flex items-center gap-3">
            {message.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sidebar Perfil */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-3xl p-8 text-center">
            <div className="relative inline-block mb-4">
              <div className="h-32 w-32 rounded-full border-4 border-background bg-muted overflow-hidden">
                {profile?.avatar_url ? (
                  <img 
                    key={profile.avatar_url}
                    src={profile.avatar_url} 
                    alt="" 
                    className="h-full w-full object-cover" 
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-letitia-gold/10 text-letitia-gold text-4xl font-serif">
                    {formData.full_name.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <label className="absolute bottom-1 right-1 h-10 w-10 bg-letitia-gold text-white rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg">
                <Camera className="h-5 w-5" />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
              </label>
            </div>
            
            <h3 className="text-xl font-medium text-foreground">{formData.full_name || "Usuário"}</h3>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="px-3 py-1 rounded-full bg-letitia-gold/10 text-letitia-gold text-[10px] font-bold uppercase tracking-widest border border-letitia-gold/20">
                {formData.role}
              </span>
            </div>
            
            <div className="mt-8 space-y-4 text-left">
              <div className="flex items-center gap-3 text-sm text-muted">
                <Mail className="h-4 w-4" />
                <span className="truncate">{user?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted">
                <Shield className="h-4 w-4" />
                <span>ID: {user?.id.substring(0, 8)}...</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-3xl p-6">
            <h4 className="text-sm font-bold uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
              <Info className="h-4 w-4" /> Dica de Segurança
            </h4>
            <p className="text-xs text-muted leading-relaxed">
              Mantenha seu telefone atualizado para recuperação de conta e evite compartilhar sua senha com outros membros da equipe.
            </p>
          </div>
        </div>

        {/* Formulários */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Informações Básicas */}
          <section className="bg-card border border-border rounded-3xl p-8">
            <h3 className="text-xl font-medium text-foreground mb-6 flex items-center gap-3">
              <User className="h-5 w-5 text-letitia-gold" /> Informações Pessoais
            </h3>
            
            <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">Nome Completo</label>
                <input 
                  type="text" 
                  value={formData.full_name}
                  onChange={e => setFormData({...formData, full_name: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-letitia-gold outline-none"
                  placeholder="Ex: Letícia Cazarré"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">E-mail</label>
                <input 
                  type="email" 
                  disabled
                  value={formData.email}
                  className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm text-muted cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">WhatsApp / Telefone</label>
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-letitia-gold outline-none"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">Nível de Permissão</label>
                <select 
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  disabled={formData.role !== 'CEO' && profile?.role !== 'CEO'} // Apenas CEO pode mudar cargo? Ou trava se não for admin
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-letitia-gold outline-none"
                >
                  {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">Aniversário</label>
                <input 
                  type="date" 
                  value={formData.metadata.aniversario}
                  onChange={e => setFormData({...formData, metadata: { ...formData.metadata, aniversario: e.target.value }})}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-letitia-gold outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">Bio / Descrição</label>
                <textarea 
                  rows={3}
                  value={formData.metadata.bio}
                  onChange={e => setFormData({...formData, metadata: { ...formData.metadata, bio: e.target.value }})}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-letitia-gold outline-none resize-none"
                  placeholder="Conte um pouco sobre sua atuação na equipe..."
                />
              </div>

              <div className="md:col-span-2 pt-4 border-t border-border mt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={formData.receber_notificacoes_email}
                      onChange={e => setFormData({...formData, receber_notificacoes_email: e.target.checked})}
                    />
                    <div className={cn("block w-14 h-8 rounded-full transition-colors", formData.receber_notificacoes_email ? "bg-letitia-gold" : "bg-muted")}></div>
                    <div className={cn("absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform", formData.receber_notificacoes_email ? "transform translate-x-6" : "")}></div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">Receber Notificações por E-mail</div>
                    <div className="text-xs text-muted">Avisos do sistema serão enviados para o seu endereço de e-mail.</div>
                  </div>
                </label>
              </div>

              <div className="md:col-span-2 flex justify-end pt-4">
                <button 
                  type="submit"
                  disabled={saving}
                  className="bg-letitia-gold text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                  Salvar Alterações
                </button>
              </div>
            </form>
          </section>

          {/* Alterar Senha */}
          <section className="bg-card border border-border rounded-3xl p-8">
            <h3 className="text-xl font-medium text-foreground mb-6 flex items-center gap-3">
              <Lock className="h-5 w-5 text-letitia-gold" /> Segurança da Conta
            </h3>
            
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">Nova Senha</label>
                  <input 
                    type="password" 
                    value={passwords.new}
                    onChange={e => setPasswords({...passwords, new: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-letitia-gold outline-none"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">Confirmar Nova Senha</label>
                  <input 
                    type="password" 
                    value={passwords.confirm}
                    onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-letitia-gold outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button 
                  type="submit"
                  disabled={saving || !passwords.new}
                  className="bg-foreground text-card px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
                  Atualizar Senha
                </button>
              </div>
            </form>
          </section>

        </div>
      </div>
    </div>
  );
}
