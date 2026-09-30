"use client";

import React, { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  Search,
  ArrowRightLeft,
  Shield,
  Scale,
  Copy,
  Check,
  FileText,
  ExternalLink,
  ChevronRight,
  Filter,
  Sparkles,
  Award,
  Clock,
  BookMarked,
  Share2,
  CheckCircle2,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  COMPREHENSIVE_BARE_ACTS,
  ACT_DEFINITIONS,
  SectionRecord,
} from "@/data/bareActsData";

function BareActsContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialAct = searchParams.get("act") || "ALL";

  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedAct, setSelectedAct] = useState(initialAct);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyCitation = (sec: SectionRecord) => {
    const citation = `${sec.section}, ${sec.actTitle} — "${sec.title}"`;
    navigator.clipboard.writeText(citation);
    setCopiedId(sec.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredSections = useMemo(() => {
    return COMPREHENSIVE_BARE_ACTS.filter((sec) => {
      const matchesAct = selectedAct === "ALL" || sec.act === selectedAct;
      if (!matchesAct) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      return (
        sec.section.toLowerCase().includes(q) ||
        sec.title.toLowerCase().includes(q) ||
        sec.description.toLowerCase().includes(q) ||
        (sec.oldSectionRef && sec.oldSectionRef.toLowerCase().includes(q)) ||
        (sec.newSectionRef && sec.newSectionRef.toLowerCase().includes(q)) ||
        sec.chapter.toLowerCase().includes(q) ||
        sec.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [selectedAct, searchQuery]);

  // JSON-LD Legislation schema for search engines and modern LLM crawlers
  const jsonLdLegislation = {
    "@context": "https://schema.org",
    "@type": "LegislationList",
    name: "Indian Bare Acts & 2023 Criminal Laws Directory (BNS, BNSS, BSA, CPC, NI Act)",
    description:
      "Authoritative statutory directory of Indian laws cross-referenced with historic IPC and CrPC provisions.",
    legislationLegalForce: "InForce",
    hasPart: filteredSections.slice(0, 20).map((sec) => ({
      "@type": "Legislation",
      name: `${sec.section}, ${sec.actTitle} — ${sec.title}`,
      legislationType: sec.actTitle,
      text: sec.description,
      inLanguage: "en",
    })),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Inject JSON-LD Schema for LLMs and Crawlers */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdLegislation) }}
      />

      {/* Hero & Search Header */}
      <div className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-2xl p-6 sm:p-8 shadow-xs border border-zinc-200/80 dark:border-zinc-800 relative overflow-hidden">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 text-xs font-medium">
            <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>{language === "en" ? "Official Indian Statutory Corpus" : "आधिकारिक भारतीय संविधि संग्रह"}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-zinc-950 dark:text-white leading-tight">
            {language === "en" ? (
              <>
                Indian Bare Acts &amp;{" "}
                <span className="text-amber-600 dark:text-amber-400">2023 Criminal Laws</span> Directory
              </>
            ) : (
              <>
                भारतीय बेयर एक्ट्स एवं{" "}
                <span className="text-amber-600 dark:text-amber-400">नए आपराधिक कानून २०२३</span> डायरेक्टरी
              </>
            )}
          </h1>

          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
            {language === "en"
              ? "Free, authoritative legal research portal for advocates, judicial officers, law researchers, and citizens. Search Bharatiya Nyaya Sanhita (BNS), Bharatiya Nagarik Suraksha Sanhita (BNSS), and Bharatiya Sakshya Adhiniyam (BSA) cross-referenced with historic IPC, CrPC, and Evidence provisions."
              : "अधिवक्ताओं, न्यायिक अधिकारियों एवं शोधकर्ताओं हेतु निःशुल्क वैधानिक अनुसंधान पोर्टल। भारतीय न्याय संहिता (BNS), भारतीय नागरिक सुरक्षा संहिता (BNSS) एवं भारतीय साक्ष्य अधिनियम (BSA) का ऐतिहासिक आईपीसी व सीआरपीसी के साथ तुलनात्मक अध्ययन।"}
          </p>

          {/* Search Bar with Old Law Quick Converter */}
          <div className="relative pt-2">
            <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 translate-y-[-2px]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === "en"
                  ? "Search by Section (e.g. 103, 302 IPC, 420, 438 CrPC, 138 NI Act, or offence keywords)..."
                  : "धारा संख्या (जैसे 103, 302 IPC, 420, 438 CrPC) अथवा अपराध का नाम खोजें..."
              }
              className="w-full pl-11 pr-10 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white placeholder:text-zinc-400 text-xs sm:text-sm font-medium border border-zinc-200 dark:border-zinc-800 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 translate-y-[-2px] text-xs font-medium text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                {language === "en" ? "Clear" : "हटाएं"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Act Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {ACT_DEFINITIONS.map((def) => {
          const isSelected = selectedAct === def.key;
          const localizedName =
            def.key === "ALL"
              ? language === "en" ? "All Bare Acts (Universal Directory)" : "सभी बेयर एक्ट्स (सार्वभौमिक संग्रह)"
              : def.key === "BNS"
              ? language === "en" ? "Bharatiya Nyaya Sanhita, 2023 (BNS)" : "भारतीय न्याय संहिता, २०२३ (BNS)"
              : def.key === "BNSS"
              ? language === "en" ? "Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)" : "भारतीय नागरिक सुरक्षा संहिता, २०२३ (BNSS)"
              : def.key === "BSA"
              ? language === "en" ? "Bharatiya Sakshya Adhiniyam, 2023 (BSA)" : "भारतीय साक्ष्य अधिनियम, २०२३ (BSA)"
              : def.key === "CPC"
              ? language === "en" ? "Code of Civil Procedure, 1908 (CPC)" : "सिविल प्रक्रिया संहिता, १९०८ (CPC)"
              : def.key === "NI_ACT"
              ? language === "en" ? "Negotiable Instruments Act, 1881 (NI Act)" : "परक्राम्य लिखत अधिनियम, १८८१ (NI Act)"
              : def.key === "CONSTITUTION"
              ? language === "en" ? "Constitution of India" : "भारत का संविधान"
              : def.key === "LIMITATION"
              ? language === "en" ? "Limitation Act, 1963" : "परिसीमा अधिनियम, १९६३"
              : language === "en" ? "Arbitration & Conciliation Act, 1996" : "मध्यस्थता एवं सुलह अधिनियम, १९९६";

          return (
            <button
              key={def.key}
              onClick={() => setSelectedAct(def.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center space-x-1.5 shrink-0 ${
                isSelected
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-semibold shadow-xs"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800"
              }`}
            >
              <span>{localizedName}</span>
            </button>
          );
        })}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
        <span>
          {language === "en" ? (
            <>
              Showing <strong className="text-zinc-900 dark:text-white">{filteredSections.length}</strong> statutory sections matching criteria
            </>
          ) : (
            <>
              कुल <strong className="text-zinc-900 dark:text-white">{filteredSections.length}</strong> वैधानिक धाराएं उपलब्ध
            </>
          )}
        </span>
        {searchQuery && (
          <span className="text-amber-600 dark:text-amber-400 font-medium">
            {language === "en" ? `Filtering by: "${searchQuery}"` : `खोज फ़िल्टर: "${searchQuery}"`}
          </span>
        )}
      </div>

      {/* Sections Grid / List */}
      <div className="space-y-4">
        {filteredSections.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 space-y-3">
            <Scale className="w-8 h-8 text-zinc-400 mx-auto" />
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {language === "en" ? "No statutory provisions found" : "कोई वैधानिक धारा नहीं मिली"}
            </h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              {language === "en"
                ? `We couldn't find any section matching "${searchQuery}". Try searching for old IPC numbers (e.g. 302, 420), offence name (murder, cheating), or pick "All Bare Acts".`
                : `"${searchQuery}" से मेल खाती कोई धारा नहीं मिली। पुरानी आईपीसी धाराएं (जैसे 302, 420), अपराध का नाम या "सभी बेयर एक्ट्स" चुनें।`}
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedAct("ALL");
              }}
              className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold"
            >
              {language === "en" ? "Reset Filters" : "फ़िल्टर रीसेट करें"}
            </button>
          </div>
        ) : (
          filteredSections.map((sec) => (
            <article
              key={sec.id}
              id={sec.id}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-5 sm:p-6 shadow-xs space-y-4"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold tracking-wide border border-zinc-200 dark:border-zinc-700">
                    {sec.section}
                  </span>
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    {sec.actTitle} ({sec.actYear})
                  </span>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                    • {sec.chapter}
                  </span>
                </div>

                {/* Old Law Cross-Reference Chip */}
                {sec.oldSectionRef && (
                  <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] font-medium border border-zinc-200 dark:border-zinc-700 self-start sm:self-auto">
                    <ArrowRightLeft className="w-3 h-3 text-zinc-500" />
                    <span>
                      {language === "en"
                        ? `Replaces: ${sec.oldSectionRef}`
                        : `पूर्ववर्ती: ${sec.oldSectionRef}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Title & Statutory Content */}
              <div className="space-y-2">
                <h2 className="text-base font-bold text-zinc-950 dark:text-white tracking-tight">
                  {sec.title}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-950/60 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80">
                  {sec.description}
                </p>
              </div>

              {/* Statutory Classifications & Penalties */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                {sec.punishment && (
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block font-semibold uppercase">
                      {language === "en" ? "Punishment" : "दण्ड / सज़ा"}
                    </span>
                    <span className="font-semibold text-rose-600 dark:text-rose-400 text-[11px] leading-tight block mt-0.5">
                      {sec.punishment}
                    </span>
                  </div>
                )}

                {sec.cognizable !== undefined && (
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block font-semibold uppercase">
                      {language === "en" ? "Cognizability" : "संज्ञेयता"}
                    </span>
                    <span className={`font-semibold text-[11px] block mt-0.5 ${sec.cognizable ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {sec.cognizable
                        ? (language === "en" ? "Cognizable (Arrest without Warrant)" : "संज्ञेय (वारंट के बिना गिरफ़्तारी)")
                        : (language === "en" ? "Non-Cognizable" : "असंज्ञेय")}
                    </span>
                  </div>
                )}

                {sec.bailable !== undefined && (
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block font-semibold uppercase">
                      {language === "en" ? "Bail Category" : "जमानत श्रेणी"}
                    </span>
                    <span className={`font-semibold text-[11px] block mt-0.5 ${sec.bailable ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                      {sec.bailable
                        ? (language === "en" ? "Bailable (Matter of Right)" : "जमानती (अधिकार स्वरूप)")
                        : (language === "en" ? "Non-Bailable (Court Discretion)" : "गैर-जमानती (न्यायालय स्वविवेक)")}
                    </span>
                  </div>
                )}

                {sec.triableBy && (
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block font-semibold uppercase">
                      {language === "en" ? "Trial Court" : "विचारणीय न्यायालय"}
                    </span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-[11px] block mt-0.5">
                      {sec.triableBy}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCopyCitation(sec)}
                    className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200/70 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium flex items-center space-x-1.5 transition-colors"
                  >
                    {copiedId === sec.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500 font-semibold">
                          {language === "en" ? "Citation Copied!" : "साइटेशन कॉपी हो गया!"}
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{language === "en" ? "Copy Citation" : "साइटेशन कॉपी करें"}</span>
                      </>
                    )}
                  </button>

                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                      `*${sec.section}, ${sec.actTitle}*\n"${sec.title}"\n\n${sec.description}\n\nPunishment: ${sec.punishment || "As per law"}\n\nVia Advocase Digital Law Library: https://advocase.in/bare-acts#${sec.id}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-xs font-medium flex items-center space-x-1.5 transition-colors border border-emerald-200 dark:border-emerald-800"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{language === "en" ? "Share on WhatsApp" : "व्हाट्सएप पर भेजें"}</span>
                  </a>
                </div>

                <Link
                  href={`/drafts?template=${sec.draftTemplate || "bail"}&section=${encodeURIComponent(sec.section)}`}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold flex items-center space-x-1.5 transition-all"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{language === "en" ? "Draft Court Petition" : "अदालती ड्राफ्ट बनाएं"}</span>
                </Link>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

export default function BareActsPage() {
  const { language } = useLanguage();
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-sm text-zinc-500">
          {language === "en" ? "Loading Statutory Bare Acts Directory..." : "वैधानिक बेयर एक्ट्स डायरेक्टरी लोड हो रही है..."}
        </div>
      }
    >
      <BareActsContent />
    </Suspense>
  );
}
