"use client";

import React, { useState } from "react";
import { FileSpreadsheet, FileText, BookOpen, Download, Sparkles } from "lucide-react";
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

  return (
    <>
      {/* Quick download & manual trigger toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700">
        <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>Need a template?</span>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={() => downloadSampleExcel(templateConfig, eventTitle)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
            title="Download formatted dummy Excel spreadsheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Sample Excel (.xlsx)
          </button>

          <button
            type="button"
            onClick={() => downloadSampleCsv(templateConfig, eventTitle)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-slate-700 shadow-xs transition-colors cursor-pointer"
            title="Download CSV format"
          >
            <FileText className="w-3.5 h-3.5 text-gray-500" />
            Sample .CSV
          </button>

          <button
            type="button"
            onClick={() => setIsGuideOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Quick Manual & Rules
          </button>
        </div>
      </div>

      {/* Upload Drag-and-Drop Area */}
      <div className="relative border-2 border-dashed border-gray-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-xl p-10 hover:bg-blue-50/20 dark:hover:bg-slate-800/40 transition-all cursor-pointer group shadow-xs">
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={onFileUpload}
        />
        <div className="text-center pointer-events-none space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Click to upload or drag and drop your student list
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Supports Microsoft Excel (<code>.xlsx</code>, <code>.xls</code>) or Comma-Separated Values (<code>.csv</code>)
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-[11px] text-gray-600 dark:text-gray-300 font-medium">
            <span>First row = Column Headers</span>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <span>1 Row = 1 Student</span>
          </div>
        </div>
      </div>

      {/* Guide Modal */}
      <BulkSubmissionGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        templateConfig={templateConfig}
        eventTitle={eventTitle}
      />
    </>
  );
}
