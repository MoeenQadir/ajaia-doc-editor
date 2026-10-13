"use client";

import React from "react";
import { Check, Loader2, AlertTriangle, Database, Clock, Keyboard } from "lucide-react";
import { formatDate } from "@/lib/utils";

export interface EditorFooterProps {
  content: string;
  saveStatus: "saving" | "saved" | "error";
  lastSavedAt: Date | null;
  onOpenShortcuts?: () => void;
}

export function EditorFooter({
  content,
  saveStatus,
  lastSavedAt,
  onOpenShortcuts,
}: EditorFooterProps) {
  // Strip HTML tags for accurate word & character calculation
  const plainText = content.replace(/<[^>]*>?/gm, " ").trim();
  const wordCount = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
  const characterCount = plainText.length;
  const readingTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="sticky bottom-0 z-30 w-full border-t border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-zinc-400 select-none transition-colors">
      {/* Left: Live Statistics */}
      <div className="flex items-center gap-3 sm:gap-5 flex-wrap">
        <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-zinc-300">
          <span>{wordCount.toLocaleString()} words</span>
          <span className="text-slate-300 dark:text-zinc-700">&middot;</span>
          <span>{characterCount.toLocaleString()} characters</span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-slate-400 dark:text-zinc-500">
          <Clock className="w-3.5 h-3.5" />
          <span>~{readingTimeMin} min read</span>
        </div>
      </div>

      {/* Right: DB & Auto-Save Pulse Indicator + Shortcuts Link */}
      <div className="flex items-center gap-3 sm:gap-4 ml-auto">
        {onOpenShortcuts && (
          <button
            onClick={onOpenShortcuts}
            className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 transition-colors"
            title="View Keyboard Shortcuts (Ctrl + K)"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span className="text-[11px] font-mono">Shortcuts (Ctrl+K)</span>
          </button>
        )}

        {/* Database Connection & Save State */}
        <div className="flex items-center gap-1.5 pl-2 sm:border-l border-slate-200 dark:border-zinc-800">
          <div className="flex items-center gap-1.5">
            {saveStatus === "saving" && (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Syncing edits...
                </span>
              </>
            )}

            {saveStatus === "saved" && (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <Database className="w-3 h-3 text-emerald-500" />
                  <span>
                    Saved {lastSavedAt ? `(${lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : "to DB"}
                  </span>
                </span>
              </>
            )}

            {saveStatus === "error" && (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                </span>
                <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                  <AlertTriangle className="w-3 h-3" />
                  Offline / Save Error
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
