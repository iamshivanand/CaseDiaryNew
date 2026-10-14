"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Sparkles,
  FileText,
  Search,
  Check,
  Trash2,
  X,
  Star,
  Plus,
  Scale,
  Calendar,
  ShieldAlert,
} from "lucide-react";

export interface TemplateItem {
  id: string;
  title: string;
  template_type: string;
  template_category: string;
  template_description?: string | null;
  author_name?: string | null;
  author_role?: string | null;
  html_content?: string | null;
  is_custom: boolean;
  updated_at?: string;
}

export const STATUTORY_TEMPLATES: TemplateItem[] = [
  {
    id: "statutory-bail",
    title: "Regular Bail Application (Cr.P.C. 439 / BNSS 483)",
    template_type: "bail",
    template_category: "Bail & Criminal",
    template_description:
      "Standard High Court & Sessions Court regular bail application with grounds, parity, personal liberty, verification, and deponent affidavit under Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023.",
    is_custom: false,
  },
  {
    id: "statutory-anticipatory-bail",
    title: "Anticipatory Bail Application (Cr.P.C. 438 / BNSS 482)",
    template_type: "anticipatory_bail",
    template_category: "Bail & Criminal",
    template_description:
      "Pre-arrest bail petition incorporating apprehension of arrest, clean antecedents, false implication, cooperation in investigation, and interim protection prayer.",
    is_custom: false,
  },
  {
    id: "statutory-vakalatnama",
    title: "Court Vakalatnama & Memo of Appearance",
    template_type: "vakalatnama",
    template_category: "Pleadings & Authorization",
    template_description:
      "Statutory power of attorney and court authorization with advocate enrolment number, chamber address, client signature, and advocate acceptance clause.",
    is_custom: false,
  },
  {
    id: "statutory-notice-138",
    title: "Legal Demand Notice u/s 138 Negotiable Instruments Act",
    template_type: "notice",
    template_category: "Commercial & 138 NI",
    template_description:
      "Statutory 15-day cheque bounce demand notice setting out legally enforceable debt, dishonour memo, return reason, and notice of criminal prosecution.",
    is_custom: false,
  },
  {
    id: "statutory-adjournment",
    title: "Adjournment Application / Pass-Over Memo",
    template_type: "adjournment",
    template_category: "Court Applications",
    template_description:
      "Bona fide application requesting adjournment or pass-over due to counsel indisposition or part-heard matter before the Division Bench.",
    is_custom: false,
  },
  {
    id: "statutory-exemption",
    title: "Application for Exemption from Personal Appearance (Sec 205/317 CrPC)",
    template_type: "exemption",
    template_category: "Court Applications",
    template_description:
      "Application seeking one-day or permanent exemption of accused / complainant from personal appearance through counsel.",
    is_custom: false,
  },
  {
    id: "statutory-urgent-memo",
    title: "Urgent Hearing Memo (Listing Before Roster Bench)",
    template_type: "urgent_memo",
    template_category: "Pleadings & Authorization",
    template_description:
      "Listing urgency slip submitted to the Registrar / Chief Justice citing imminent threat to personal liberty or demolition of property.",
    is_custom: false,
  },
];

export interface TemplatesLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: TemplateItem) => void;
  onOpenSaveAsTemplate: () => void;
}

export const TemplatesLibraryModal: React.FC<TemplatesLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  onOpenSaveAsTemplate,
}) => {
  const [activeTab, setActiveTab] = useState<"statutory" | "chamber">("statutory");
  const [chamberTemplates, setChamberTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const fetchChamberTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/drafts?is_template=1");
      const data = await res.json();
      if (data.success && data.drafts) {
        setChamberTemplates(
          data.drafts.map((d: any) => ({
            id: d.id,
            title: d.title,
            template_type: d.template_type,
            template_category: d.template_category || "Custom",
            template_description: d.template_description,
            author_name: d.author_name,
            author_role: d.author_role,
            html_content: d.html_content,
            is_custom: true,
            updated_at: d.updated_at,
          }))
        );
      }
    } catch (err) {
      console.error("Error fetching chamber templates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchChamberTemplates();
    }
  }, [isOpen]);

  const handleDeleteCustomTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this custom chamber template?")) {
      return;
    }
    try {
      const res = await fetch(`/api/drafts?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setChamberTemplates((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (err) {
      console.error("Delete template error:", err);
    }
  };

  if (!isOpen) return null;

  const currentPool = activeTab === "statutory" ? STATUTORY_TEMPLATES : chamberTemplates;

  const categories = [
    "All",
    "Bail & Criminal",
    "Commercial & 138 NI",
    "Pleadings & Authorization",
    "Court Applications",
  ];

  const filteredTemplates = currentPool.filter((t) => {
    const matchesSearch =
      !searchQuery.trim() ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.template_description && t.template_description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === "All" ||
      t.template_category.toLowerCase().includes(selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Legal Templates & Chamber Vault</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose standard Indian statutory formats or reusable drafts saved by your chamber advocates.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onClose();
                onOpenSaveAsTemplate();
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save Current as Template</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab & Filter Bar */}
        <div className="px-4 pt-3 pb-2 border-b border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center space-x-1 p-1 bg-slate-100 dark:bg-zinc-800 rounded-xl text-xs font-semibold self-start">
            <button
              onClick={() => setActiveTab("statutory")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "statutory"
                  ? "bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Statutory Court Templates ({STATUTORY_TEMPLATES.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("chamber")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "chamber"
                  ? "bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>Chamber Custom Vault ({chamberTemplates.length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Categories Bar */}
        <div className="px-4 py-2 border-b border-slate-100 dark:border-zinc-800/60 bg-slate-50/50 dark:bg-zinc-900/40 flex items-center space-x-1.5 overflow-x-auto text-[11px]">
          <span className="text-slate-400 text-[10.5px] uppercase font-bold pr-1">Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "bg-white dark:bg-zinc-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {activeTab === "chamber" && loading ? (
            <div className="col-span-2 py-16 text-center text-xs text-slate-400">
              Loading chamber templates...
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="col-span-2 py-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                {activeTab === "chamber"
                  ? "No custom chamber templates saved yet."
                  : "No templates match your search."}
              </div>
              {activeTab === "chamber" && (
                <div className="text-xs text-slate-400 max-w-sm">
                  Draft any petition in the editor and click <b>Save Current as Template</b> to create your reusable chamber boilerplate!
                </div>
              )}
            </div>
          ) : (
            filteredTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => {
                  onSelectTemplate(template);
                  onClose();
                }}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-amber-400 dark:hover:border-amber-600 bg-white dark:bg-zinc-900/90 transition-all cursor-pointer flex flex-col justify-between group shadow-2xs hover:shadow-md"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-snug">
                      {template.title}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 shrink-0">
                      {template.template_category}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {template.template_description || "Ready-to-use court draft formatted to High Court Registry guidelines."}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                  {template.is_custom ? (
                    <div className="text-[10.5px] text-slate-400 font-mono">
                      By {template.author_name || "Advocate"} ({template.author_role || "Chamber"})
                    </div>
                  ) : (
                    <div className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>BNS/BNSS 2023 Verified</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-1.5">
                    {template.is_custom && (
                      <button
                        onClick={(e) => handleDeleteCustomTemplate(template.id, e)}
                        className="p-1 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                        title="Delete Custom Template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onSelectTemplate(template);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold shadow-2xs transition-all"
                    >
                      Use Template
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span>
            Applying a template automatically populates parties, FIR, court name, and advocates from the selected case.
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

export default TemplatesLibraryModal;
