"use client";

import React, { useState } from "react";
import { BubbleMenu as TipTapBubbleMenu, type Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  Wand2,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export interface EditorBubbleMenuProps {
  editor: Editor | null;
  disabled?: boolean;
}

export function EditorBubbleMenu({ editor, disabled }: EditorBubbleMenuProps) {
  const { toast } = useToast();
  const [isPolishing, setIsPolishing] = useState(false);

  if (!editor || disabled) return null;

  const handlePolishSelection = async () => {
    const { from, to, empty } = editor.state.selection;
    if (empty) return;

    const selectedText = editor.state.doc.textBetween(from, to, " ");
    if (!selectedText.trim()) return;

    try {
      setIsPolishing(true);
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "polish",
          text: selectedText,
        }),
      });

      if (!res.ok) throw new Error("AI polish request failed");
      const data = await res.json();
      if (data.result) {
        editor.chain().focus().insertContent(data.result).run();
        toast.success("Selection polished with AI!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to polish text");
    } finally {
      setIsPolishing(false);
    }
  };

  const btnClass = (active: boolean) =>
    `p-1.5 rounded-md text-xs transition-colors flex items-center justify-center ${
      active
        ? "bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-semibold"
        : "text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
    }`;

  return (
    <TipTapBubbleMenu
      editor={editor}
      tippyOptions={{ duration: 150, placement: "top" }}
      className="flex items-center gap-0.5 p-1 rounded-xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-slate-200 dark:border-zinc-800 shadow-xl z-40 text-slate-900 dark:text-zinc-100 animate-in fade-in zoom-in-95"
    >
      {/* Bold */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={btnClass(editor.isActive("bold"))}
        title="Bold (Ctrl+B)"
        aria-label="Bold"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>

      {/* Italic */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={btnClass(editor.isActive("italic"))}
        title="Italic (Ctrl+I)"
        aria-label="Italic"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>

      {/* Underline */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={btnClass(editor.isActive("underline"))}
        title="Underline (Ctrl+U)"
        aria-label="Underline"
      >
        <UnderlineIcon className="w-3.5 h-3.5" />
      </button>

      {/* Heading 2 */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={btnClass(editor.isActive("heading", { level: 2 }))}
        title="Heading"
        aria-label="Heading"
      >
        <Heading2 className="w-3.5 h-3.5" />
      </button>

      <div className="w-px h-4 bg-slate-200 dark:bg-zinc-800 mx-1" />

      {/* Polish with AI Button */}
      <button
        type="button"
        disabled={isPolishing}
        onClick={handlePolishSelection}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors disabled:opacity-50"
        title="Polish selection with AI"
      >
        {isPolishing ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Wand2 className="w-3 h-3" />
        )}
        <span>Polish</span>
      </button>
    </TipTapBubbleMenu>
  );
}

