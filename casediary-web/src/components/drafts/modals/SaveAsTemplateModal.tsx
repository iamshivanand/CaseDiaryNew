"use client";

import React, { useState } from "react";
import { Star, X, Check, BookOpen, AlertCircle } from "lucide-react";

export interface SaveAsTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTitle: string;
  onSaveTemplate: (data: {
    title: string;
    category: string;
    description: string;
  }) => Promise<void>;
}

export const SaveAsTemplateModal: React.FC<SaveAsTemplateModalProps> = ({
  isOpen,
  onClose,
  defaultTitle,
  onSaveTemplate,
}) => {
  const [title, setTitle] = useState(defaultTitle ? `${defaultTitle} (Template)` : "Standard Chamber Template");
  const [category, setCategory] = useState("Bail & Criminal");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a template title");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSaveTemplate({
        title: title.trim(),
        category,
        description: description.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const categories = [
    "Bail & Criminal",
    "Civil & Property",
    "Commercial & 138 NI",
    "Pleadings & Authorization",
    "Court Applications",
    "Family & Matrimonial",
    "Corporate & Arbitration",
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
      >
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Star className="w-5 h-5 fill-amber-500/20" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Save as Reusable Chamber Template
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Save current draft structure to your chamber library for instant reuse across cases.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Template Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Chamber Standard Bail Application"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Practice Area / Legal Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Short Description / Drafting Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe key statutory clauses, grounds included, or court specifics for junior associates..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100 resize-none"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? "Saving Template..." : "Save to Chamber Vault"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaveAsTemplateModal;
