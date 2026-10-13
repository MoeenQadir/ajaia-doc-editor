"use client";

import React from "react";
import Link from "next/link";
import { FileText, Trash2, Clock, Users, ShieldCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";

export interface DocumentCardProps {
  document: {
    id: string;
    title: string;
    content: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    owner?: {
      id: string;
      name: string;
      email: string;
    };
    shares?: Array<{
      id: string;
      userId: string;
      permission: string;
      user?: {
        id: string;
        name: string;
        email: string;
      };
    }>;
  };
  isOwned: boolean;
  onDelete?: (id: string) => void;
}

export function DocumentCard({ document, isOwned, onDelete }: DocumentCardProps) {
  // Strip HTML for brief preview
  const plainText = document.content
    ? document.content.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim()
    : "No content yet. Click to start editing.";

  const previewSnippet =
    plainText.length > 120 ? plainText.slice(0, 120) + "..." : plainText;

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(document.id);
  };

  const shareCount = document.shares?.length ?? 0;

  return (
    <Link
      href={`/doc/${document.id}`}
      className="group block relative rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all duration-200 overflow-hidden flex flex-col justify-between"
    >
      <div className="p-5">
        {/* Top bar with icon and badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5" />
          </div>

          <div className="flex items-center gap-1.5">
            {isOwned ? (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                <ShieldCheck className="w-3 h-3" />
                Owned
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <Users className="w-3 h-3" />
                Shared
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-slate-900 dark:text-zinc-100 text-base mb-1.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
          {document.title || "Untitled Document"}
        </h3>

        {/* Text snippet preview */}
        <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-4">
          {previewSnippet}
        </p>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/50 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
        <div className="flex items-center gap-1.5 truncate">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{formatDate(document.updatedAt)}</span>
        </div>

        <div className="flex items-center gap-2">
          {!isOwned && document.owner && (
            <span className="truncate text-slate-600 dark:text-zinc-300 font-medium">
              Owned by {document.owner.name.split(" ")[0]}
            </span>
          )}

          {isOwned && shareCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400">
              <Users className="w-3 h-3" />
              {shareCount}
            </span>
          )}

          {isOwned && (
            <button
              onClick={handleDelete}
              className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Delete document"
              aria-label="Delete document"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

