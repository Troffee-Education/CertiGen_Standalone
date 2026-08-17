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
  ArrowRight,
  ArrowLeft,
  UploadCloud,
  FileCheck,
  ShieldCheck,
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
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const { headers, rows } = getSampleTableData(templateConfig);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] w-screen h-screen min-h-screen bg-slate-950/95 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-8 lg:p-12 overflow-hidden animate-in fade-in duration-300">
      <div
        className="w-full max-w-6xl mx-auto h-full flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Full-Width Header with Step Wizard Indicator */}
        <div className="px-6 sm:px-10 py-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-blue-950/40 to-indigo-950/40 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Bulk Submission Quick Manual
                </h3>
                <span className="text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-0.5 rounded-full">
                  Step {currentStep} of 3
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                {currentStep === 1 && "Step 1: Download the official sample template"}
                {currentStep === 2 && "Step 2: Format your columns & preview dummy data"}
                {currentStep === 3 && "Step 3: Upload student file and generate certificates"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-2xl transition-colors cursor-pointer"
            aria-label="Close guide"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Step Progress Navigation Bar */}
        <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-950/70 p-2.5 sm:p-3 gap-2 sm:gap-4 text-xs sm:text-sm font-bold flex-shrink-0">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`py-2.5 px-3 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              currentStep === 1
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/30"
                : currentStep > 1
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            {currentStep > 1 ? <CheckCircle2 className="w-4 h-4" /> : <span>1.</span>}
            <span>Download Template</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className={`py-2.5 px-3 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              currentStep === 2
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/30"
                : currentStep > 2
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            {currentStep > 2 ? <CheckCircle2 className="w-4 h-4" /> : <span>2.</span>}
            <span>Format Rules & Table</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            className={`py-2.5 px-3 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              currentStep === 3
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <span>3.</span>
            <span>Upload & Generate</span>
          </button>
        </div>

        {/* Modal Step Content Body */}
        <div className="p-6 sm:p-10 overflow-y-auto space-y-8 flex-1 text-sm">
          {/* STEP 1: DOWNLOAD TEMPLATE */}
          {currentStep === 1 && (
            <div className="space-y-8 animate-in fade-in duration-200 max-w-4xl mx-auto">
              <div className="text-center space-y-2 max-w-2xl mx-auto">
                <div className="mx-auto w-20 h-20 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-xl shadow-emerald-500/10 mb-3">
                  <FileSpreadsheet className="w-10 h-10" />
                </div>
                <h4 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Step 1: Download the Sample Spreadsheet
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Start by downloading our formatted dummy spreadsheet template. It is pre-configured with all the fields required for this certificate event.
                </p>
              </div>

              {/* Download Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto pt-2">
                <div className="p-6 rounded-3xl bg-slate-800/80 border border-slate-700 space-y-4 text-center flex flex-col justify-between hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5 transition-all">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                      Recommended
                    </span>
                    <h5 className="font-extrabold text-white text-lg">Excel Spreadsheet (.xlsx)</h5>
                    <p className="text-xs text-slate-400">
                      Standard Microsoft Excel workbook with pre-styled column headers and sample rows.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadSampleExcel(templateConfig, eventTitle)}
                    className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all hover:scale-102 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Download Sample Excel (.xlsx)
                  </button>
                </div>

                <div className="p-6 rounded-3xl bg-slate-800/80 border border-slate-700 space-y-4 text-center flex flex-col justify-between hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Universal
                    </span>
                    <h5 className="font-extrabold text-white text-lg">Comma-Separated (.csv)</h5>
                    <p className="text-xs text-slate-400">
                      Compatible with Google Sheets, Apple Numbers, and text editors.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadSampleCsv(templateConfig, eventTitle)}
                    className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold transition-all hover:scale-102 cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    Download Sample .csv
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-xs sm:text-sm flex items-center gap-3 max-w-2xl mx-auto">
                <Lightbulb className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <span>
                  Already have your student list in another spreadsheet? Click <strong>Next Step</strong> to see how to format your headers for automatic column detection.
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: FORMATTING RULES & INTERACTIVE TABLE PREVIEW */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200 max-w-5xl mx-auto">
              <div className="space-y-1">
                <h4 className="text-xl sm:text-2xl font-extrabold text-white">
                  Step 2: Spreadsheet Formatting Guidelines
                </h4>
                <p className="text-xs sm:text-sm text-slate-400">
                  Ensure your file strictly follows these rules to avoid parsing or alignment issues:
                </p>
              </div>

              {/* Rules 3-Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Row 1 = Headers</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    The top row must contain column titles (e.g. Student Name, School Name, IC Number).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>1 Student Per Row</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Each subsequent row represents an individual student. Empty rows are skipped automatically.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
                    <AlertCircle className="w-5 h-5" />
                    <span>No Merged Cells</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Keep table cells unmerged and simple to guarantee deterministic text placement.
                  </p>
                </div>
              </div>

              {/* Sample Table Preview */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Table className="w-4 h-4 text-emerald-400" />
                    Live Sample Table Layout (Customized to Active Template):
                  </span>
                  <button
                    type="button"
                    onClick={() => downloadSampleExcel(templateConfig, eventTitle)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 underline underline-offset-2 cursor-pointer font-bold"
                  >
                    Download this sample sheet (.xlsx)
                  </button>
                </div>

                <div className="border border-slate-800 rounded-2xl overflow-hidden shadow-inner bg-slate-950">
                  <div className="overflow-x-auto max-h-[280px]">
                    <table className="w-full text-left text-xs sm:text-sm border-collapse font-mono">
                      <thead>
                        <tr className="bg-blue-600 text-white font-semibold uppercase text-xs tracking-wider">
                          <th className="py-3 px-3 text-center border-r border-blue-500 w-12">#</th>
                          {headers.map((h, i) => (
                            <th key={i} className="py-3 px-4 border-r border-blue-500 last:border-r-0 whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-xs text-slate-300">
                        {rows.map((row, rowIdx) => (
                          <tr key={rowIdx} className="hover:bg-slate-900/90 transition-colors">
                            <td className="py-2.5 px-3 text-center text-slate-500 bg-slate-900/60 font-sans">
                              {rowIdx + 1}
                            </td>
                            {headers.map((h, colIdx) => (
                              <td key={colIdx} className="py-2.5 px-4 whitespace-nowrap">
                                {row[h] || "-"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: UPLOAD & GENERATE */}
          {currentStep === 3 && (
            <div className="space-y-8 animate-in fade-in duration-200 max-w-4xl mx-auto">
              <div className="text-center space-y-2 max-w-2xl mx-auto">
                <div className="mx-auto w-20 h-20 rounded-3xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-xl shadow-indigo-500/10 mb-3">
                  <UploadCloud className="w-10 h-10" />
                </div>
                <h4 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Step 3: Upload & Instant Batch Generation
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  You are now ready to generate official certificates for your entire student list!
                </p>
              </div>

              {/* 3 Step Workflow */}
              <div className="space-y-4 max-w-2xl mx-auto">
                <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-start gap-4">
                  <span className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                    A
                  </span>
                  <div>
                    <h5 className="font-bold text-white text-sm">Enter Teacher Details & Upload</h5>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      Fill your teacher name and school name on the portal, then drop your completed <code>.xlsx</code> or <code>.csv</code> file.
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-start gap-4">
                  <span className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                    B
                  </span>
                  <div>
                    <h5 className="font-bold text-white text-sm">Verify Column Matching</h5>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      Our system automatically matches your columns to certificate placeholders. Click <strong>Preview</strong> to test generate 1 sample.
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-start gap-4">
                  <span className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                    C
                  </span>
                  <div>
                    <h5 className="font-bold text-white text-sm">Download Complete ZIP Archive</h5>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      Click <strong>Start Generating</strong> to process all student certificates in seconds into a single, high-resolution ZIP archive!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Back / Next Navigation */}
        <div className="px-6 sm:px-10 py-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between flex-shrink-0">
          <div>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous Step
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-2xl text-slate-400 hover:text-slate-200 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
              >
                Skip & Close
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
              >
                Next Step
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-xl shadow-emerald-500/25 transition-all hover:scale-102 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                Got it, Start Uploading!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
