"use client";

import React, { useState, useRef, useEffect } from "react";
import { type Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Undo2,
  Redo2,
  Pilcrow,
  Sparkles,
  Loader2,
  ChevronDown,
  FileText,
  Wand2,
  ListTree,
} from "lucide-react";

import { useToast } from "@/components/ui/Toast";

export interface ToolbarProps {
  editor: Editor | null;
  disabled?: boolean;
  documentTitle?: string;
}

export function Toolbar({ editor, disabled, documentTitle }: ToolbarProps) {
  const { toast } = useToast();
  const [isAiDropdownOpen, setIsAiDropdownOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiActionActive, setAiActionActive] = useState<string | null>(null);
  const aiDropdownRef = useRef<HTMLDivElement>(null);

  // Close AI dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        aiDropdownRef.current &&
        !aiDropdownRef.current.contains(event.target as Node)
      ) {
        setIsAiDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!editor || disabled) return null;

  const buttonBase =
    "p-2 rounded-lg text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0";
  const activeStyle =
    "bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-semibold";

  const handleAiAction = async (action: "summarize" | "polish" | "expand") => {
    if (!editor || disabled) return;

    setIsAiDropdownOpen(false);
    setIsAiLoading(true);
    setAiActionActive(action);

    try {
      // Get selected text if any, or full text
      const { from, to, empty } = editor.state.selection;
      let selectedText = "";
      if (!empty) {
        selectedText = editor.state.doc.textBetween(from, to, " ");
      } else {
        selectedText = editor.getText();
      }

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          text: selectedText,
          title: documentTitle || "Untitled Document",
        }),
      });

      if (!res.ok) {
        throw new Error("AI request failed");
      }

      const data = await res.json();
      const generatedHtml = data.result;

      if (!generatedHtml) return;

      if (action === "polish" && !empty) {
        // Replace current selection with polished text
        editor.chain().focus().insertContent(generatedHtml).run();
      } else {
        // Append or insert at cursor
        editor.chain().focus().insertContent(generatedHtml).run();
      }
      toast.success(`AI ${action} completed!`);
    } catch (err: any) {
      console.error("AI Assistant error:", err);
      toast.error(err.message || "Failed to generate AI response. Please check connection.");
    } finally {
      setIsAiLoading(false);
      setAiActionActive(null);
    }
  };

  return (
    <div className="sticky top-[108px] sm:top-[116px] z-20 flex items-center justify-between gap-2 px-3 sm:px-6 py-2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border-b border-slate-200 dark:border-zinc-800 transition-colors">
      {/* Scrollable formatting actions */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5 min-w-0 flex-1 mr-2">
        {/* Paragraph / Normal text */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`${buttonBase} ${
            editor.isActive("paragraph") ? activeStyle : ""
          }`}
          title="Normal text"
          aria-label="Normal text"
        >
          <Pilcrow className="w-4 h-4" />
        </button>

        {/* Heading 1 */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`${buttonBase} ${
            editor.isActive("heading", { level: 1 }) ? activeStyle : ""
          }`}
          title="Heading 1"
          aria-label="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>

        {/* Heading 2 */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`${buttonBase} ${
            editor.isActive("heading", { level: 2 }) ? activeStyle : ""
          }`}
          title="Heading 2"
          aria-label="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-200 dark:bg-zinc-800 mx-1" />

        {/* Bold */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${buttonBase} ${editor.isActive("bold") ? activeStyle : ""}`}
          title="Bold (Ctrl+B)"
          aria-label="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>

        {/* Italic */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${buttonBase} ${
            editor.isActive("italic") ? activeStyle : ""
          }`}
          title="Italic (Ctrl+I)"
          aria-label="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>

        {/* Underline */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`${buttonBase} ${
            editor.isActive("underline") ? activeStyle : ""
          }`}
          title="Underline (Ctrl+U)"
          aria-label="Underline"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-200 dark:bg-zinc-800 mx-1" />

        {/* Bullet List */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${buttonBase} ${
            editor.isActive("bulletList") ? activeStyle : ""
          }`}
          title="Bullet list"
          aria-label="Bullet list"
        >
          <List className="w-4 h-4" />
        </button>

        {/* Numbered List */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`${buttonBase} ${
            editor.isActive("orderedList") ? activeStyle : ""
          }`}
          title="Numbered list"
          aria-label="Numbered list"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-200 dark:bg-zinc-800 mx-1" />

        {/* Undo */}
        <button
          type="button"
          disabled={disabled || !editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
          className={buttonBase}
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        {/* Redo */}
        <button
          type="button"
          disabled={disabled || !editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
          className={buttonBase}
          title="Redo (Ctrl+Y)"
          aria-label="Redo"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      {/* Right side: AI Assistant Dropdown */}
      <div className="relative shrink-0 z-30" ref={aiDropdownRef}>
        <button
          type="button"
          disabled={disabled || isAiLoading}
          onClick={(e) => {
            e.stopPropagation();
            setIsAiDropdownOpen((prev) => !prev);
          }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 hover:from-indigo-500/20 hover:to-pink-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
          title="AI Writing Assistant"
        >
          {isAiLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
              <span>Thinking...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>AI Assist</span>
              <ChevronDown className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
            </>
          )}
        </button>

        {/* AI Dropdown Menu */}
        {isAiDropdownOpen && (
          <div className="absolute right-0 mt-2 w-60 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-1 border-b border-slate-100 dark:border-zinc-800 mb-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                OpenRouter AI Actions
              </span>
            </div>

            <button
              onClick={() => handleAiAction("summarize")}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
              <div>
                <p className="font-medium">3-Bullet Summary</p>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                  Concise executive highlights
                </p>
              </div>
            </button>

            <button
              onClick={() => handleAiAction("polish")}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <Wand2 className="w-4 h-4 text-purple-500 shrink-0" />
              <div>
                <p className="font-medium">Polish Grammar & Tone</p>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                  Improve style and flow
                </p>
              </div>
            </button>

            <button
              onClick={() => handleAiAction("expand")}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <ListTree className="w-4 h-4 text-pink-500 shrink-0" />
              <div>
                <p className="font-medium">Expand Section Outline</p>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                  Generate structured sections
                </p>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
