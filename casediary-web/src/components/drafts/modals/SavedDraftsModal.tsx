"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Trash2,
  Copy,
  ExternalLink,
  Clock,
  User,
  Scale,
  RefreshCw,
  X,
  AlertCircle,
} from "lucide-react";

export interface SavedDraftItem {
  id: string;
  title: string;
  template_type: string;
  case_id?: number | null;
  case_title?: string | null;
  client_name?: string | null;
  case_number?: string | null;
  author_name?: string | null;
  author_role?: string | null;
  chamber_id?: string | null;
  html_content?: string | null;
  updated_at: string;
  created_at: string;
}

export interface SavedDraftsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadDraft: (draft: SavedDraftItem) => void;
  currentDraftId?: string;
}

export const SavedDraftsModal: React.FC<SavedDraftsModalProps> = ({
  isOpen,
  onClose,
  onLoadDraft,
  currentDraftId,
}) => {
  const [drafts, setDrafts] = useState<SavedDraftItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchDrafts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/drafts?is_template=0");
      const data = await res.json();
      if (data.success && data.drafts) {
        setDrafts(data.drafts);
      }
    } catch (err) {
      console.error("Error fetching drafts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDrafts();
    }
  }, [isOpen]);

  const handleDeleteDraft = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to permanently delete this saved draft?")) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/drafts?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setDrafts((prev) => prev.filter((d) => d.id !== id));
        setStatusMsg("Draft deleted successfully");
        setTimeout(() => setStatusMsg(null), 3000);
      } else {
        alert("Failed to delete draft: " + data.error);
      }
    } catch (err) {
      console.error("Delete draft error:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicateDraft = async (draft: SavedDraftItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${draft.title} (Copy)`,
          template_type: draft.template_type,
          case_id: draft.case_id,
          case_title: draft.case_title,
          client_name: draft.client_name,
          case_number: draft.case_number,
          html_content: draft.html_content,
          author_name: draft.author_name,
          author_role: draft.author_role,
          chamber_id: draft.chamber_id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg(`Duplicated "${draft.title}"`);
        setTimeout(() => setStatusMsg(null), 3000);
        fetchDrafts();
      }
    } catch (err) {
      console.error("Duplicate draft error:", err);
    }
  };

  if (!isOpen) return null;

  const filteredDrafts = drafts.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.title.toLowerCase().includes(q) ||
      (d.case_title && d.case_title.toLowerCase().includes(q)) ||
      (d.client_name && d.client_name.toLowerCase().includes(q)) ||
      (d.case_number && d.case_number.toLowerCase().includes(q)) ||
      (d.template_type && d.template_type.toLowerCase().includes(q))
    );
  });

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Chamber Drafts & Saved Petitions</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 font-mono">
                  {drafts.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Resume, manage, and audit case drafts saved by your chamber advocates.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchDrafts}
              disabled={loading}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 transition-colors"
              title="Refresh Drafts"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Status Bar */}
        <div className="p-3 border-b border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by draft title, client, CNR number, or case..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          {statusMsg && (
            <div className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 animate-fade-in">
              {statusMsg}
            </div>
          )}
        </div>

        {/* Drafts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
              <span>Loading chamber drafts from database...</span>
            </div>
          ) : filteredDrafts.length === 0 ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400">
                <FileText className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                {searchQuery ? "No drafts match your search query." : "No saved drafts found."}
              </div>
              <div className="text-xs text-slate-400 max-w-sm">
                Click <b>Save Draft</b> in the editor toolbar while drafting any petition or notice to save it into your chamber vault.
              </div>
            </div>
          ) : (
            filteredDrafts.map((d) => {
              const isCurrent = d.id === currentDraftId;
              const dateStr = new Date(d.updated_at).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={d.id}
                  onClick={() => onLoadDraft(d)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 group ${
                    isCurrent
                      ? "bg-amber-50/70 dark:bg-amber-950/30 border-amber-400 dark:border-amber-700/60 ring-1 ring-amber-400/40"
                      : "bg-white dark:bg-zinc-900/90 border-slate-200 dark:border-zinc-800 hover:border-amber-300 dark:hover:border-zinc-700 hover:shadow-sm"
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {d.title}
                      </span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-bold">
                          Active
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-[10.5px] font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        {d.template_type}
                      </span>
                    </div>

                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      {d.client_name && (
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>Client: <b>{d.client_name}</b></span>
                        </span>
                      )}
                      {d.case_title && (
                        <span className="flex items-center gap-1 truncate max-w-xs">
                          <Scale className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{d.case_title}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{dateStr}</span>
                      </span>
                      {d.author_name && (
                        <span className="text-[10.5px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 font-mono">
                          {d.author_name} ({d.author_role || "Counsel"})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0 self-end md:self-center">
                    <button
                      onClick={(e) => handleDuplicateDraft(d, e)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Duplicate Draft"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-[11px]">Duplicate</span>
                    </button>
                    <button
                      onClick={(e) => handleDeleteDraft(d.id, e)}
                      disabled={deletingId === d.id}
                      className="p-1.5 rounded-lg border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-xs transition-colors"
                      title="Delete Draft"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onLoadDraft(d)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>Drafts are saved with TipTap AST, court margin configuration, and Hindi fonts intact.</span>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-zinc-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SavedDraftsModal;
