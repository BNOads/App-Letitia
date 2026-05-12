import { useRef, useEffect, useState, useCallback } from "react";
import {
  Bold, Italic, Underline, Heading1, Heading2, Heading3,
  List, ListOrdered, CheckSquare, Link2, Image, Undo2, Redo2, X, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const isInitialLoad = useRef(true);

  // Initialize content
  useEffect(() => {
    if (editorRef.current && isInitialLoad.current) {
      editorRef.current.innerHTML = value || "";
      isInitialLoad.current = false;
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  // Track active formatting
  const updateActiveFormats = useCallback(() => {
    const formats = new Set<string>();
    if (document.queryCommandState("bold")) formats.add("bold");
    if (document.queryCommandState("italic")) formats.add("italic");
    if (document.queryCommandState("underline")) formats.add("underline");
    if (document.queryCommandState("insertUnorderedList")) formats.add("ul");
    if (document.queryCommandState("insertOrderedList")) formats.add("ol");
    setActiveFormats(formats);
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", updateActiveFormats);
    return () => document.removeEventListener("selectionchange", updateActiveFormats);
  }, [updateActiveFormats]);

  const execCommand = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    handleInput();
    updateActiveFormats();
  };

  const handleHeading = (level: number) => {
    execCommand("formatBlock", `h${level}`);
  };

  const handleChecklist = () => {
    const selection = window.getSelection();
    if (!selection || !editorRef.current) return;

    const text = selection.toString() || "Item";
    const checkbox = document.createElement("div");
    checkbox.className = "checklist-item";
    checkbox.innerHTML = `<label style="display:flex;align-items:center;gap:8px;cursor:pointer;"><input type="checkbox" style="width:16px;height:16px;accent-color:#C4A265;cursor:pointer;" /><span>${text}</span></label>`;

    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(checkbox);

    // Move cursor after
    range.setStartAfter(checkbox);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);

    handleInput();
  };

  const handleInsertLink = () => {
    if (!linkUrl.trim()) return;
    const url = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`;
    const display = linkText.trim() || url;

    editorRef.current?.focus();
    document.execCommand("insertHTML", false, `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:#C4A265;text-decoration:underline;font-weight:500;">${display}</a>&nbsp;`);

    setShowLinkModal(false);
    setLinkUrl("");
    setLinkText("");
    handleInput();
  };

  const handleImageUpload = async (file: File) => {
    if (file.size > 1024 * 1024) {
      alert("A imagem deve ter no máximo 1MB.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Apenas arquivos de imagem são permitidos.");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `doc_${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("documentos")
        .upload(fileName, file);

      if (error) {
        // If bucket doesn't exist, use base64 fallback
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          editorRef.current?.focus();
          document.execCommand("insertHTML", false, `<img src="${base64}" style="max-width:100%;border-radius:8px;margin:8px 0;" />`);
          handleInput();
        };
        reader.readAsDataURL(file);
        return;
      }

      const { data: urlData } = supabase.storage.from("documentos").getPublicUrl(fileName);
      editorRef.current?.focus();
      document.execCommand("insertHTML", false, `<img src="${urlData.publicUrl}" style="max-width:100%;border-radius:8px;margin:8px 0;" />`);
      handleInput();
    } catch {
      // Fallback to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        editorRef.current?.focus();
        document.execCommand("insertHTML", false, `<img src="${base64}" style="max-width:100%;border-radius:8px;margin:8px 0;" />`);
        handleInput();
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) handleImageUpload(file);
        return;
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (files?.[0]?.type.startsWith("image/")) {
      handleImageUpload(files[0]);
    }
  };

  const ToolbarButton = ({ icon: Icon, action, active, title }: { icon: any; action: () => void; active?: boolean; title: string }) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); action(); }}
      title={title}
      className={cn(
        "p-1.5 rounded hover:bg-foreground/10 transition-colors",
        active ? "bg-foreground/10 text-foreground" : "text-muted"
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );

  const Divider = () => <div className="w-px h-5 bg-border mx-0.5" />;

  return (
    <div className={cn("flex flex-col border border-border rounded-lg overflow-hidden bg-background", className)}>
      {/* Toolbar */}
      <div className="px-3 py-2 border-b border-border flex items-center gap-0.5 flex-wrap bg-card">
        <ToolbarButton icon={Undo2} action={() => execCommand("undo")} title="Desfazer" />
        <ToolbarButton icon={Redo2} action={() => execCommand("redo")} title="Refazer" />
        <Divider />
        <ToolbarButton icon={Bold} action={() => execCommand("bold")} active={activeFormats.has("bold")} title="Negrito" />
        <ToolbarButton icon={Italic} action={() => execCommand("italic")} active={activeFormats.has("italic")} title="Itálico" />
        <ToolbarButton icon={Underline} action={() => execCommand("underline")} active={activeFormats.has("underline")} title="Sublinhado" />
        <Divider />
        <ToolbarButton icon={Heading1} action={() => handleHeading(1)} title="Título 1" />
        <ToolbarButton icon={Heading2} action={() => handleHeading(2)} title="Título 2" />
        <ToolbarButton icon={Heading3} action={() => handleHeading(3)} title="Título 3" />
        <Divider />
        <ToolbarButton icon={List} action={() => execCommand("insertUnorderedList")} active={activeFormats.has("ul")} title="Lista" />
        <ToolbarButton icon={ListOrdered} action={() => execCommand("insertOrderedList")} active={activeFormats.has("ol")} title="Lista numerada" />
        <ToolbarButton icon={CheckSquare} action={handleChecklist} title="Checklist" />
        <Divider />
        <ToolbarButton icon={Link2} action={() => setShowLinkModal(true)} title="Inserir link" />
        <ToolbarButton
          icon={uploading ? Loader2 : Image}
          action={() => fileInputRef.current?.click()}
          title="Inserir imagem (máx 1MB)"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file);
            e.target.value = "";
          }}
        />
      </div>

      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        data-placeholder={placeholder || "Comece a escrever..."}
        className="flex-1 min-h-[200px] p-6 text-sm leading-relaxed text-foreground focus:outline-none overflow-y-auto prose prose-sm max-w-none
          [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted/50 [&:empty]:before:pointer-events-none
          [&_h1]:text-2xl [&_h1]:font-serif [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3
          [&_h2]:text-xl [&_h2]:font-serif [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2
          [&_h3]:text-lg [&_h3]:font-serif [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2
          [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:my-2
          [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:my-2
          [&_li]:mb-1
          [&_a]:text-[#C4A265] [&_a]:underline [&_a]:font-medium
          [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-3
          [&_.checklist-item]:flex [&_.checklist-item]:items-center [&_.checklist-item]:gap-2 [&_.checklist-item]:my-1
        "
      />

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-serif text-lg font-medium text-foreground flex items-center gap-2">
                <Link2 className="h-4 w-4 text-letitia-gold" />
                Inserir Link
              </h4>
              <button onClick={() => { setShowLinkModal(false); setLinkUrl(""); setLinkText(""); }} className="rounded-full p-1 hover:bg-foreground/10">
                <X className="h-4 w-4 text-muted" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1">URL</label>
                <input
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  placeholder="https://exemplo.com"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
                  autoFocus
                  onKeyDown={e => e.key === "Enter" && handleInsertLink()}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Texto do link (opcional)</label>
                <input
                  value={linkText}
                  onChange={e => setLinkText(e.target.value)}
                  placeholder="Clique aqui"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
                  onKeyDown={e => e.key === "Enter" && handleInsertLink()}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => { setShowLinkModal(false); setLinkUrl(""); setLinkText(""); }} className="px-3 py-1.5 text-xs text-muted hover:text-foreground transition-colors">Cancelar</button>
                <button
                  onClick={handleInsertLink}
                  disabled={!linkUrl.trim()}
                  className="px-4 py-1.5 rounded-md bg-letitia-gold text-white text-xs font-medium hover:opacity-90 transition-all disabled:opacity-50"
                >
                  Inserir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
