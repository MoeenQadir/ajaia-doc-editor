"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  History,
  Clock,
  RotateCcw,
  Check,
  AlertCircle,
  Loader2,
  FileText,
  Plus,
} from "lucide-react";
import { useActiveUser } from "@/lib/user-context";
import { formatDate } from "@/lib/utils";

export interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  currentTitle: string;
  canEdit: boolean;
  onVersionRestored: (restoredDoc: any) => void;
}

interface VersionItem {
  id: string;
  documentId: string;
  title: string;
  content: string;
  savedAt: string;
}

export function VersionHistoryModal({
  isOpen,
  onClose,
  documentId,
  currentTitle,
  canEdit,
  onVersionRestored,
}: VersionHistoryModalProps) {
  const { fetchWithUser } = useActiveUser();

  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<VersionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [creatingSnapshot, setCreatingSnapshot] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await fetchWithUser(`/api/documents/${documentId}/versions`);
      if (!res.ok) throw new Error("Failed to load versions");
      const data = await res.json();
      setVersions(data.versions || []);
      if (data.versions && data.versions.length > 0) {
        setSelectedVersion(data.versions[0]);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Could not fetch version history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchVersions();
    }
  }, [isOpen, documentId]);

  if (!isOpen) return null;

  const handleCreateManualSnapshot = async () => {
    try {
      setCreatingSnapshot(true);
      setErrorMessage(null);
      const res = await fetchWithUser(`/api/documents/${documentId}/versions`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to create checkpoint");
      await fetchVersions();
      setStatusMessage("Snapshot checkpoint created!");
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create checkpoint");
    } finally {
      setCreatingSnapshot(false);
    }
  };

  const handleRestoreVersion = async (version: VersionItem) => {
    if (!canEdit) return;
    if (
      !confirm(
        `Are you sure you want to restore the version from ${formatDate(
          version.savedAt
        )}? Active content will be overwritten.`
      )
    ) {
      return;
    }

    try {
      setRestoring(true);
      setErrorMessage(null);
      const res = await fetchWithUser(
        `/api/documents/${documentId}/versions/${version.id}/restore`,
        {
          method: "POST",
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to restore version");

      setStatusMessage("Version restored successfully!");
      onVersionRestored(data.document);
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: any) {
      setErrorMessage(err.message || "Could not restore version");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl h-[85vh] rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col text-slate-900 dark:text-zinc-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-white/95 dark:bg-zinc-900/95">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-900 dark:text-zinc-100">
                Version History
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {currentTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                onClick={handleCreateManualSnapshot}
                disabled={creatingSnapshot}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
              >
                {creatingSnapshot ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>Save Checkpoint</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {statusMessage && (
          <div className="px-6 py-2 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="px-6 py-2 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-800 text-xs font-medium text-rose-800 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Versions list */}
          <div className="w-80 border-r border-slate-200 dark:border-zinc-800 overflow-y-auto p-3 space-y-2 bg-slate-50/50 dark:bg-zinc-950/40 shrink-0">
            <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-2 block mb-1">
              Snapshots ({versions.length})
            </span>

            {loading ? (
              <div className="p-6 text-center">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-indigo-600 dark:text-indigo-400" />
              </div>
            ) : versions.length > 0 ? (
              versions.map((ver, idx) => {
                const isSelected = selectedVersion?.id === ver.id;
                return (
                  <button
                    key={ver.id}
                    onClick={() => setSelectedVersion(ver)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? "bg-white dark:bg-zinc-800 border-indigo-400 dark:border-indigo-600 shadow-sm"
                        : "bg-white/60 dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-200">
                        <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate">
                          {formatDate(ver.savedAt)}
                        </span>
                      </div>
                      {idx === 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                          Latest
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">
                      {ver.title || "Untitled Document"}
                    </p>
                  </button>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 dark:text-zinc-500">
                <FileText className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p>No historical versions recorded yet.</p>
                <p className="mt-1">
                  Versions are captured automatically as you edit.
                </p>
              </div>
            )}
          </div>

          {/* Right: Version Preview & Restore Pane */}
          <div className="flex-1 flex flex-col bg-white dark:bg-zinc-900 overflow-hidden">
            {selectedVersion ? (
              <>
                {/* Preview Toolbar */}
                <div className="px-6 py-3 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-800/20 shrink-0">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 truncate">
                      {selectedVersion.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Saved on {formatDate(selectedVersion.savedAt)}
                    </p>
                  </div>

                  {canEdit && (
                    <button
                      onClick={() => handleRestoreVersion(selectedVersion)}
                      disabled={restoring}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
                    >
                      {restoring ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="w-3.5 h-3.5" />
                      )}
                      <span>Restore this Version</span>
                    </button>
                  )}
                </div>

                {/* Preview Paper Canvas */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30 dark:bg-zinc-950/30 flex justify-center">
                  <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md p-8 shadow-sm h-fit">
                    <div
                      className="prose prose-slate dark:prose-invert max-w-none text-slate-900 dark:text-zinc-100"
                      dangerouslySetInnerHTML={{
                        __html: selectedVersion.content || "<p>Empty document</p>",
                      }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-400 dark:text-zinc-500">
                Select a version on the left to preview.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

