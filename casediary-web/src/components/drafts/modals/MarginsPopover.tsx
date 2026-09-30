"use client";

import React from "react";
import { RulerUnit, formatUnitVal } from "../CourtPageRuler";

export interface MarginsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  margins: { top: number; bottom: number; left: number; right: number };
  setMargins: React.Dispatch<React.SetStateAction<{ top: number; bottom: number; left: number; right: number }>>;
  setMarginPreset: (val: "high_court" | "district_court" | "standard") => void;
  marginUnit: RulerUnit;
}

export const MarginsPopover: React.FC<MarginsPopoverProps> = ({
  isOpen,
  onClose,
  margins,
  setMargins,
  setMarginPreset,
  marginUnit,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute top-full left-0 mt-2 w-80 p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xl z-50 animate-fade-in text-slate-800 dark:text-slate-200"
    >
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
        <span className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">
          Page Margins ({marginUnit})
        </span>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
        >
          ✕
        </button>
      </div>

      {/* Preset Margins */}
      <div className="py-2 space-y-1.5">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Registry Standards
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => {
              setMargins({ top: 25, bottom: 25, left: 45, right: 25 });
              setMarginPreset("high_court");
            }}
            className={`p-1.5 text-left rounded-lg border text-[11px] font-medium transition-all cursor-pointer ${
              margins.left === 45 && margins.right === 25 && margins.top === 25 && margins.bottom === 25
                ? "bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-400 font-bold"
                : "border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800"
            }`}
          >
            <div className="font-bold">Delhi High Court</div>
            <div className="text-[10px] text-slate-400">
              {formatUnitVal(45, marginUnit)} Gutter L
            </div>
          </button>
          <button
            onClick={() => {
              setMargins({ top: 25, bottom: 25, left: 35, right: 20 });
              setMarginPreset("district_court");
            }}
            className={`p-1.5 text-left rounded-lg border text-[11px] font-medium transition-all cursor-pointer ${
              margins.left === 35 && margins.right === 20 && margins.top === 25 && margins.bottom === 25
                ? "bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-400 font-bold"
                : "border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800"
            }`}
          >
            <div className="font-bold">District Courts</div>
            <div className="text-[10px] text-slate-400">
              {formatUnitVal(35, marginUnit)} Gutter L
            </div>
          </button>
          <button
            onClick={() => {
              setMargins({ top: 25.4, bottom: 25.4, left: 25.4, right: 25.4 });
              setMarginPreset("standard");
            }}
            className={`p-1.5 text-left rounded-lg border text-[11px] font-medium transition-all cursor-pointer ${
              margins.left === 25.4 && margins.right === 25.4 && margins.top === 25.4 && margins.bottom === 25.4
                ? "bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-400 font-bold"
                : "border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800"
            }`}
          >
            <div className="font-bold">Standard (1.0")</div>
            <div className="text-[10px] text-slate-400">
              {formatUnitVal(25.4, marginUnit)} uniform
            </div>
          </button>
          <button
            onClick={() => {
              setMargins({ top: 12.7, bottom: 12.7, left: 12.7, right: 12.7 });
            }}
            className={`p-1.5 text-left rounded-lg border text-[11px] font-medium transition-all cursor-pointer ${
              margins.left === 12.7 && margins.right === 12.7 && margins.top === 12.7 && margins.bottom === 12.7
                ? "bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-400 font-bold"
                : "border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800"
            }`}
          >
            <div className="font-bold">Narrow (0.5")</div>
            <div className="text-[10px] text-slate-400">
              {formatUnitVal(12.7, marginUnit)} uniform
            </div>
          </button>
        </div>
      </div>

      {/* 4-Side Custom Margin Inputs in active unit */}
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Custom Margins ({marginUnit})
        </div>
        <div className="grid grid-cols-2 gap-2">
          {/* Top Margin */}
          <div>
            <label className="block text-[10px] font-medium text-slate-500 mb-0.5">
              Top Margin ({marginUnit})
            </label>
            <input
              type="number"
              step={marginUnit === "in" ? 0.05 : marginUnit === "cm" ? 0.1 : 1}
              min={marginUnit === "in" ? 0.2 : marginUnit === "cm" ? 0.5 : 5}
              max={marginUnit === "in" ? 3.0 : marginUnit === "cm" ? 8.0 : 80}
              value={
                marginUnit === "in"
                  ? parseFloat((margins.top / 25.4).toFixed(2))
                  : marginUnit === "cm"
                  ? parseFloat((margins.top / 10).toFixed(2))
                  : Math.round(margins.top)
              }
              onChange={(e) => {
                const v = parseFloat(e.target.value) || 0;
                const mm = marginUnit === "in" ? v * 25.4 : marginUnit === "cm" ? v * 10 : v;
                setMargins((m) => ({ ...m, top: Math.max(5, Math.round(mm * 10) / 10) }));
              }}
              className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <span className="text-[9px] text-slate-400">
              {marginUnit === "in" ? `${(margins.top / 10).toFixed(2)} cm` : `${(margins.top / 25.4).toFixed(2)}"`}
            </span>
          </div>

          {/* Bottom Margin */}
          <div>
            <label className="block text-[10px] font-medium text-slate-500 mb-0.5">
              Bottom Margin ({marginUnit})
            </label>
            <input
              type="number"
              step={marginUnit === "in" ? 0.05 : marginUnit === "cm" ? 0.1 : 1}
              min={marginUnit === "in" ? 0.2 : marginUnit === "cm" ? 0.5 : 5}
              max={marginUnit === "in" ? 3.0 : marginUnit === "cm" ? 8.0 : 80}
              value={
                marginUnit === "in"
                  ? parseFloat((margins.bottom / 25.4).toFixed(2))
                  : marginUnit === "cm"
                  ? parseFloat((margins.bottom / 10).toFixed(2))
                  : Math.round(margins.bottom)
              }
              onChange={(e) => {
                const v = parseFloat(e.target.value) || 0;
                const mm = marginUnit === "in" ? v * 25.4 : marginUnit === "cm" ? v * 10 : v;
                setMargins((m) => ({ ...m, bottom: Math.max(5, Math.round(mm * 10) / 10) }));
              }}
              className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <span className="text-[9px] text-slate-400">
              {marginUnit === "in" ? `${(margins.bottom / 10).toFixed(2)} cm` : `${(margins.bottom / 25.4).toFixed(2)}"`}
            </span>
          </div>

          {/* Left / Gutter Margin */}
          <div>
            <label className="block text-[10px] font-medium text-slate-500 mb-0.5">
              Left / Gutter ({marginUnit})
            </label>
            <input
              type="number"
              step={marginUnit === "in" ? 0.05 : marginUnit === "cm" ? 0.1 : 1}
              min={marginUnit === "in" ? 0.4 : marginUnit === "cm" ? 1.0 : 10}
              max={marginUnit === "in" ? 3.5 : marginUnit === "cm" ? 9.0 : 90}
              value={
                marginUnit === "in"
                  ? parseFloat((margins.left / 25.4).toFixed(2))
                  : marginUnit === "cm"
                  ? parseFloat((margins.left / 10).toFixed(2))
                  : Math.round(margins.left)
              }
              onChange={(e) => {
                const v = parseFloat(e.target.value) || 0;
                const mm = marginUnit === "in" ? v * 25.4 : marginUnit === "cm" ? v * 10 : v;
                setMargins((m) => ({ ...m, left: Math.max(10, Math.round(mm * 10) / 10) }));
              }}
              className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <span className="text-[9px] text-slate-400">
              {marginUnit === "in" ? `${(margins.left / 10).toFixed(2)} cm` : `${(margins.left / 25.4).toFixed(2)}"`}
            </span>
          </div>

          {/* Right Margin */}
          <div>
            <label className="block text-[10px] font-medium text-slate-500 mb-0.5">
              Right Margin ({marginUnit})
            </label>
            <input
              type="number"
              step={marginUnit === "in" ? 0.05 : marginUnit === "cm" ? 0.1 : 1}
              min={marginUnit === "in" ? 0.4 : marginUnit === "cm" ? 1.0 : 10}
              max={marginUnit === "in" ? 3.0 : marginUnit === "cm" ? 8.0 : 80}
              value={
                marginUnit === "in"
                  ? parseFloat((margins.right / 25.4).toFixed(2))
                  : marginUnit === "cm"
                  ? parseFloat((margins.right / 10).toFixed(2))
                  : Math.round(margins.right)
              }
              onChange={(e) => {
                const v = parseFloat(e.target.value) || 0;
                const mm = marginUnit === "in" ? v * 25.4 : marginUnit === "cm" ? v * 10 : v;
                setMargins((m) => ({ ...m, right: Math.max(10, Math.round(mm * 10) / 10) }));
              }}
              className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <span className="text-[9px] text-slate-400">
              {marginUnit === "in" ? `${(margins.right / 10).toFixed(2)} cm` : `${(margins.right / 25.4).toFixed(2)}"`}
            </span>
          </div>
        </div>

        <div className="pt-2 text-[10px] text-amber-600 dark:text-amber-400 flex items-center space-x-1">
          <span>✓</span>
          <span>Applied consistently across every physical sheet</span>
        </div>
      </div>
    </div>
  );
};

export default MarginsPopover;
