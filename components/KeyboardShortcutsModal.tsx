"use client";

import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Keyboard, X, Sparkles, Command } from "lucide-react";

export interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUT_GROUPS = [
  {
    category: "Document & Actions",
    shortcuts: [
      { keys: ["Ctrl", "S"], desc: "Save document snapshot instantly" },
      { keys: ["Ctrl", "K"], desc: "Open keyboard shortcuts menu" },
      { keys: ["Ctrl", "P"], desc: "Export document as PDF / Print" },
    ],
  },
  {
    category: "Rich Text Formatting",
    shortcuts: [
      { keys: ["Ctrl", "B"], desc: "Toggle Bold" },
      { keys: ["Ctrl", "I"], desc: "Toggle Italic" },
      { keys: ["Ctrl", "U"], desc: "Toggle Underline" },
      { keys: ["Ctrl", "Z"], desc: "Undo last edit" },
      { keys: ["Ctrl", "Y"], desc: "Redo undone edit" },
    ],
  },
  {
    category: "Collaboration & AI",
    shortcuts: [
      { keys: ["Ctrl", "Shift", "C"], desc: "Toggle Comments sidebar" },
      { keys: ["Ctrl", "Shift", "H"], desc: "Open Version History" },
      { keys: ["Ctrl", "Shift", "A"], desc: "Trigger AI Writing Assistant" },
    ],
  },
];

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: KeyboardShortcutsModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 shadow-2xl z-10 text-slate-900 dark:text-zinc-100 max-h-[85vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Keyboard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-zinc-100">
                  Keyboard Shortcuts
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Quick keys for productive editing
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Groups */}
          <div className="space-y-6">
            {SHORTCUT_GROUPS.map((group) => (
              <div key={group.category}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2.5">
                  {group.category}
                </h4>
                <div className="space-y-2">
                  {group.shortcuts.map((sc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <span className="text-slate-700 dark:text-zinc-300 font-medium">
                        {sc.desc}
                      </span>
                      <div className="flex items-center gap-1">
                        {sc.keys.map((k, kIdx) => (
                          <kbd
                            key={kIdx}
                            className="px-2 py-0.5 rounded-md border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 text-[11px] font-mono text-slate-800 dark:text-zinc-200 shadow-xs"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800 text-center text-xs text-slate-400 dark:text-zinc-500">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 font-mono text-[10px]">Esc</kbd> to close
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

