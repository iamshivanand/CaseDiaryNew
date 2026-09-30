import { useCallback, useRef, useState, useEffect } from "react";

export type PageSizeKey = "a4" | "legal" | "letter";

export interface PageDimension {
  width: number;
  height: number;
  name: string;
  shortName: string;
}

export const PAGE_CONFIG: Record<PageSizeKey, PageDimension> = {
  a4: {
    width: 794, // 210mm at 96 DPI
    height: 1123, // 297mm at 96 DPI
    name: "A4 (210 × 297 mm) - High Court Standard",
    shortName: "A4",
  },
  legal: {
    width: 816, // 8.5in at 96 DPI
    height: 1344, // 14in at 96 DPI
    name: "Legal 14\" (216 × 356 mm) - Green Sheet",
    shortName: "Legal 14\"",
  },
  letter: {
    width: 816, // 8.5in at 96 DPI
    height: 1056, // 11in at 96 DPI
    name: "Letter (8.5 × 11 in) - Registry Notice",
    shortName: "Letter",
  },
};

export interface UseDraftPaginationProps {
  contentContainerRef: React.RefObject<HTMLDivElement | null>;
  margins: { top: number; bottom: number; left: number; right: number };
  pageSize: PageSizeKey;
  letterheadSpace: boolean;
  zoomLevel: number;
  headerFooterConfig: {
    showHeader: boolean;
    showFooter: boolean;
    differentFirstPage: boolean;
  };
}

export function useDraftPagination({
  contentContainerRef,
  margins,
  pageSize,
  letterheadSpace,
  zoomLevel,
  headerFooterConfig,
}: UseDraftPaginationProps) {
  const [pages, setPages] = useState<number>(1);
  const isCalculatingRef = useRef(false);
  const blockSheetAssignmentsRef = useRef<number[]>([]);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const recalculatePageBreaksAndSpacers = useCallback(() => {
    if (isCalculatingRef.current) return;
    if (!contentContainerRef.current) return;
    const container = contentContainerRef.current;
    const proseMirrorEl = container.querySelector(".ProseMirror") as HTMLElement | null;
    if (!proseMirrorEl) return;

    const breakableBlocks = Array.from(proseMirrorEl.children) as HTMLElement[];
    if (breakableBlocks.length === 0) return;

    isCalculatingRef.current = true;

    try {
      let styleTag = document.getElementById("legal-page-break-spacers") as HTMLStyleElement | null;
      if (styleTag) {
        styleTag.textContent = "";
      }

      // Force layout measurement flush
      void container.offsetHeight;

      const mmToPx = 3.7795;
      const topMarginPx = Math.round(margins.top * mmToPx);
      const bottomMarginPx = Math.round(margins.bottom * mmToPx);
      const gapHeightPx = 36;
      const sheetHeightPx = PAGE_CONFIG[pageSize].height;
      const letterheadPx = letterheadSpace ? Math.round(65 * mmToPx) : 0;
      const scale = (zoomLevel || 100) / 100;

      const getSheetTop = (sheetNum: number) => (sheetNum - 1) * (sheetHeightPx + gapHeightPx);
      const getPrintableTop = (sheetNum: number) => {
        const sTop = getSheetTop(sheetNum);
        const lHead = sheetNum === 1 ? letterheadPx : 0;
        const hHeight =
          !headerFooterConfig.showHeader ||
          (headerFooterConfig.differentFirstPage && sheetNum === 1)
            ? 0
            : 38;
        return sTop + hHeight + lHead + topMarginPx;
      };
      const getPrintableBottom = (sheetNum: number) => {
        const sTop = getSheetTop(sheetNum);
        const fHeight = headerFooterConfig.showFooter ? 38 : 0;
        return sTop + sheetHeightPx - fHeight - bottomMarginPx;
      };

      const containerRect = container.getBoundingClientRect();
      const naturalBlocks = breakableBlocks.map((c, i) => {
        const r = c.getBoundingClientRect();
        return {
          idx: i,
          top: (r.top - containerRect.top) / scale,
          bottom: (r.bottom - containerRect.top) / scale,
          height: r.height / scale,
        };
      });

      let currentSheet = 1;
      let accumulatedShift = 0;
      const cssRules: string[] = [];
      const assignments: number[] = [];

      for (let i = 0; i < naturalBlocks.length; i++) {
        const b = naturalBlocks[i];
        if (b.height <= 0) {
          assignments[i] = currentSheet;
          continue;
        }

        const effectiveTop = b.top + accumulatedShift;
        const effectiveBottom = b.bottom + accumulatedShift;

        const isExplicitBreak =
          breakableBlocks[i]?.getAttribute("data-page-break") === "true" ||
          breakableBlocks[i]?.classList.contains("court-page-break");

        if (isExplicitBreak) {
          const nextSheet = currentSheet + 1;
          const nextPrintableTop = getPrintableTop(nextSheet);
          const prevEffectiveBottom =
            i > 0 ? naturalBlocks[i - 1].bottom + accumulatedShift : effectiveTop;
          const neededMarginTop = nextPrintableTop - prevEffectiveBottom;

          if (neededMarginTop > 0) {
            cssRules.push(
              `.ProseMirror > *:nth-child(${i + 1}) { margin-top: ${neededMarginTop}px !important; }`
            );
            accumulatedShift += nextPrintableTop - effectiveTop;
            currentSheet = nextSheet;
          }
          assignments[i] = currentSheet;
          continue;
        }

        while (currentSheet < 50) {
          const sBottom = getSheetTop(currentSheet) + sheetHeightPx;
          if (effectiveTop >= sBottom) {
            currentSheet++;
          } else {
            break;
          }
        }

        const printableTop = getPrintableTop(currentSheet);
        const printableBottom = getPrintableBottom(currentSheet);

        if (effectiveBottom > printableBottom) {
          const isAlreadyAtTop = Math.abs(effectiveTop - printableTop) < 4;

          if (!isAlreadyAtTop) {
            const nextSheet = currentSheet + 1;
            const nextPrintableTop = getPrintableTop(nextSheet);
            const prevEffectiveBottom =
              i > 0 ? naturalBlocks[i - 1].bottom + accumulatedShift : effectiveTop;
            const neededMarginTop = nextPrintableTop - prevEffectiveBottom;

            if (neededMarginTop > 0) {
              cssRules.push(
                `.ProseMirror > *:nth-child(${i + 1}) { margin-top: ${neededMarginTop}px !important; }`
              );
              accumulatedShift += nextPrintableTop - effectiveTop;
              currentSheet = nextSheet;
            }
          }
        }

        assignments[i] = currentSheet;
      }

      blockSheetAssignmentsRef.current = assignments;

      if (!styleTag) {
        styleTag = document.createElement("style");
        styleTag.id = "legal-page-break-spacers";
        document.head.appendChild(styleTag);
      }
      styleTag.textContent = cssRules.join("\n");

      setPages(currentSheet);
    } finally {
      requestAnimationFrame(() => {
        isCalculatingRef.current = false;
      });
    }
  }, [margins, pageSize, letterheadSpace, zoomLevel, headerFooterConfig, contentContainerRef]);

  // Debounced pagination trigger: ensures typing never stutters from synchronous DOM queries
  const debouncedRecalculatePagination = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      requestAnimationFrame(() => {
        recalculatePageBreaksAndSpacers();
      });
    }, 200);
  }, [recalculatePageBreaksAndSpacers]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    pages,
    blockSheetAssignmentsRef,
    recalculatePageBreaksAndSpacers,
    debouncedRecalculatePagination,
  };
}
