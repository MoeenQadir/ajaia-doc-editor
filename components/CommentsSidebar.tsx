"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  MessageSquare,
  Send,
  CheckCircle2,
  Trash2,
  Clock,
  Loader2,
  Check,
  User,
} from "lucide-react";
import { useActiveUser } from "@/lib/user-context";
import { formatDate } from "@/lib/utils";

import { useToast } from "@/components/ui/Toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { AnimatePresence, motion } from "framer-motion";

export interface CommentsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentOwnerId?: string;
  onCommentsCountChange?: (count: number) => void;
}

interface CommentItem {
  id: string;
  documentId: string;
  authorId: string;
  text: string;
  resolved: boolean;
  createdAt: string;
  author?: {
    id: string;
    name: string;
    email: string;
  };
}

export function CommentsSidebar({
  isOpen,
  onClose,
  documentId,
  documentOwnerId,
  onCommentsCountChange,
}: CommentsSidebarProps) {
  const { currentUser, fetchWithUser } = useActiveUser();
  const { toast } = useToast();

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newText, setNewText] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("open");
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [isDeletingComment, setIsDeletingComment] = useState(false);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await fetchWithUser(`/api/documents/${documentId}/comments`);
      if (!res.ok) throw new Error("Failed to load comments");
      const data = await res.json();
      setComments(data.comments || []);
      onCommentsCountChange?.((data.comments || []).filter((c: CommentItem) => !c.resolved).length);
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (documentId) {
      fetchComments();
    }
  }, [documentId]);

  if (!isOpen) return null;

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim() || posting) return;

    try {
      setPosting(true);
      const res = await fetchWithUser(`/api/documents/${documentId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newText.trim() }),
      });

      if (!res.ok) throw new Error("Failed to post comment");
      const data = await res.json();
      const updated = [...comments, data.comment];
      setComments(updated);
      setNewText("");
      toast.success("Comment added");
      onCommentsCountChange?.(updated.filter((c) => !c.resolved).length);
    } catch (err: any) {
      toast.error(err.message || "Could not post comment");
    } finally {
      setPosting(false);
    }
  };

  const handleToggleResolve = async (commentId: string, currentResolved: boolean) => {
    try {
      const res = await fetchWithUser(
        `/api/documents/${documentId}/comments/${commentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resolved: !currentResolved }),
        }
      );

      if (!res.ok) throw new Error("Failed to update status");
      const data = await res.json();

      const updated = comments.map((c) =>
        c.id === commentId ? data.comment : c
      );
      setComments(updated);
      toast.info(!currentResolved ? "Comment marked as resolved" : "Comment reopened");
      onCommentsCountChange?.(updated.filter((c) => !c.resolved).length);
    } catch (err: any) {
      toast.error(err.message || "Failed to update comment");
    }
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;

    try {
      setIsDeletingComment(true);
      const res = await fetchWithUser(
        `/api/documents/${documentId}/comments/${commentToDelete}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) throw new Error("Failed to delete comment");

      const updated = comments.filter((c) => c.id !== commentToDelete);
      setComments(updated);
      toast.success("Comment deleted");
      onCommentsCountChange?.(updated.filter((c) => !c.resolved).length);
      setCommentToDelete(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete comment");
    } finally {
      setIsDeletingComment(false);
    }
  };

  const filteredComments = comments.filter((c) => {
    if (filter === "open") return !c.resolved;
    if (filter === "resolved") return c.resolved;
    return true;
  });

  return (
    <>
      {/* Mobile backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 sm:hidden"
      />

      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col pt-16"
      >
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-white/95 dark:bg-zinc-900/95 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-zinc-100">
              Comments & Feedback
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500">
              Collaborative discussion
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-2 border-b border-slate-100 dark:border-zinc-800/80 flex items-center gap-1.5 text-xs bg-slate-50/50 dark:bg-zinc-950/30 shrink-0">
        <button
          onClick={() => setFilter("open")}
          className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
            filter === "open"
              ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/80 dark:border-zinc-700"
              : "text-slate-500 hover:text-slate-800 dark:text-zinc-400"
          }`}
        >
          Open ({comments.filter((c) => !c.resolved).length})
        </button>
        <button
          onClick={() => setFilter("resolved")}
          className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
            filter === "resolved"
              ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/80 dark:border-zinc-700"
              : "text-slate-500 hover:text-slate-800 dark:text-zinc-400"
          }`}
        >
          Resolved ({comments.filter((c) => c.resolved).length})
        </button>
        <button
          onClick={() => setFilter("all")}
          className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
            filter === "all"
              ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/80 dark:border-zinc-700"
              : "text-slate-500 hover:text-slate-800 dark:text-zinc-400"
          }`}
        >
          All ({comments.length})
        </button>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-indigo-600 dark:text-indigo-400" />
          </div>
        ) : filteredComments.length > 0 ? (
          filteredComments.map((comment) => {
            const isAuthor = comment.authorId === currentUser.id;
            const canDelete = isAuthor || documentOwnerId === currentUser.id;

            return (
              <div
                key={comment.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  comment.resolved
                    ? "bg-slate-50/80 dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-800/80 opacity-75"
                    : "bg-white dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700/80 shadow-xs"
                }`}
              >
                {/* Author row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-semibold text-[10px] flex items-center justify-center">
                      {comment.author?.name?.[0] || "U"}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-zinc-100 leading-none">
                        {comment.author?.name || comment.authorId}
                      </p>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                  </div>

                  {comment.resolved && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <Check className="w-3 h-3" />
                      Resolved
                    </span>
                  )}
                </div>

                {/* Text */}
                <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap mb-3">
                  {comment.text}
                </p>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800 text-xs">
                  <button
                    onClick={() => handleToggleResolve(comment.id, comment.resolved)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{comment.resolved ? "Reopen" : "Resolve"}</span>
                  </button>

                  {canDelete && (
                    <button
                      onClick={() => setCommentToDelete(comment.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete comment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-xs text-slate-400 dark:text-zinc-500">
            <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-40" />
            <p>
              {filter === "open"
                ? "No open comments."
                : filter === "resolved"
                ? "No resolved comments."
                : "No comments yet."}
            </p>
            <p className="mt-1">Use the box below to start a discussion.</p>
          </div>
        )}
      </div>

      {/* Post comment input box */}
      <form
        onSubmit={handlePostComment}
        className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 shrink-0"
      >
        <div className="relative">
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder={`Comment as ${currentUser.name.split(" ")[0]}...`}
            rows={3}
            className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={!newText.trim() || posting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
          >
            {posting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>Post Comment</span>
          </button>
        </div>
      </form>
    </motion.aside>

    {/* Confirm Delete Comment Modal */}
    <ConfirmModal
      isOpen={!!commentToDelete}
      title="Delete Comment"
      description="Are you sure you want to delete this comment? This action cannot be undone."
      confirmText="Yes, Delete Comment"
      cancelText="Cancel"
      variant="danger"
      isLoading={isDeletingComment}
      onConfirm={confirmDeleteComment}
      onClose={() => setCommentToDelete(null)}
    />
  </>
  );
}

