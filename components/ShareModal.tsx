"use client";

import React, { useState } from "react";
import { X, Users, Shield, Check, UserPlus, AlertCircle } from "lucide-react";
import { useActiveUser } from "@/lib/user-context";
import { MOCK_USERS } from "@/lib/permissions";

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: string;
    title: string;
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
  onShareSuccess?: () => void;
}

export function ShareModal({
  isOpen,
  onClose,
  document,
  onShareSuccess,
}: ShareModalProps) {
  const { fetchWithUser } = useActiveUser();

  // Pick default user not equal to owner
  const availableUsers = MOCK_USERS.filter(
    (u) => u.id !== document.owner?.id
  );

  const [selectedUserId, setSelectedUserId] = useState<string>(
    availableUsers[0]?.id || ""
  );
  const [permission, setPermission] = useState<"edit" | "view">("edit");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetchWithUser(`/api/documents/${document.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: selectedUserId,
          permission,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to share document");
      }

      const targetUserName =
        MOCK_USERS.find((u) => u.id === selectedUserId)?.name || "user";
      setSuccessMessage(`Successfully shared with ${targetUserName}!`);
      onShareSuccess?.();
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl p-6 text-slate-900 dark:text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-900 dark:text-zinc-100">
                Share Document
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 truncate max-w-[240px]">
                {document.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Alerts */}
        {successMessage && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-300">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-medium text-rose-800 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* People with access */}
        <div className="mb-5 space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            People with access
          </label>

          {/* Owner item */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-medium flex items-center justify-center text-xs">
                {document.owner?.name?.[0] || "O"}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-zinc-200">
                  {document.owner?.name || "Owner"}
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {document.owner?.email || ""}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              <Shield className="w-3 h-3" />
              Owner
            </span>
          </div>

          {/* Collaborators */}
          {document.shares && document.shares.length > 0 ? (
            document.shares.map((share) => (
              <div
                key={share.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-medium flex items-center justify-center text-xs">
                    {share.user?.name?.[0] || "C"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-zinc-200">
                      {share.user?.name || share.userId}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      {share.user?.email || ""}
                    </p>
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  Can {share.permission}
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 dark:text-zinc-500 italic px-1">
              No collaborators yet. Add someone below to start working together.
            </p>
          )}
        </div>

        {/* Share with new user */}
        <form onSubmit={handleShare} className="space-y-4 pt-3 border-t border-slate-100 dark:border-zinc-800">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            Share with user
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-2">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value as "edit" | "view")}
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="edit">Can Edit</option>
                <option value="view">Can View</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedUserId}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-50 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              {loading ? "Sharing..." : "Grant Access"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

