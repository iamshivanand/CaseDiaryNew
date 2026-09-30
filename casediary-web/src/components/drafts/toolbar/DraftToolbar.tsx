"use client";

import React from "react";
import { Editor } from "@tiptap/react";
import clsx from "clsx";
import { HindiTypingMode } from "../extensions/hindiTransliteration";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  RotateCcw,
  RotateCw,
  Table as TableIcon,
  Trash2,
  Highlighter,
  Save,
  Printer,
  FileCheck,
  Scale,
  Heading1,
  Heading2,
  Heading3,
  Sliders,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Stamp,
  Search,
  MessageSquare,
  Share2,
  History,
  Check,
  SplitSquareVertical,
  Ruler,
  ChevronUp,
  ChevronDown,
  BookOpen,
  Mic,
  MicOff,
  FolderOpen,
  FilePlus,
  Star,
  User,
} from "lucide-react";
import { RulerUnit, formatUnitVal } from "../CourtPageRuler";
import { ChamberUser } from "@/context/AuthContext";

export interface DraftToolbarProps {
  editor: Editor | null;
  draftTitle: string;
  setDraftTitle: (val: string) => void;
  saving: boolean;
  saveStatus: string | null;
  handleSaveDraft: () => void;
  row1Expanded: boolean;
  setRow1Expanded: (val: boolean | ((prev: boolean) => boolean)) => void;
  row3Expanded: boolean;
  setRow3Expanded: (val: boolean | ((prev: boolean) => boolean)) => void;
  editorMode: "editing" | "suggesting";
  setEditorMode: (mode: "editing" | "suggesting") => void;
  showDossierSplit: boolean;
  setShowDossierSplit: (val: boolean | ((prev: boolean) => boolean)) => void;
  showCommentsRail: boolean;
  setShowCommentsRail: (val: boolean | ((prev: boolean) => boolean)) => void;
  commentsCount: number;
  handleCourtPrint: () => void;
  setShowSnapshotsDrawer: (val: boolean | ((prev: boolean) => boolean)) => void;
  setShowFindReplace: (val: boolean | ((prev: boolean) => boolean)) => void;
  setShowWhatsAppModal: (val: boolean | ((prev: boolean) => boolean)) => void;
  showOutline: boolean;
  setShowOutline: (val: boolean | ((prev: boolean) => boolean)) => void;
  fontFamily: string;
  setFontFamily: (val: string) => void;
  fontSize: string;
  setFontSize: (val: string) => void;
  lineHeight: string;
  setLineHeight: (val: string) => void;
  courtPreset: "delhi_high_court" | "supreme_court" | "district_court";
  applyCourtPreset: (preset: "delhi_high_court" | "supreme_court" | "district_court") => void;
  marginPreset: "high_court" | "district_court" | "standard";
  margins: { top: number; bottom: number; left: number; right: number };
  setMargins: React.Dispatch<React.SetStateAction<{ top: number; bottom: number; left: number; right: number }>>;
  setMarginPreset: (val: "high_court" | "district_court" | "standard") => void;
  showMarginPopover: boolean;
  setShowMarginPopover: (val: boolean | ((prev: boolean) => boolean)) => void;
  marginUnit: RulerUnit;
  setMarginUnit: (u: RulerUnit) => void;
  showRuler: boolean;
  setShowRuler: (val: boolean | ((prev: boolean) => boolean)) => void;
  showLineNumbers: boolean;
  setShowLineNumbers: (val: boolean | ((prev: boolean) => boolean)) => void;
  watermark: "NONE" | "DRAFT" | "CONFIDENTIAL" | "OFFICE COPY";
  setWatermark: (w: "NONE" | "DRAFT" | "CONFIDENTIAL" | "OFFICE COPY") => void;
  letterheadSpace: boolean;
  setLetterheadSpace: (val: boolean | ((prev: boolean) => boolean)) => void;
  zoomLevel: number;
  setZoomLevel: (val: number | ((prev: number) => number)) => void;
  setShowHeaderFooterModal: (val: boolean | ((prev: boolean) => boolean)) => void;
  insertClause: (clauseKey: string) => void;
  hindiMode?: HindiTypingMode;
  setHindiMode?: (mode: HindiTypingMode) => void;
  onOpenSavedDrafts?: () => void;
  onOpenTemplatesLibrary?: () => void;
  onOpenSaveAsTemplate?: () => void;
  currentUser?: ChamberUser | null;
}

