"use client";

import React, { useState } from "react";
import {
  BookOpen,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
  X,
  Layers,
  Table,
  Lightbulb,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import type { FieldConfig } from "./CanvasEditor";
import {
  getSampleTableData,
  downloadSampleExcel,
  downloadSampleCsv,
} from "@/lib/certigen/sample-template-generator";

interface BulkSubmissionGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateConfig?: FieldConfig[] | null;
  eventTitle?: string;
}

export default function BulkSubmissionGuideModal({
  isOpen,
  onClose,
  templateConfig,
  eventTitle,
}: BulkSubmissionGuideModalProps) {
  const [activeTab, setActiveTab] = useState<"guide" | "format" | "preview">("guide");
  const { headers, rows } = getSampleTableData(templateConfig);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden text-gray-900 dark:text-gray-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-purple-50/30 dark:from-slate-800/80 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Teacher Bulk Submission Guide
                <span className="text-[11px] font-semibold uppercase tracking-wider bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                  User Manual
                </span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Instructions and dummy sample spreadsheets for student certificates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-950/40 px-6 pt-2">
          <button
            onClick={() => setActiveTab("guide")}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "guide"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            How to Submit (3 Steps)
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "preview"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            <Table className="w-4 h-4" />
            Sample Excel Preview
          </button>
          <button
            onClick={() => setActiveTab("format")}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "format"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            <Layers className="w-4 h-4" />
            Format Requirements & Rules
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* TAB 1: 3-STEP USER MANUAL */}
          {activeTab === "guide" && (
            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex gap-4 items-start p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm">
                  1
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-bold text-gray-900 dark:text-white text-base">
                      Download & Prepare the Spreadsheet
                    </h4>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => downloadSampleExcel(templateConfig, eventTitle)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        Download Dummy .XLSX
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadSampleCsv(templateConfig, eventTitle)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-gray-700 hover:bg-gray-800 text-white shadow-xs transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Download .CSV
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed">
                    Download the pre-structured dummy Excel template above or prepare your own. Ensure the <strong>first row</strong> contains the column titles (e.g. <code>Student Name</code>, <code>School Name</code>, etc.) and each subsequent row contains one student&apos;s details.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4 items-start p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm">
                  2
                </div>
                <div className="space-y-1.5 flex-1">
                  <h4 className="font-bold text-gray-900 dark:text-white text-base">
                    Fill Teacher Info & Upload File
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed">
                    Complete your teacher name, school name, and email if requested. Then drag & drop or select your prepared <code>.xlsx</code> or <code>.csv</code> file into the upload zone.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4 items-start p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50">
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm">
                  3
                </div>
                <div className="space-y-1.5 flex-1">
                  <h4 className="font-bold text-gray-900 dark:text-white text-base">
                    Map Columns, Preview & Download All Certificates
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed">
                    Match your spreadsheet columns to the certificate placeholders (auto-detected). Generate a single test preview to verify design alignment, then click <strong>Generate Certificates</strong> to download all student certificates in a high-speed ZIP package!
                  </p>
                </div>
              </div>

              {/* Quick tip box */}
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 flex gap-3 text-amber-900 dark:text-amber-200">
                <Lightbulb className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold">Pro-Tip for Fast Column Matching:</p>
                  <p className="text-amber-800 dark:text-amber-300">
                    If your Excel headers match the template field names (e.g. &ldquo;Student Name&rdquo; or &ldquo;Nama Murid&rdquo;), the system will automatically map the columns for you!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE DUMMY SAMPLE TABLE PREVIEW */}
          {activeTab === "preview" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">
                    Interactive Dummy Excel Template
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    This sample matches this event&apos;s active template placeholders.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadSampleExcel(templateConfig, eventTitle)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Download Sample .XLSX
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadSampleCsv(templateConfig, eventTitle)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-gray-700 hover:bg-gray-800 text-white shadow-xs transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Download Sample .CSV
                  </button>
                </div>
              </div>

              {/* Table rendering */}
              <div className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto max-h-[300px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-blue-600 text-white uppercase tracking-wider font-semibold">
                        <th className="py-2.5 px-3 text-center border-r border-blue-500 w-10">#</th>
                        {headers.map((h, i) => (
                          <th key={i} className="py-2.5 px-3.5 border-r border-blue-500 last:border-r-0 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-800 bg-white dark:bg-slate-900 font-mono text-[11px]">
                      {rows.map((row, rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-blue-50/50 dark:hover:bg-slate-800/60 transition-colors">
                          <td className="py-2 px-3 text-center text-gray-400 bg-gray-50/80 dark:bg-slate-950 font-sans text-xs">
                            {rowIdx + 1}
                          </td>
                          {headers.map((h, colIdx) => (
                            <td key={colIdx} className="py-2 px-3.5 text-gray-800 dark:text-gray-200 whitespace-nowrap">
                              {row[h] || "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 italic">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                This dummy dataset is structured with standard Malaysian & international student formats ready for instant upload.
              </p>
            </div>
          )}

          {/* TAB 3: FORMATTING RULES & SPECIFICATIONS */}
          {activeTab === "format" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Rule 1 */}
                <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    First Row Must Be Column Headers
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    Row 1 in your file must contain clear names for each column (e.g. <code>Full Name</code>, <code>School</code>, <code>IC Number</code>).
                  </p>
                </div>

                {/* Rule 2 */}
                <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    One Student Per Row
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    Each row from Row 2 onward represents an individual student certificate. Empty rows are skipped automatically.
                  </p>
                </div>

                {/* Rule 3 */}
                <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                    <AlertCircle className="w-4 h-4" />
                    Avoid Merged Cells
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    Spreadsheets with merged header or data cells can cause alignment issues. Keep table grids simple and unmerged.
                  </p>
                </div>

                {/* Rule 4 */}
                <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
                    <HelpCircle className="w-4 h-4" />
                    Supported File Types
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    We support Microsoft Excel (<code>.xlsx</code>, <code>.xls</code>) and standard comma-separated files (<code>.csv</code>).
                  </p>
                </div>
              </div>

              {/* Batch Capacity note */}
              <div className="p-4 bg-gray-50 dark:bg-slate-800/80 rounded-xl border border-gray-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-300">
                  Maximum batch capacity: <strong className="text-gray-900 dark:text-white">Up to 6,000 students</strong> per upload.
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> High-speed generation
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Download className="w-4 h-4 text-blue-600" />
            <span>Need a template now? Download directly:</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => downloadSampleExcel(templateConfig, eventTitle)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Sample Excel (.xlsx)
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200 transition-colors"
            >
              Got it, Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
