"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Plus,
  Upload,
  User,
  Check,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { ImportModal } from "./ImportModal";
import { useActiveUser } from "@/lib/user-context";
import { MOCK_USERS } from "@/lib/permissions";

export function Navbar() {
  const router = useRouter();
  const { currentUser, switchUser, fetchWithUser } = useActiveUser();
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreateDocument = async () => {
    try {
      setIsCreatingDoc(true);
      const res = await fetchWithUser("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Untitled Document",
          content: "<p></p>",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create document");
      }

      const newDoc = await res.json();
      router.push(`/doc/${newDoc.id}`);
    } catch (err) {
      console.error("Error creating document:", err);
      alert("Could not create new document. Please try again.");
    } finally {
      setIsCreatingDoc(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-zinc-900/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand & Identity */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 group transition-transform"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center shadow-sm">
                <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 group-hover:rotate-12 transition-transform" />
              </div>
              <div className="flex items-center tracking-tight">
                <span className="text-slate-900 dark:text-white font-bold text-lg">
                  Ajaia
                </span>
                <span className="text-indigo-600 dark:text-indigo-400 font-medium text-lg ml-1">
                  Docs
                </span>
              </div>
            </Link>

            {/* Sub-badge */}
            <span className="hidden sm:inline-flex bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs px-2.5 py-0.5 rounded-full font-mono font-medium">
              AI-Native Prototype
            </span>
          </div>

          {/* Actions & User Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* New Document Button */}
            <button
              onClick={handleCreateDocument}
              disabled={isCreatingDoc}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isCreatingDoc ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>New Doc</span>
            </button>

            {/* Import File Button */}
            <button
              onClick={() => setIsImportOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <Upload className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
              <span className="hidden sm:inline">Import</span>
            </button>

            {/* User Switcher Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shadow-sm text-xs sm:text-sm"
                aria-label="Active user switcher"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-semibold text-xs flex items-center justify-center">
                  {currentUser.avatar}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="font-medium text-slate-800 dark:text-zinc-200 leading-tight">
                    {currentUser.name}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
              </button>

              {/* Dropdown Menu */}
              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 border-b border-slate-100 dark:border-zinc-800 mb-1">
                    <p className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                      Switch Active User (Simulation)
                    </p>
                  </div>

                  {MOCK_USERS.map((user) => {
                    const isActive = user.id === currentUser.id;
                    return (
                      <button
                        key={user.id}
                        onClick={() => {
                          switchUser(user.id);
                          setIsUserDropdownOpen(false);
                          // Reload or notify so views refresh active user's permissions
                          window.location.reload();
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors ${
                          isActive
                            ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200"
                            : "hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold flex items-center justify-center text-xs">
                            {user.avatar}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 dark:text-zinc-200">
                              {user.name}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                              {user.email}
                            </p>
                          </div>
                        </div>

                        {isActive && (
                          <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Import File Modal */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
      />
    </>
  );
}