export const DraftToolbar: React.FC<DraftToolbarProps> = ({
  editor,
  draftTitle,
  setDraftTitle,
  saving,
  saveStatus,
  handleSaveDraft,
  row1Expanded,
  setRow1Expanded,
  row3Expanded,
  setRow3Expanded,
  editorMode,
  setEditorMode,
  showDossierSplit,
  setShowDossierSplit,
  showCommentsRail,
  setShowCommentsRail,
  commentsCount,
  handleCourtPrint,
  setShowSnapshotsDrawer,
  setShowFindReplace,
  setShowWhatsAppModal,
  showOutline,
  setShowOutline,
  fontFamily,
  setFontFamily,
  fontSize,
  setFontSize,
  lineHeight,
  setLineHeight,
  courtPreset,
  applyCourtPreset,
  marginPreset,
  margins,
  setMargins,
  setMarginPreset,
  showMarginPopover,
  setShowMarginPopover,
  marginUnit,
  setMarginUnit,
  showRuler,
  setShowRuler,
  showLineNumbers,
  setShowLineNumbers,
  watermark,
  setWatermark,
  letterheadSpace,
  setLetterheadSpace,
  zoomLevel,
  setZoomLevel,
  setShowHeaderFooterModal,
  insertClause,
  hindiMode = "off",
  setHindiMode,
  onOpenSavedDrafts,
  onOpenTemplatesLibrary,
  onOpenSaveAsTemplate,
  currentUser,
}) => {
  const [isListening, setIsListening] = React.useState(false);
  const [dictationLang, setDictationLang] = React.useState<"hi-IN" | "en-IN">("hi-IN");
  const recognitionRef = React.useRef<any>(null);

  const toggleSpeechRecognition = React.useCallback(() => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = dictationLang; // 'hi-IN' for Hindi, 'en-IN' for Indian English

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript && editor) {
          editor.commands.insertContent(finalTranscript + " ");
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsListening(false);
    }
  }, [isListening, dictationLang, editor]);

  return (
    <div className="no-print shrink-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-all sticky top-0">
      {/* Row 1: Case Selector, Modes & Major Actions (Collapsible) */}
      {row1Expanded && (
        <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 animate-fade-in">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  placeholder="Draft Title..."
                  className="text-sm font-bold text-slate-900 dark:text-white bg-transparent border-none focus:outline-none focus:ring-0 p-0 hover:bg-slate-100 dark:hover:bg-slate-800/50 px-2 py-0.5 rounded transition-colors"
                />
                {currentUser && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10.5px] font-medium text-slate-700 dark:text-slate-300">
                    <User className="w-3 h-3 text-amber-500" />
                    <span className="font-semibold">{currentUser.name}</span>
                    <span className="text-[9.5px] px-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono">
                      {currentUser.role}
                    </span>
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-slate-500 px-2">
                <span>TipTap Legal AST</span>
                <span>•</span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">100% Mobile Parity</span>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center space-x-0.5">
                  <Check className="w-3 h-3" />
                  <span>Dossier Split & Collab Ready</span>
                </span>
              </div>
            </div>
          </div>

          {/* Mode Switcher, Split Screen & Primary Actions */}
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            {/* Split Screen Dossier Toggle */}
            <button
              onClick={() => setShowDossierSplit((prev) => !prev)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                showDossierSplit
                  ? "bg-blue-500/15 border-blue-500/40 text-blue-600 dark:text-blue-400"
                  : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              }`}
              title="Split View: Evidence & Case Dossier on Left"
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span>Dossier Split</span>
            </button>

            {/* Editing vs Suggesting Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <button
                onClick={() => setEditorMode("editing")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  editorMode === "editing"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Editing
              </button>
              <button
                onClick={() => setEditorMode("suggesting")}
                className={`px-2.5 py-1 rounded-md font-semibold flex items-center space-x-1 transition-all ${
                  editorMode === "suggesting"
                    ? "bg-amber-500 text-slate-950 font-bold shadow-2xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
                title="Track Changes / Review Mode"
              >
                <span>Suggesting</span>
              </button>
            </div>

            {/* Comments Rail Toggle */}
            <button
              onClick={() => setShowCommentsRail((prev) => !prev)}
              className={`p-1.5 rounded-lg border text-xs flex items-center space-x-1 transition-all ${
                showCommentsRail
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400 font-semibold"
                  : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              }`}
              title="Toggle Chamber Comments Rail"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Comments ({commentsCount})</span>
            </button>

            {/* Version Snapshots Button */}
            <button
              onClick={() => setShowSnapshotsDrawer(true)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 text-xs flex items-center space-x-1"
              title="Version Snapshots & History"
            >
              <History className="w-4 h-4" />
              <span className="hidden md:inline">Snapshots</span>
            </button>

            {/* Find & Replace Button */}
            <button
              onClick={() => setShowFindReplace((prev) => !prev)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 text-xs flex items-center space-x-1"
              title="Find & Replace (Ctrl+F)"
            >
              <Search className="w-4 h-4" />
              <span className="hidden md:inline">Find</span>
            </button>

            {/* WhatsApp Client Dispatch */}
            <button
              onClick={() => setShowWhatsAppModal(true)}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1 shadow-sm transition-all"
              title="Send Draft Preview to Client on WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            {/* Document Outline Toggle */}
            <button
              onClick={() => setShowOutline((prev) => !prev)}
              className={`p-1.5 rounded-lg border text-xs flex items-center space-x-1 transition-all ${
                showOutline
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400 font-semibold"
                  : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              }`}
              title="Toggle Petition Outline"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Outline</span>
            </button>

            {/* My Drafts Button */}
            <button
              onClick={onOpenSavedDrafts}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-all cursor-pointer"
              title="Open Saved Chamber Drafts & Petitions"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
              <span>My Drafts</span>
            </button>

            {/* Templates Library Button */}
            <button
              onClick={onOpenTemplatesLibrary}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-all cursor-pointer"
              title="Browse Statutory Court & Chamber Templates"
            >
              <FilePlus className="w-3.5 h-3.5 text-blue-500" />
              <span>Templates</span>
            </button>

            {/* Save as Template Button */}
            <button
              onClick={onOpenSaveAsTemplate}
              className="px-2 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer"
              title="Save current document as a reusable chamber template"
            >
              <Star className="w-3.5 h-3.5 fill-amber-500/20" />
              <span className="hidden lg:inline text-[11px]">Save as Template</span>
            </button>

            {/* Print Button */}
            <button
              id="toolbar-print-btn"
              onClick={handleCourtPrint}
              className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 flex items-center space-x-1.5 shadow-sm transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Court Print / PDF</span>
            </button>

            {/* Save Button */}
            <button
              id="toolbar-save-btn"
              onClick={handleSaveDraft}
              disabled={saving}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? "Saving..." : saveStatus || "Save Draft"}</span>
            </button>

            {/* Collapse Row 1 Header Button */}
            <button
              type="button"
              onClick={() => setRow1Expanded(false)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs flex items-center space-x-1 transition-colors"
              title="Collapse Header Controls"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              <span className="hidden xl:inline text-[11px] font-semibold">Hide Header</span>
            </button>
          </div>
        </div>
      )}

      {/* Row 2: Standard Formatting Ribbon (ALWAYS VISIBLE & NON-COLLAPSIBLE) */}
      {editor && (
        <div className="px-4 py-1.5 flex flex-wrap items-center gap-1.5 text-slate-700 dark:text-slate-300 overflow-x-auto bg-white/95 dark:bg-slate-900/95">
          {!row1Expanded && (
            <div className="flex items-center space-x-1.5 border-r border-slate-200 dark:border-slate-800 pr-2 mr-0.5">
              <input
                type="text"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="Draft Title..."
                className="max-w-[130px] text-xs font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                title="Document Title"
              />
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving}
                className="p-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center shadow-2xs disabled:opacity-50"
                title="Quick Save Draft"
              >
                <Save className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setRow1Expanded(true)}
                className="px-1.5 py-0.5 rounded border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold flex items-center space-x-1 transition-colors"
                title="Unhide Header Bar"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span className="text-[10px]">Header</span>
              </button>
            </div>
          )}

          {/* Undo / Redo */}
          <div className="flex items-center border-r border-slate-200 dark:border-slate-800 pr-1.5 mr-1 space-x-0.5">
            <button
              id="toolbar-undo-btn"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo (Ctrl+Z)"
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              id="toolbar-redo-btn"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo (Ctrl+Y)"
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Font Family Selector (Supports English & Hindi Court Fonts) */}
          <select
            id="toolbar-font-family-select"
            value={fontFamily}
            onChange={(e) => {
              const newFont = e.target.value;
              setFontFamily(newFont);
              editor.chain().focus().setFontFamily(newFont).run();

              // Automatically switch keyboard typing script when user selects a Hindi or English font
              if (newFont.includes("Kruti Dev") || newFont.includes("Chanakya")) {
                setHindiMode?.("remington");
                if (editor.commands.setHindiMode) {
                  editor.commands.setHindiMode("remington");
                }
              } else if (
                newFont.includes("Mangal") ||
                newFont.includes("Devanagari") ||
                newFont.includes("Aparajita")
              ) {
                setHindiMode?.("phonetic");
                if (editor.commands.setHindiMode) {
                  editor.commands.setHindiMode("phonetic");
                }
              } else {
                setHindiMode?.("off");
                if (editor.commands.setHindiMode) {
                  editor.commands.setHindiMode("off");
                }
              }
            }}
            className="px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            title="Font Family"
          >
            <optgroup label="English Court Fonts">
              <option value="Times New Roman">Times New Roman (Court)</option>
              <option value="Bookman Old Style">Bookman Old Style (SC of India)</option>
              <option value="Georgia">Georgia</option>
              <option value="Arial">Arial</option>
              <option value="Courier New">Courier New</option>
            </optgroup>
            <optgroup label="Hindi / Devanagari (हिंदी अदालत फॉन्ट)">
              <option value="Mangal, 'Noto Sans Devanagari', sans-serif">Mangal (हिंदी यूनिकोड)</option>
              <option value="'Noto Sans Devanagari', sans-serif">Noto Sans Devanagari</option>
              <option value="'Kruti Dev 010', 'Devlys 010', sans-serif">Kruti Dev 010 (Legacy Court)</option>
              <option value="'Walkman-Chanakya', sans-serif">Walkman-Chanakya (Chanakya)</option>
              <option value="'Aparajita', sans-serif">Aparajita (अपराजिता)</option>
            </optgroup>
          </select>

          {/* Hindi Typing Keyboard Mode Selector & Quick Toggle */}
          <div className="flex items-center space-x-1">
            <select
              id="toolbar-hindi-mode-select"
              value={hindiMode}
              onChange={(e) => {
                const mode = e.target.value as HindiTypingMode;
                setHindiMode?.(mode);
                if (editor.commands.setHindiMode) {
                  editor.commands.setHindiMode(mode);
                }
              }}
              className={clsx(
                "px-2 py-1 text-xs rounded border transition-all cursor-pointer font-medium",
                hindiMode !== "off"
                  ? "bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold border-amber-600 shadow-xs ring-1 ring-amber-400"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 border-slate-200 dark:border-slate-700"
              )}
              title="Hindi Keyboard Typing Script & Layout (Shortcut: Ctrl+M)"
            >
              <option value="off">⌨️ Eng (QWERTY)</option>
              <option value="phonetic">🇮🇳 हिंदी फोनेटिक (mera → मेरा)</option>
              <option value="remington">🏛️ कृति देव (Remington: d → क)</option>
              <option value="inscript">🇮🇳 इन्स्क्रिप्ट (InScript: k → क)</option>
            </select>

            <button
              type="button"
              onClick={() => {
                const nextMode: HindiTypingMode = hindiMode === "off" ? "phonetic" : "off";
                setHindiMode?.(nextMode);
                if (editor.commands.setHindiMode) {
                  editor.commands.setHindiMode(nextMode);
                }
              }}
              className={clsx(
                "px-1.5 py-1 text-[10px] rounded border font-mono transition-all cursor-pointer",
                hindiMode !== "off"
                  ? "bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700 font-bold"
                  : "bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-800 border-slate-200 dark:border-slate-700"
              )}
              title="Toggle Hindi/English Keyboard (Shortcut: Ctrl+M)"
            >
              Ctrl+M
            </button>
          </div>

          {/* Font Size Selector (with immediate TipTap TextStyle command) */}
          <select
            id="toolbar-font-size-select"
            value={fontSize}
            onChange={(e) => {
              const val = e.target.value;
              setFontSize(val);
              if (editor) {
                if (!editor.state.selection.empty) {
                  editor.chain().focus().setFontSize(val).run();
                } else {
                  editor.commands.focus();
                }
              }
            }}
            className="px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            title="Font Size (Selection or Default)"
          >
            <option value="11pt">11 pt</option>
            <option value="12pt">12 pt (Notice)</option>
            <option value="13pt">13 pt (District Court)</option>
            <option value="14pt">14 pt (High Court Standard)</option>
            <option value="16pt">16 pt (Headings)</option>
            <option value="18pt">18 pt (Title)</option>
          </select>

          {/* Line Spacing (with immediate TipTap LineHeight command) */}
          <select
            id="toolbar-line-height-select"
            value={lineHeight}
            onChange={(e) => {
              const val = e.target.value;
              setLineHeight(val);
              if (editor) {
                if (editor.state.selection.empty) {
                  // Apply line height to all paragraphs and headings across the entire document
                  editor.chain().focus().selectAll().setLineHeight(val).setTextSelection(0).run();
                } else {
                  // Apply to current selection
                  editor.chain().focus().setLineHeight(val).run();
                }
              }
            }}
            className="px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            title="Line Spacing (Applies to selection or whole document)"
          >
            <option value="1.0">Single (1.0)</option>
            <option value="1.15">1.15</option>
            <option value="1.5">1.5 Space (Districts)</option>
            <option value="1.8">1.8 Space (Delhi HC)</option>
            <option value="2.0">Double (2.0 SC of India)</option>
          </select>

          {/* Bold, Italic, Underline, Strikethrough, Highlight */}
          <div className="flex items-center border-l border-r border-slate-200 dark:border-slate-800 px-1.5 mx-1 space-x-0.5">
            <button
              id="toolbar-bold-btn"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1.5 rounded transition-colors ${
                editor.isActive("bold")
                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              id="toolbar-italic-btn"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1.5 rounded transition-colors ${
                editor.isActive("italic")
                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              id="toolbar-underline-btn"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`p-1.5 rounded transition-colors ${
                editor.isActive("underline")
                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              title="Underline (Ctrl+U)"
            >
              <UnderlineIcon className="w-3.5 h-3.5" />
            </button>
            <button
              id="toolbar-strike-btn"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`p-1.5 rounded transition-colors ${
                editor.isActive("strike")
                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              title="Strikethrough"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
            <button
              id="toolbar-highlight-btn"
              onClick={() => editor.chain().focus().toggleHighlight({ color: "#fef08a" }).run()}
              className={`p-1.5 rounded transition-colors ${
                editor.isActive("highlight")
                  ? "bg-amber-500/20 text-amber-600"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              title="Highlight Marker"
            >
              <Highlighter className="w-3.5 h-3.5 text-amber-500" />
            </button>
          </div>

          {/* Alignments (Left, Center, Right, Justify) */}
          <div className="flex items-center border-r border-slate-200 dark:border-slate-800 pr-1.5 mr-1 space-x-0.5">
            <button
              id="toolbar-align-left-btn"
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              className={`p-1.5 rounded ${
                editor.isActive({ textAlign: "left" })
                  ? "bg-slate-200 dark:bg-slate-700"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              title="Align Left"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              id="toolbar-align-center-btn"
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
              className={`p-1.5 rounded ${
                editor.isActive({ textAlign: "center" })
                  ? "bg-slate-200 dark:bg-slate-700"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              title="Center (Court Title)"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              id="toolbar-align-right-btn"
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              className={`p-1.5 rounded ${
                editor.isActive({ textAlign: "right" })
                  ? "bg-slate-200 dark:bg-slate-700"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              title="Align Right (Counsel Signature)"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
            <button
              id="toolbar-align-justify-btn"
              onClick={() => editor.chain().focus().setTextAlign("justify").run()}
              className={`p-1.5 rounded ${
                editor.isActive({ textAlign: "justify" })
                  ? "bg-slate-200 dark:bg-slate-700"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              title="Full Justify (High Court Registry Standard)"
            >
              <AlignJustify className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Block Selector / Headings (H1, H2, H3) & Lists */}
          <div className="flex items-center border-r border-slate-200 dark:border-slate-800 pr-1.5 mr-1 space-x-0.5">
            <button
              id="toolbar-h1-btn"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`p-1.5 rounded ${
                editor.isActive("heading", { level: 1 })
                  ? "bg-amber-500/20 text-amber-600 font-bold"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              title="H1: Court Name"
            >
              <Heading1 className="w-3.5 h-3.5" />
            </button>
            <button
              id="toolbar-h2-btn"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-1.5 rounded ${
                editor.isActive("heading", { level: 2 })
                  ? "bg-amber-500/20 text-amber-600 font-bold"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              title="H2: Petition Heading"
            >
              <Heading2 className="w-3.5 h-3.5" />
            </button>
            <button
              id="toolbar-h3-btn"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`p-1.5 rounded ${
                editor.isActive("heading", { level: 3 })
                  ? "bg-amber-500/20 text-amber-600 font-bold"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              title="H3: Sub-section Heading"
            >
              <Heading3 className="w-3.5 h-3.5" />
            </button>
            <button
              id="toolbar-bullet-list-btn"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-1.5 rounded ${
                editor.isActive("bulletList")
                  ? "bg-slate-200 dark:bg-slate-700"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              title="Bulleted List"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              id="toolbar-ordered-list-btn"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-1.5 rounded ${
                editor.isActive("orderedList")
                  ? "bg-slate-200 dark:bg-slate-700"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              title="Numbered Grounds (1, 2, 3...)"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Legal Table Controls */}
          <div className="flex items-center border-r border-slate-200 dark:border-slate-800 pr-1.5 mr-1 space-x-1">
            <button
              id="toolbar-insert-table-btn"
              onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
              className="px-2 py-1 rounded text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-1 text-slate-700 dark:text-slate-300"
              title="Insert Table (Index of Documents / Dates)"
            >
              <TableIcon className="w-3.5 h-3.5 text-blue-500" />
              <span>Table</span>
            </button>
            {editor.isActive("table") && (
              <>
                <button
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                  className="p-1 rounded hover:bg-slate-100 text-[10px] text-slate-600 dark:text-slate-400"
                  title="Add Row Below"
                >
                  +Row
                </button>
                <button
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                  className="p-1 rounded hover:bg-slate-100 text-[10px] text-slate-600 dark:text-slate-400"
                  title="Add Column Right"
                >
                  +Col
                </button>
                <button
                  onClick={() => editor.chain().focus().deleteTable().run()}
                  className="p-1 rounded hover:bg-rose-100 text-rose-500"
                  title="Delete Table"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </>
            )}
          </div>

          {/* Indian Court Registry Auto-Formatting Clauses */}
          <div className="hidden lg:flex items-center border-r border-slate-200 dark:border-slate-800 pr-1.5 mr-1 space-x-1">
            <button
              onClick={() => insertClause("verification")}
              className="px-2 py-1 rounded text-[11px] font-medium bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center space-x-1"
              title="Insert Verification Clause"
            >
              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>+ Verification</span>
            </button>
            <button
              onClick={() => insertClause("hindi_verification")}
              className="px-2 py-1 rounded text-[11px] font-medium bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center space-x-1"
              title="हिंदी सत्यापन खंड सम्मिलित करें"
            >
              <FileCheck className="w-3.5 h-3.5 text-orange-600" />
              <span>+ हिंदी सत्यापन</span>
            </button>
            <button
              onClick={() => insertClause("affidavit_oath")}
              className="px-2 py-1 rounded text-[11px] font-medium bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center space-x-1"
              title="Insert Affidavit on Oath"
            >
              <FileCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>+ Affidavit</span>
            </button>
          </div>

          {/* Voice Typing / Speech-to-Text Dictation (Hindi & English Support) */}
          <div className="flex items-center border-r border-slate-200 dark:border-slate-800 pr-1.5 mr-1 space-x-1">
            <button
              type="button"
              id="toolbar-voice-dictation-btn"
              onClick={toggleSpeechRecognition}
              className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center space-x-1.5 transition-all shadow-2xs ${
                isListening
                  ? "bg-rose-500 text-white animate-pulse"
                  : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30"
              }`}
              title={isListening ? "Listening... Click to Stop" : "Voice Dictation (Speak to write)"}
            >
              {isListening ? (
                <>
                  <MicOff className="w-3.5 h-3.5 animate-bounce" />
                  <span>Listening...</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Voice Type</span>
                </>
              )}
            </button>
            <select
              value={dictationLang}
              onChange={(e) => setDictationLang(e.target.value as "hi-IN" | "en-IN")}
              disabled={isListening}
              className="px-1.5 py-1 text-[11px] font-medium rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              title="Dictation Language"
            >
              <option value="hi-IN">हिंदी (Hindi)</option>
              <option value="en-IN">English (India)</option>
            </select>
          </div>

          {/* Expand Row 1 Header Button (visible when header bar is hidden) */}
          {!row1Expanded && (
            <div className="ml-auto flex items-center pl-2">
              <button
                type="button"
                id="toolbar-show-header-btn"
                onClick={() => setRow1Expanded(true)}
                className="px-2 py-1 rounded-md border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs"
                title="Show Header Bar (Case info, Mode, Collab, Actions)"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span className="text-[11px]">Show Header</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Row 3: Court Registry Standards, Margins, Rulers & Layout Options (Collapsible) */}
      {row3Expanded ? (
        <div className="px-4 py-1 flex flex-wrap items-center justify-between text-xs bg-slate-50/90 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800/80 animate-fade-in gap-y-1">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            {/* 1-Click Court Presets Switcher */}
            <div className="flex items-center space-x-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px]">
              <button
                onClick={() => applyCourtPreset("delhi_high_court")}
                className={`px-2 py-0.5 rounded font-medium transition-all ${
                  courtPreset === "delhi_high_court"
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold border border-amber-500/30"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Delhi HC
              </button>
              <button
                onClick={() => applyCourtPreset("supreme_court")}
                className={`px-2 py-0.5 rounded font-medium transition-all ${
                  courtPreset === "supreme_court"
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold border border-amber-500/30"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Supreme Court
              </button>
              <button
                onClick={() => applyCourtPreset("district_court")}
                className={`px-2 py-0.5 rounded font-medium transition-all ${
                  courtPreset === "district_court"
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold border border-amber-500/30"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                District Courts
              </button>
            </div>

            {/* Custom Margins Popover Button */}
            <div className="relative">
              <button
                id="toolbar-margins-btn"
                onClick={() => setShowMarginPopover((prev) => !prev)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium flex items-center space-x-1.5 transition-all ${
                  showMarginPopover
                    ? "bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-400 font-bold"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  Margins: L{formatUnitVal(margins.left, marginUnit)} | R{formatUnitVal(margins.right, marginUnit)}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            </div>

            {/* Scale / Ruler Unit Switcher (cm, in, mm) */}
            <div className="flex items-center bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-mono">
              <button
                onClick={() => setMarginUnit("cm")}
                className={`px-1.5 py-0.5 rounded ${
                  marginUnit === "cm"
                    ? "bg-amber-500 text-slate-950 font-bold"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                cm
              </button>
              <button
                onClick={() => setMarginUnit("in")}
                className={`px-1.5 py-0.5 rounded ${
                  marginUnit === "in"
                    ? "bg-amber-500 text-slate-950 font-bold"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                inch
              </button>
              <button
                onClick={() => setMarginUnit("mm")}
                className={`px-1.5 py-0.5 rounded ${
                  marginUnit === "mm"
                    ? "bg-amber-500 text-slate-950 font-bold"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                mm
              </button>
            </div>

            {/* Toggle Ruler Button */}
            <button
              id="toolbar-ruler-btn"
              onClick={() => setShowRuler((prev) => !prev)}
              className={`p-1 rounded border text-[11px] flex items-center space-x-1 ${
                showRuler
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-400 font-semibold"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"
              }`}
              title="Toggle Interactive Court Ruler"
            >
              <Ruler className="w-3 h-3" />
              <span className="hidden sm:inline">Ruler</span>
            </button>

            {/* Running Court Header & Footer Modal Button */}
            <button
              onClick={() => setShowHeaderFooterModal(true)}
              className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 hover:bg-slate-100 flex items-center space-x-1"
              title="Configure Running Header & Footer"
            >
              <span>Headers & Footers</span>
            </button>

            {/* Line Numbers Toggle */}
            <button
              onClick={() => setShowLineNumbers((prev) => !prev)}
              className={`px-2 py-0.5 rounded border text-[10px] font-mono ${
                showLineNumbers
                  ? "bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-400 font-bold"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"
              }`}
              title="Show High Court Line Numbers"
            >
              123 Lines
            </button>

            {/* Watermark Selector */}
            <div className="flex items-center space-x-1 text-[11px]">
              <Stamp className="w-3 h-3 text-slate-400" />
              <select
                value={watermark}
                onChange={(e) => setWatermark(e.target.value as any)}
                className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px]"
              >
                <option value="NONE">No Watermark</option>
                <option value="DRAFT">DRAFT</option>
                <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                <option value="OFFICE COPY">OFFICE COPY</option>
              </select>
            </div>

            {/* Chamber Letterhead Space */}
            <label className="flex items-center space-x-1 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={letterheadSpace}
                onChange={(e) => setLetterheadSpace(e.target.checked)}
                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-3 h-3"
              />
              <span>Letterhead (2.5")</span>
            </label>
          </div>

          {/* Zoom Controls & Collapse Row 3 */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px]">
              <button
                onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                title="Zoom Out"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              <span className="font-mono font-bold w-9 text-center text-slate-700 dark:text-slate-300">
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                title="Zoom In"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
              <button
                onClick={() => setZoomLevel(100)}
                className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
                title="Reset Zoom to 100%"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setRow3Expanded(false)}
              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Hide Layout Bar"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4 py-0.5 flex items-center justify-between text-[10px] bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
          <span className="text-slate-400">
            Presets & Layout: {courtPreset.replace(/_/g, " ")} • Margins ({marginUnit})
          </span>
          <button
            type="button"
            onClick={() => setRow3Expanded(true)}
            className="flex items-center space-x-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
          >
            <span>Show Layout Bar</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default DraftToolbar;
