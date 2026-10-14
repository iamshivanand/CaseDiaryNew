"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

// Dynamically import TipTap Legal Editor to avoid SSR hydration mismatch
const LegalTipTapEditor = dynamic(
  () => import("@/components/drafts/LegalTipTapEditor"),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <div className="text-sm font-semibold">Initializing TipTap Legal Processor...</div>
        <div className="text-xs text-slate-400">Loading ProseMirror AST engine & Indian court presets</div>
      </div>
    ),
  }
);

import { ChamberAuthGuard } from "@/components/ChamberAuthGuard";

function DraftsStudioPageContent() {
  const searchParams = useSearchParams();
  const caseId = searchParams.get("case_id");
  const template = searchParams.get("template") || "bail";
  const draftId = searchParams.get("draft_id");

  return (
    <ChamberAuthGuard featureName="Legal Drafting Studio">
      <LegalTipTapEditor
        initialCaseId={caseId}
        initialTemplate={template}
        initialDraftId={draftId}
      />
    </ChamberAuthGuard>
  );
}

export default function DraftsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-sm text-slate-500">
          Loading Legal Drafting Studio...
        </div>
      }
    >
      <DraftsStudioPageContent />
    </Suspense>
  );
}
