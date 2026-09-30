"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import FontFamily from "@tiptap/extension-font-family";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
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
  Plus,
  Trash2,
  Highlighter,
  Save,
  Printer,
  Sparkles,
  FileText,
  Sliders,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Stamp,
  Heading1,
  Heading2,
  Heading3,
  Scale,
  Building,
  User,
  Hash,
  Calendar,
  Layers,
  Search,
  Replace,
  BookOpen,
  ChevronRight,
  ChevronDown,
  Copy,
  Scissors,
  ClipboardPaste,
  Type,
  FileCheck,
  ShieldAlert,
  ArrowRight,
  X,
  PanelLeftClose,
  PanelLeft,
  MessageSquare,
  Eye,
  CheckCircle2,
  XCircle,
  Download,
  Share2,
  Send,
  History,
  Check,
  SplitSquareVertical,
  Ruler,
  ChevronUp,
} from "lucide-react";
import DossierSplitPane from "./DossierSplitPane";
import { CourtPageRuler, RulerUnit, formatUnitVal } from "./CourtPageRuler";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "../ThemeToggle";
import FontSize from "./extensions/FontSizeExtension";
import LineHeight from "./extensions/LineHeightExtension";
import HindiInputExtension from "./extensions/HindiInputExtension";
import { HindiTypingMode } from "./extensions/hindiTransliteration";
import { useDraftPagination } from "./editor/useDraftPagination";
import { DraftToolbar } from "./toolbar/DraftToolbar";
import MarginsPopover from "./modals/MarginsPopover";
import SavedDraftsModal, { SavedDraftItem } from "./modals/SavedDraftsModal";
import TemplatesLibraryModal, { TemplateItem } from "./modals/TemplatesLibraryModal";
import SaveAsTemplateModal from "./modals/SaveAsTemplateModal";
import { executeCourtPrint } from "./print/DraftPrintEngine";

interface CaseItem {
  id: number;
  CaseTitle: string;
  ClientName?: string;
  OppositeParty?: string;
  court_name?: string;
  case_number?: string;
  crime_number?: string;
  Undersection?: string;
  AdvocateName?: string;
  NextDate?: string;
  phone_number?: string;
}

interface LegalTipTapEditorProps {
  initialCaseId?: string | null;
  initialTemplate?: string;
  initialDraftId?: string | null;
}

interface OutlineItem {
  id: string;
  text: string;
  level: number;
}

interface ChamberComment {
  id: string;
  author: string;
  authorRole: "Senior Advocate" | "Junior Counsel" | "Munshi";
  text: string;
  quoteExcerpt?: string;
  timestamp: string;
  resolved: boolean;
}

interface VersionSnapshot {
  id: string;
  label: string;
  timestamp: string;
  html: string;
}

export type PageSizeKey = "a4" | "legal" | "letter";

export interface PageConfigItem {
  name: string;
  shortName: string;
  width: number;
  height: number;
  printableHeight: number;
  topPadding: number;
  bottomPadding: number;
  badge: string;
}

export const PAGE_CONFIG: Record<PageSizeKey, PageConfigItem> = {
  a4: {
    name: "A4 (210 × 297 mm — High Court & Supreme Court)",
    shortName: "A4",
    width: 794,
    height: 1123,
    printableHeight: 930,
    topPadding: 75,
    bottomPadding: 75,
    badge: "HC/SC Standard",
  },
  legal: {
    name: "Legal (8.5 × 14 in — Green Paper / District Courts)",
    shortName: "Legal 14\"",
    width: 816,
    height: 1344,
    printableHeight: 1150,
    topPadding: 85,
    bottomPadding: 85,
    badge: "14\" Green Ledger",
  },
  letter: {
    name: "Letter (8.5 × 11 in)",
    shortName: "Letter",
    width: 816,
    height: 1056,
    printableHeight: 860,
    topPadding: 75,
    bottomPadding: 75,
    badge: "Standard",
  },
};

export interface HeaderFooterConfig {
  showHeader: boolean;
  showFooter: boolean;
  differentFirstPage: boolean;
  customCourtName?: string;
  customCaseNumber?: string;
  customAdvocateName?: string;
  pageNumberStyle: "full" | "simple" | "numOnly" | "roman" | "none";
}

// Consistent Running Court Header (MS Word Paged Mode)
const CourtRunningHeader = ({
  courtName,
  caseNumber,
  margins,
  sheetNumber,
  config,
  unit = "cm",
}: {
  courtName?: string;
  caseNumber?: string;
  margins?: { left: number; right: number };
  sheetNumber: number;
  config?: HeaderFooterConfig;
  unit?: RulerUnit;
}) => {
  if (config && !config.showHeader) return null;
  if (config?.differentFirstPage && sheetNumber === 1) return null;

  const displayCourt = config?.customCourtName?.trim() || courtName || "IN THE HON'BLE COURT OF SESSIONS";
  const displayCase = config?.customCaseNumber?.trim() || caseNumber || "CRIMINAL PETITION";

  return (
    <div
      style={{
        paddingLeft: margins ? `${margins.left}mm` : "25mm",
        paddingRight: margins ? `${margins.right}mm` : "25mm",
        height: "38px",
      }}
      className="w-full bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono select-none shrink-0"
    >
      <div className="flex items-center space-x-2 truncate pr-4">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
        <span className="truncate">{displayCourt}</span>
        <span className="no-print px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 text-[8.5px] font-bold tracking-normal normal-case">
          Header: {formatUnitVal(38 / 3.7795, unit)} (38px)
        </span>
      </div>
      <div className="shrink-0 text-slate-400 dark:text-slate-500 font-mono">
        {displayCase}
      </div>
    </div>
  );
};

// Consistent Running Court Footer (MS Word Paged Mode)
const CourtRunningFooter = ({
  advocateName,
  currentPage,
  totalPages,
  paperName,
  margins,
  config,
  unit = "cm",
}: {
  advocateName?: string;
  currentPage: number;
  totalPages: number;
  paperName: string;
  margins?: { left: number; right: number };
  config?: HeaderFooterConfig;
  unit?: RulerUnit;
}) => {
  if (config && !config.showFooter) return null;

  const displayAdvocate = config?.customAdvocateName?.trim() || advocateName || "Adv. Rajesh Sharma";
  const style = config?.pageNumberStyle || "full";

  let pageStr = "";
  if (style === "full") pageStr = `Page ${currentPage} of ${totalPages} (${paperName})`;
  else if (style === "simple") pageStr = `Page ${currentPage} of ${totalPages}`;
  else if (style === "numOnly") pageStr = `${currentPage}`;
  else if (style === "roman") pageStr = `— ${currentPage} —`;

  return (
    <div
      style={{
        paddingLeft: margins ? `${margins.left}mm` : "25mm",
        paddingRight: margins ? `${margins.right}mm` : "25mm",
        height: "38px",
      }}
      className="w-full bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-mono select-none shrink-0"
    >
      <div className="flex items-center space-x-2 truncate pr-4">
        <span>Counsel for Applicant • </span>
        <span className="font-semibold text-slate-800 dark:text-slate-200">{displayAdvocate}</span>
        <span className="no-print px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 text-[8.5px] font-bold tracking-normal">
          Footer: {formatUnitVal(38 / 3.7795, unit)} (38px)
        </span>
      </div>
      {pageStr && (
        <div className="shrink-0 font-bold text-slate-700 dark:text-slate-300">
          {pageStr}
        </div>
      )}
    </div>
  );
};

