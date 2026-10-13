"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Share2,
  Check,
  Loader2,
  AlertTriangle,
  Shield,
  Users,
  Eye,
  History,
  MessageSquare,
} from "lucide-react";
import { TipTapEditor } from "@/components/Editor/TipTapEditor";
import { ShareModal } from "@/components/ShareModal";
import { ExportDropdown } from "@/components/ExportDropdown";
import { VersionHistoryModal } from "@/components/VersionHistoryModal";
import { CommentsSidebar } from "@/components/CommentsSidebar";
import { EditorFooter } from "@/components/Editor/EditorFooter";
import { KeyboardShortcutsModal } from "@/components/KeyboardShortcutsModal";
import { useActiveUser } from "@/lib/user-context";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { Keyboard } from "lucide-react";

type SaveStatus = "saved" | "saving" | "error";

export default function DocumentEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { fetchWithUser } = useActiveUser();
  const { toast } = useToast();

  const docId = params.id as string;

  const [document, setDocument] = useState<any>(null);
  const [access, setAccess] = useState<{
    role: "owner" | "shared" | "none";
    canEdit: boolean;
    canDelete: boolean;
    permission?: "edit" | "view";
  } | null>(null);

  const [title, setTitle] = useState("Untitled Document");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);

  // References for debounce timer and latest content
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const latestContentRef = useRef<string>("");

  // Fetch document details
  const fetchDoc = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const res = await fetchWithUser(`/api/documents/${docId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load document");
      }

      setDocument(data.document);
      setAccess(data.access);
      setTitle(data.document.title);
      latestContentRef.current = data.document.content;
      setLastSavedAt(new Date(data.document.updatedAt));
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [docId, fetchWithUser]);

  useEffect(() => {
    fetchDoc();
  }, [fetchDoc]);

  // Save changes to backend
  const saveDocumentChanges = async (updates: {
    title?: string;
    content?: string;
  }) => {
    if (!access?.canEdit) return;

    try {
      setSaveStatus("saving");
      const res = await fetchWithUser(`/api/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        throw new Error("Failed to save changes");
      }

      const data = await res.json();
      setDocument(data.document);
      setLastSavedAt(new Date(data.document.updatedAt));
      setSaveStatus("saved");
    } catch (err) {
      console.error("Auto-save error:", err);
      setSaveStatus("error");
    }
  };

  // Content change handler with 2-second debounced auto-save
  const handleContentChange = (newHtml: string) => {
    latestContentRef.current = newHtml;
    setSaveStatus("saving");

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      saveDocumentChanges({ content: latestContentRef.current });
    }, 2000);
  };

  // Title change blur/enter handler
  const handleTitleBlur = () => {
    if (document && title !== document.title) {
      saveDocumentChanges({ title });
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  // Clean up timer on unmount & register global shortcuts
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;

      if (isCmdOrCtrl && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveDocumentChanges({
          content: latestContentRef.current,
          title,
        });
        toast.success("Document saved to DB!");
      } else if (isCmdOrCtrl && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      } else if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        setIsCommentsOpen((prev) => !prev);
      } else if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === "h") {
        e.preventDefault();
        setIsHistoryModalOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleGlobalShortcuts);

    return () => {
      window.removeEventListener("keydown", handleGlobalShortcuts);
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [title]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
          Loading document...
        </p>
      </div>
    );
  }

  if (errorMessage || !document) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Unable to Open Document
        </h2>
        <p className="text-sm text-slate-600 dark:text-zinc-400 mb-6 leading-relaxed">
          {errorMessage || "Document could not be found or you do not have permission to view it."}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const isOwner = access?.role === "owner";
  const canEdit = access?.canEdit ?? false;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950 transition-colors">
      {/* Read-Only Mode Banner for Viewers */}
      {!canEdit && (
        <div className="w-full bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-900/60 px-4 py-2 flex items-center justify-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
          <Eye className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>👁️ Read-Only Mode (Shared with you as Viewer)</span>
        </div>
      )}

      {/* Document Sub-header */}
      <div className="sticky top-16 z-30 w-full border-b border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur px-3 sm:px-6 py-2 sm:py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Left: Back button & Title input */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 w-full sm:w-auto sm:flex-1 max-w-2xl">
          <Link
            href="/"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          {/* Editable Document Title */}
          <div className="min-w-0 flex-1">
            {canEdit ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                placeholder="Untitled Document"
                className="w-full text-sm sm:text-lg font-semibold text-slate-900 dark:text-zinc-100 bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-zinc-700 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-md px-1.5 sm:px-2 py-0.5 outline-none transition-colors truncate"
              />
            ) : (
              <h1 className="text-sm sm:text-lg font-semibold text-slate-900 dark:text-zinc-100 px-1.5 sm:px-2 py-0.5 truncate">
                {title}
              </h1>
            )}
          </div>

          {/* Mobile Auto-save status indicator */}
          <div className="flex sm:hidden items-center shrink-0 text-[11px]">
            {saveStatus === "saving" && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
            )}
            {saveStatus === "saved" && (
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            )}
            {saveStatus === "error" && (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            )}
          </div>
        </div>

        {/* Right: Live Auto-save status, permission badge, Share & Action buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto justify-between sm:justify-end shrink-0 text-xs">
          {/* Live Auto-save status indicator (desktop) */}
          <div className="hidden sm:flex items-center gap-1.5 font-medium">
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                Saved to Ajaia DB
              </span>
            )}
            {saveStatus === "error" && (
              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                Failed to save
              </span>
            )}
          </div>

          {/* Access / Role Badge */}
          {isOwner ? (
            <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] sm:text-xs shrink-0">
              <Shield className="w-3 h-3" />
              <span className="hidden xs:inline">Owner</span>
            </span>
          ) : canEdit ? (
            <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] sm:text-xs shrink-0">
              <Users className="w-3 h-3" />
              <span className="hidden xs:inline">Editor</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full font-medium bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 text-[11px] sm:text-xs shrink-0">
              <Eye className="w-3 h-3" />
              <span className="hidden xs:inline">Viewer</span>
            </span>
          )}

          {/* Export Dropdown */}
          <div className="shrink-0">
            <ExportDropdown
              title={title}
              getContentHtml={() => latestContentRef.current || document.content}
            />
          </div>

          {/* Version History Button */}
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 shrink-0"
            title="Version History"
            aria-label="Version History"
          >
            <History className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
            <span className="hidden sm:inline">History</span>
          </button>

          {/* Comments Sidebar Button */}
          <button
            onClick={() => setIsCommentsOpen(!isCommentsOpen)}
            className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 shrink-0 ${
              isCommentsOpen
                ? "bg-indigo-50 dark:bg-indigo-950/80 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-semibold"
                : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200"
            }`}
            title="Comments & Discussion"
            aria-label="Comments"
          >
            <MessageSquare className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
            <span className="hidden sm:inline">Comments</span>
            {commentsCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                {commentsCount}
              </span>
            )}
          </button>

          {/* Keyboard Shortcuts Trigger Button */}
          <button
            onClick={() => setIsShortcutsOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 shrink-0"
            title="Keyboard Shortcuts (Ctrl+K)"
            aria-label="Shortcuts"
          >
            <Keyboard className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
            <span className="hidden lg:inline">Shortcuts</span>
          </button>

          {/* Share Button (Available to owner) */}
          {isOwner && (
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 shrink-0 text-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          )}
        </div>
      </div>

      {/* Editor Canvas */}
      <div className="flex-1 flex flex-col">
        <TipTapEditor
          initialContent={document.content}
          editable={canEdit}
          documentTitle={title}
          onChange={handleContentChange}
        />
      </div>

      {/* Google Docs Style Footer & Word Count Status Bar */}
      <EditorFooter
        content={latestContentRef.current || document.content || ""}
        saveStatus={saveStatus}
        lastSavedAt={lastSavedAt}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Share Modal */}
      {isOwner && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          document={document}
          onShareSuccess={() => fetchDoc()}
        />
      )}

      {/* Version History Modal */}
      <VersionHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        documentId={docId}
        currentTitle={title}
        canEdit={canEdit}
        onVersionRestored={(restoredDoc) => {
          setDocument(restoredDoc);
          setTitle(restoredDoc.title);
          latestContentRef.current = restoredDoc.content;
          window.location.reload();
        }}
      />

      {/* Comments Sidebar */}
      <CommentsSidebar
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        documentId={docId}
        documentOwnerId={document.ownerId}
        onCommentsCountChange={(count) => setCommentsCount(count)}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}

