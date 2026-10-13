"use client";

import React, { useState, useRef, useEffect } from "react";
import { Download, ChevronDown, FileDown, Printer, FileText } from "lucide-react";
import { htmlToMarkdown, downloadFile } from "@/lib/exportUtils";

export interface ExportDropdownProps {
  title: string;
  getContentHtml: () => string;
}

export function ExportDropdown({ title, getContentHtml }: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExportMarkdown = () => {
    setIsOpen(false);
    const html = getContentHtml();
    const markdown = htmlToMarkdown(html);
    const sanitizedTitle = (title || "Untitled Document").replace(/[^a-z0-9_-]/gi, "_");
    downloadFile(markdown, `${sanitizedTitle}.md`, "text/markdown");
  };

  const handleExportPdf = () => {
    setIsOpen(false);
    // Trigger clean browser print view configured for PDF export via @media print
    window.print();
  };

  return (
    <div className={`relative ${isOpen ? "z-50" : "z-20"}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
        title="Export Document"
        aria-label="Export Document"
      >
        <Download className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
        <span>Export</span>
        <ChevronDown className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1 border-b border-slate-100 dark:border-zinc-800 mb-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
              Document Formats
            </span>
          </div>

          <button
            onClick={handleExportMarkdown}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
            <div>
              <p className="font-medium">Markdown (.md)</p>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                Formatted markdown text
              </p>
            </div>
          </button>

          <button
            onClick={handleExportPdf}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <Printer className="w-4 h-4 text-emerald-500 shrink-0" />
            <div>
              <p className="font-medium">PDF Document (.pdf)</p>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                Print or save as PDF
              </p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

