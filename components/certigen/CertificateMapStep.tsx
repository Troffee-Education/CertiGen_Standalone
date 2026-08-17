"use client";

import React from "react";
import { ArrowRight, Eye, CheckCircle2, FileSpreadsheet, Sparkles } from "lucide-react";
import { Button } from "@/components/base/buttons/button";
import type { FieldConfig } from "./CanvasEditor";

type Props = {
  templateConfig: FieldConfig[] | null;
  csvHeaders: string[];
  mapping: Record<string, string>;
  onMappingChange: (mapping: Record<string, string>) => void;
  onPreview: () => void;
  onGenerate: () => void;
  canGenerate: boolean;
};

export default function CertificateMapStep({
  templateConfig,
  csvHeaders,
  mapping,
  onMappingChange,
  onPreview,
  onGenerate,
  canGenerate,
}: Props) {
  const textFields = (templateConfig ?? []).filter((b) => b.type !== "image");
  const mappedCount = textFields.filter((b) => !!mapping[b.id]).length;

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-semibold uppercase tracking-wider">
              Step 2: Column Mapping
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white mt-1">
            Match Template Placeholders to Your Spreadsheet
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Verify which column from your uploaded file maps to each certificate field.
          </p>
        </div>

        <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2 text-xs">
          <span className="text-slate-400">Mapped Fields:</span>
          <span className="font-bold text-emerald-400">
            {mappedCount} / {textFields.length}
          </span>
        </div>
      </div>

      {/* Field Mapping Cards */}
      <div className="grid grid-cols-1 gap-3.5">
        {textFields.map((box) => {
          const isMapped = !!mapping[box.id];
          return (
            <div
              key={box.id}
              className={`
                flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all gap-3
                ${
                  isMapped
                    ? "bg-slate-900/80 border-slate-700/80 shadow-xs"
                    : "bg-slate-900/40 border-slate-800"
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                    isMapped
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {isMapped ? <CheckCircle2 className="w-4 h-4" /> : "Aa"}
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">{box.label}</div>
                  <div className="text-[11px] text-slate-400">
                    Certificate Placeholder
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <ArrowRight className="hidden sm:block w-4 h-4 text-slate-500 flex-shrink-0" />
                <select
                  className="w-full sm:w-72 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs px-3.5 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  value={mapping[box.id] || ""}
                  onChange={(e) =>
                    onMappingChange({ ...mapping, [box.id]: e.target.value })
                  }
                >
                  <option value="" className="bg-slate-900 text-slate-400">
                    -- Select Matching Header --
                  </option>
                  {csvHeaders.map((h) => (
                    <option key={h} value={h} className="bg-slate-900 text-white">
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-slate-400">
          Tip: Click <strong>Preview</strong> to test generate 1 certificate before generating the whole batch.
        </p>

        <div className="flex items-center gap-3">
          <Button color="secondary" onClick={onPreview} isDisabled={!canGenerate}>
            <Eye className="w-4 h-4 mr-2 text-blue-400" />
            Preview Single Certificate
          </Button>
          <Button color="primary" onClick={onGenerate} isDisabled={!canGenerate}>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate All Certificates (.ZIP)
          </Button>
        </div>
      </div>
    </div>
  );
}
