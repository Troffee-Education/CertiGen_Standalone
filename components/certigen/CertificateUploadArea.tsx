"use client";

import React, { useState } from "react";
import { FileSpreadsheet, FileText, BookOpen, Sparkles, UploadCloud, CheckCircle2 } from "lucide-react";
import type { FieldConfig } from "./CanvasEditor";
import BulkSubmissionGuideModal from "./BulkSubmissionGuideModal";
import {
  downloadSampleExcel,
  downloadSampleCsv,
} from "@/lib/certigen/sample-template-generator";

type Props = {
  templateConfig: FieldConfig[] | null;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  eventTitle?: string;
};

export default function CertificateUploadArea({ templateConfig, onFileUpload, eventTitle }: Props) {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div className="space-y-4">
      {/* Upload Drag-and-Drop Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={() => setIsDragging(false)}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 sm:p-10 transition-all cursor-pointer group text-center
          ${
            isDragging
              ? "border-blue-400 bg-blue-500/10 shadow-lg shadow-blue-500/20 scale-[1.01]"
              : "border-slate-700/80 hover:border-blue-500/80 bg-slate-900/40 hover:bg-slate-900/80"
          }
        `}
      >
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={onFileUpload}
        />

        <div className="pointer-events-none space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center group-hover:scale-110 group-hover:text-blue-300 transition-all shadow-inner">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
              Click to browse or drop your student file here
            </h4>
            <p className="text-xs text-slate-400">
              Supports Microsoft Excel (<span className="text-emerald-400 font-semibold">.xlsx</span>, <span className="text-emerald-400 font-semibold">.xls</span>) or Comma-Separated Values (<span className="text-blue-400 font-semibold">.csv</span>)
            </p>
          </div>

          <div className="inline-flex flex-wrap items-center justify-center gap-2 pt-1">
            <span className="px-2.5 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-[11px] text-slate-300 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Row 1: Column Headers
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-[11px] text-slate-300 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> 1 Row = 1 Student
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-[11px] text-slate-300 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Up to 6,000 Rows
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="font-semibold">Quick Sample Templates:</span>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={() => downloadSampleExcel(templateConfig, eventTitle)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors cursor-pointer"
            title="Download formatted dummy Excel spreadsheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Download Excel (.xlsx)
          </button>

          <button
            type="button"
            onClick={() => downloadSampleCsv(templateConfig, eventTitle)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            title="Download CSV format"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Download .CSV
          </button>

          <button
            type="button"
            onClick={() => setIsGuideOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Format Guide Modal
          </button>
        </div>
      </div>

      {/* Guide Modal */}
      <BulkSubmissionGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        templateConfig={templateConfig}
        eventTitle={eventTitle}
      />
    </div>
  );
}
