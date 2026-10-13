"use client";

import React, { useState } from "react";
import {
  QrCode,
  X,
  Copy,
  Check,
  Send,
  Building,
  UserCheck,
  ShieldCheck,
  Loader2,
  AlertCircle,
  ExternalLink,
  Users,
  Plus,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

interface ChamberInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemberAdded?: () => void;
  chamberName?: string;
  seniorName?: string;
}

export function ChamberInviteModal({
  isOpen,
  onClose,
  onMemberAdded,
  chamberName = "Law Chamber",
  seniorName = "Senior Advocate",
}: ChamberInviteModalProps) {
  const { language } = useLanguage();
  const [modalTab, setModalTab] = useState<"qr-invite" | "manual">("qr-invite");

  // Invite state
  const [role, setRole] = useState("Associate Advocate");
  const [targetEmail, setTargetEmail] = useState("");
  const [targetPhone, setTargetPhone] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("7");
  const [generating, setGenerating] = useState(false);
  const [inviteResult, setInviteResult] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Manual fallback state
  const [manualForm, setManualForm] = useState({
    name: "",
    role: "Associate Advocate",
    barCouncilNumber: "",
    phone: "",
    email: "",
    assigned_courts: "Tis Hazari Courts, Patiala House",
  });
  const [manualSubmitting, setManualSubmitting] = useState(false);

  const handleGenerateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setInviteError(null);

    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          target_email: targetEmail.trim() || undefined,
          target_phone: targetPhone.trim() || undefined,
          expiresInDays: parseInt(expiresInDays, 10) || 7,
          max_uses: 1,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setInviteResult(data.invitation);
      } else {
        setInviteError(data.error || "Failed to generate chamber invitation.");
      }
    } catch (err) {
      setInviteError("Network error generating invitation.");
    } finally {
      setGenerating(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.name.trim()) return;

    setManualSubmitting(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manualForm),
      });
      const data = await res.json();
      if (data.success) {
        onMemberAdded?.();
        onClose();
      } else {
        alert(data.error || "Failed to add chamber member");
      }
    } catch (err) {
      alert("Network error adding member");
    } finally {
      setManualSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const dispatchWhatsApp = (joinUrl: string, roleName: string) => {
    const text =
      `*OFFICIAL CHAMBER INVITATION | ADVOCASE*\n\n` +
      `Adv. ${seniorName} invites you to join *${chamberName}* as an *${roleName}*.\n\n` +
      `Tap the secure onboarding link below or scan your chamber QR code to activate your digital briefcase:\n` +
      `${joinUrl}\n\n` +
      `_Role & Chamber are pre-locked by the Senior Advocate._`;

    const phone = targetPhone.replace(/[^0-9]/g, "");
    const url = phone
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white">
                {language === "en" ? "Invite Chamber Advocate" : "चेंबर अधिवक्ता आमंत्रित करें"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === "en"
                  ? "Generate QR code or secure invite link with locked role"
                  : "सुरक्षित भूमिका के साथ QR कोड अथवा लिंक बनाएं"}
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

        {/* Tab switch (QR Link vs Manual Directory) */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 pt-3 space-x-4 text-xs font-semibold shrink-0">
          <button
            onClick={() => setModalTab("qr-invite")}
            className={`pb-3 border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer ${
              modalTab === "qr-invite"
                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>{language === "en" ? "QR Code & Digital Invite (Recommended)" : "QR कोड एवं आमंत्रण लिंक"}</span>
          </button>
          <button
            onClick={() => setModalTab("manual")}
            className={`pb-3 border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer ${
              modalTab === "manual"
                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{language === "en" ? "Manual Directory Entry" : "मैन्युअल विवरण"}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {modalTab === "qr-invite" ? (
            <div className="space-y-5">
              {inviteError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{inviteError}</span>
                </div>
              )}

              {inviteResult ? (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 space-y-4">
                  <div className="text-center space-y-2">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-amber-600 dark:text-amber-400">
                      Chamber QR Code Ready
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">
                      Scan to Join as {inviteResult.role}
                    </h4>
                  </div>

                  {/* QR Image */}
                  {inviteResult.qrCodeDataUrl && (
                    <div className="p-3 rounded-2xl bg-white shadow-lg border border-slate-200 w-fit mx-auto">
                      <img
                        src={inviteResult.qrCodeDataUrl}
                        alt="Chamber Invite QR Code"
                        className="w-44 h-44 rounded-xl"
                      />
                      <span className="text-[10px] text-slate-600 text-center block mt-1.5 font-medium">
                        Hold camera to scan & join
                      </span>
                    </div>
                  )}

                  {/* Join Link & Copy */}
                  <div className="space-y-1.5">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold block">
                      Direct Onboarding Link:
                    </span>
                    <div className="flex items-center space-x-2">
                      <input
                        readOnly
                        value={inviteResult.joinUrl}
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 select-all"
                      />
                      <button
                        onClick={() => copyToClipboard(inviteResult.joinUrl)}
                        className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shrink-0 flex items-center space-x-1 transition-all"
                      >
                        {copied ? (
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

                  {/* WhatsApp Action */}
                  <button
                    onClick={() => dispatchWhatsApp(inviteResult.joinUrl, inviteResult.role)}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Invite via WhatsApp</span>
                  </button>

                  <button
                    onClick={() => {
                      setInviteResult(null);
                      setTargetEmail("");
                      setTargetPhone("");
                    }}
                    className="w-full py-2 text-center text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
                  >
                    Generate another invitation
                  </button>
                </div>
              ) : (
                <form onSubmit={handleGenerateInvite} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Pre-Assigned Chamber Role *
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none"
                    >
                      <option value="Associate Advocate">Associate Advocate (Full Briefs & Drafting)</option>
                      <option value="Senior Advocate">Senior Advocate / Partner (Admin & Finance Access)</option>
                    </select>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                      Role will be locked so the invitee cannot elevate their own privileges.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Target Email (Optional)
                      </label>
                      <input
                        type="email"
                        placeholder="associate@delhibar.org"
                        value={targetEmail}
                        onChange={(e) => setTargetEmail(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Target Phone (Optional)
                      </label>
                      <input
                        type="tel"
                        placeholder="9876543210"
                        value={targetPhone}
                        onChange={(e) => setTargetPhone(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Link Validity
                    </label>
                    <select
                      value={expiresInDays}
                      onChange={(e) => setExpiresInDays(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                    >
                      <option value="3">3 Days</option>
                      <option value="7">7 Days (Recommended)</option>
                      <option value="14">14 Days</option>
                      <option value="30">30 Days</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={generating}
                    className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating QR Code...</span>
                      </>
                    ) : (
                      <>
                        <QrCode className="w-4 h-4" />
                        <span>Generate Chamber QR Code & Link</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* Manual Fallback */
            <form onSubmit={handleManualSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Advocate Name *
                </label>
                <input
                  type="text"
                  required
                  value={manualForm.name}
                  onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                  placeholder="e.g. Adv. Vikram Mehra"
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chamber Role
                </label>
                <select
                  value={manualForm.role}
                  onChange={(e) => setManualForm({ ...manualForm, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="Associate Advocate">Associate Advocate</option>
                  <option value="Senior Advocate">Senior Advocate / Partner</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bar Council Number
                  </label>
                  <input
                    type="text"
                    value={manualForm.barCouncilNumber}
                    onChange={(e) => setManualForm({ ...manualForm, barCouncilNumber: e.target.value })}
                    placeholder="D/1234/2021"
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={manualForm.phone}
                    onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={manualSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm"
                >
                  {manualSubmitting ? "Saving..." : "Add to Roster"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
