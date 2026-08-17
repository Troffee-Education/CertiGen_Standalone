"use client";

import React, { useState } from "react";
import {
  FileUp,
  BookOpen,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Download,
  Info,
} from "lucide-react";
import type { FieldConfig } from "./CanvasEditor";
import { useCertificateGenerator } from "@/hooks/certigen/useCertificateGenerator";
import WizardStepBar from "./WizardStepBar";
import CertificateUploadArea from "./CertificateUploadArea";
import CertificateMapStep from "./CertificateMapStep";
import CertificateProgressStep from "./CertificateProgressStep";
import BulkSubmissionGuideModal from "./BulkSubmissionGuideModal";
import {
  downloadSampleExcel,
  downloadSampleCsv,
} from "@/lib/certigen/sample-template-generator";
import { Input } from "@/components/base/input/input";
import { Label } from "@/components/base/input/label";

type Props = {
  eventId: string;
  magicLinkId?: string;
  adminName: string;
  adminEmail: string;
  templateUrl: string;
  templateConfig: FieldConfig[] | null;
  eventTitle?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/;

export default function AdminBulkEngine({
  eventId,
  magicLinkId,
  adminName,
  adminEmail,
  templateUrl,
  templateConfig,
  eventTitle,
}: Props) {
  const [teacherName, setTeacherName] = useState(adminName || "");
  const [teacherEmail, setTeacherEmail] = useState(adminEmail || "");
  const [schoolName, setSchoolName] = useState("");
  const [teacherPhone, setTeacherPhone] = useState("");
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const {
    csvHeaders,
    mapping,
    setMapping,
    step,
    isSuccess,
    eta,
    progress,
    handleFileUpload,
    generatePDFs,
    generatePreview,
    jobStatus,
    zipUrl,
  } = useCertificateGenerator({
    templateUrl,
    templateConfig,
    eventId,
    magicLinkId,
    teacherName: teacherName,
    teacherEmail: teacherEmail,
    teacherPhone: teacherPhone,
    schoolName: schoolName,
  });

  const canGenerate = Object.values(mapping).length > 0;
  const isPublicMode = !adminName || !adminEmail;
  const isEmailValid = EMAIL_REGEX.test(teacherEmail.trim());
  const isPhoneValid = teacherPhone.trim().length >= 7; // Basic validation check for phone numbers
  const isInfoValid =
    !isPublicMode ||
    (teacherName.trim().length > 0 &&
      schoolName.trim().length > 0 &&
      isEmailValid &&
      isPhoneValid);

  const handleNumericKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowed = [
      "Backspace",
      "Delete",
      "Tab",
      "Escape",
      "Enter",
      "ArrowLeft",
      "ArrowRight",
      "Home",
      "End",
      "+",
      "-",
      " ",
    ];
    if (allowed.includes(e.key)) return;
    if (e.ctrlKey || e.metaKey) return;
    if (!/^\d$/.test(e.key)) e.preventDefault();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
      <WizardStepBar step={step} />

      <div className="p-6 md:p-8">
        {step === 1 && (
          <div className="max-w-2xl mx-auto py-2 space-y-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-3 shadow-xs">
                <FileUp className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Bulk Student Submission
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Upload your student list in Excel (.xlsx) or CSV format to generate individual certificates.
              </p>
            </div>

            {/* Quick User Manual Banner Card */}
            <div className="bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-slate-50 dark:from-slate-800/80 dark:to-slate-900 border border-blue-200/80 dark:border-slate-700 p-5 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      Quick User Manual & Format Guide
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Follow these 3 simple steps to ensure your student list uploads smoothly:
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsGuideOpen(true)}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-2 flex-shrink-0 cursor-pointer"
                >
                  View Full Manual
                </button>
              </div>

              {/* 3 Step Visual Flow */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="bg-white/80 dark:bg-slate-800/80 p-3 rounded-xl border border-blue-100 dark:border-slate-700/80 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                    1
                  </span>
                  <div>
                    <strong className="block font-semibold text-gray-800 dark:text-gray-200">
                      Download Template
                    </strong>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      Get the pre-formatted dummy Excel file.
                    </span>
                  </div>
                </div>

                <div className="bg-white/80 dark:bg-slate-800/80 p-3 rounded-xl border border-indigo-100 dark:border-slate-700/80 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                    2
                  </span>
                  <div>
                    <strong className="block font-semibold text-gray-800 dark:text-gray-200">
                      Fill Student List
                    </strong>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      1 student per row. First row = titles.
                    </span>
                  </div>
                </div>

                <div className="bg-white/80 dark:bg-slate-800/80 p-3 rounded-xl border border-purple-100 dark:border-slate-700/80 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                    3
                  </span>
                  <div>
                    <strong className="block font-semibold text-gray-800 dark:text-gray-200">
                      Upload & Generate
                    </strong>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      Map headers & download bulk ZIP.
                    </span>
                  </div>
                </div>
              </div>

              {/* Action row with sample downloads */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-blue-100/60 dark:border-slate-700/60">
                <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Ready-to-use dummy spreadsheet matching this event&apos;s design:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadSampleExcel(templateConfig, eventTitle)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Download Dummy Excel (.xlsx)
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadSampleCsv(templateConfig, eventTitle)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-gray-500" />
                    Download CSV
                  </button>
                </div>
              </div>
            </div>

            {/* Teacher Information Form (for public links) */}
            {isPublicMode && (
              <div className="bg-gray-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 space-y-4">
                <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                  Teacher Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Full Name
                    </Label>
                    <Input
                      isRequired
                      placeholder="e.g. Cikgu Azman"
                      value={teacherName}
                      onChange={(val: any) =>
                        setTeacherName(
                          typeof val === "string"
                            ? val
                            : val?.target?.value || ""
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      School Name
                    </Label>
                    <Input
                      isRequired
                      placeholder="e.g. SMK Bandar Utama"
                      value={schoolName}
                      onChange={(val: any) =>
                        setSchoolName(
                          typeof val === "string"
                            ? val
                            : val?.target?.value || ""
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Email Address
                    </Label>
                    <Input
                      isRequired
                      type="email"
                      placeholder="teacher@school.edu.my"
                      value={teacherEmail}
                      onChange={(val: any) =>
                        setTeacherEmail(
                          typeof val === "string"
                            ? val
                            : val?.target?.value || ""
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Phone Number
                    </Label>
                    <input
                      required
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9+\-\s]*"
                      placeholder="e.g. 012-3456789"
                      value={teacherPhone}
                      onKeyDown={handleNumericKeyDown}
                      onChange={(e) => setTeacherPhone(e.target.value)}
                      className="w-full border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Upload Area */}
            {isInfoValid ? (
              <CertificateUploadArea
                templateConfig={templateConfig}
                onFileUpload={handleFileUpload}
                eventTitle={eventTitle}
              />
            ) : (
              <div className="p-8 bg-gray-50 dark:bg-slate-800/30 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-2xl text-center text-gray-400">
                <FileUp className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                <p className="text-sm font-medium">
                  Please fill in your teacher information above to unlock file upload.
                </p>
              </div>
            )}

            {/* Guide Modal Trigger */}
            <BulkSubmissionGuideModal
              isOpen={isGuideOpen}
              onClose={() => setIsGuideOpen(false)}
              templateConfig={templateConfig}
              eventTitle={eventTitle}
            />
          </div>
        )}

        {step === 2 && (
          <CertificateMapStep
            templateConfig={templateConfig}
            csvHeaders={csvHeaders}
            mapping={mapping}
            onMappingChange={setMapping}
            onPreview={generatePreview}
            onGenerate={generatePDFs}
            canGenerate={canGenerate}
          />
        )}

        {step === 3 && (
          <CertificateProgressStep
            isSuccess={isSuccess}
            jobStatus={jobStatus}
            progress={progress}
            zipUrl={zipUrl}
            eta={eta}
            onRestart={() => window.location.reload()}
          />
        )}
      </div>
    </div>
  );
}
