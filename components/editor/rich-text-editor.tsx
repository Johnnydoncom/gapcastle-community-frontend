"use client";

import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
  Unlink,
  type LucideIcon,
} from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * A simple, robust WYSIWYG editor for listing descriptions. Only formatting the
 * API keeps is offered (headings, bold/italic/underline/strike, lists, quotes,
 * links); the server sanitises the HTML again before saving.
 */
export function RichTextEditor({
  id,
  value,
  onChange,
  placeholder,
  invalid = false,
  disabled = false,
  maxLength = 5000,
}: {
  id?: string;
  value: string;
  onChange: (html: string, text: string) => void;
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  maxLength?: number;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        horizontalRule: false,
        link: { openOnClick: false, autolink: true, protocols: ["https", "mailto"], HTMLAttributes: { rel: "nofollow noopener noreferrer", target: "_blank" } },
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        role: "textbox",
        "aria-multiline": "true",
        "aria-invalid": invalid ? "true" : "false",
        class: "rich-text min-h-44 px-4 py-3 text-[15px] leading-relaxed outline-none sm:text-sm",
      },
    },
    onUpdate: ({ editor: current }) => {
      const text = current.getText();
      onChange(text.trim() ? current.getHTML() : "", text);
    },
  });

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      isEmpty: current?.isEmpty ?? true,
      length: current?.getText().length ?? 0,
    }),
  });

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-card transition-colors focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-ring/40",
        invalid ? "border-destructive" : "border-input",
        disabled && "opacity-60",
      )}
    >
      {editor && <Toolbar editor={editor} disabled={disabled} />}
      <div className="relative">
        {state?.isEmpty && placeholder && (
          <p className="pointer-events-none absolute left-4 top-3 text-[15px] text-muted-foreground sm:text-sm">{placeholder}</p>
        )}
        <EditorContent editor={editor} />
        {!editor && <div className="min-h-44" />}
      </div>
      <div className="flex items-center justify-between border-t border-border bg-muted/40 px-3 py-1.5 text-[11px] text-muted-foreground">
        <span>Tip: use short paragraphs and bullet points for key facts.</span>
        <span className={cn((state?.length ?? 0) > maxLength && "font-semibold text-destructive")}>{state?.length ?? 0}/{maxLength}</span>
      </div>
    </div>
  );
}

function Toolbar({ editor, disabled }: { editor: Editor; disabled: boolean }) {
  const active = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current.isActive("bold"),
      italic: current.isActive("italic"),
      underline: current.isActive("underline"),
      strike: current.isActive("strike"),
      h2: current.isActive("heading", { level: 2 }),
      h3: current.isActive("heading", { level: 3 }),
      bullet: current.isActive("bulletList"),
      ordered: current.isActive("orderedList"),
      quote: current.isActive("blockquote"),
      link: current.isActive("link"),
      canUndo: current.can().undo(),
      canRedo: current.can().redo(),
    }),
  });

  function setLink() {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link address (https://…)", previous ?? "https://");
    if (url === null) return;
    if (url.trim() === "" || url.trim() === "https://") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    if (!/^(https:\/\/|mailto:)/i.test(url.trim())) {
      window.alert("Please use a full https:// link.");
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  const groups: { icon: LucideIcon; label: string; on: boolean; run: () => void; enabled?: boolean }[][] = [
    [
      { icon: Bold, label: "Bold", on: active.bold, run: () => editor.chain().focus().toggleBold().run() },
      { icon: Italic, label: "Italic", on: active.italic, run: () => editor.chain().focus().toggleItalic().run() },
      { icon: Underline, label: "Underline", on: active.underline, run: () => editor.chain().focus().toggleUnderline().run() },
      { icon: Strikethrough, label: "Strikethrough", on: active.strike, run: () => editor.chain().focus().toggleStrike().run() },
    ],
    [
      { icon: Heading2, label: "Heading", on: active.h2, run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
      { icon: Heading3, label: "Subheading", on: active.h3, run: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    ],
    [
      { icon: List, label: "Bullet list", on: active.bullet, run: () => editor.chain().focus().toggleBulletList().run() },
      { icon: ListOrdered, label: "Numbered list", on: active.ordered, run: () => editor.chain().focus().toggleOrderedList().run() },
      { icon: Quote, label: "Quote", on: active.quote, run: () => editor.chain().focus().toggleBlockquote().run() },
    ],
    [
      { icon: Link2, label: "Add link", on: active.link, run: setLink },
      { icon: Unlink, label: "Remove link", on: false, run: () => editor.chain().focus().unsetLink().run(), enabled: active.link },
    ],
    [
      { icon: Undo2, label: "Undo", on: false, run: () => editor.chain().focus().undo().run(), enabled: active.canUndo },
      { icon: Redo2, label: "Redo", on: false, run: () => editor.chain().focus().redo().run(), enabled: active.canRedo },
    ],
  ];

  return (
    <div role="toolbar" aria-label="Formatting" className="scrollbar-none flex items-center gap-1 overflow-x-auto border-b border-border bg-muted/40 px-2 py-1.5">
      {groups.map((group, index) => (
        <div key={index} className={cn("flex shrink-0 items-center gap-0.5", index > 0 && "border-l border-border pl-1")}>
          {group.map((button) => (
            <button
              key={button.label}
              type="button"
              title={button.label}
              aria-label={button.label}
              aria-pressed={button.on}
              disabled={disabled || button.enabled === false}
              onMouseDown={(event) => event.preventDefault()}
              onClick={button.run}
              className={cn(
                "flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-card hover:text-foreground disabled:pointer-events-none disabled:opacity-35",
                button.on && "bg-card text-primary shadow-soft",
              )}
            >
              <button.icon className="size-4" />
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Renders a sanitised listing description. The API stores only allowlisted
 * formatting (see backend App\Support\RichText), so this HTML is safe to render.
 */
export function RichTextContent({ html, className }: { html: string; className?: string }) {
  return <div className={cn("rich-text", className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
