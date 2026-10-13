"use client";

import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Toolbar } from "./Toolbar";

export interface TipTapEditorProps {
  initialContent: string;
  editable: boolean;
  documentTitle?: string;
  onChange: (html: string) => void;
}

export function TipTapEditor({
  initialContent,
  editable,
  documentTitle,
  onChange,
}: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
    ],
    content: initialContent || "<p></p>",
    editable: editable,
    editorProps: {
      attributes: {
        class:
          "prose prose-slate dark:prose-invert max-w-none focus:outline-none min-h-[750px] px-8 sm:px-14 py-12 text-slate-900 dark:text-zinc-100 leading-relaxed font-sans",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Keep editor editable state in sync
  useEffect(() => {
    if (editor && editor.isEditable !== editable) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  // Keep content synced if initialContent arrives later
  useEffect(() => {
    if (editor && initialContent && editor.isEmpty) {
      editor.commands.setContent(initialContent);
    }
  }, [initialContent, editor]);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Formatting Toolbar */}
      <div className="w-full">
        <Toolbar editor={editor} disabled={!editable} documentTitle={documentTitle} />
      </div>

      {/* Centered Google Docs-style Paper Sheet */}
      <main className="w-full max-w-4xl px-4 sm:px-6 py-8 flex justify-center">
        <div className="w-full bg-white dark:bg-zinc-900 shadow-md dark:shadow-2xl border border-slate-200 dark:border-zinc-800 rounded-sm sm:rounded-md transition-colors min-h-[850px]">
          <EditorContent editor={editor} />
        </div>
      </main>
    </div>
  );
}

