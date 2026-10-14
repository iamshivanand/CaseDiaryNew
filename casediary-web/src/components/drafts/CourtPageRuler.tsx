"use client";

import React from "react";
import { HeaderFooterConfig, PageSizeKey, PAGE_CONFIG } from "./LegalTipTapEditor";

export type RulerUnit = "cm" | "in" | "mm";

interface CourtPageRulerProps {
  pageSize: PageSizeKey;
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  headerFooterConfig: HeaderFooterConfig;
  sheetNumber: number;
  letterheadSpace: boolean;
  unit: RulerUnit;
  onUnitChange: (unit: RulerUnit) => void;
  showHorizontal?: boolean;
  showVertical?: boolean;
}

export function formatUnitVal(mmVal: number, unit: RulerUnit): string {
  if (unit === "in") {
    return `${(mmVal / 25.4).toFixed(2)}"`;
  } else if (unit === "mm") {
    return `${Math.round(mmVal)} mm`;
  }
  return `${(mmVal / 10).toFixed(2)} cm`;
}

export function CourtPageRuler({
  pageSize,
  margins,
  headerFooterConfig,
  sheetNumber,
  letterheadSpace,
  unit,
  onUnitChange,
  showHorizontal = true,
  showVertical = true,
}: CourtPageRulerProps) {
  const config = PAGE_CONFIG[pageSize];
  const sheetWidth = config.width;
  const sheetHeight = config.height;
  const mmToPx = 3.779527559; // Exact 96 DPI CSS pixel ratio (96 / 25.4)

  const hasHeader =
    headerFooterConfig.showHeader &&
    (!headerFooterConfig.differentFirstPage || sheetNumber !== 1);
  const hasFooter = headerFooterConfig.showFooter;
  const headerHeightPx = hasHeader ? 38 : 0;
  const footerHeightPx = hasFooter ? 38 : 0;
  const letterheadPx = sheetNumber === 1 && letterheadSpace ? Math.round(65 * mmToPx) : 0;

  const leftMarginPx = Math.round(margins.left * mmToPx);
  const rightMarginPx = Math.round(margins.right * mmToPx);
  const topMarginPx = Math.round(margins.top * mmToPx);
  const bottomMarginPx = Math.round(margins.bottom * mmToPx);

  // Exact vertical pointer pixel coordinates from top edge of sheet (0px)
  const headerTopPx = 0;
  const headerBottomPx = headerHeightPx;
  const letterheadTopPx = headerBottomPx;
  const letterheadBottomPx = letterheadTopPx + letterheadPx;
  const contentTopPx = letterheadBottomPx + topMarginPx;
  const contentBottomPx = sheetHeight - footerHeightPx - bottomMarginPx;
  const footerTopPx = sheetHeight - footerHeightPx;
  const footerBottomPx = sheetHeight;

  // Physical dimensions in chosen unit
  const widthInUnit = unit === "in" ? sheetWidth / 96 : (sheetWidth / mmToPx / (unit === "mm" ? 1 : 10));
  const heightInUnit = unit === "in" ? sheetHeight / 96 : (sheetHeight / mmToPx / (unit === "mm" ? 1 : 10));

  // Ticks calculation for Horizontal Ruler
  const hStepMajor = unit === "in" ? 96 : (unit === "mm" ? 10 * mmToPx : 10 * mmToPx); // Every 1 inch or 1 cm
  const hStepHalf = hStepMajor / 2; // Every 0.5 in or 5 mm
  const hMajorCount = Math.floor(sheetWidth / hStepMajor);

  // Ticks calculation for Vertical Ruler
  const vStepMajor = unit === "in" ? 96 : (unit === "mm" ? 10 * mmToPx : 10 * mmToPx);
  const vStepHalf = vStepMajor / 2;
  const vMajorCount = Math.floor(sheetHeight / vStepMajor);

  return (
    <>
      {/* 1. TOP HORIZONTAL RULER (ALIGNED PIXEL-FOR-PIXEL WITH SHEET WIDTH) */}
      {showHorizontal && (
        <div
          style={{ width: `${sheetWidth}px` }}
          className="no-print relative h-9 bg-slate-100 dark:bg-slate-900 border-t border-l border-r border-b-2 border-slate-300 dark:border-slate-700 rounded-t-sm flex items-center select-none shadow-2xs font-mono text-[9px]"
        >
          {/* Top-Left Origin Corner Joint Indicator */}
          <div
            style={{ left: "-52px", width: "52px" }}
            className="absolute top-0 bottom-0 bg-slate-200/90 dark:bg-slate-800/90 border-t border-l border-b-2 border-slate-300 dark:border-slate-700 rounded-tl-sm flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400"
            title="Origin (0,0) Reference Point"
          >
            <span>📐 0,0</span>
          </div>

          {/* Unit Toggle Pill in top-left corner */}
          <div className="absolute -top-7 left-0 flex items-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md p-0.5 shadow-2xs text-[10px] z-30">
            <button
              type="button"
              onClick={() => onUnitChange("cm")}
              className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
                unit === "cm"
                  ? "bg-emerald-700 text-white shadow-2xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Display scale & margins in Centimeters (cm)"
            >
              cm
            </button>
            <button
              type="button"
              onClick={() => onUnitChange("in")}
              className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
                unit === "in"
                  ? "bg-emerald-700 text-white shadow-2xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Display scale & margins in Inches (in)"
            >
              in
            </button>
            <button
              type="button"
              onClick={() => onUnitChange("mm")}
              className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
                unit === "mm"
                  ? "bg-emerald-700 text-white shadow-2xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Display scale & margins in Millimeters (mm)"
            >
              mm
            </button>
            <span className="ml-1.5 pr-1 text-slate-400 font-sans text-[9.5px]">
              Width: {widthInUnit.toFixed(1)} {unit}
            </span>
          </div>

          {/* Left Margin Shaded Zone (Courtroom Gutter) */}
          <div
            style={{ width: `${margins.left}mm` }}
            className="absolute left-0 top-0 bottom-0 bg-emerald-500/15 dark:bg-emerald-500/25 border-r-2 border-emerald-600 dark:border-emerald-400 z-10 flex items-center justify-between px-1"
          >
            <span className="text-[8px] font-bold text-emerald-800 dark:text-emerald-300 truncate">
              Gutter: {formatUnitVal(margins.left, unit)}
            </span>
            {/* Margin Pointer Pin perfectly aligned with left margin boundary */}
            <div
              className="absolute -bottom-2.5 right-0 translate-x-1/2 z-20 flex flex-col items-center pointer-events-none"
              title={`Left Courtroom Gutter Margin: ${formatUnitVal(margins.left, unit)}`}
            >
              <span className="text-emerald-700 dark:text-emerald-400 text-[11px] leading-none font-bold">
                ▼
              </span>
            </div>
          </div>

          {/* Center Printable Text Width Zone */}
          <div
            style={{
              left: `${margins.left}mm`,
              right: `${margins.right}mm`,
            }}
            className="absolute top-0 bottom-0 bg-white/60 dark:bg-slate-800/40 flex items-center justify-center z-5"
          >
            <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 tracking-wide bg-white/90 dark:bg-slate-900/90 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-2xs">
              ↔ Drafting Width:{" "}
              {formatUnitVal((sheetWidth - leftMarginPx - rightMarginPx) / mmToPx, unit)}
            </span>
          </div>

          {/* Right Margin Shaded Zone */}
          <div
            style={{ width: `${margins.right}mm` }}
            className="absolute right-0 top-0 bottom-0 bg-emerald-500/15 dark:bg-emerald-500/25 border-l-2 border-emerald-600 dark:border-emerald-400 z-10 flex items-center justify-between px-1"
          >
            {/* Margin Pointer Pin perfectly aligned with right margin boundary */}
            <div
              className="absolute -bottom-2.5 left-0 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none"
              title={`Right Court Margin: ${formatUnitVal(margins.right, unit)}`}
            >
              <span className="text-emerald-700 dark:text-emerald-400 text-[11px] leading-none font-bold">
                ▼
              </span>
            </div>
            <span className="text-[8px] font-bold text-emerald-800 dark:text-emerald-300 truncate ml-auto">
              Margin: {formatUnitVal(margins.right, unit)}
            </span>
          </div>

          {/* Scale Tick Marks (Major and Intermediate Half-Ticks) */}
          <div className="absolute inset-0 flex pointer-events-none overflow-hidden">
            {/* Intermediate Half-Ticks */}
            {Array.from({ length: hMajorCount * 2 + 1 }, (_, i) => {
              const tickPosPx = i * hStepHalf;
              if (tickPosPx > sheetWidth) return null;
              if (i % 2 === 0) return null; // Skip where major tick exists

              return (
                <div
                  key={`h-half-tick-${i}`}
                  style={{ left: `${tickPosPx}px` }}
                  className="absolute bottom-0 w-[1px] h-1.5 bg-slate-300 dark:bg-slate-700"
                />
              );
            })}

            {/* Major Ticks with Numbers */}
            {Array.from({ length: hMajorCount + 1 }, (_, i) => {
              const tickPosPx = i * hStepMajor;
              if (tickPosPx > sheetWidth) return null;

              return (
                <div
                  key={`h-tick-${i}`}
                  style={{ left: `${tickPosPx}px` }}
                  className="absolute bottom-0 flex flex-col items-center -translate-x-1/2"
                >
                  <span className="text-[7.5px] text-slate-500 dark:text-slate-400 font-mono -translate-y-2">
                    {i}
                  </span>
                  <div className="w-[1px] h-2.5 bg-slate-400 dark:bg-slate-600" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. LEFT VERTICAL RULER (STRICT 1:1 PHYSICAL PAGE HEIGHT SCALE) */}
      {showVertical && (
        <div
          data-vertical-ruler={`sheet-${sheetNumber}`}
          style={{
            position: "absolute",
            top: 0,
            left: "-52px",
            width: "52px",
            height: `${sheetHeight}px`,
          }}
          className="no-print bg-slate-100/95 dark:bg-slate-900/95 border-t border-l border-b border-r border-slate-300 dark:border-slate-700 rounded-l-sm select-none shadow-md z-20 font-mono text-[8.5px]"
        >
          {/* Top Label: only for Sheet 2+ (on Sheet 1, the top corner joint 📐 0,0 connects seamlessly above it) */}
          {sheetNumber > 1 && (
            <div
              style={{
                position: "absolute",
                top: "-22px",
                left: "-1px",
                right: "-1px",
                height: "21px",
              }}
              className="border-t border-l border-r border-slate-300 dark:border-slate-700 bg-slate-200/95 dark:bg-slate-800/95 text-[7.5px] text-slate-600 dark:text-slate-300 font-bold uppercase tracking-tight flex items-center justify-center rounded-tl-sm shadow-2xs"
            >
              Sheet {sheetNumber}
            </div>
          )}

          {/* Bottom Total Height Indicator (Placed BELOW tick space) */}
          <div
            style={{
              position: "absolute",
              bottom: "-21px",
              left: "-1px",
              right: "-1px",
              height: "20px",
            }}
            className="border-b border-l border-r border-slate-300 dark:border-slate-700 text-[7.5px] font-bold text-slate-700 dark:text-slate-300 bg-slate-200/95 dark:bg-slate-800/95 flex items-center justify-center rounded-bl-sm shadow-2xs"
          >
            {heightInUnit.toFixed(1)} {unit}
          </div>

          {/* Absolute 1:1 Coordinate Ticks and Pointers Canvas */}
          <div className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
            {/* Intermediate Half-Ticks (0.5 in or 5 mm) */}
            {Array.from({ length: vMajorCount * 2 + 1 }, (_, i) => {
              const tickPosPx = i * vStepHalf;
              if (tickPosPx > sheetHeight) return null;
              if (i % 2 === 0) return null; // Skip where major tick exists

              return (
                <div
                  key={`v-half-tick-${i}`}
                  style={{ top: `${tickPosPx}px` }}
                  className="absolute right-0 w-1.5 h-[1px] bg-slate-300 dark:bg-slate-700"
                />
              );
            })}

            {/* Major Ticks with Numbers along right edge */}
            {Array.from({ length: vMajorCount + 1 }, (_, i) => {
              const tickPosPx = i * vStepMajor;
              if (tickPosPx > sheetHeight - 8) return null;

              return (
                <div
                  key={`v-tick-${i}`}
                  style={{ top: `${tickPosPx}px` }}
                  className="absolute right-0 flex items-center space-x-1 pr-0.5 -translate-y-1/2"
                >
                  <span className="text-[7.5px] text-slate-500 dark:text-slate-400 font-mono">
                    {i}
                  </span>
                  <div className="w-2.5 h-[1px] bg-slate-400 dark:bg-slate-600" />
                </div>
              );
            })}

            {/* POINTER 1: Running Court Header Zone (0px to 38px) */}
            {hasHeader && (
              <div
                style={{
                  top: `${headerTopPx}px`,
                  height: `${headerHeightPx}px`,
                }}
                className="absolute right-0 w-full bg-amber-500/20 border-r-2 border-amber-600 group cursor-help z-15"
                title={`Running Court Header: ${formatUnitVal(38 / mmToPx, unit)} (38px)`}
              >
                <div className="absolute top-1 right-1 text-[7px] font-bold text-amber-700 dark:text-amber-400 whitespace-nowrap bg-amber-100 dark:bg-amber-950/80 px-1 rounded shadow-2xs">
                  ▶ Header
                </div>
              </div>
            )}

            {/* POINTER 2: Letterhead Top clearance (if enabled) */}
            {sheetNumber === 1 && letterheadSpace && (
              <div
                style={{
                  top: `${letterheadTopPx}px`,
                  height: `${letterheadPx}px`,
                }}
                className="absolute right-0 w-full bg-blue-500/15 border-r-2 border-blue-600 group cursor-help z-15"
                title={`Letterhead Reserved Space: ${formatUnitVal(65, unit)} (2.5")`}
              >
                <div className="absolute top-2 right-1 text-[7px] font-bold text-blue-700 dark:text-blue-300 whitespace-nowrap bg-blue-100 dark:bg-blue-950/80 px-1 rounded shadow-2xs">
                  ▶ 2.5" Seal
                </div>
              </div>
            )}

            {/* Shaded Top Margin Zone */}
            <div
              style={{
                top: `${letterheadBottomPx}px`,
                height: `${topMarginPx}px`,
              }}
              className="absolute right-0 w-full bg-emerald-500/15 dark:bg-emerald-500/25 border-b-2 border-emerald-600 dark:border-emerald-400 z-12 flex flex-col justify-end items-end pr-1 pb-0.5"
              title={`Top Court Margin: ${formatUnitVal(margins.top, unit)}`}
            >
              <span className="text-[7px] font-bold text-emerald-800 dark:text-emerald-300 leading-tight">
                Top: {formatUnitVal(margins.top, unit)}
              </span>
            </div>

            {/* POINTER 3: Top Margin Pointer Pin (EXACTLY ALIGNED WITH CONTENT & RED MARGIN BOX) */}
            <div
              style={{ top: `${contentTopPx}px` }}
              className="absolute right-0 -translate-y-1/2 z-25 flex items-center pointer-events-none"
              title={`Top Margin Boundary: ${formatUnitVal(margins.top, unit)}`}
            >
              <div className="w-2.5 h-[1.5px] bg-emerald-600 dark:bg-emerald-400" />
              <span className="text-emerald-700 dark:text-emerald-400 text-[11px] leading-none font-bold">
                ▶
              </span>
            </div>

            {/* Printable Body Height Highlight */}
            <div
              style={{
                top: `${contentTopPx}px`,
                height: `${contentBottomPx - contentTopPx}px`,
              }}
              className="absolute right-0 w-1.5 bg-emerald-500/30 dark:bg-emerald-400/30 border-r-2 border-emerald-600 dark:border-emerald-400 z-10"
              title={`Printable Drafting Body: ${formatUnitVal((contentBottomPx - contentTopPx) / mmToPx, unit)}`}
            />

            {/* Shaded Bottom Margin Zone */}
            <div
              style={{
                top: `${contentBottomPx}px`,
                height: `${bottomMarginPx}px`,
              }}
              className="absolute right-0 w-full bg-emerald-500/15 dark:bg-emerald-500/25 border-t-2 border-emerald-600 dark:border-emerald-400 z-12 flex flex-col justify-start items-end pr-1 pt-0.5"
              title={`Bottom Court Margin: ${formatUnitVal(margins.bottom, unit)}`}
            >
              <span className="text-[7px] font-bold text-emerald-800 dark:text-emerald-300 leading-tight">
                Btm: {formatUnitVal(margins.bottom, unit)}
              </span>
            </div>

            {/* POINTER 4: Bottom Margin Pointer Pin (EXACTLY ALIGNED WITH CONTENT & RED MARGIN BOX) */}
            <div
              style={{ top: `${contentBottomPx}px` }}
              className="absolute right-0 -translate-y-1/2 z-25 flex items-center pointer-events-none"
              title={`Bottom Margin Boundary: ${formatUnitVal(margins.bottom, unit)}`}
            >
              <div className="w-2.5 h-[1.5px] bg-emerald-600 dark:bg-emerald-400" />
              <span className="text-emerald-700 dark:text-emerald-400 text-[11px] leading-none font-bold">
                ▶
              </span>
            </div>

            {/* POINTER 5: Running Court Footer Zone (Exact 38px from sheet bottom) */}
            {hasFooter && (
              <div
                style={{
                  top: `${footerTopPx}px`,
                  height: `${footerHeightPx}px`,
                }}
                className="absolute right-0 w-full bg-amber-500/20 border-r-2 border-amber-600 group cursor-help z-15"
                title={`Running Court Footer: ${formatUnitVal(38 / mmToPx, unit)} (38px)`}
              >
                <div className="absolute bottom-1 right-1 text-[7px] font-bold text-amber-700 dark:text-amber-400 whitespace-nowrap bg-amber-100 dark:bg-amber-950/80 px-1 rounded shadow-2xs">
                  ▶ Footer
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
