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
  User,
  School,
  Mail,
  Phone,
  Table,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import type { FieldConfig } from "./CanvasEditor";
import { useCertificateGenerator } from "@/hooks/certigen/useCertificateGenerator";
import WizardStepBar from "./WizardStepBar";
import CertificateUploadArea from "./CertificateUploadArea";
import CertificateMapStep from "./CertificateMapStep";
import CertificateProgressStep from "./CertificateProgressStep";
import BulkSubmissionGuideModal from "./BulkSubmissionGuideModal";
import {
  getSampleTableData,
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

  const { headers: sampleHeaders, rows: sampleRows } = getSampleTableData(templateConfig);

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
  const isPhoneValid = teacherPhone.trim().length >= 7;
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
    <div className="w-full bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-800 overflow-hidden text-white">
      {/* Sleek Step Progress Header */}
      <WizardStepBar step={step} />

      <div className="p-6 sm:p-8 lg:p-10">
        {step === 1 && (
          <div className="space-y-8">
            {/* Top Info Header Bar */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800/80">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-semibold uppercase tracking-wider">
                    Bulk Student Portal
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-xs text-slate-400">
                    Maximum <strong className="text-slate-200">6,000 students</strong> per batch
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Prepare & Upload Student List
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => downloadSampleExcel(templateConfig, eventTitle)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Download Sample Excel (.xlsx)
                </button>
                <button
                  type="button"
                  onClick={() => setIsGuideOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  View Guide
                </button>
              </div>
            </div>

            {/* 2-Column Wide Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT COLUMN (6 Cols): Teacher Information & File Upload */}
              <div className="lg:col-span-6 space-y-6">
                {/* Teacher Profile Card */}
                {isPublicMode && (
                  <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                            1. Teacher Information
                          </h3>
                          <p className="text-xs text-slate-400">
                            Required to register the batch certificate generation
                          </p>
                        </div>
                      </div>
                      {isInfoValid && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-blue-400" />
                          Teacher Full Name
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
                          className="bg-slate-950/70 border-slate-700 text-white placeholder-slate-500 text-sm focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <School className="w-3.5 h-3.5 text-blue-400" />
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
                          className="bg-slate-950/70 border-slate-700 text-white placeholder-slate-500 text-sm focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-blue-400" />
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
                          className="bg-slate-950/70 border-slate-700 text-white placeholder-slate-500 text-sm focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-blue-400" />
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
                          className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-950/70 text-white placeholder-slate-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload Area Card */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <FileUp className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        2. Upload Student Spreadsheet
                      </h3>
                      <p className="text-xs text-slate-400">
                        Upload your file (.xlsx, .xls, .csv) with student records
                      </p>
                    </div>
                  </div>

                  {isInfoValid ? (
                    <CertificateUploadArea
                      templateConfig={templateConfig}
                      onFileUpload={handleFileUpload}
                      eventTitle={eventTitle}
                    />
                  ) : (
                    <div className="p-8 bg-slate-950/40 border-2 border-dashed border-slate-800 rounded-2xl text-center text-slate-500 space-y-2">
                      <FileUp className="w-10 h-10 mx-auto text-slate-600" />
                      <p className="text-sm font-medium text-slate-400">
                        Please fill in your teacher information above to unlock file upload.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN (6 Cols): Quick User Manual & Live Dummy Table Preview */}
              <div className="lg:col-span-6 space-y-6">
                {/* Quick Step Manual Card */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 via-blue-950/30 to-indigo-950/40 border border-blue-500/20 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">
                          Quick User Manual: How to Submit
                        </h3>
                        <p className="text-xs text-slate-400">
                          Follow these 3 easy steps for error-free certificates
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 3 Step Flow */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-blue-400">
                        <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px]">
                          1
                        </span>
                        <span>Get Template</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Download the ready-to-use sample Excel file.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-indigo-400">
                        <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px]">
                          2
                        </span>
                        <span>Paste Students</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        1 row per student. Row 1 has column titles.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-purple-400">
                        <span className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px]">
                          3
                        </span>
                        <span>Instant Batch</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Map headers & download all certificates in ZIP.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Embedded Live Dummy Spreadsheet Table Card */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Table className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-sm font-bold text-white">
                        Sample Excel Structure (Live Preview)
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => downloadSampleExcel(templateConfig, eventTitle)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download This Template (.xlsx)
                    </button>
                  </div>

                  <p className="text-xs text-slate-400">
                    Your uploaded spreadsheet should match this structure with columns corresponding to template fields:
                  </p>

                  {/* Table rendering */}
                  <div className="border border-slate-800 rounded-xl overflow-hidden shadow-inner bg-slate-950">
                    <div className="overflow-x-auto max-h-[260px]">
                      <table className="w-full text-left text-xs border-collapse font-mono">
                        <thead>
                          <tr className="bg-blue-600 text-white font-semibold uppercase text-[11px] tracking-wider">
                            <th className="py-2.5 px-3 text-center border-r border-blue-500 w-10">
                              #
                            </th>
                            {sampleHeaders.map((h, i) => (
                              <th
                                key={i}
                                className="py-2.5 px-3.5 border-r border-blue-500 last:border-r-0 whitespace-nowrap"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-[11px] text-slate-300">
                          {sampleRows.map((row, rowIdx) => (
                            <tr
                              key={rowIdx}
                              className="hover:bg-slate-900/90 transition-colors"
                            >
                              <td className="py-2 px-3 text-center text-slate-500 bg-slate-900/60 font-sans">
                                {rowIdx + 1}
                              </td>
                              {sampleHeaders.map((h, colIdx) => (
                                <td
                                  key={colIdx}
                                  className="py-2 px-3.5 whitespace-nowrap"
                                >
                                  {row[h] || "-"}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Clean formatting • No merged cells
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsGuideOpen(true)}
                      className="text-blue-400 hover:text-blue-300 underline underline-offset-2 cursor-pointer"
                    >
                      More format rules & tips →
                    </button>
                  </div>
                </div>
              </div>
            </div>

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