export default function LegalTipTapEditor({
  initialCaseId,
  initialTemplate = "bail",
  initialDraftId,
}: LegalTipTapEditorProps) {
  const { language } = useLanguage();
  const { user } = useAuth();

  // Active Draft & Chamber Template Vault State
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(initialDraftId || null);
  const [showSavedDraftsModal, setShowSavedDraftsModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showSaveAsTemplateModal, setShowSaveAsTemplateModal] = useState(false);

  // Role-based permission enforcement: Junior Associates / Clerks start in Review Mode
  useEffect(() => {
    if (user?.role === "Court Clerk / Munshi" || user?.role === "Intern") {
      setEditorMode("suggesting");
    }
  }, [user?.role]);

  // Cases list for variable autofill
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(initialCaseId || "");
  const activeCase = cases.find((c) => c.id.toString() === selectedCaseId);
  const [selectedTemplate, setSelectedTemplate] = useState<string>(initialTemplate);
  const [draftTitle, setDraftTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Collaboration: Mode Switcher (Editing vs Suggesting / Track Changes)
  const [editorMode, setEditorMode] = useState<"editing" | "suggesting">("editing");
  const [comments, setComments] = useState<ChamberComment[]>([
    {
      id: "comm-1",
      author: "Adv. Rajesh Sharma",
      authorRole: "Senior Advocate",
      text: "Please verify if the charge-sheet annexure numbers match the trial court record.",
      quoteExcerpt: "investigation is virtually complete",
      timestamp: "Today, 4:15 PM",
      resolved: false,
    },
  ]);
  const [showCommentsRail, setShowCommentsRail] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");

  // Version Snapshots
  const [snapshots, setSnapshots] = useState<VersionSnapshot[]>([]);
  const [showSnapshotsDrawer, setShowSnapshotsDrawer] = useState(false);

  // Split-Screen Dossier State
  const [showDossierSplit, setShowDossierSplit] = useState(false);

  // WhatsApp Client Dispatch Modal
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  // Courtroom Presets & Formatting
  const [courtPreset, setCourtPreset] = useState<"delhi_high_court" | "supreme_court" | "district_court">("delhi_high_court");
  const [pageSize, setPageSize] = useState<PageSizeKey>("a4");
  const [fontFamily, setFontFamily] = useState("Times New Roman");
  const [fontSize, setFontSize] = useState("14pt");
  const [lineHeight, setLineHeight] = useState("1.8");
  const [marginPreset, setMarginPreset] = useState<"high_court" | "district_court" | "standard">("high_court");
  const [hindiMode, setHindiMode] = useState<HindiTypingMode>("off");

  // Keep React state in sync with global Hindi keyboard mode events (e.g., Ctrl+M shortcut)
  useEffect(() => {
    const handleHindiModeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ mode: HindiTypingMode }>;
      if (customEvent.detail?.mode) {
        setHindiMode(customEvent.detail.mode);
      }
    };
    window.addEventListener("casediary:hindi-mode-change", handleHindiModeChange);
    return () => window.removeEventListener("casediary:hindi-mode-change", handleHindiModeChange);
  }, []);

  // Full 4-Side Page Margins (Left, Right, Top, Bottom in mm) - Applied consistently to Every Page
  const [margins, setMargins] = useState<{
    top: number;
    bottom: number;
    left: number;
    right: number;
  }>({
    top: 25,
    bottom: 25,
    left: 45, // Standard 1.75" Gutter for Court Filing
    right: 25,
  });
  const [showMarginPopover, setShowMarginPopover] = useState(false);
  const [marginUnit, setMarginUnit] = useState<RulerUnit>("cm");
  const [showRuler, setShowRuler] = useState(true);
  const [row1Expanded, setRow1Expanded] = useState(true);
  const [row3Expanded, setRow3Expanded] = useState(true);

  // Running Court Header & Footer Customization State
  const [headerFooterConfig, setHeaderFooterConfig] = useState<HeaderFooterConfig>({
    showHeader: true,
    showFooter: true,
    differentFirstPage: false,
    customCourtName: "",
    customCaseNumber: "",
    customAdvocateName: "",
    pageNumberStyle: "full",
  });
  const [showHeaderFooterModal, setShowHeaderFooterModal] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [watermark, setWatermark] = useState<"NONE" | "DRAFT" | "CONFIDENTIAL" | "OFFICE COPY">("NONE");
  const [letterheadSpace, setLetterheadSpace] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Right-Click Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    visible: boolean;
    isInsideTable: boolean;
    hasSelection: boolean;
    selectedText: string;
  } | null>(null);

  // Find & Replace State
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findQuery, setFindQuery] = useState("");
  const [replaceQuery, setReplaceQuery] = useState("");
  const [findMatchCount, setFindMatchCount] = useState<number | null>(null);

  // Document Outline Sidebar State
  const [showOutline, setShowOutline] = useState(false);
  const [outline, setOutline] = useState<OutlineItem[]>([]);

  // Reference to physical TipTap content container for strict height-based page measurement
  const contentContainerRef = useRef<HTMLDivElement>(null);

  // Modular debounced pagination hook: eliminates typing lag by avoiding synchronous getBoundingClientRect layout thrashing
  const {
    pages,
    blockSheetAssignmentsRef,
    recalculatePageBreaksAndSpacers,
    debouncedRecalculatePagination,
  } = useDraftPagination({
    contentContainerRef,
    margins,
    pageSize,
    letterheadSpace,
    zoomLevel,
    headerFooterConfig,
  });

  // Base Stats (Words, Chars, Lines)
  const [baseStats, setBaseStats] = useState({
    words: 0,
    chars: 0,
    lines: 1,
  });

  const stats = useMemo(
    () => ({
      ...baseStats,
      pages,
    }),
    [baseStats, pages]
  );

  // Debounced stats & outline calculator so fast typing is completely unblocked
  const statsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedUpdateStatsAndOutline = useCallback((tiptapEditor: any) => {
    if (statsTimeoutRef.current) {
      clearTimeout(statsTimeoutRef.current);
    }
    statsTimeoutRef.current = setTimeout(() => {
      const text = tiptapEditor.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const chars = text.length;
      const lines = text.split("\n").length;
      setBaseStats({ words, chars, lines });

      const headings: OutlineItem[] = [];
      tiptapEditor.state.doc.descendants((node: any, pos: number) => {
        if (node.type.name === "heading") {
          headings.push({
            id: `heading-${pos}`,
            text: node.textContent,
            level: node.attrs.level,
          });
        }
      });
      setOutline(headings);
    }, 250);
  }, []);

  // Listen to container resizing
  useEffect(() => {
    const el = contentContainerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => {
      debouncedRecalculatePagination();
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [debouncedRecalculatePagination]);

  // Recalculate when formatting, margins, zoom, template or header/footer changes
  useEffect(() => {
    recalculatePageBreaksAndSpacers();
  }, [
    recalculatePageBreaksAndSpacers,
    fontFamily,
    fontSize,
    lineHeight,
    margins,
    pageSize,
    selectedTemplate,
    letterheadSpace,
    zoomLevel,
    headerFooterConfig,
  ]);

  // Pixel-Perfect Court Document PDF / Print Engine (Zero Whitespace Distortion)
  const handleCourtPrint = useCallback(() => {
    executeCourtPrint({
      contentContainer: contentContainerRef.current,
      pageSize,
      margins,
      headerFooterConfig,
      activeCase,
      draftTitle,
      fontFamily,
      fontSize,
      lineHeight,
      letterheadSpace,
      watermark,
      totalPages: pages,
      assignments: blockSheetAssignmentsRef.current,
    });
  }, [
    contentContainerRef,
    pageSize,
    margins,
    headerFooterConfig,
    activeCase,
    draftTitle,
    fontFamily,
    fontSize,
    lineHeight,
    letterheadSpace,
    watermark,
    pages,
    blockSheetAssignmentsRef,
  ]);

  // Intercept Ctrl+P / Cmd+P to invoke pixel-perfect court print
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        handleCourtPrint();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCourtPrint]);


  // Fetch Cases on Mount
  useEffect(() => {
    fetch("/api/cases")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.cases) {
          setCases(data.cases);
          if (!selectedCaseId && data.cases.length > 0) {
            setSelectedCaseId(data.cases[0].id.toString());
          }
        }
      })
      .catch((err) => console.error("Error fetching cases:", err));
  }, []);

  // Close popovers on any global click
  useEffect(() => {
    const handleGlobalClick = () => {
      if (contextMenu?.visible) {
        setContextMenu(null);
      }
      setShowMarginPopover(false);
    };
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, [contextMenu]);

  // Keyboard shortcut listener (Ctrl+F for Find & Replace)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setShowFindReplace((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Apply Court-Specific Registry Presets (1-Click Switcher)
  const applyCourtPreset = (preset: "delhi_high_court" | "supreme_court" | "district_court") => {
    setCourtPreset(preset);
    if (preset === "delhi_high_court") {
      setPageSize("a4");
      setMarginPreset("high_court");
      setMargins({ top: 25, bottom: 25, left: 45, right: 25 });
      setFontFamily("Times New Roman");
      setFontSize("14pt");
      setLineHeight("1.8");
      setShowLineNumbers(true);
      setSaveStatus("Applied Delhi High Court Registry Preset (A4, 1.75\" Gutter, 14pt, 1.8 spacing)");
    } else if (preset === "supreme_court") {
      setPageSize("a4");
      setMarginPreset("high_court");
      setMargins({ top: 30, bottom: 25, left: 45, right: 25 });
      setFontFamily("Bookman Old Style");
      setFontSize("14pt");
      setLineHeight("2.0");
      setShowLineNumbers(true);
      setSaveStatus("Applied Supreme Court of India Preset (A4, Double Spaced, Bookman Old Style)");
    } else if (preset === "district_court") {
      setPageSize("legal");
      setMarginPreset("district_court");
      setMargins({ top: 25, bottom: 25, left: 35, right: 20 });
      setFontFamily("Times New Roman");
      setFontSize("13pt");
      setLineHeight("1.5");
      setShowLineNumbers(false);
      setSaveStatus("Applied District & Sessions Court Preset (Legal 14\" Green Paper, 1.4\" Margin)");
    }
    setTimeout(() => setSaveStatus(null), 3000);
  };

  // Template Content Generator
  const getTemplateContent = useCallback(
    (templateKey: string, c?: CaseItem) => {
      const court = c?.court_name || "IN THE COURT OF HON'BLE DISTRICT & SESSIONS JUDGE, TIS HAZARI COURTS, DELHI";
      const caseNo = c?.case_number || "CRIMINAL MISC. PETITION NO. ______ / 2026";
      const client = c?.ClientName || "Applicant / Accused";
      const oppParty = c?.OppositeParty || "State of NCT of Delhi";
      const fir = c?.crime_number || "FIR No. _____ / 2025";
      const ps = "PS Karol Bagh, Central District";
      const sections = c?.Undersection || "Sections 420, 468, 471, 120-B IPC";
      const advocate = c?.AdvocateName || "Adv. Rajesh Sharma";
      const currentDate = new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      if (templateKey === "bail") {
        return `
          <h1 style="text-align: center; font-weight: bold; text-decoration: underline;">
            IN THE COURT OF ${court.toUpperCase()}
          </h1>
          <p style="text-align: center; font-weight: bold;">
            ${caseNo.toUpperCase()}<br/>
            IN RE: ${fir.toUpperCase()}, ${ps.toUpperCase()}<br/>
            UNDER SECTIONS: ${sections.toUpperCase()}
          </p>
          
          <p style="margin-top: 24px;">
            <b>IN THE MATTER OF:</b><br/>
            <b>${client}</b>, S/o Late Shri Ram Swaroop, R/o Sector 14, Rohini, New Delhi.<br/>
            ... <i>Applicant / Accused</i><br/><br/>
            <b>VERSUS</b><br/><br/>
            <b>${oppParty.toUpperCase()}</b><br/>
            ... <i>Respondent / State</i>
          </p>

          <h2 style="text-align: center; font-weight: bold; margin-top: 28px; text-decoration: underline;">
            APPLICATION UNDER SECTION 439 CR.P.C. / SECTION 483 BHARATIYA NAGARIK SURAKSHA SANHITA (BNSS), 2023 FOR GRANT OF REGULAR BAIL ON BEHALF OF THE APPLICANT
          </h2>

          <p><b>MOST RESPECTFULLY SHOWETH:</b></p>
          
          <p><b>1.</b> That the Applicant is a peace-loving, law-abiding citizen of India with deep roots in society and no previous criminal antecedents of any nature whatsoever.</p>
          <p><b>2.</b> That the Applicant has been falsely and maliciously implicated in the above-captioned case on frivolous allegations without any incriminating recovery from his possession.</p>
          <p><b>3.</b> That the Applicant was arrested on 12.01.2026 and has been in continuous judicial custody since then. The investigation is virtually complete, all relevant documents have been seized, and the charge-sheet is ready for submission before this Hon'ble Court.</p>
          <p><b>4.</b> That no custodial interrogation of the applicant is any further required for any purpose whatsoever, and incarceration prior to conviction amounts to punitive detention violative of Article 21 of the Constitution of India.</p>
          <p><b>5.</b> That the Applicant undertakes to abide by any stringent conditions, furnish solvent local sureties, and surrender his passport as may be imposed by this Hon'ble Court.</p>

          <h2 style="text-align: center; font-weight: bold; margin-top: 28px; text-decoration: underline;">PRAYER</h2>
          <p>Wherefore, in the light of the facts and circumstances stated hereinabove, it is most respectfully prayed that this Hon'ble Court may graciously be pleased to:</p>
          
          <p style="padding-left: 24px;">
            <b>(a)</b> Enlarge the Applicant on regular bail in connection with ${fir}, ${ps}, pending trial before this Hon'ble Court; and<br/>
            <b>(b)</b> Pass any such other or further order(s) as this Hon'ble Court may deem fit and proper in the interest of justice.
          </p>

          <table style="width: 100%; border: none; margin-top: 40px;">
            <tbody>
              <tr>
                <td style="border: none; vertical-align: bottom;">
                  Date: ${currentDate}<br/>
                  Place: New Delhi
                </td>
                <td style="border: none; text-align: right; vertical-align: bottom;">
                  <b>APPLICANT / ACCUSED</b><br/><br/>
                  <b>THROUGH COUNSEL</b><br/>
                  <b>${advocate.toUpperCase()}</b><br/>
                  Enrolment No. D/1248/2012<br/>
                  Chamber No. 412, Lawyers Chambers,<br/>
                  Tis Hazari Courts, Delhi - 110054
                </td>
              </tr>
            </tbody>
          </table>

          <h2 style="text-align: center; font-weight: bold; margin-top: 24px; text-decoration: underline;">
            VERIFICATION
          </h2>
          <p style="margin-top: 14px; text-align: justify;">
            Verified at New Delhi on this <b>${currentDate}</b> that the contents of paragraphs 1 to 5 of the above bail application are true and correct to my personal knowledge, and the legal grounds and prayer clause are based on legal advice received and believed by me to be true. No part of it is false and nothing material has been concealed therefrom.
          </p>
          <p style="text-align: right; margin-top: 40px;">
            <b>DEPONENT</b>
          </p>

          <h2 style="text-align: center; font-weight: bold; margin-top: 24px; text-decoration: underline;">
            AFFIDAVIT ON BEHALF OF THE APPLICANT
          </h2>
          <p style="margin-top: 16px; text-align: justify;">
            I, <b>${client}</b>, aged about 42 years, residing at New Delhi, do hereby solemnly affirm and declare on oath as under:-
          </p>
          <p style="margin-top: 12px;">
            <b>1.</b> That I am the Applicant in the accompanying application for regular bail and am fully conversant with the facts of the case, hence competent to swear this affidavit.
          </p>
          <p>
            <b>2.</b> That the contents of the accompanying application have been read over and explained to me in vernacular, and I state that the same are true and correct to my knowledge.
          </p>
          <p>
            <b>3.</b> That no similar application for bail has previously been filed or is pending before any other court.
          </p>
          <p style="text-align: right; margin-top: 40px;">
            <b>DEPONENT</b>
          </p>
          <p style="margin-top: 35px; border-top: 1px dashed #94a3b8; padding-top: 12px; font-size: 11pt;">
            <b>ATTESTED BY OATH COMMISSIONER:</b><br/>
            Solemnly affirmed and signed before me by the Deponent on this <b>${currentDate}</b> at New Delhi after reading and admitting contents.
          </p>
        `;
      } else if (templateKey === "vakalatnama") {
        return `
          <h1 style="text-align: center; font-weight: bold; text-decoration: underline; font-size: 16pt;">
            VAKALATNAMA
          </h1>
          <p style="text-align: center; font-weight: bold;">
            IN THE COURT OF ${court.toUpperCase()}
          </p>
          <p style="text-align: center; font-weight: bold;">
            ${caseNo}
          </p>

          <p style="margin-top: 20px;">
            <b>${client}</b> ... <i>Petitioner / Plaintiff / Appellant</i><br/>
            <b>VERSUS</b><br/>
            <b>${oppParty}</b> ... <i>Respondent / Defendant / Opposite Party</i>
          </p>

          <p style="margin-top: 24px; text-align: justify;">
            I/We, the undersigned, do hereby appoint, nominate, and retain <b>${advocate.toUpperCase()}</b> (Enrolment No. D/1248/2012), Advocate, to be our legal practitioner in the above matter, to conduct proceedings, file pleadings, examine witnesses, compromise, and represent me/us before this Hon'ble Court.
          </p>

          <table style="width: 100%; border: none; margin-top: 50px;">
            <tbody>
              <tr>
                <td style="border: none; vertical-align: bottom;">
                  ___________________________<br/>
                  <b>CLIENT SIGNATURE / THUMB IMPRESSION</b><br/>
                  (${client})
                </td>
                <td style="border: none; text-align: right; vertical-align: bottom;">
                  <b>ACCEPTED & FILED BY:</b><br/><br/>
                  <b>${advocate.toUpperCase()}</b><br/>
                  Advocate for the Client
                </td>
              </tr>
            </tbody>
          </table>
        `;
      } else if (templateKey === "notice") {
        return `
          <h1 style="text-align: center; font-weight: bold; text-decoration: underline;">
            REGISTERED SPEED POST / LEGAL NOTICE
          </h1>
          <p style="text-align: right;">
            Date: ${currentDate}
          </p>

          <p>
            <b>TO:</b><br/>
            <b>${oppParty}</b><br/>
            Resident of: ____________________________<br/>
            New Delhi, India.
          </p>

          <p style="margin-top: 20px;">
            <b>SUBJECT:</b> STATUTORY LEGAL NOTICE UNDER SECTION 138 OF THE NEGOTIABLE INSTRUMENTS ACT, 1881 FOR DISHONOUR OF CHEQUE BEARING NO. ______ DATED ______ FOR RS. ____________/-.
          </p>

          <p style="margin-top: 20px; text-align: justify;">
            Sir/Madam,<br/>
            Under instructions and on behalf of my client, <b>${client}</b>, I do hereby serve upon you this statutory legal notice for the dishonour of the subject cheque drawn on your bank account, which on presentation was returned unpaid with the endorsement <b>"FUNDS INSUFFICIENT"</b>.
          </p>

          <p style="text-align: justify;">
            You are hereby called upon to pay the entire amount of <b>Rs. ___________/-</b> to my client within <b>15 (fifteen) days</b> of receipt of this notice, failing which my client shall initiate criminal prosecution against you under Section 138 of the Negotiable Instruments Act, 1881.
          </p>

          <p style="margin-top: 40px; text-align: right;">
            <b>${advocate.toUpperCase()}</b><br/>
            Advocate, High Court of Delhi
          </p>
        `;
      } else if (templateKey === "adjournment") {
        return `
          <h1 style="text-align: center; font-weight: bold; text-decoration: underline;">
            IN THE COURT OF ${court.toUpperCase()}
          </h1>
          <p style="text-align: center; font-weight: bold;">
            ${caseNo}
          </p>

          <p style="margin-top: 20px;">
            <b>${client}</b> ... <i>Petitioner / Applicant</i><br/>
            <b>VERSUS</b><br/>
            <b>${oppParty}</b> ... <i>Respondent</i>
          </p>

          <h2 style="text-align: center; font-weight: bold; margin-top: 24px; text-decoration: underline;">
            APPLICATION FOR ADJOURNMENT ON BEHALF OF THE APPLICANT / COUNSEL
          </h2>

          <p><b>MOST RESPECTFULLY SHOWETH:</b></p>
          <p><b>1.</b> That the above-titled matter is listed today before this Hon'ble Court for arguments / hearing.</p>
          <p><b>2.</b> That the main arguing counsel, <b>${advocate}</b>, is indisposed / engaged in another part-heard matter before the Hon'ble High Court, and is unable to address arguments today.</p>
          <p><b>3.</b> That the request for adjournment is bona fide and not intended to delay proceedings.</p>

          <p><b>PRAYER:</b> It is therefore respectfully prayed that this Hon'ble Court may kindly adjourn the matter to any convenient future date.</p>

          <p style="margin-top: 40px; text-align: right;">
            <b>THROUGH COUNSEL</b><br/>
            ${advocate}
          </p>
        `;
      }

      return `<p>Start typing your legal petition or court draft here...</p>`;
    },
    []
  );

  // Initialize TipTap Editor Instance
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      FontFamily.configure({
        types: ["textStyle"],
      }),
      TextStyle,
      FontSize,
      LineHeight,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      HindiInputExtension.configure({
        defaultMode: "off",
        onModeChange: (mode: HindiTypingMode) => setHindiMode(mode),
      }),
    ],
    content: getTemplateContent(selectedTemplate, activeCase),
    editorProps: {
      attributes: {
        class: "focus:outline-none min-h-[900px] text-slate-900",
      },
    },
    onUpdate: ({ editor }) => {
      // Debounced stats, outline, and pagination updates to guarantee completely lag-free drafting
      debouncedUpdateStatsAndOutline(editor);
      debouncedRecalculatePagination();
    },
  });

  // Re-generate content when template or case selection changes
  useEffect(() => {
    if (editor) {
      const newHtml = getTemplateContent(selectedTemplate, activeCase);
      editor.commands.setContent(newHtml);
      const titlePrefix =
        selectedTemplate === "bail"
          ? "Bail Application"
          : selectedTemplate === "vakalatnama"
          ? "Vakalatnama"
          : selectedTemplate === "notice"
          ? "Legal Notice u/s 138"
          : "Court Draft";
      setDraftTitle(`${titlePrefix} - ${activeCase?.ClientName || "Untitled Case"}`);
      requestAnimationFrame(() => {
        recalculatePageBreaksAndSpacers();
      });
    }
  }, [selectedTemplate, selectedCaseId, activeCase, editor, getTemplateContent, recalculatePageBreaksAndSpacers]);

  // Ensure recalculation once editor is mounted and fonts are ready
  useEffect(() => {
    if (editor) {
      const timer1 = setTimeout(() => {
        recalculatePageBreaksAndSpacers();
      }, 100);
      const timer2 = setTimeout(() => {
        recalculatePageBreaksAndSpacers();
      }, 350);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [editor, recalculatePageBreaksAndSpacers]);

  // Insert Case Variable Chip into TipTap
  const insertVariable = (variableText: string) => {
    if (editor) {
      editor.chain().focus().insertContent(`<b>${variableText}</b> `).run();
    }
  };

  // Quote Dossier Snippet directly into TipTap
  const handleQuoteSnippet = (text: string, source: string) => {
    if (editor) {
      editor
        .chain()
        .focus()
        .insertContent(
          `<blockquote>"${text}"<br/><span style="font-size: 11px; font-weight: bold; color: #475569;">— [Ref: ${source}]</span></blockquote>`
        )
        .run();
      setSaveStatus(`Quoted "${source}" into petition!`);
      setTimeout(() => setSaveStatus(null), 2500);
    }
  };

  // Insert Digital Advocate Signature & Chamber Seal Block
  const insertDigitalSealAndSignature = () => {
    if (!editor) return;
    const advocate = activeCase?.AdvocateName || "ADV. RAJESH SHARMA";
    const dateStr = new Date().toLocaleDateString("en-IN");

    const sealHtml = `
      <div style="margin-top: 40px; display: flex; justify-content: flex-end;">
        <div style="text-align: center; border: 2px solid #1e3a8a; border-radius: 50%; width: 120px; height: 120px; display: flex; flex-direction: column; justify-content: center; align-items: center; color: #1e3a8a; font-family: sans-serif; padding: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <span style="font-size: 8px; font-weight: bold; letter-spacing: 0.5px;">DELHI HIGH COURT BAR</span>
          <span style="font-size: 11px; font-weight: 900; margin: 2px 0;">D/1248/2012</span>
          <span style="font-size: 9px; font-weight: bold;">${advocate.toUpperCase()}</span>
          <span style="font-size: 7px; color: #1e3a8a;">DATE: ${dateStr}</span>
          <span style="font-size: 7px; font-weight: 700;">★ VERIFIED SEAL ★</span>
        </div>
      </div>
    `;

    editor.chain().focus().insertContent(sealHtml).run();
    setSaveStatus("Inserted Digital Chamber Seal!");
    setTimeout(() => setSaveStatus(null), 2500);
  };

  // Export as Word (.doc)
  const handleExportWord = async () => {
    if (!editor) return;
    setSaving(true);
    setSaveStatus("Generating Word Doc...");

    try {
      const res = await fetch("/api/drafts/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draftTitle || "Legal_Petition",
          html_content: editor.getHTML(),
          format: "doc",
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${(draftTitle || "Legal_Petition").replace(/[^a-zA-Z0-9_-]/g, "_")}.doc`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setSaveStatus("Word document downloaded!");
      } else {
        setSaveStatus("Export failed");
      }
    } catch (err) {
      setSaveStatus("Error generating export");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  // Collaboration: Add Inline Chamber Comment
  const handleAddComment = () => {
    if (!newCommentText.trim() || !editor) return;
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ");

    const newComment: ChamberComment = {
      id: `comm-${Date.now()}`,
      author: "Adv. Rajesh Sharma",
      authorRole: "Senior Advocate",
      text: newCommentText.trim(),
      quoteExcerpt: selectedText || undefined,
      timestamp: "Just now",
      resolved: false,
    };

    setComments((prev) => [newComment, ...prev]);
    setNewCommentText("");
    setShowCommentsRail(true);
    setSaveStatus("Chamber comment added!");
    setTimeout(() => setSaveStatus(null), 2500);
  };

  // Track Changes: Accept All / Reject All
  const handleAcceptAllSuggestions = () => {
    if (!editor) return;
    let html = editor.getHTML();
    // Remove suggestion wrappers, keep content
    html = html.replace(/<span class="suggestion-add"[^>]*>(.*?)<\/span>/gi, "$1");
    html = html.replace(/<span class="suggestion-del"[^>]*>.*?<\/span>/gi, "");
    editor.commands.setContent(html);
    setSaveStatus("Accepted all suggestions!");
    setTimeout(() => setSaveStatus(null), 2500);
  };

  const handleRejectAllSuggestions = () => {
    if (!editor) return;
    let html = editor.getHTML();
    // Remove added suggestions, restore deleted
    html = html.replace(/<span class="suggestion-add"[^>]*>.*?<\/span>/gi, "");
    html = html.replace(/<span class="suggestion-del"[^>]*>(.*?)<\/span>/gi, "$1");
    editor.commands.setContent(html);
    setSaveStatus("Rejected all suggestions!");
    setTimeout(() => setSaveStatus(null), 2500);
  };

  // Snapshot Versioning
  const handleCreateSnapshot = () => {
    if (!editor) return;
    const label = prompt("Enter a label for this version snapshot:", `Version ${snapshots.length + 1}`) || `Revision ${snapshots.length + 1}`;
    const newSnapshot: VersionSnapshot = {
      id: `snap-${Date.now()}`,
      label,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      html: editor.getHTML(),
    };
    setSnapshots((prev) => [newSnapshot, ...prev]);
    setSaveStatus(`Created snapshot "${label}"!`);
    setTimeout(() => setSaveStatus(null), 2500);
  };

  const handleRestoreSnapshot = (snap: VersionSnapshot) => {
    if (!editor) return;
    if (confirm(`Restore draft to "${snap.label}" from ${snap.timestamp}? Current unsaved edits will be overwritten.`)) {
      editor.commands.setContent(snap.html);
      setSaveStatus(`Restored to "${snap.label}"`);
      setTimeout(() => setSaveStatus(null), 2500);
    }
  };

  // Insert Standard Legal Clause
  const insertClause = (clauseType: string) => {
    if (!editor) return;
    const client = activeCase?.ClientName || "[Client Name]";
    const advocate = activeCase?.AdvocateName || "Adv. Rajesh Sharma";
    const currentDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    if (clauseType === "verification" || clauseType === "verification_fresh_page") {
      editor
        .chain()
        .focus()
        .insertContent(
          `<h2 style="text-align: center; font-weight: bold; margin-top: 24px; text-decoration: underline;">VERIFICATION</h2>` +
            `<p style="margin-top: 14px; text-align: justify;">Verified at New Delhi on this <b>${currentDate}</b> that the contents of paragraphs 1 to _____ of the above petition are true and correct to the best of my knowledge and belief, and based on information received and believed to be true. No part of it is false and nothing material has been concealed therefrom.</p>` +
            `<p style="text-align: right; margin-top: 40px;"><b>DEPONENT</b></p>`
        )
        .run();
    } else if (clauseType === "hindi_verification") {
      editor
        .chain()
        .focus()
        .insertContent(
          `<h2 style="text-align: center; font-weight: bold; margin-top: 24px; text-decoration: underline;">सत्यापन (VERIFICATION)</h2>` +
            `<p style="margin-top: 14px; text-align: justify; font-family: 'Noto Sans Devanagari', 'Mangal', sans-serif;">मैं, उपरोक्त शपथकर्ता, सत्यनिष्ठा से सत्यापित करता/करती हूँ कि इस याचिका के पैरा 1 से _____ तक की अंतर्वस्तु मेरे निजी ज्ञान और प्राप्त सूचना के आधार पर सत्य एवं सही है। इसका कोई भी अंश असत्य नहीं है और न ही कोई तात्विक तथ्य छिपाया गया है।</p>` +
            `<p style="margin-top: 10px;">स्थान: नई दिल्ली<br/>दिनांक: <b>${currentDate}</b></p>` +
            `<p style="text-align: right; margin-top: 30px;"><b>शपथकर्ता (DEPONENT)</b></p>`
        )
        .run();
    } else if (clauseType === "affidavit_oath" || clauseType === "affidavit_fresh_page") {
      editor
        .chain()
        .focus()
        .insertContent(
          `<h2 style="text-align: center; font-weight: bold; margin-top: 24px; text-decoration: underline;">AFFIDAVIT ON BEHALF OF THE APPLICANT</h2>` +
            `<p style="margin-top: 16px; text-align: justify;">I, <b>${client}</b>, S/o Late Shri ________________, aged about _____ years, residing at _____________________________________, do hereby solemnly affirm and declare on oath as under:-</p>` +
            `<ol style="margin-top: 12px;">` +
            `<li>That I am the Applicant in the accompanying matter and am fully conversant with the facts of the case, hence competent to swear this affidavit.</li>` +
            `<li>That the contents of the accompanying petition have been read over and explained to me in vernacular, and I state that the same are true and correct to my knowledge.</li>` +
            `</ol>` +
            `<p style="text-align: right; margin-top: 40px;"><b>DEPONENT</b></p>` +
            `<div style="margin-top: 35px; border-top: 1px dashed #94a3b8; padding-top: 12px; font-size: 11pt;">` +
            `<p><b>ATTESTED BY OATH COMMISSIONER:</b><br/>Solemnly affirmed and signed before me by the Deponent on this <b>${currentDate}</b> at New Delhi.</p>` +
            `</div>`
        )
        .run();
    } else if (clauseType === "prayer_header") {
      editor
        .chain()
        .focus()
        .insertContent(
          `<h2 style="text-align: center; font-weight: bold; margin-top: 24px; text-decoration: underline;">PRAYER</h2>` +
            `<p>Wherefore, in the light of the facts and circumstances stated hereinabove, it is most respectfully prayed that this Hon'ble Court may graciously be pleased to:-</p>`
        )
        .run();
    } else if (clauseType === "urgent_memo") {
      editor
        .chain()
        .focus()
        .insertContent(
          `<div style="border: 2px solid #0f172a; padding: 12px; margin-top: 15px; margin-bottom: 20px;">` +
            `<p style="text-align: center; font-weight: bold; text-decoration: underline; margin: 0;">MEMO OF URGENCY</p>` +
            `<p style="margin-top: 8px; font-size: 12pt;">Kindly list the accompanying application for urgent hearing on <b>${currentDate}</b> as the matter involves immediate threat to personal liberty under Article 21 of the Constitution of India.</p>` +
            `<p style="text-align: right; margin: 0;"><b>COUNSEL FOR APPLICANT</b></p>` +
            `</div>`
        )
        .run();
    }
  };

  // Text Transform: Uppercase / Title Case / Lowercase
  const transformSelectedText = (type: "upper" | "title" | "lower") => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ");
    if (!selectedText) return;

    let newText = selectedText;
    if (type === "upper") {
      newText = selectedText.toUpperCase();
    } else if (type === "lower") {
      newText = selectedText.toLowerCase();
    } else if (type === "title") {
      newText = selectedText.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase());
    }

    editor.chain().focus().insertContentAt({ from, to }, newText).run();
  };

  // Right-Click Context Menu Handler
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ");
    const isInsideTable = editor.isActive("table");

    const menuWidth = 270;
    const menuHeight = 440;
    const x = Math.min(e.clientX, window.innerWidth - menuWidth - 10);
    const y = Math.min(e.clientY, window.innerHeight - menuHeight - 10);

    setContextMenu({
      x,
      y,
      visible: true,
      isInsideTable,
      hasSelection: from !== to && selectedText.trim().length > 0,
      selectedText,
    });
  };

  // Find & Replace Handler
  const handleFind = () => {
    if (!editor || !findQuery.trim()) return;
    const content = editor.getHTML();
    const regex = new RegExp(findQuery, "gi");
    const matches = content.match(regex);
    setFindMatchCount(matches ? matches.length : 0);
  };

  const handleReplaceAll = (customFind?: string, customReplace?: string) => {
    if (!editor) return;
    const f = customFind || findQuery;
    const r = customReplace !== undefined ? customReplace : replaceQuery;
    if (!f.trim()) return;

    const currentHtml = editor.getHTML();
    const regex = new RegExp(f, "g");
    const updatedHtml = currentHtml.replace(regex, r);
    editor.commands.setContent(updatedHtml);
    setFindMatchCount(0);
    setSaveStatus(`Replaced "${f}" with "${r}"`);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  // Court Margin Preset Mapping
  const getMarginClass = () => {
    if (marginPreset === "high_court") {
      return "pl-[45mm] pr-[25mm] pt-[25mm] pb-[25mm]";
    } else if (marginPreset === "district_court") {
      return "pl-[32mm] pr-[25mm] pt-[25mm] pb-[25mm]";
    }
    return "pl-[25mm] pr-[25mm] pt-[25mm] pb-[25mm]";
  };

  // Save Draft to SQLite / Cloud via /api/drafts
  const handleSaveDraft = async () => {
    if (!editor) return;
    setSaving(true);
    setSaveStatus("Saving...");

    try {
      const htmlContent = editor.getHTML();
      const layoutComment = `<!-- CD_LAYOUT: ${JSON.stringify({
        font: fontFamily,
        fontSize: parseInt(fontSize, 10) || 14,
        lineHeight: parseFloat(lineHeight) || 1.8,
        pageSize,
        margins,
        courtPreset,
        letterheadSpace: letterheadSpace ? 65 : 0,
      })} -->\n`;

      const fullPayload = layoutComment + htmlContent;

      const res = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentDraftId || undefined,
          case_id: activeCase?.id || null,
          case_title: activeCase?.CaseTitle || null,
          client_name: activeCase?.ClientName || null,
          case_number: activeCase?.case_number || null,
          title: draftTitle || "Untitled Legal Draft",
          template_type: selectedTemplate,
          html_content: fullPayload,
          author_name: user?.name || "Adv. Rajesh Sharma",
          author_role: user?.role || "Senior Advocate",
          chamber_id: "delhi_main_chamber",
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.draft?.id) {
          setCurrentDraftId(data.draft.id);
        }
        setSaveStatus("Saved to Chamber!");
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        setSaveStatus("Save failed");
      }
    } catch (err) {
      setSaveStatus("Error saving");
    } finally {
      setSaving(false);
    }
  };

  // Open & Load an Existing Saved Draft into TipTap
  const handleLoadDraft = (draft: SavedDraftItem) => {
    if (!editor) return;
    setCurrentDraftId(draft.id);
    setDraftTitle(draft.title);

    if (draft.case_id) {
      setSelectedCaseId(draft.case_id.toString());
    }

    if (draft.template_type) {
      setSelectedTemplate(draft.template_type);
    }

    let contentToLoad = draft.html_content || "<p>Empty draft</p>";

    // Extract CD_LAYOUT metadata if present
    const layoutMatch = contentToLoad.match(/<!-- CD_LAYOUT: (\{.*?\}) -->/);
    if (layoutMatch) {
      try {
        const layoutConfig = JSON.parse(layoutMatch[1]);
        if (layoutConfig.font) setFontFamily(layoutConfig.font);
        if (layoutConfig.fontSize) setFontSize(`${layoutConfig.fontSize}pt`);
        if (layoutConfig.lineHeight) setLineHeight(String(layoutConfig.lineHeight));
        if (layoutConfig.pageSize) setPageSize(layoutConfig.pageSize);
        if (layoutConfig.margins) setMargins(layoutConfig.margins);
        if (layoutConfig.courtPreset) setCourtPreset(layoutConfig.courtPreset);
        if (layoutConfig.letterheadSpace !== undefined) {
          setLetterheadSpace(layoutConfig.letterheadSpace > 0);
        }
        contentToLoad = contentToLoad.replace(/<!-- CD_LAYOUT: \{.*?\} -->\n?/, "");
      } catch (err) {
        console.warn("Failed to parse CD_LAYOUT config:", err);
      }
    }

    editor.commands.setContent(contentToLoad);
    setShowSavedDraftsModal(false);
    setSaveStatus(`Loaded "${draft.title}"`);
    setTimeout(() => setSaveStatus(null), 3000);

    requestAnimationFrame(() => {
      recalculatePageBreaksAndSpacers();
    });
  };

  // Apply a Statutory or Custom Chamber Template
  const handleSelectTemplate = (template: TemplateItem) => {
    if (!editor) return;
    setSelectedTemplate(template.template_type);
    setCurrentDraftId(null); // Fresh document ready to save

    let newHtml = "";
    if (template.is_custom && template.html_content) {
      let processed = template.html_content;

      // Extract and restore layout if present
      const layoutMatch = processed.match(/<!-- CD_LAYOUT: (\{.*?\}) -->/);
      if (layoutMatch) {
        try {
          const layoutConfig = JSON.parse(layoutMatch[1]);
          if (layoutConfig.font) setFontFamily(layoutConfig.font);
          if (layoutConfig.fontSize) setFontSize(`${layoutConfig.fontSize}pt`);
          if (layoutConfig.lineHeight) setLineHeight(String(layoutConfig.lineHeight));
          if (layoutConfig.pageSize) setPageSize(layoutConfig.pageSize);
          if (layoutConfig.margins) setMargins(layoutConfig.margins);
          processed = processed.replace(/<!-- CD_LAYOUT: \{.*?\} -->\n?/, "");
        } catch (e) {
          console.warn("Template layout parse error:", e);
        }
      }

      // Variable interpolation for the active case
      const courtName = activeCase?.court_name || "IN THE HON'BLE DISTRICT & SESSIONS COURT, DELHI";
      const caseNumber = activeCase?.case_number || "CRIMINAL MISC. NO. ______ / 2026";
      const clientName = activeCase?.ClientName || "Applicant / Accused";
      const oppParty = activeCase?.OppositeParty || "State of NCT of Delhi";
      const firNo = activeCase?.crime_number || "FIR No. _____ / 2025";
      const advocateName = activeCase?.AdvocateName || user?.name || "Adv. Rajesh Sharma";
      const currentDate = new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      processed = processed
        .replace(/\{\{Court_Name\}\}/gi, courtName)
        .replace(/\{\{Case_Number\}\}/gi, caseNumber)
        .replace(/\{\{Client_Name\}\}/gi, clientName)
        .replace(/\{\{Opposite_Party\}\}/gi, oppParty)
        .replace(/\{\{FIR_No\}\}/gi, firNo)
        .replace(/\{\{Advocate_Name\}\}/gi, advocateName)
        .replace(/\{\{Current_Date\}\}/gi, currentDate);

      newHtml = processed;
    } else {
      newHtml = getTemplateContent(template.template_type, activeCase);
    }

    editor.commands.setContent(newHtml);
    setDraftTitle(`${template.title} - ${activeCase?.ClientName || "Untitled Case"}`);
    setSaveStatus(`Applied "${template.title}" template`);
    setTimeout(() => setSaveStatus(null), 3000);

    requestAnimationFrame(() => {
      recalculatePageBreaksAndSpacers();
    });
  };

  // Save current document as reusable chamber template
  const handleSaveCurrentAsTemplate = async (meta: {
    title: string;
    category: string;
    description: string;
  }) => {
    if (!editor) return;
    const htmlContent = editor.getHTML();
    const layoutComment = `<!-- CD_LAYOUT: ${JSON.stringify({
      font: fontFamily,
      fontSize: parseInt(fontSize, 10) || 14,
      lineHeight: parseFloat(lineHeight) || 1.8,
      pageSize,
      margins,
      courtPreset,
      letterheadSpace: letterheadSpace ? 65 : 0,
    })} -->\n`;

    const fullPayload = layoutComment + htmlContent;

    const res = await fetch("/api/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: meta.title,
        template_type: "custom",
        template_category: meta.category,
        template_description: meta.description,
        is_custom_template: 1,
        html_content: fullPayload,
        author_name: user?.name || "Adv. Rajesh Sharma",
        author_role: user?.role || "Senior Advocate",
        chamber_id: "delhi_main_chamber",
      }),
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to save template");
    }

    setSaveStatus(`Saved "${meta.title}" to Chamber Templates!`);
    setTimeout(() => setSaveStatus(null), 3500);
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-100 dark:bg-slate-950 select-text overflow-hidden">
      {/* Sticky Modular Legal TipTap Toolbar */}
      <DraftToolbar
        editor={editor}
        draftTitle={draftTitle}
        setDraftTitle={setDraftTitle}
        saving={saving}
        saveStatus={saveStatus}
        handleSaveDraft={handleSaveDraft}
        row1Expanded={row1Expanded}
        setRow1Expanded={setRow1Expanded}
        row3Expanded={row3Expanded}
        setRow3Expanded={setRow3Expanded}
        editorMode={editorMode}
        setEditorMode={setEditorMode}
        showDossierSplit={showDossierSplit}
        setShowDossierSplit={setShowDossierSplit}
        showCommentsRail={showCommentsRail}
        setShowCommentsRail={setShowCommentsRail}
        commentsCount={comments.length}
        handleCourtPrint={handleCourtPrint}
        setShowSnapshotsDrawer={setShowSnapshotsDrawer}
        setShowFindReplace={setShowFindReplace}
        setShowWhatsAppModal={setShowWhatsAppModal}
        showOutline={showOutline}
        setShowOutline={setShowOutline}
        fontFamily={fontFamily}
        setFontFamily={setFontFamily}
        fontSize={fontSize}
        setFontSize={setFontSize}
        lineHeight={lineHeight}
        setLineHeight={setLineHeight}
        courtPreset={courtPreset}
        applyCourtPreset={applyCourtPreset}
        marginPreset={marginPreset}
        margins={margins}
        setMargins={setMargins}
        setMarginPreset={setMarginPreset}
        showMarginPopover={showMarginPopover}
        setShowMarginPopover={setShowMarginPopover}
        marginUnit={marginUnit}
        setMarginUnit={setMarginUnit}
        showRuler={showRuler}
        setShowRuler={setShowRuler}
        showLineNumbers={showLineNumbers}
        setShowLineNumbers={setShowLineNumbers}
        watermark={watermark}
        setWatermark={setWatermark}
        letterheadSpace={letterheadSpace}
        setLetterheadSpace={setLetterheadSpace}
        zoomLevel={zoomLevel}
        setZoomLevel={setZoomLevel}
        setShowHeaderFooterModal={setShowHeaderFooterModal}
        insertClause={insertClause}
        hindiMode={hindiMode}
        setHindiMode={setHindiMode}
        onOpenSavedDrafts={() => setShowSavedDraftsModal(true)}
        onOpenTemplatesLibrary={() => setShowTemplatesModal(true)}
        onOpenSaveAsTemplate={() => setShowSaveAsTemplateModal(true)}
        currentUser={user}
      />

      {/* Margins Popover Modal */}
      <div className="relative">
        <MarginsPopover
          isOpen={showMarginPopover}
          onClose={() => setShowMarginPopover(false)}
          margins={margins}
          setMargins={setMargins}
          setMarginPreset={setMarginPreset}
          marginUnit={marginUnit}
        />
      </div>

        {/* Find & Replace Floating Toolbar */}
        {showFindReplace && (
          <div className="px-4 py-2 bg-amber-50/90 dark:bg-slate-800/90 border-t border-amber-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs animate-fade-in">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <div className="flex items-center space-x-1">
                <Search className="w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Find in draft..."
                  value={findQuery}
                  onChange={(e) => setFindQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFind()}
                  className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 w-36 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center space-x-1">
                <Replace className="w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Replace with..."
                  value={replaceQuery}
                  onChange={(e) => setReplaceQuery(e.target.value)}
                  className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 w-36 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <button
                onClick={handleFind}
                className="px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-[11px] font-semibold"
              >
                Find
              </button>
              <button
                onClick={() => handleReplaceAll()}
                className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold"
              >
                Replace All
              </button>

              {findMatchCount !== null && (
                <span className="text-[11px] text-slate-500 font-mono">
                  {findMatchCount > 0 ? `${findMatchCount} match(es)` : "No matches found"}
                </span>
              )}
            </div>

            {/* Quick Litigation Reform Swappers */}
            <div className="flex items-center space-x-1 text-[11px]">
              <span className="text-slate-500">Quick Swap:</span>
              <button
                onClick={() => handleReplaceAll("Cr.P.C.", "BNSS, 2023")}
                className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:border-amber-500 text-slate-700 dark:text-slate-200"
                title="Swap CrPC with Bharatiya Nagarik Suraksha Sanhita, 2023"
              >
                CrPC ➔ BNSS
              </button>
              <button
                onClick={() => handleReplaceAll("IPC", "BNS, 2023")}
                className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:border-amber-500 text-slate-700 dark:text-slate-200"
                title="Swap IPC with Bharatiya Nyaya Sanhita, 2023"
              >
                IPC ➔ BNS
              </button>
              <button
                onClick={() => setShowFindReplace(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      {/* Studio Workspace Layout */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        {/* Split Screen Dossier Pane (Category 3) */}
        {showDossierSplit && (
          <DossierSplitPane
            activeCase={activeCase}
            onQuoteSnippet={handleQuoteSnippet}
            onClose={() => setShowDossierSplit(false)}
          />
        )}

        {/* Document Outline Drawer */}
        {showOutline && (
          <div className="no-print w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 overflow-y-auto flex flex-col space-y-3 shrink-0 animate-slide-in-right">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                <BookOpen className="w-4 h-4 text-amber-500" />
                <span>Petition Outline</span>
              </div>
              <button
                onClick={() => setShowOutline(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {outline.length === 0 ? (
              <p className="text-xs text-slate-400 leading-relaxed">
                Add Headings (H1, H2) to see your document outline structure here.
              </p>
            ) : (
              <div className="space-y-1.5">
                {outline.map((item, idx) => (
                  <div
                    key={idx}
                    className={`text-xs py-1 px-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors line-clamp-2 ${
                      item.level === 1
                        ? "font-bold text-slate-900 dark:text-white"
                        : item.level === 2
                        ? "pl-3 font-semibold text-slate-700 dark:text-slate-300"
                        : "pl-6 text-slate-500"
                    }`}
                  >
                    {item.text || "Untitled Section"}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Floating Bubble Menu (Selection Toolbar) */}
        {editor && (
          <BubbleMenu
            editor={editor}
            className="no-print flex items-center bg-slate-950/95 text-white backdrop-blur-md px-2 py-1 rounded-xl shadow-2xl border border-slate-800 space-x-1 z-50 text-xs"
          >
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1 rounded hover:bg-slate-800 ${editor.isActive("bold") ? "text-amber-400 font-bold" : ""}`}
              title="Bold"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1 rounded hover:bg-slate-800 ${editor.isActive("italic") ? "text-amber-400" : ""}`}
              title="Italic"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`p-1 rounded hover:bg-slate-800 ${editor.isActive("underline") ? "text-amber-400" : ""}`}
              title="Underline"
            >
              <UnderlineIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHighlight({ color: "#fef08a" }).run()}
              className="p-1 rounded hover:bg-slate-800 text-yellow-400"
              title="Highlight"
            >
              <Highlighter className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-4 bg-slate-800 my-auto" />
            <button
              onClick={() => transformSelectedText("upper")}
              className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-[10px] font-mono font-bold text-amber-400"
              title="Convert to UPPERCASE"
            >
              AA
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign("justify").run()}
              className={`p-1 rounded hover:bg-slate-800 ${editor.isActive({ textAlign: "justify" }) ? "text-amber-400" : ""}`}
              title="Justify"
            >
              <AlignJustify className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setShowCommentsRail(true);
                setNewCommentText("");
              }}
              className="p-1 rounded hover:bg-slate-800 text-amber-400"
              title="Add Comment"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
          </BubbleMenu>
        )}

        {/* Main Studio Viewport (MS Word Physical Paged Canvas with Fixed Sheet Dimensions) */}
        <div
          onContextMenu={handleContextMenu}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-auto py-8 sm:py-12 px-4 flex justify-center items-start print:p-0 print:m-0 print:overflow-visible bg-slate-100/90 dark:bg-zinc-950"
        >
          <div
            style={{
              width: `${PAGE_CONFIG[pageSize].width}px`,
              minHeight: `${stats.pages * PAGE_CONFIG[pageSize].height + (stats.pages - 1) * 36}px`,
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: "top center",
              transition: "transform 0.15s ease-out, width 0.2s ease-out",
            }}
            className="relative legal-print-canvas print:transform-none select-text"
          >
            {/* Top Horizontal Scale / Physical Court Ruler (Width) */}
            {showRuler && (
              <div className="mb-0 flex justify-center">
                <CourtPageRuler
                  pageSize={pageSize}
                  margins={margins}
                  headerFooterConfig={headerFooterConfig}
                  sheetNumber={1}
                  letterheadSpace={letterheadSpace}
                  unit={marginUnit}
                  onUnitChange={setMarginUnit}
                  showHorizontal={true}
                  showVertical={false}
                />
              </div>
            )}

            {/* Paper Desk Workspace (Sheets Stack + Content Canvas sharing exact Sheet 1 Origin) */}
            <div className="relative">
              {/* Background Physical Sheets Stack (Pixel-Perfect Physical Paper Cards) */}
              <div className="flex flex-col gap-9 select-none pointer-events-none print:gap-0">
              {Array.from({ length: Math.max(1, stats.pages) }, (_, pageIndex) => {
                const sheetNumber = pageIndex + 1;
                const sheetHeight = PAGE_CONFIG[pageSize].height;
                const sheetWidth = PAGE_CONFIG[pageSize].width;

                return (
                  <div key={sheetNumber} className="relative">
                    {/* Left Vertical Physical Page Height Scale Ruler */}
                    {showRuler && (
                      <CourtPageRuler
                        pageSize={pageSize}
                        margins={margins}
                        headerFooterConfig={headerFooterConfig}
                        sheetNumber={sheetNumber}
                        letterheadSpace={letterheadSpace}
                        unit={marginUnit}
                        onUnitChange={setMarginUnit}
                        showHorizontal={false}
                        showVertical={true}
                      />
                    )}

                    <div
                      style={{
                        width: `${sheetWidth}px`,
                        height: `${sheetHeight}px`,
                      }}
                      className={`relative bg-white text-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-slate-200/90 dark:border-zinc-800 rounded-xs flex flex-col justify-between overflow-hidden print:shadow-none print:border-none print:m-0 print:overflow-hidden legal-canvas-${pageSize}`}
                    >
                      {/* Consistent Running Court Header on Every Physical Sheet */}
                      <CourtRunningHeader
                        courtName={activeCase?.court_name}
                        caseNumber={activeCase?.case_number}
                        margins={margins}
                        sheetNumber={sheetNumber}
                        config={headerFooterConfig}
                        unit={marginUnit}
                      />

                      {/* Watermark Overlay (Centered on Every Sheet) */}
                      {watermark !== "NONE" && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
                          <span className="text-8xl font-black text-slate-900 opacity-[0.04] tracking-widest -rotate-45 uppercase">
                            {watermark}
                          </span>
                        </div>
                      )}

                      {/* Letterhead Top Clearance Spacing (Only on Sheet 1 if toggled) */}
                      {sheetNumber === 1 && letterheadSpace && (
                        <div className="h-[65mm] border-b border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs font-mono select-none">
                          [ 2.5" Reserved For Printed Chamber Letterhead & Seal ]
                        </div>
                      )}

                      {/* Court Margin Line Numbering Strip (1–32) for Each Physical Sheet */}
                      {showLineNumbers && (
                        <div
                          style={{
                            position: "absolute",
                            top: sheetNumber === 1 && letterheadSpace ? "75mm" : "42mm",
                            left: "6mm",
                            bottom: "42mm",
                            width: "20px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            fontFamily: "monospace",
                            fontSize: "11px",
                            color: "#94a3b8",
                            userSelect: "none",
                            pointerEvents: "none",
                            borderRight: "1px solid #cbd5e1",
                            paddingRight: "4px",
                            zIndex: 5,
                          }}
                        >
                          {Array.from({ length: 32 }, (_, i) => (
                            <div key={i + 1} className="text-right leading-none">
                              {i + 1}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Visual Printable Margin Boundary (Red Color with Dimensions in active unit) */}
                      {(() => {
                        const mmToPx = 3.779527559;
                        const sheetHeightFormatted = formatUnitVal(PAGE_CONFIG[pageSize].height / mmToPx, marginUnit);
                        const sheetWidthFormatted = formatUnitVal(PAGE_CONFIG[pageSize].width / mmToPx, marginUnit);
                        const topMarginFormatted = formatUnitVal(margins.top, marginUnit);
                        const bottomMarginFormatted = formatUnitVal(margins.bottom, marginUnit);
                        const leftMarginFormatted = formatUnitVal(margins.left, marginUnit);
                        const rightMarginFormatted = formatUnitVal(margins.right, marginUnit);
                        const hasHeader = headerFooterConfig.showHeader && (!headerFooterConfig.differentFirstPage || sheetNumber !== 1);
                        const hasFooter = headerFooterConfig.showFooter;
                        const headerFormatted = hasHeader ? formatUnitVal(38 / mmToPx, marginUnit) : "0";
                        const footerFormatted = hasFooter ? formatUnitVal(38 / mmToPx, marginUnit) : "0";
                        const printableMm = (PAGE_CONFIG[pageSize].height / mmToPx) - (hasHeader ? 38 / mmToPx : 0) - (hasFooter ? 38 / mmToPx : 0) - margins.top - margins.bottom - (sheetNumber === 1 && letterheadSpace ? 65 : 0);
                        const printableHeightFormatted = formatUnitVal(printableMm, marginUnit);

                        return (
                          <div
                            style={{
                              position: "absolute",
                              top: `${(hasHeader ? 38 : 0) + (sheetNumber === 1 && letterheadSpace ? Math.round(65 * mmToPx) : 0) + Math.round(margins.top * mmToPx)}px`,
                              bottom: `${(hasFooter ? 38 : 0) + Math.round(margins.bottom * mmToPx)}px`,
                              left: `${margins.left}mm`,
                              right: `${margins.right}mm`,
                              pointerEvents: "none",
                            }}
                            className="border-2 border-dashed border-red-500/80 dark:border-red-500/90 no-print z-0"
                          >
                            {/* Top-Left Corner Margin Crop Mark */}
                            <span className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-red-600 dark:border-red-400" />
                            {/* Top-Right Corner Margin Crop Mark */}
                            <span className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-red-600 dark:border-red-400" />
                            {/* Bottom-Left Corner Margin Crop Mark */}
                            <span className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-red-600 dark:border-red-400" />
                            {/* Bottom-Right Corner Margin Crop Mark */}
                            <span className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-red-600 dark:border-red-400" />

                            {/* Top Margin Indicator */}
                            <div className="absolute -top-5 left-2 px-2 py-0.5 rounded bg-red-600 text-white text-[9px] font-mono font-bold tracking-tight shadow-xs flex items-center space-x-1.5 select-none pointer-events-none">
                              <span>▲ Top Margin: {topMarginFormatted}</span>
                              {hasHeader && (
                                <>
                                  <span>•</span>
                                  <span>Header: {headerFormatted}</span>
                                </>
                              )}
                            </div>

                            {/* Left Margin Indicator */}
                            <div className="absolute top-1/2 -left-4 -translate-y-1/2 -rotate-90 origin-center px-1.5 py-0.5 rounded bg-red-50 dark:bg-zinc-900 border border-red-400 text-red-700 dark:text-red-400 text-[8.5px] font-mono font-bold select-none pointer-events-none whitespace-nowrap">
                              Left: {leftMarginFormatted}
                            </div>

                            {/* Right Margin Indicator */}
                            <div className="absolute top-1/2 -right-4 -translate-y-1/2 rotate-90 origin-center px-1.5 py-0.5 rounded bg-red-50 dark:bg-zinc-900 border border-red-400 text-red-700 dark:text-red-400 text-[8.5px] font-mono font-bold select-none pointer-events-none whitespace-nowrap">
                              Right: {rightMarginFormatted}
                            </div>

                            {/* Printable Height Right Badge */}
                            <div className="absolute -top-5 right-2 px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/80 border border-red-400 text-red-700 dark:text-red-300 text-[9px] font-mono font-bold select-none pointer-events-none">
                              Printable Height: {printableHeightFormatted}
                            </div>

                            {/* Bottom Margin Indicator */}
                            <div className="absolute -bottom-5 right-2 px-2 py-0.5 rounded bg-red-600 text-white text-[9px] font-mono font-bold tracking-tight shadow-xs flex items-center space-x-1.5 select-none pointer-events-none">
                              <span>▼ Bottom Margin: {bottomMarginFormatted}</span>
                              {hasFooter && (
                                <>
                                  <span>•</span>
                                  <span>Footer: {footerFormatted}</span>
                                </>
                              )}
                              <span>•</span>
                              <span>Total Sheet: {sheetHeightFormatted} ({sheetWidthFormatted} × {sheetHeightFormatted})</span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Middle flexible space between header and footer */}
                      <div className="flex-1" />

                      {/* Consistent Running Court Footer on Every Physical Sheet */}
                      <CourtRunningFooter
                        advocateName={activeCase?.AdvocateName}
                        currentPage={sheetNumber}
                        totalPages={stats.pages}
                        paperName={PAGE_CONFIG[pageSize].shortName}
                        margins={margins}
                        config={headerFooterConfig}
                        unit={marginUnit}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Visual Sheet Gap Labels (Rendered between sheets on the desk) */}
            {Array.from({ length: Math.max(0, stats.pages - 1) }, (_, i) => {
              const sheetHeight = PAGE_CONFIG[pageSize].height;
              const gapHeight = 36;
              const topOffset = (i + 1) * sheetHeight + i * gapHeight;

              return (
                <div
                  key={`gap-${i}`}
                  style={{
                    position: "absolute",
                    top: `${topOffset}px`,
                    left: 0,
                    width: `${PAGE_CONFIG[pageSize].width}px`,
                    height: `${gapHeight}px`,
                    zIndex: 15,
                    pointerEvents: "none",
                  }}
                  className="no-print flex items-center justify-center select-none"
                >
                  <div className="px-3 py-0.5 rounded-full bg-white/95 dark:bg-zinc-900/95 border border-slate-300 dark:border-zinc-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center space-x-1.5 shadow-sm backdrop-blur-xs">
                    <span>📄</span>
                    <span className="tracking-wider uppercase">
                      Sheet {i + 2} ({PAGE_CONFIG[pageSize].shortName} • {PAGE_CONFIG[pageSize].width} × {sheetHeight}px)
                    </span>
                  </div>
                </div>
              );
            })}

            {/* TipTap Document Content Canvas with Exact Printable Coordinates & 4-Side Margins */}
            <div
              ref={contentContainerRef}
              onClick={() => {
                if (editor && !editor.isFocused) {
                  editor.commands.focus();
                }
              }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: `${PAGE_CONFIG[pageSize].width}px`,
                fontFamily,
                fontSize,
                lineHeight,
                paddingLeft: `${margins.left}mm`,
                paddingRight: `${margins.right}mm`,
                paddingTop: `${(headerFooterConfig.showHeader && !headerFooterConfig.differentFirstPage ? 38 : 0) + (letterheadSpace ? Math.round(65 * 3.779527559) : 0) + Math.round(margins.top * 3.779527559)}px`,
                paddingBottom: `${Math.round(margins.bottom * 3.779527559) + (headerFooterConfig.showFooter ? 38 : 0)}px`,
                minHeight: `${PAGE_CONFIG[pageSize].height}px`,
                zIndex: 20,
              }}
              className="bg-transparent text-slate-900 dark:text-slate-100 cursor-text"
            >
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>
        </div>

        {/* Right-Hand Collaboration Rail (Category 1: Chamber Comments) */}
        {showCommentsRail && (
          <div className="no-print w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-4 flex flex-col space-y-4 shrink-0 shadow-lg z-20">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                <MessageSquare className="w-4 h-4 text-amber-500" />
                <span>Chamber Review</span>
              </div>
              <button
                onClick={() => setShowCommentsRail(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Add New Comment Box */}
            <div className="space-y-2">
              <textarea
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Leave legal note or review feedback for junior..."
                rows={3}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none text-slate-800 dark:text-slate-200"
              />
              <button
                onClick={handleAddComment}
                className="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition-all"
              >
                Post Chamber Note
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto space-y-3">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${
                    c.resolved
                      ? "bg-slate-50 dark:bg-slate-800/40 border-slate-200/50 opacity-60"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-2xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">{c.author}</span>
                    <span className="text-[10px] text-slate-400">{c.timestamp}</span>
                  </div>
                  <div className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                    {c.authorRole}
                  </div>
                  {c.quoteExcerpt && (
                    <div className="p-1.5 bg-slate-50 dark:bg-slate-700/50 rounded border-l-2 border-amber-500 text-[11px] text-slate-600 dark:text-slate-300 italic">
                      "{c.quoteExcerpt}"
                    </div>
                  )}
                  <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                    {c.text}
                  </p>
                  <div className="pt-1 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/50">
                    <button
                      onClick={() =>
                        setComments((prev) =>
                          prev.map((item) =>
                            item.id === c.id ? { ...item, resolved: !item.resolved } : item
                          )
                        )
                      }
                      className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                    >
                      {c.resolved ? "Re-open" : "✓ Mark Resolved"}
                    </button>
                    <button
                      onClick={() =>
                        setComments((prev) => prev.filter((item) => item.id !== c.id))
                      }
                      className="text-[10px] text-rose-500 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Version Snapshots Drawer (Category 1) */}
        {showSnapshotsDrawer && (
          <div className="no-print w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-4 flex flex-col space-y-4 shrink-0 shadow-lg z-20">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                <History className="w-4 h-4 text-amber-500" />
                <span>Version Snapshots</span>
              </div>
              <button
                onClick={() => setShowSnapshotsDrawer(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <button
              onClick={handleCreateSnapshot}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 font-bold text-xs hover:bg-slate-800 flex items-center justify-center space-x-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Snapshot Current Draft</span>
            </button>

            <div className="flex-1 overflow-y-auto space-y-2">
              {snapshots.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs">
                  No snapshots recorded yet. Click "Snapshot Current Draft" before major edits.
                </div>
              ) : (
                snapshots.map((snap) => (
                  <div
                    key={snap.id}
                    className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 shadow-2xs"
                  >
                    <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {snap.label}
                    </div>
                    <div className="text-[10px] text-slate-400">{snap.timestamp}</div>
                    <button
                      onClick={() => handleRestoreSnapshot(snap)}
                      className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center space-x-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restore this version</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right-Click Context Menu Overlay (Google Docs / MS Word Style) */}
      {contextMenu?.visible && (
        <div
          style={{
            position: "fixed",
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
            zIndex: 9999,
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-68 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl py-1.5 text-xs text-slate-700 dark:text-slate-200 animate-fade-in divide-y divide-slate-100 dark:divide-slate-800"
        >
          {/* Section 1: Legal Clauses & Clipboard */}
          <div className="py-1">
            <button
              onClick={() => {
                insertClause("verification");
                setContextMenu(null);
              }}
              className="w-full px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 text-left text-emerald-600 text-xs"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Insert Verification Clause</span>
            </button>
            <button
              onClick={() => {
                insertClause("affidavit_oath");
                setContextMenu(null);
              }}
              className="w-full px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 text-left text-blue-600 text-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Insert Affidavit on Oath</span>
            </button>
            <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
            <button
              onClick={() => {
                if (contextMenu.hasSelection) {
                  document.execCommand("copy");
                  setSaveStatus("Copied to clipboard");
                  setTimeout(() => setSaveStatus(null), 2000);
                }
                setContextMenu(null);
              }}
              disabled={!contextMenu.hasSelection}
              className="w-full px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between disabled:opacity-40 text-left"
            >
              <span className="flex items-center space-x-2">
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </span>
              <span className="text-[10px] text-slate-400">Ctrl+C</span>
            </button>
            <button
              onClick={() => {
                if (contextMenu.hasSelection) {
                  document.execCommand("cut");
                }
                setContextMenu(null);
              }}
              disabled={!contextMenu.hasSelection}
              className="w-full px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between disabled:opacity-40 text-left"
            >
              <span className="flex items-center space-x-2">
                <Scissors className="w-3.5 h-3.5" />
                <span>Cut</span>
              </span>
              <span className="text-[10px] text-slate-400">Ctrl+X</span>
            </button>
          </div>

          {/* Section 2: Text Case Transformations */}
          {contextMenu.hasSelection && (
            <div className="py-1">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Case Transform
              </div>
              <button
                onClick={() => {
                  transformSelectedText("upper");
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 text-left"
              >
                <Type className="w-3.5 h-3.5 text-amber-500" />
                <span>UPPERCASE (Court Heading)</span>
              </button>
              <button
                onClick={() => {
                  transformSelectedText("title");
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 text-left"
              >
                <Type className="w-3.5 h-3.5 text-blue-500" />
                <span>Title Case</span>
              </button>
              <button
                onClick={() => {
                  transformSelectedText("lower");
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 text-left"
              >
                <Type className="w-3.5 h-3.5 text-slate-400" />
                <span>lowercase</span>
              </button>
            </div>
          )}

          {/* Section 3: Legal Table Operations (Active when right-clicking table) */}
          {contextMenu.isInsideTable && (
            <div className="py-1">
              <div className="px-3 py-1 text-[10px] font-bold text-blue-500 uppercase tracking-wider">
                Table Operations
              </div>
              <button
                onClick={() => {
                  editor?.chain().focus().addRowBefore().run();
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 text-left"
              >
                <Plus className="w-3.5 h-3.5 text-blue-500" />
                <span>Insert Row Above</span>
              </button>
              <button
                onClick={() => {
                  editor?.chain().focus().addRowAfter().run();
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 text-left"
              >
                <Plus className="w-3.5 h-3.5 text-blue-500" />
                <span>Insert Row Below</span>
              </button>
              <button
                onClick={() => {
                  editor?.chain().focus().addColumnBefore().run();
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 text-left"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-500" />
                <span>Insert Column Left</span>
              </button>
              <button
                onClick={() => {
                  editor?.chain().focus().addColumnAfter().run();
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 text-left"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-500" />
                <span>Insert Column Right</span>
              </button>
              <button
                onClick={() => {
                  editor?.chain().focus().deleteRow().run();
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1 hover:bg-rose-50 text-rose-600 flex items-center space-x-2 text-left"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Row</span>
              </button>
              <button
                onClick={() => {
                  editor?.chain().focus().deleteColumn().run();
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1 hover:bg-rose-50 text-rose-600 flex items-center space-x-2 text-left"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Column</span>
              </button>
            </div>
          )}

          {/* Section 4: Quick Case Variable Insertion */}
          <div className="py-1">
            <div className="px-3 py-1 text-[10px] font-bold text-amber-500 uppercase tracking-wider">
              Insert Case Field
            </div>
            <button
              onClick={() => {
                insertVariable(activeCase?.ClientName || "{{Client_Name}}");
                setContextMenu(null);
              }}
              className="w-full px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 text-left"
            >
              <User className="w-3.5 h-3.5 text-blue-500" />
              <span>Client: {activeCase?.ClientName || "Client"}</span>
            </button>
            <button
              onClick={() => {
                insertVariable(activeCase?.case_number || "{{Case_Number}}");
                setContextMenu(null);
              }}
              className="w-full px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 text-left"
            >
              <Hash className="w-3.5 h-3.5 text-amber-500" />
              <span>Case No: {activeCase?.case_number || "Case No"}</span>
            </button>
            <button
              onClick={() => {
                insertVariable(activeCase?.court_name || "{{Court_Name}}");
                setContextMenu(null);
              }}
              className="w-full px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 text-left"
            >
              <Building className="w-3.5 h-3.5 text-purple-500" />
              <span>Court: {activeCase?.court_name ? activeCase.court_name.slice(0, 20) + "..." : "Court"}</span>
            </button>
            <button
              onClick={() => {
                insertVariable(activeCase?.Undersection || "{{Under_Sections}}");
                setContextMenu(null);
              }}
              className="w-full px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 text-left"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-500" />
              <span>Sections: {activeCase?.Undersection || "IPC/BNSS"}</span>
            </button>
          </div>

          {/* Section 5: Standard Legal Clauses */}
          <div className="py-1">
            <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Insert Court Clause
            </div>
            <button
              onClick={() => {
                insertClause("verification");
                setContextMenu(null);
              }}
              className="w-full px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 text-left"
            >
              <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Verification Clause</span>
            </button>
            <button
              onClick={() => {
                insertClause("affidavit_oath");
                setContextMenu(null);
              }}
              className="w-full px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 text-left"
            >
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              <span>Affidavit Oath Block</span>
            </button>
            <button
              onClick={() => {
                insertClause("prayer_header");
                setContextMenu(null);
              }}
              className="w-full px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 text-left"
            >
              <Scale className="w-3.5 h-3.5 text-amber-500" />
              <span>Prayer Clause</span>
            </button>
          </div>
        </div>
      )}

      {/* Header & Footer Customization Modal */}
      {showHeaderFooterModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in no-print">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2 font-bold text-sm text-slate-900 dark:text-white">
                <Sliders className="w-4 h-4 text-amber-500" />
                <span>Court Header & Footer Customization</span>
              </div>
              <button
                onClick={() => setShowHeaderFooterModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Quick Court Presets */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Quick Court Presets
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setHeaderFooterConfig((prev) => ({
                      ...prev,
                      showHeader: true,
                      showFooter: true,
                      differentFirstPage: true,
                      pageNumberStyle: "full",
                    }))
                  }
                  className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:border-amber-500 text-left transition-all group"
                >
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-200 group-hover:text-amber-500">
                    🏛️ High Court
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Header Sheets 2+, Full page no
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setHeaderFooterConfig((prev) => ({
                      ...prev,
                      showHeader: true,
                      showFooter: true,
                      differentFirstPage: false,
                      pageNumberStyle: "simple",
                    }))
                  }
                  className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:border-amber-500 text-left transition-all group"
                >
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-200 group-hover:text-amber-500">
                    ⚖️ District / Sessions
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Header on all, Page X of Y
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setHeaderFooterConfig((prev) => ({
                      ...prev,
                      showHeader: false,
                      showFooter: true,
                      differentFirstPage: true,
                      pageNumberStyle: "numOnly",
                    }))
                  }
                  className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:border-amber-500 text-left transition-all group"
                >
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-200 group-hover:text-amber-500">
                    📜 Letterhead / Clean
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    No header, Number only
                  </div>
                </button>
              </div>
            </div>

            {/* Running Header Settings */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={headerFooterConfig.showHeader}
                    onChange={(e) =>
                      setHeaderFooterConfig((prev) => ({ ...prev, showHeader: e.target.checked }))
                    }
                    className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                  />
                  <span>Show Running Court Header (Top Strip • 1.01 cm / 38px)</span>
                </label>
              </div>

              {headerFooterConfig.showHeader && (
                <div className="space-y-3 pl-6 pt-1 border-l-2 border-amber-500/30">
                  <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={headerFooterConfig.differentFirstPage}
                      onChange={(e) =>
                        setHeaderFooterConfig((prev) => ({
                          ...prev,
                          differentFirstPage: e.target.checked,
                        }))
                      }
                      className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="font-medium">
                      Different First Page (Omit header on Sheet 1 for Cause Title & Court Seal)
                    </span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          Court / Forum Title:
                        </label>
                        {activeCase?.court_name && (
                          <button
                            type="button"
                            onClick={() =>
                              setHeaderFooterConfig((prev) => ({
                                ...prev,
                                customCourtName: activeCase.court_name,
                              }))
                            }
                            className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline"
                          >
                            Fill Active Court
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder={activeCase?.court_name || "IN THE HON'BLE COURT OF SESSIONS"}
                        value={headerFooterConfig.customCourtName || ""}
                        onChange={(e) =>
                          setHeaderFooterConfig((prev) => ({
                            ...prev,
                            customCourtName: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          Case / Petition No:
                        </label>
                        {activeCase?.case_number && (
                          <button
                            type="button"
                            onClick={() =>
                              setHeaderFooterConfig((prev) => ({
                                ...prev,
                                customCaseNumber: activeCase.case_number,
                              }))
                            }
                            className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline"
                          >
                            Fill Case No
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder={activeCase?.case_number || "CRIMINAL PETITION"}
                        value={headerFooterConfig.customCaseNumber || ""}
                        onChange={(e) =>
                          setHeaderFooterConfig((prev) => ({
                            ...prev,
                            customCaseNumber: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Running Footer Settings */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={headerFooterConfig.showFooter}
                    onChange={(e) =>
                      setHeaderFooterConfig((prev) => ({ ...prev, showFooter: e.target.checked }))
                    }
                    className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                  />
                  <span>Show Running Court Footer (Bottom Strip • 1.01 cm / 38px)</span>
                </label>
              </div>

              {headerFooterConfig.showFooter && (
                <div className="space-y-3 pl-6 pt-1 border-l-2 border-amber-500/30">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          Advocate / Counsel Sign-off:
                        </label>
                        {activeCase?.AdvocateName && (
                          <button
                            type="button"
                            onClick={() =>
                              setHeaderFooterConfig((prev) => ({
                                ...prev,
                                customAdvocateName: activeCase.AdvocateName,
                              }))
                            }
                            className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline"
                          >
                            Fill Advocate
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder={activeCase?.AdvocateName || "Adv. Rajesh Sharma"}
                        value={headerFooterConfig.customAdvocateName || ""}
                        onChange={(e) =>
                          setHeaderFooterConfig((prev) => ({
                            ...prev,
                            customAdvocateName: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        Page Numbering Style:
                      </label>
                      <select
                        value={headerFooterConfig.pageNumberStyle}
                        onChange={(e: any) =>
                          setHeaderFooterConfig((prev) => ({
                            ...prev,
                            pageNumberStyle: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                      >
                        <option value="full">Page 1 of {stats.pages} ({PAGE_CONFIG[pageSize].shortName})</option>
                        <option value="simple">Page 1 of {stats.pages}</option>
                        <option value="numOnly">1, 2, 3... (Number only)</option>
                        <option value="roman">— 1 —, — 2 — (Em dash)</option>
                        <option value="none">None (No page numbers)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Live Visual Preview Box */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Live Sheet Preview (Sheets 1 & 2)
              </label>
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
                {/* Sheet 1 Preview */}
                <div className="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded p-2 text-[9px] font-mono flex flex-col justify-between h-28 shadow-2xs">
                  {headerFooterConfig.showHeader && !headerFooterConfig.differentFirstPage ? (
                    <div className="border-b border-slate-200 dark:border-zinc-800 pb-1 flex justify-between font-bold text-slate-600 dark:text-slate-400 truncate">
                      <span className="truncate">{headerFooterConfig.customCourtName || activeCase?.court_name || "COURT"}</span>
                      <span className="shrink-0">{headerFooterConfig.customCaseNumber || activeCase?.case_number || "NO."}</span>
                    </div>
                  ) : (
                    <div className="text-[8.5px] italic text-slate-400 text-center border-b border-dashed border-slate-200 dark:border-zinc-800 pb-1">
                      [ Sheet 1: Cause Title / No Running Header ]
                    </div>
                  )}

                  <div className="text-center text-slate-400 text-[8px] my-auto">
                    IN THE COURT OF...<br />CAUSE TITLE & PETITION
                  </div>

                  {headerFooterConfig.showFooter ? (
                    <div className="border-t border-slate-200 dark:border-zinc-800 pt-1 flex justify-between text-slate-500 truncate">
                      <span className="truncate">Counsel: {headerFooterConfig.customAdvocateName || activeCase?.AdvocateName || "Advocate"}</span>
                      <span className="shrink-0 font-bold">
                        {headerFooterConfig.pageNumberStyle === "full" ? `Page 1 of ${stats.pages}` : headerFooterConfig.pageNumberStyle === "numOnly" ? "1" : headerFooterConfig.pageNumberStyle === "roman" ? "— 1 —" : headerFooterConfig.pageNumberStyle === "simple" ? "Page 1 of 4" : ""}
                      </span>
                    </div>
                  ) : (
                    <div className="text-[8px] text-slate-400 text-center pt-1 border-t border-dashed border-slate-200 dark:border-zinc-800">
                      [ No Footer ]
                    </div>
                  )}
                </div>

                {/* Sheet 2 Preview */}
                <div className="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded p-2 text-[9px] font-mono flex flex-col justify-between h-28 shadow-2xs">
                  {headerFooterConfig.showHeader ? (
                    <div className="border-b border-slate-200 dark:border-zinc-800 pb-1 flex justify-between font-bold text-slate-600 dark:text-slate-400 truncate">
                      <span className="truncate">{headerFooterConfig.customCourtName || activeCase?.court_name || "COURT"}</span>
                      <span className="shrink-0">{headerFooterConfig.customCaseNumber || activeCase?.case_number || "NO."}</span>
                    </div>
                  ) : (
                    <div className="text-[8.5px] italic text-slate-400 text-center border-b border-dashed border-slate-200 dark:border-zinc-800 pb-1">
                      [ No Header ]
                    </div>
                  )}

                  <div className="text-center text-slate-400 text-[8px] my-auto">
                    PARAGRAPH CONTINUATION...<br />GROUNDS & PRAYER
                  </div>

                  {headerFooterConfig.showFooter ? (
                    <div className="border-t border-slate-200 dark:border-zinc-800 pt-1 flex justify-between text-slate-500 truncate">
                      <span className="truncate">Counsel: {headerFooterConfig.customAdvocateName || activeCase?.AdvocateName || "Advocate"}</span>
                      <span className="shrink-0 font-bold">
                        {headerFooterConfig.pageNumberStyle === "full" ? `Page 2 of ${stats.pages}` : headerFooterConfig.pageNumberStyle === "numOnly" ? "2" : headerFooterConfig.pageNumberStyle === "roman" ? "— 2 —" : headerFooterConfig.pageNumberStyle === "simple" ? "Page 2 of 4" : ""}
                      </span>
                    </div>
                  ) : (
                    <div className="text-[8px] text-slate-400 text-center pt-1 border-t border-dashed border-slate-200 dark:border-zinc-800">
                      [ No Footer ]
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() =>
                  setHeaderFooterConfig({
                    showHeader: true,
                    showFooter: true,
                    differentFirstPage: false,
                    customCourtName: "",
                    customCaseNumber: "",
                    customAdvocateName: "",
                    pageNumberStyle: "full",
                  })
                }
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Reset to Case Defaults
              </button>
              <button
                type="button"
                onClick={() => setShowHeaderFooterModal(false)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md transition-all flex items-center space-x-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp / Email Client Dispatch Modal (Category 5) */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2 font-bold text-sm text-slate-900 dark:text-white">
                <Share2 className="w-4 h-4 text-emerald-500" />
                <span>Dispatch Petition to Client</span>
              </div>
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Recipient (Client Name):
                </label>
                <input
                  type="text"
                  readOnly
                  value={activeCase?.ClientName || "Client"}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Case Reference:
                </label>
                <input
                  type="text"
                  readOnly
                  value={`${activeCase?.CaseTitle || "Legal Matter"} (${activeCase?.case_number || "CNR Pending"})`}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Message Preview:
                </label>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                  Respected {activeCase?.ClientName || "Client"},<br/><br/>
                  We have prepared the draft of <b>{draftTitle || "your legal petition"}</b> for filing before the {activeCase?.court_name || "Hon'ble Court"}.<br/><br/>
                  Please review the grounds and averments before final signing and filing.<br/><br/>
                  — Adv. Rajesh Sharma, Delhi High Court
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Respected ${activeCase?.ClientName || "Client"},\n\nWe have prepared the draft of "${draftTitle || "your legal petition"}" for filing before ${activeCase?.court_name || "Hon'ble Court"}.\n\nPlease review the grounds and particulars.\n\n— Adv. Rajesh Sharma`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-600/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send via WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Application Status Bar (MS Word / Google Docs Style) */}
      <div className="no-print bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-1.5 flex flex-wrap items-center justify-between text-xs text-slate-500 z-20">
        {/* Left: Document Statistics */}
        <div className="flex items-center space-x-4">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Page {stats.pages} of {stats.pages} ({PAGE_CONFIG[pageSize].shortName})
          </span>
          <span>•</span>
          <span>{stats.words.toLocaleString()} Words</span>
          <span>•</span>
          <span>{stats.chars.toLocaleString()} Characters</span>
          <span>•</span>
          <span className="text-amber-600 dark:text-amber-400 font-medium">
            ~{stats.pages} {PAGE_CONFIG[pageSize].shortName} Sheet{stats.pages > 1 ? "s" : ""} ({PAGE_CONFIG[pageSize].height}px)
          </span>
        </div>

        {/* Right: View & Zoom Controls */}
        <div className="flex items-center space-x-3">
          <span className="text-[11px] text-slate-400">Right-Click for Legal Context Menu</span>
          <span>•</span>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 10, 70))}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] w-8 text-center">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 10, 140))}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Chamber Saved Drafts Browser Modal */}
      <SavedDraftsModal
        isOpen={showSavedDraftsModal}
        onClose={() => setShowSavedDraftsModal(false)}
        onLoadDraft={handleLoadDraft}
        currentDraftId={currentDraftId || undefined}
      />

      {/* Statutory & Chamber Templates Library Modal */}
      <TemplatesLibraryModal
        isOpen={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
        onSelectTemplate={handleSelectTemplate}
        onOpenSaveAsTemplate={() => setShowSaveAsTemplateModal(true)}
      />

      {/* Save as Chamber Template Modal */}
      <SaveAsTemplateModal
        isOpen={showSaveAsTemplateModal}
        onClose={() => setShowSaveAsTemplateModal(false)}
        defaultTitle={draftTitle}
        onSaveTemplate={handleSaveCurrentAsTemplate}
      />
    </div>
  );
}
