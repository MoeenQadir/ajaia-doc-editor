"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Users,
  Search,
  Plus,
  Upload,
  ShieldCheck,
  FolderOpen,
  Sparkles,
  Loader2,
} from "lucide-react";
import { DocumentCard } from "@/components/DocumentCard";
import { useActiveUser } from "@/lib/user-context";
import { ImportModal } from "@/components/ImportModal";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const { currentUser, fetchWithUser } = useActiveUser();

  const [ownedDocs, setOwnedDocs] = useState<any[]>([]);
  const [sharedDocs, setSharedDocs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchWithUser("/api/documents");
      if (!res.ok) throw new Error("Failed to load documents");
      const data = await res.json();
      setOwnedDocs(data.owned || []);
      setSharedDocs(data.shared || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchWithUser]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments, currentUser.id]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetchWithUser(`/api/documents/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete document");
      }
      // Optimistic update
      setOwnedDocs((prev) => prev.filter((d) => d.id !== id));
    } catch (err: any) {
      alert(err.message || "Could not delete document");
    }
  };

  const handleCreateNew = async () => {
    try {
      setIsCreating(true);
      const res = await fetchWithUser("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Untitled Document",
          content: "<p></p>",
        }),
      });

      if (!res.ok) throw new Error("Failed to create document");
      const newDoc = await res.json();
      router.push(`/doc/${newDoc.id}`);
    } catch (err) {
      alert("Error creating new document");
    } finally {
      setIsCreating(false);
    }
  };

  // Filter documents by search query
  const filteredOwned = ownedDocs.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredShared = sharedDocs.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Welcome Banner */}
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-100 dark:border-indigo-900/50 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" />
            AI-Native Collaborative Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Welcome back, {currentUser.name}
          </h1>
          <p className="text-sm text-slate-600 dark:text-zinc-400 mt-1 max-w-xl leading-relaxed">
            Create, collaborate, and edit intelligent documents in real-time.
            Switch users in the top bar to test live permissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateNew}
            disabled={isCreating}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isCreating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            New Document
          </button>
          <button
            onClick={() => setIsImportOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 font-medium text-sm shadow-sm transition-colors"
          >
            <Upload className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
            Import (.docx, .md, .txt)
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-10">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by title..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 text-sm placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-44 rounded-xl bg-slate-200 dark:bg-zinc-800/60"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-12">
          {/* Section 1: Owned by Me */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
                  Owned by Me
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {filteredOwned.length}
                </span>
              </div>
            </div>

            {filteredOwned.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOwned.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    isOwned={true}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 dark:border-zinc-800 p-8 text-center bg-slate-50/50 dark:bg-zinc-900/40">
                <FolderOpen className="w-8 h-8 text-slate-400 dark:text-zinc-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                  {searchQuery
                    ? "No owned documents match your search."
                    : "No owned documents yet."}
                </p>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
                  Click &quot;New Document&quot; above to create your first document.
                </p>
              </div>
            )}
          </section>

          {/* Section 2: Shared with Me */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Users className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
                  Shared with Me
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {filteredShared.length}
                </span>
              </div>
            </div>

            {filteredShared.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredShared.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    isOwned={false}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 dark:border-zinc-800 p-8 text-center bg-slate-50/50 dark:bg-zinc-900/40">
                <Users className="w-8 h-8 text-slate-400 dark:text-zinc-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                  {searchQuery
                    ? "No shared documents match your search."
                    : "No documents shared with you yet."}
                </p>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
                  Switch to Alice in the user switcher to share documents with Bob.
                </p>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => {
          setIsImportOpen(false);
          fetchDocuments();
        }}
      />
    </div>
  );
}

