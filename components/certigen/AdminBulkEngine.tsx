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
    <div className="w-full bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-800 overflow-hidden text-white">
      {/* Step Progress Header */}
      <WizardStepBar step={step} />

      <div className="p-6 sm:p-10 lg:p-12">
        {step === 1 && (
          <div className="space-y-8 max-w-6xl mx-auto">
            {/* Pop-Out Guide Launcher Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/20 border border-blue-500/30 shadow-lg shadow-blue-500/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 flex-shrink-0">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    Need Help Preparing Your Student Spreadsheet?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300">
                    Open our interactive 3-step guide for formatting rules, sample data preview, and template downloads.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-center flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsGuideOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/20 transition-all hover:scale-102 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  Open Step-by-Step Guide
                </button>
              </div>
            </div>

            {/* Main Form & Upload Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Teacher Profile Information */}
              {isPublicMode && (
                <div className="lg:col-span-6 p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-5 shadow-sm">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                          1. Teacher Information
                        </h4>
                        <p className="text-xs text-slate-400">
                          Enter your details for certificate records
                        </p>
                      </div>
                    </div>

                    {isInfoValid && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-400" />
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
                        className="bg-slate-950/70 border-slate-700 text-white placeholder-slate-500 text-sm focus:border-blue-500 rounded-xl"
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
                        className="bg-slate-950/70 border-slate-700 text-white placeholder-slate-500 text-sm focus:border-blue-500 rounded-xl"
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
                        className="bg-slate-950/70 border-slate-700 text-white placeholder-slate-500 text-sm focus:border-blue-500 rounded-xl"
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
                        className="w-full border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-950/70 text-white placeholder-slate-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Student File Area */}
              <div
                className={`${
                  isPublicMode ? "lg:col-span-6" : "lg:col-span-12"
                } p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-5 shadow-sm`}
              >
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <FileUp className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                        2. Upload Student List (.xlsx / .csv)
                      </h4>
                      <p className="text-xs text-slate-400">
                        Max 6,000 students per batch
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => downloadSampleExcel(templateConfig, eventTitle)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Sample Excel (.xlsx)
                    </button>
                  </div>
                </div>

                {isInfoValid ? (
                  <CertificateUploadArea
                    templateConfig={templateConfig}
                    onFileUpload={handleFileUpload}
                    eventTitle={eventTitle}
                  />
                ) : (
                  <div className="p-10 bg-slate-950/40 border-2 border-dashed border-slate-800 rounded-2xl text-center text-slate-500 space-y-2">
                    <FileUp className="w-10 h-10 mx-auto text-slate-600" />
                    <p className="text-sm font-medium text-slate-400">
                      Please complete your Teacher Information on the left to unlock file upload.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Guide Pop-Out Modal */}
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
