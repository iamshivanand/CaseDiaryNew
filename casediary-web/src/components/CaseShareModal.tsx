"use client";

import React, { useState, useEffect } from "react";
import {
  Share2,
  X,
  QrCode,
  Copy,
  Check,
  Send,
  ShieldCheck,
  Trash2,
  ExternalLink,
  Loader2,
  AlertCircle,
  Building,
  User,
  Clock,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface CaseShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: number;
  caseTitle: string;
  cnrNumber?: string;
}

export function CaseShareModal({
  isOpen,
  onClose,
  caseId,
  caseTitle,
  cnrNumber,
}: CaseShareModalProps) {
  const [loading, setLoading] = useState(false);
  const [activeShares, setActiveShares] = useState<any[]>([]);
  const [accessLevel, setAccessLevel] = useState<"view_brief" | "co_counsel">("view_brief");
  const [counselName, setCounselName] = useState("");
  const [counselEmail, setCounselEmail] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("30");
  const [creating, setCreating] = useState(false);
  const [newShare, setNewShare] = useState<any | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchShares = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/cases/${caseId}/share`);
      const data = await res.json();
      if (data.success) {
        setActiveShares(data.shares || []);
      }
    } catch (err) {
      console.error("Failed to load shares:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setNewShare(null);
      fetchShares();
    }
  }, [isOpen, caseId]);

  const handleCreateShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_level: accessLevel,
          shared_with_counsel_name: counselName.trim() || undefined,
          shared_with_email: counselEmail.trim() || undefined,
          expiresInDays: parseInt(expiresInDays, 10) || 30,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNewShare(data.share);
        setCounselName("");
        setCounselEmail("");
        fetchShares();
      } else {
        alert(data.error || "Failed to create share link");
      }
    } catch (err) {
      alert("Network error generating share link");
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (shareId: string) => {
    if (!confirm("Revoke this external counsel link? Any counsel using it will immediately lose access.")) {
      return;
    }
    setRevokingId(shareId);
    try {
      const res = await fetch(`/api/cases/${caseId}/share?shareId=${shareId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchShares();
        if (newShare?.id === shareId) {
          setNewShare(null);
        }
      } else {
        alert(data.error || "Failed to revoke share");
      }
    } catch (err) {
      alert("Network error revoking share");
    } finally {
      setRevokingId(null);
    }
  };

  const copyToClipboard = (text: string, token: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const dispatchWhatsApp = (shareUrl: string) => {
    const text =
      `*LEGAL MATTER BRIEF DOSSIER | ADVOCASE*\n\n` +
      `*Matter:* ${caseTitle}\n` +
      (cnrNumber ? `*CNR:* ${cnrNumber}\n` : "") +
      `\nI have shared the isolated matter dossier (facts, hearings, documents, and pleadings) with you.\n\n` +
      `*Dossier Link / QR:* ${shareUrl}`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white">
                Share Matter with External Counsel
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generate isolated court briefs with QR codes for co-counsel & solo advocates.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Privacy Isolation Alert Callout */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">Strict Financial & Chamber Isolation</span>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400/90 leading-relaxed">
                External counsel will only see this single case (facts, timeline, documents, drafting).
                Your chamber’s fee ledgers, client billing balances, and internal roster are completely invisible.
              </p>
            </div>
          </div>

          {/* New Share Generated Display Card */}
          {newShare && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400 flex items-center space-x-1.5">
                  <QrCode className="w-4 h-4" />
                  <span>External Counsel Link & QR Generated</span>
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Expires {formatDate(newShare.expiresAt)}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-5">
                {/* QR Code */}
                {newShare.qrCodeDataUrl && (
                  <div className="p-2.5 rounded-2xl bg-white shadow-md border border-slate-200 shrink-0">
                    <img
                      src={newShare.qrCodeDataUrl}
                      alt="Matter Brief QR Code"
                      className="w-32 h-32 rounded-lg"
                    />
                    <span className="text-[10px] text-slate-500 text-center block mt-1 font-mono">
                      Scan to Open Brief
                    </span>
                  </div>
                )}

                <div className="space-y-3 flex-1 w-full text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium block">
                      Direct Dossier Link:
                    </span>
                    <div className="flex items-center space-x-2">
                      <input
                        readOnly
                        value={newShare.shareUrl}
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 select-all"
                      />
                      <button
                        onClick={() => copyToClipboard(newShare.shareUrl, newShare.shareToken)}
                        className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shrink-0 flex items-center space-x-1 transition-all"
                      >
                        {copiedToken === newShare.shareToken ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      onClick={() => dispatchWhatsApp(newShare.shareUrl)}
                      className="flex-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send to Counsel via WhatsApp</span>
                    </button>
                    <a
                      href={newShare.shareUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium flex items-center space-x-1 transition-colors"
                      title="Preview Dossier"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form to create a share */}
          <form onSubmit={handleCreateShare} className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Create New Brief Share
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Access Level *
                </label>
                <select
                  value={accessLevel}
                  onChange={(e: any) => setAccessLevel(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  <option value="view_brief">View-Only Court Brief (Safe)</option>
                  <option value="co_counsel">Co-Counsel Access (Brief + Drafting)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Link Validity Duration
                </label>
                <select
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  <option value="7">7 Days (Single Hearing)</option>
                  <option value="30">30 Days (Standard Month)</option>
                  <option value="90">90 Days (Trial / Sessions)</option>
                  <option value="365">1 Year (Long Matter)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  External Counsel Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Adv. Vivek Agnihotri (AoR)"
                  value={counselName}
                  onChange={(e) => setCounselName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Counsel Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="counsel@delhibar.org"
                  value={counselEmail}
                  onChange={(e) => setCounselEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {creating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating QR & Link...</span>
                </>
              ) : (
                <>
                  <QrCode className="w-3.5 h-3.5 text-amber-500" />
                  <span>Generate External Counsel QR Code & Link</span>
                </>
              )}
            </button>
          </form>

          {/* Active Shares Roster */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Shared Briefs ({activeShares.length})
            </h4>

            {loading ? (
              <div className="text-center py-6 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1 text-amber-500" />
                <span>Loading active shares...</span>
              </div>
            ) : activeShares.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                No active external counsel shares for this matter yet.
              </p>
            ) : (
              <div className="space-y-2">
                {activeShares.map((s) => (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5 truncate">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 dark:text-white truncate">
                          {s.counselName || "External Counsel"}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          {s.accessLevel === "co_counsel" ? "Co-Counsel" : "View-Only"}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                        Expires {formatDate(s.expiresAt)} • Shared by {s.sharedByName}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => copyToClipboard(s.shareUrl, s.shareToken)}
                        className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 transition-colors"
                        title="Copy Link"
                      >
                        {copiedToken === s.shareToken ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => dispatchWhatsApp(s.shareUrl)}
                        className="p-2 rounded-lg bg-emerald-600/10 text-emerald-600 hover:bg-emerald-600/20 transition-colors"
                        title="Send via WhatsApp"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRevoke(s.id)}
                        disabled={revokingId === s.id}
                        className="p-2 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 transition-colors cursor-pointer"
                        title="Revoke Access"
                      >
                        {revokingId === s.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
