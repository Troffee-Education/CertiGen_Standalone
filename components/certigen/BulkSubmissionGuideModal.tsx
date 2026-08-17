"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  BookOpen,
  FileSpreadsheet,
  FileText,
  Download,
  X,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import type { FieldConfig } from "./CanvasEditor";
import {
  downloadSampleExcel,
  downloadSampleCsv,
} from "@/lib/certigen/sample-template-generator";

interface UserManualModalProps {
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
}: UserManualModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Centered Clean Light Card */}
      <div
        className="w-full max-w-[800px] bg-white text-gray-900 rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col transition-all transform animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="modal-title"
                className="text-lg sm:text-xl font-bold text-gray-900"
              >
                Quick User Manual
              </h3>
              <p className="text-xs text-gray-500">
                Bulk Certificate Submission Guide
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-700">
              Follow these 3 easy steps for error-free certificates:
            </p>
          </div>

          {/* 3 Steps in Horizontal / Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2.5 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    1
                  </span>
                  <h4 className="font-bold text-gray-900 text-sm">
                    Get Template
                  </h4>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Download the ready-to-use sample Excel file.
                </p>
              </div>

              {/* Download buttons inside Step 1 */}
              <div className="pt-2 space-y-1.5">
                <button
                  type="button"
                  onClick={() => downloadSampleExcel(templateConfig, eventTitle)}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Sample Excel (.xlsx)
                </button>
                <button
                  type="button"
                  onClick={() => downloadSampleCsv(templateConfig, eventTitle)}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-medium transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-gray-500" />
                  Sample .CSV
                </button>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2.5 flex flex-col">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    2
                  </span>
                  <h4 className="font-bold text-gray-900 text-sm">
                    Paste Students
                  </h4>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  1 row per student. Row 1 has column titles.
                </p>
              </div>

              <div className="mt-auto pt-3 text-[11px] text-indigo-700 bg-indigo-100/50 p-2.5 rounded-xl border border-indigo-200/60 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                <span>Keep table cells unmerged</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-2.5 flex flex-col">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    3
                  </span>
                  <h4 className="font-bold text-gray-900 text-sm">
                    Instant Batch
                  </h4>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Map headers & download all certificates in ZIP.
                </p>
              </div>

              <div className="mt-auto pt-3 text-[11px] text-purple-700 bg-purple-100/50 p-2.5 rounded-xl border border-purple-200/60 flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                <span>Supports up to 6,000 rows</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold transition-colors cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
