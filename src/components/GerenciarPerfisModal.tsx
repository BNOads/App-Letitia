import { useState, useEffect, useRef } from "react";
import { 
  getSocialProfiles, createSocialProfile, updateSocialProfile, 
  deleteSocialProfile, uploadSocialAvatar, type SocialProfile 
} from "@/services/socialProfileService";
import { 
  X, Plus, Loader2, Trash2, Edit2, Camera, Check, 
  Users2, CheckCircle2, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";


const PRESET_COLORS = [
  "#E74C3C", "#E67E22", "#F1C40F", "#2ECC71", "#1ABC9C",
  "#3498DB", "#9B59B6", "#34495E", "#C4A47C", "#A66B4A",
  "#7A8B6F", "#E91E63", "#FF5722", "#795548", "#607D8B",
];

interface GerenciarPerfisModalProps {
  onClose: () => void;
}

export function GerenciarPerfisModal({ onClose }: GerenciarPerfisModalProps) {
  const [profiles, setProfiles] = useState<SocialProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  async function fetchProfiles() {
    try {
      const data = await getSocialProfiles();
      setProfiles(data);
    } catch (error) {
      console.error("Erro ao buscar perfis:", error);
      setMessage({ type: "error", text: "Erro ao carregar perfis." });
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este perfil?")) return;
    try {
      await deleteSocialProfile(id);
      setProfiles((prev) => prev.filter((p) => p.id !== id));
      setMessage({ type: "success", text: "Perfil excluído com sucesso!" });
    } catch (error) {
      console.error("Erro ao deletar perfil:", error);
      setMessage({ type: "error", text: "Erro ao excluir perfil." });
    }
  };

  return (
    <div className="modal-overlay modal-overlay-z60 items-center justify-center p-4">
      <div
        className="w-full max-w-2xl bg-card border border-border rounded-3xl shadow-lg overflow-hidden max-h-[90vh] modal-content flex flex-col"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-[#1a1a2e] to-[#16213e] px-8 pt-8 pb-10 text-center overflow-hidden">
          {/* Decorative circle */}
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-letitia-gold/10 rounded-full" />
          <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-letitia-gold/5 rounded-full" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 border border-white/10 mb-4">
              <Users2 className="h-7 w-7 text-letitia-gold" />
            </div>
            <h2 className="text-2xl font-serif font-semibold text-white tracking-tight">
              Gerenciar Perfis
            </h2>
            <p className="text-sm text-white/60 mt-1">
              Personalize seus perfis sociais e identidades visuais.
            </p>
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {/* Message */}
          <>
            {message && (
              <div
                className={cn(
                  "p-3 rounded-xl border flex items-center gap-3 text-sm font-medium",
                  message.type === "success"
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-red-50 border-red-200 text-red-700"
                )}
              >
                {message.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                )}
                {message.text}
              </div>
            )}
          </>

          {/* Add Button */}
          <button
            onClick={() => { setIsAdding(true); setEditingId(null); }}
            disabled={isAdding}
            className={cn(
              "w-full flex items-center justify-center gap-3 py-4 rounded-2xl border-2 border-dashed transition-all font-semibold text-sm",
              isAdding
                ? "border-letitia-gold/30 bg-letitia-gold/5 text-letitia-gold/50 cursor-not-allowed"
                : "border-letitia-gold/40 hover:border-letitia-gold hover:bg-letitia-gold/5 text-letitia-gold cursor-pointer"
            )}
          >
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-letitia-gold/10 border border-letitia-gold/30">
              <Plus className="h-4 w-4" />
            </div>
            Adicionar Novo Perfil
          </button>

          {/* Add Form */}
          <>
            {isAdding && (
              <ProfileForm
                onSave={async (data) => {
                  const newProfile = await createSocialProfile(data);
                  setProfiles((prev) => [...prev, newProfile]);
                  return newProfile.id;
                }}
                onCancel={() => setIsAdding(false)}
                onDone={() => {
                  setIsAdding(false);
                  setMessage({ type: "success", text: "Perfil criado com sucesso!" });
                }}
                onAvatarUpload={async (profileId, file) => {
                  const url = await uploadSocialAvatar(profileId, file);
                  setProfiles((prev) =>
                    prev.map((p) =>
                      p.id === profileId ? { ...p, avatar_url: url } : p
                    )
                  );
                  return url;
                }}
              />
            )}
          </>

          {/* Profiles List */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted mb-4">
              Perfis Existentes
            </p>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-letitia-gold" />
              </div>
            ) : profiles.length === 0 ? (
              <div className="text-center py-12">
                <Users2 className="h-10 w-10 text-muted/30 mx-auto mb-3" />
                <p className="text-sm text-muted">Nenhum perfil cadastrado ainda.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {profiles.map((profile) => (
                  <div key={profile.id}>
                    {editingId === profile.id ? (
                      <ProfileForm
                        initialData={profile}
                        onSave={async (data) => {
                          await updateSocialProfile(profile.id, data);
                          setProfiles((prev) =>
                            prev.map((p) =>
                              p.id === profile.id ? { ...p, ...data } : p
                            )
                          );
                          return profile.id;
                        }}
                        onCancel={() => setEditingId(null)}
                        onDone={() => {
                          setEditingId(null);
                          setMessage({ type: "success", text: "Perfil atualizado!" });
                        }}
                        onAvatarUpload={async (profileId, file) => {
                          const url = await uploadSocialAvatar(profileId, file);
                          setProfiles((prev) =>
                            prev.map((p) =>
                              p.id === profileId ? { ...p, avatar_url: url } : p
                            )
                          );
                          return url;
                        }}
                      />
                    ) : (
                      <ProfileCard
                        profile={profile}
                        onEdit={() => { setEditingId(profile.id); setIsAdding(false); }}
                        onDelete={() => handleDelete(profile.id)}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Profile Card ───────────────────────────────────── */
function ProfileCard({
  profile,
  onEdit,
  onDelete,
}: {
  profile: SocialProfile;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="group flex items-center gap-4 p-4 rounded-2xl border border-border bg-background hover:border-letitia-gold/30 hover:shadow-md transition-colors"
    >
      {/* Avatar */}
      <div className="h-14 w-14 rounded-xl overflow-hidden flex-shrink-0 border-2 border-border bg-muted/20 shadow-sm">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.nome}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="h-full w-full flex items-center justify-center text-white font-serif text-xl font-semibold"
            style={{ backgroundColor: profile.cor }}
          >
            {profile.nome.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-base font-semibold text-foreground truncate">{profile.nome}</h4>
        <div className="flex items-center gap-2 mt-1">
          <div
            className="w-5 h-3 rounded-sm shadow-inner"
            style={{ backgroundColor: profile.cor }}
          />
          <span className="text-xs font-mono text-muted">{profile.cor.toUpperCase()}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-2.5 rounded-xl hover:bg-letitia-gold/10 text-letitia-clay hover:text-letitia-gold transition-colors"
          title="Editar"
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2.5 rounded-xl hover:bg-red-500/10 text-muted hover:text-red-500 transition-colors"
          title="Excluir"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ─── Profile Form (Add/Edit) ────────────────────────── */
function ProfileForm({
  initialData,
  onSave,
  onCancel,
  onDone,
  onAvatarUpload,
}: {
  initialData?: SocialProfile;
  onSave: (data: { nome: string; cor: string; avatar_url?: string }) => Promise<string | void>;
  onCancel: () => void;
  onDone?: () => void;
  onAvatarUpload?: (profileId: string, file: File) => Promise<string>;
}) {
  const [nome, setNome] = useState(initialData?.nome || "");
  const [cor, setCor] = useState(initialData?.cor || "#C4A47C");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialData?.avatar_url || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingStatus, setSavingStatus] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [customColor, setCustomColor] = useState(
    PRESET_COLORS.includes(initialData?.cor || "") ? "" : (initialData?.cor || "")
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setFormError(null);
    // Reset input value so same file can be selected again
    e.target.value = '';
  };

  const handleSubmit = async () => {
    if (!nome.trim()) return;
    setSaving(true);
    setFormError(null);
    try {
      // Save profile first (creates it if new, updates if existing)
      setSavingStatus("Salvando perfil...");
      const profileId = await onSave({ 
        nome: nome.trim(), 
        cor, 
        ...(initialData?.avatar_url && !avatarFile ? { avatar_url: initialData.avatar_url } : {})
      });

      // Upload avatar if a new file was selected
      if (avatarFile && onAvatarUpload) {
        setSavingStatus("Enviando imagem...");
        const targetId = (typeof profileId === 'string' ? profileId : initialData?.id) || '';
        if (targetId) {
          await onAvatarUpload(targetId, avatarFile);
        }
      }

      // Close form AFTER everything is done
      if (onDone) onDone();
    } catch (error: any) {
      console.error("Erro ao salvar perfil:", error);
      setFormError(error?.message || "Erro ao salvar perfil. Tente novamente.");
    } finally {
      setSaving(false);
      setSavingStatus("");
    }
  };

  return (
    <div
      className="overflow-hidden"
    >
      <div className="rounded-2xl border-2 border-letitia-gold/30 bg-letitia-gold/5 p-5 space-y-5">
        {/* Avatar + Name Row */}
        <div className="flex items-start gap-4">
          {/* Avatar Upload */}
          <div className="relative flex-shrink-0">
            <div
              className="h-16 w-16 rounded-xl overflow-hidden border-2 border-dashed border-letitia-gold/30 bg-background flex items-center justify-center cursor-pointer hover:border-letitia-gold transition-colors group"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <Camera className="h-6 w-6 text-letitia-gold/40 group-hover:text-letitia-gold transition-colors" />
              )}
            </div>
            {avatarPreview && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-letitia-gold text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
              >
                <Camera className="h-3 w-3" />
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Name */}
          <div className="flex-1">
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted mb-1.5">
              Nome do Perfil
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-letitia-gold outline-none transition-all"
              placeholder="Ex: Letícia Cazarré"
              autoFocus
            />
          </div>
        </div>

        {/* Color Picker */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted mb-2">
            Cor do Perfil
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => { setCor(c); setCustomColor(""); }}
                className={cn(
                  "w-7 h-7 rounded-lg transition-all border-2 hover:scale-110",
                  cor === c ? "border-foreground scale-110 shadow-md" : "border-transparent"
                )}
                style={{ backgroundColor: c }}
                title={c}
              >
                {cor === c && (
                  <Check className="h-3.5 w-3.5 text-white mx-auto drop-shadow" />
                )}
              </button>
            ))}
            
            {/* Custom Color Input */}
            <div className="relative">
              <input
                type="color"
                value={customColor || cor}
                onChange={(e) => {
                  const val = e.target.value;
                  setCor(val);
                  setCustomColor(val);
                }}
                className="w-7 h-7 rounded-lg cursor-pointer border-2 border-border appearance-none bg-transparent"
                style={{ backgroundColor: customColor || "transparent" }}
                title="Cor personalizada"
              />
            </div>
            
            {/* Color hex display */}
            <div className="ml-auto flex items-center gap-2">
              <div className="w-5 h-5 rounded-md shadow-inner" style={{ backgroundColor: cor }} />
              <span className="text-xs font-mono text-muted">{cor.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {formError && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {formError}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            disabled={saving}
            className="px-5 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !nome.trim()}
            className="bg-letitia-gold text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-letitia-gold/20 hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {saving ? (savingStatus || "Salvando...") : initialData ? "Salvar" : "Criar Perfil"}
          </button>
        </div>
      </div>
    </div>
  );
}
