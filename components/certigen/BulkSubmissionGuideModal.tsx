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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-100 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header with Step Wizard Indicator */}
        <div className="px-6 sm:px-8 py-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-blue-950/40 to-indigo-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  Step-by-Step Upload Guide
                </h3>
                <span className="text-[11px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">
                  Step {currentStep} of 3
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentStep === 1 && "Step 1: Download your ready-to-use template"}
                {currentStep === 2 && "Step 2: Prepare & format your student list"}
                {currentStep === 3 && "Step 3: Upload and generate bulk certificates"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Pills Bar */}
        <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-950/60 p-2 gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              currentStep === 1
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
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
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              currentStep === 2
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
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
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              currentStep === 3
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <span>3.</span>
            <span>Upload & Generate</span>
          </button>
        </div>

        {/* Modal Step Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* STEP 1: DOWNLOAD TEMPLATE */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="text-center space-y-2 max-w-lg mx-auto">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                  <FileSpreadsheet className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-extrabold text-white">
                  Step 1: Download Sample Template
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Start by downloading our formatted dummy spreadsheet template. It is pre-configured with all the fields required for this certificate event.
                </p>
              </div>

              {/* Download cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
                <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3 text-center flex flex-col justify-between hover:border-emerald-500/50 transition-colors">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                      Recommended
                    </span>
                    <h5 className="font-bold text-white text-base">Excel Spreadsheet (.xlsx)</h5>
                    <p className="text-[11px] text-slate-400">
                      Standard Microsoft Excel workbook with pre-styled column headers.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadSampleExcel(templateConfig, eventTitle)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Download Sample .xlsx
                  </button>
                </div>

                <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3 text-center flex flex-col justify-between hover:border-blue-500/50 transition-colors">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Universal
                    </span>
                    <h5 className="font-bold text-white text-base">Comma-Separated (.csv)</h5>
                    <p className="text-[11px] text-slate-400">
                      Compatible with Google Sheets, Apple Numbers, and text editors.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadSampleCsv(templateConfig, eventTitle)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    Download Sample .csv
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-xs flex items-center gap-3">
                <Lightbulb className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <span>
                  Already have your student list in another spreadsheet? Click <strong>Next</strong> to see how to structure your headers for automatic column mapping.
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: FORMATTING RULES & INTERACTIVE TABLE PREVIEW */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-white">
                  Step 2: Structure Your Columns & Rows
                </h4>
                <p className="text-xs text-slate-400">
                  Ensure your spreadsheet strictly adheres to the formatting guidelines below:
                </p>
              </div>

              {/* Rules 3-Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Row 1 = Headers</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Top row must contain column titles (e.g. Student Name, School).
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>1 Student Per Row</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Each subsequent row generates 1 certificate. Empty rows are skipped.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-400">
                    <AlertCircle className="w-4 h-4" />
                    <span>No Merged Cells</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Keep the table flat and simple without merged columns or rows.
                  </p>
                </div>
              </div>

              {/* Sample Table Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Table className="w-4 h-4 text-emerald-400" />
                    Sample Table Layout (Matching Your Template):
                  </span>
                  <button
                    type="button"
                    onClick={() => downloadSampleExcel(templateConfig, eventTitle)}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 underline underline-offset-2 cursor-pointer font-semibold"
                  >
                    Download this sample sheet (.xlsx)
                  </button>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden shadow-inner bg-slate-950">
                  <div className="overflow-x-auto max-h-[220px]">
                    <table className="w-full text-left text-xs border-collapse font-mono">
                      <thead>
                        <tr className="bg-blue-600 text-white font-semibold uppercase text-[11px] tracking-wider">
                          <th className="py-2.5 px-3 text-center border-r border-blue-500 w-10">#</th>
                          {headers.map((h, i) => (
                            <th key={i} className="py-2.5 px-3.5 border-r border-blue-500 last:border-r-0 whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-[11px] text-slate-300">
                        {rows.map((row, rowIdx) => (
                          <tr key={rowIdx} className="hover:bg-slate-900/90 transition-colors">
                            <td className="py-2 px-3 text-center text-slate-500 bg-slate-900/60 font-sans">
                              {rowIdx + 1}
                            </td>
                            {headers.map((h, colIdx) => (
                              <td key={colIdx} className="py-2 px-3.5 whitespace-nowrap">
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
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="text-center space-y-2 max-w-lg mx-auto">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/10">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-extrabold text-white">
                  Step 3: Upload & Instant Batch Generation
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  You are now ready to generate official certificates for your entire student list!
                </p>
              </div>

              {/* What happens next */}
              <div className="space-y-3 max-w-xl mx-auto">
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                    A
                  </span>
                  <div>
                    <h5 className="font-bold text-white text-xs">Fill Teacher Details & Upload</h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Enter your teacher info on the main screen and drop your saved <code>.xlsx</code> or <code>.csv</code> file.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                    B
                  </span>
                  <div>
                    <h5 className="font-bold text-white text-xs">Confirm Column Mapping</h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      The system automatically matches your columns to certificate placeholders. Click <strong>Preview</strong> to test generate 1 sample.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                    C
                  </span>
                  <div>
                    <h5 className="font-bold text-white text-xs">High-Speed ZIP Download</h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Click <strong>Start Generating</strong> to process all student certificates in seconds into a single ZIP archive!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Back / Next Navigation */}
        <div className="px-6 sm:px-8 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous Step
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
              >
                Skip & Close
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                Next Step
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-102 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Got it, Start Uploading!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
