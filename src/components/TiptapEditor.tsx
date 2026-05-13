import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { useState, useRef, useCallback, useEffect } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2, Heading3,
  List, ListOrdered, CheckSquare, Link2, Image, Undo2, Redo2, X,
  Loader2, Paperclip, FileText, Code, Quote, Minus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

interface TiptapEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  compact?: boolean;
}

export function TiptapEditor({ value, onChange, placeholder, className, minHeight = "150px", compact = false }: TiptapEditorProps) {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachInputRef = useRef<HTMLInputElement>(null);
  const linkUrlInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "tiptap-link",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      ImageExtension.configure({
        HTMLAttributes: {
          class: "tiptap-image",
        },
        allowBase64: true,
      }),
      Underline,
      Placeholder.configure({
        placeholder: placeholder || "Descreva os detalhes da tarefa...",
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "tiptap-editor-content",
      },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (let i = 0; i < items.length; i++) {
          if (items[i].type.startsWith("image/")) {
            event.preventDefault();
            const file = items[i].getAsFile();
            if (file) handleImageUpload(file);
            return true;
          }
        }
        return false;
      },
      handleDrop: (_view, event) => {
        const files = event.dataTransfer?.files;
        if (files?.[0]?.type.startsWith("image/")) {
          event.preventDefault();
          handleImageUpload(files[0]);
          return true;
        }
        return false;
      },
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [value]);  // eslint-disable-line react-hooks/exhaustive-deps

  const handleImageUpload = useCallback(async (file: File) => {
    if (!editor) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 5MB.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Apenas arquivos de imagem são permitidos.");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `task_${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("documentos")
        .upload(fileName, file);

      if (error) {
        // Fallback to base64
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          editor.chain().focus().setImage({ src: base64 }).run();
        };
        reader.readAsDataURL(file);
        return;
      }

      const { data: urlData } = supabase.storage.from("documentos").getPublicUrl(fileName);
      editor.chain().focus().setImage({ src: urlData.publicUrl }).run();
    } catch {
      // Fallback to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        editor.chain().focus().setImage({ src: base64 }).run();
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  }, [editor]);

  const handleFileAttach = useCallback(async (file: File) => {
    if (!editor) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("O arquivo deve ter no máximo 10MB.");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const safeFileName = `attach_${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("documentos")
        .upload(safeFileName, file);

      if (error) {
        // Create a local object URL fallback
        const objectUrl = URL.createObjectURL(file);
        editor.chain().focus().insertContent(
          `<p><a href="${objectUrl}" target="_blank" rel="noopener noreferrer" class="tiptap-link">📎 ${file.name}</a></p>`
        ).run();
        return;
      }

      const { data: urlData } = supabase.storage.from("documentos").getPublicUrl(safeFileName);
      editor.chain().focus().insertContent(
        `<p><a href="${urlData.publicUrl}" target="_blank" rel="noopener noreferrer" class="tiptap-link">📎 ${file.name}</a></p>`
      ).run();
    } catch {
      alert("Erro ao anexar arquivo.");
    } finally {
      setUploading(false);
    }
  }, [editor]);

  const handleInsertLink = useCallback(() => {
    if (!editor || !linkUrl.trim()) return;
    const url = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`;

    if (linkText.trim()) {
      editor.chain().focus().insertContent(
        `<a href="${url}" target="_blank" rel="noopener noreferrer">${linkText}</a> `
      ).run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }

    setShowLinkModal(false);
    setLinkUrl("");
    setLinkText("");
  }, [editor, linkUrl, linkText]);

  const openLinkModal = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href || "";
    const selectedText = editor.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to,
      ""
    );
    setLinkUrl(previousUrl);
    setLinkText(selectedText);
    setShowLinkModal(true);
    setTimeout(() => linkUrlInputRef.current?.focus(), 100);
  }, [editor]);

  if (!editor) return null;

  const ToolbarButton = ({ icon: Icon, action, active, title, disabled }: {
    icon: any; action: () => void; active?: boolean; title: string; disabled?: boolean;
  }) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); if (!disabled) action(); }}
      title={title}
      disabled={disabled}
      className={cn(
        "p-1.5 rounded transition-all duration-150",
        active
          ? "bg-letitia-gold/15 text-letitia-gold shadow-sm"
          : "text-muted hover:text-foreground hover:bg-foreground/8",
        disabled && "opacity-30 cursor-not-allowed",
        compact && "p-1"
      )}
    >
      <Icon className={cn("h-4 w-4", compact && "h-3.5 w-3.5")} />
    </button>
  );

  const Divider = () => <div className="w-px h-5 bg-border/60 mx-0.5" />;

  return (
    <div className={cn(
      "flex flex-col border border-border rounded-xl overflow-hidden bg-background transition-all duration-200",
      "focus-within:ring-2 focus-within:ring-letitia-gold/40 focus-within:border-letitia-gold/50",
      className
    )}>
      {/* Toolbar */}
      <div className={cn(
        "border-b border-border flex items-center gap-0.5 flex-wrap bg-card/80",
        compact ? "px-2 py-1.5" : "px-3 py-2"
      )}>
        <ToolbarButton icon={Undo2} action={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Desfazer (Ctrl+Z)" />
        <ToolbarButton icon={Redo2} action={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Refazer (Ctrl+Shift+Z)" />
        <Divider />
        <ToolbarButton icon={Bold} action={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Negrito (Ctrl+B)" />
        <ToolbarButton icon={Italic} action={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Itálico (Ctrl+I)" />
        <ToolbarButton icon={UnderlineIcon} action={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Sublinhado (Ctrl+U)" />
        <Divider />
        {!compact && (
          <>
            <ToolbarButton icon={Heading1} action={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Título 1" />
            <ToolbarButton icon={Heading2} action={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Título 2" />
            <ToolbarButton icon={Heading3} action={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Título 3" />
            <Divider />
          </>
        )}
        <ToolbarButton icon={List} action={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Lista" />
        <ToolbarButton icon={ListOrdered} action={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Lista numerada" />
        <ToolbarButton icon={CheckSquare} action={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive("taskList")} title="Checklist" />
        <Divider />
        {!compact && (
          <>
            <ToolbarButton icon={Quote} action={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Citação" />
            <ToolbarButton icon={Code} action={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Bloco de código" />
            <ToolbarButton icon={Minus} action={() => editor.chain().focus().setHorizontalRule().run()} title="Linha horizontal" />
            <Divider />
          </>
        )}
        <ToolbarButton icon={Link2} action={openLinkModal} active={editor.isActive("link")} title="Inserir link" />
        <ToolbarButton
          icon={uploading ? Loader2 : Image}
          action={() => fileInputRef.current?.click()}
          title="Inserir imagem (colar print ou arrastar)"
        />
        <ToolbarButton
          icon={Paperclip}
          action={() => attachInputRef.current?.click()}
          title="Anexar arquivo"
        />

        {/* Hidden file inputs */}
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
        <input
          ref={attachInputRef}
          type="file"
          accept="*/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              if (file.type.startsWith("image/")) {
                handleImageUpload(file);
              } else {
                handleFileAttach(file);
              }
            }
            e.target.value = "";
          }}
        />
      </div>

      {/* Editor Content */}
      <EditorContent
        editor={editor}
        className="tiptap-wrapper"
        style={{ minHeight }}
      />

      {/* Upload indicator */}
      {uploading && (
        <div className="px-3 py-2 border-t border-border bg-letitia-gold/5 flex items-center gap-2 text-xs text-letitia-gold animate-pulse">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Enviando arquivo...
        </div>
      )}

      {/* Link Modal */}
      {showLinkModal && (
        <div className="modal-overlay modal-overlay-z70 items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) { setShowLinkModal(false); setLinkUrl(""); setLinkText(""); } }}>
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-serif text-lg font-medium text-foreground flex items-center gap-2">
                <Link2 className="h-4 w-4 text-letitia-gold" />
                Inserir Link
              </h4>
              <button onClick={() => { setShowLinkModal(false); setLinkUrl(""); setLinkText(""); }} className="rounded-full p-1 hover:bg-foreground/10 transition-colors">
                <X className="h-4 w-4 text-muted" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1">URL</label>
                <input
                  ref={linkUrlInputRef}
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  placeholder="https://exemplo.com"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
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
