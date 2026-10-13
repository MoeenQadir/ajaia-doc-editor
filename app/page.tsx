"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
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
  Calendar,
  Layers,
  FileCode,
} from "lucide-react";
import { DocumentCard } from "@/components/DocumentCard";
import { useActiveUser } from "@/lib/user-context";
import { ImportModal } from "@/components/ImportModal";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const TEMPLATES = [
  {
    id: "blank",
    title: "Blank Document",
    desc: "Start with a clean sheet",
    icon: Plus,
    color: "from-indigo-500/10 to-violet-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
    initialContent: "<p></p>",
    defaultTitle: "Untitled Document",
  },
  {
    id: "prd",
    title: "Product PRD",
    desc: "Overview, Personas & User Stories",
    icon: Layers,
    color: "from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    defaultTitle: "Product Requirement Document (PRD)",
    initialContent: `<h1>Product Requirement Document (PRD)</h1><p><strong>Status:</strong> Draft &middot; <strong>Author:</strong> Team Lead &middot; <strong>Target Release:</strong> Q3</p><h2>1. Executive Summary & Objective</h2><p>Briefly describe the product vision, core customer problem, and business value.</p><h2>2. Target Audience & User Personas</h2><ul><li><strong>Primary User:</strong> Power users looking for fast collaborative note taking.</li><li><strong>Secondary User:</strong> Team managers reviewing specifications.</li></ul><h2>3. User Stories & Functional Requirements</h2><ul><li>As a user, I want instant auto-saving so that no edits are lost.</li><li>As a team member, I want to comment on sections directly.</li></ul><h2>4. Technical Architecture & Constraints</h2><p>Overview of system boundaries, database schemas, and API design.</p>`,
  },
  {
    id: "meeting",
    title: "Meeting Notes",
    desc: "Attendees, Agenda & Action Items",
    icon: Calendar,
    color: "from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    defaultTitle: "Weekly Engineering Sync",
    initialContent: `<h1>Weekly Engineering Sync</h1><p><strong>Date:</strong> Today &middot; <strong>Attendees:</strong> Alice, Bob, Engineering Team</p><h2>Agenda</h2><ul><li>Sprint velocity and progress review</li><li>Blockers & architecture discussions</li><li>Upcoming milestone deliverables</li></ul><h2>Key Discussion Points</h2><p>Document decisions, architectural tradeoffs, and feedback here.</p><h2>Action Items</h2><ul><li>[ ] Finalize API specifications for v1 launch</li><li>[ ] Complete automated integration testing suite</li><li>[ ] Deploy staging environment for feedback</li></ul>`,
  },
  {
    id: "architecture",
    title: "Architecture Spec",
    desc: "Topology, Schemas & API Endpoints",
    icon: FileCode,
    color: "from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    defaultTitle: "System Architecture Specification",
    initialContent: `<h1>System Architecture Specification</h1><p><strong>System:</strong> Ajaia Docs Engine &middot; <strong>Version:</strong> 2.0-Alpha</p><h2>1. High-Level Architecture Overview</h2><p>Describes client-server topology, data persistence, and edge caching.</p><h2>2. Data Models & Entity Relationships</h2><ul><li><strong>User:</strong> Multi-tenant identity model.</li><li><strong>Document:</strong> Document body with revision tracking.</li><li><strong>DocShare:</strong> Role-based access control (View/Edit).</li></ul><h2>3. API Endpoints & Interfaces</h2><ul><li><code>GET /api/documents</code> - Fetch documents</li><li><code>POST /api/documents</code> - Create new record</li><li><code>PATCH /api/documents/:id</code> - Auto-save debounced snapshot</li></ul><h2>4. Non-Functional Requirements & Security</h2><p>Outlines SLA, latency targets, and role permissions.</p>`,
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { currentUser, fetchWithUser } = useActiveUser();
  const { toast } = useToast();

  const [ownedDocs, setOwnedDocs] = useState<any[]>([]);
  const [sharedDocs, setSharedDocs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [docToDelete, setDocToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      toast.error("Could not fetch documents. Check database connection.");
    } finally {
      setLoading(false);
    }
  }, [fetchWithUser, toast]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments, currentUser.id]);

  const confirmDeleteAction = async () => {
    if (!docToDelete) return;
    try {
      setIsDeleting(true);
      const res = await fetchWithUser(`/api/documents/${docToDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete document");
      }
      setOwnedDocs((prev) => prev.filter((d) => d.id !== docToDelete.id));
      toast.success(`"${docToDelete.title}" was deleted.`);
      setDocToDelete(null);
    } catch (err: any) {
      toast.error(err.message || "Could not delete document");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateNew = async (templateTitle?: string, initialContent?: string) => {
    try {
      setIsCreating(true);
      const res = await fetchWithUser("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: templateTitle || "Untitled Document",
          content: initialContent || "<p></p>",
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to create document");
      }
      const newDoc = await res.json();
      toast.success("New document created!");
      router.push(`/doc/${newDoc.id}`);
    } catch (err: any) {
      toast.error(err.message || "Error creating new document");
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
            onClick={() => handleCreateNew()}
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

      {/* Quick Starter Templates Gallery */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            Start a New Document
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {TEMPLATES.map((tmpl) => {
            const Icon = tmpl.icon;
            return (
              <motion.button
                key={tmpl.id}
                whileHover={{ y: -3, transition: { duration: 0.15 } }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleCreateNew(tmpl.defaultTitle, tmpl.initialContent)}
                disabled={isCreating}
                className="flex flex-col text-left p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-indigo-500 group relative overflow-hidden"
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tmpl.color} border flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {tmpl.title}
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5 line-clamp-1">
                  {tmpl.desc}
                </p>
              </motion.button>
            );
          })}
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
                    onDelete={(id) => setDocToDelete({ id, title: doc.title })}
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
                  Click a template above to start your first document.
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!docToDelete}
        title="Delete Document"
        description={`Are you sure you want to permanently delete "${docToDelete?.title || "this document"}"? This action cannot be undone.`}
        confirmText="Yes, Delete Document"
        cancelText="Keep Document"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={confirmDeleteAction}
        onClose={() => setDocToDelete(null)}
      />

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

