"use client";

import React, { useState } from "react";
import { FileUp, Info } from "lucide-react";
import type { FieldConfig } from "./CanvasEditor";
import { useCertificateGenerator } from "@/hooks/certigen/useCertificateGenerator";
import WizardStepBar from "./WizardStepBar";
import CertificateUploadArea from "./CertificateUploadArea";
import CertificateMapStep from "./CertificateMapStep";
import CertificateProgressStep from "./CertificateProgressStep";
import { Input } from "@/components/base/input/input";
import { Label } from "@/components/base/input/label";

type Props = {
  eventId: string;
  magicLinkId?: string;
  adminName: string;
  adminEmail: string;
  templateUrl: string;
  templateConfig: FieldConfig[] | null;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/;

export default function AdminBulkEngine({
  eventId,
  magicLinkId,
  adminName,
  adminEmail,
  templateUrl,
  templateConfig,
}: Props) {
  const [teacherName, setTeacherName] = useState(adminName || "");
  const [teacherEmail, setTeacherEmail] = useState(adminEmail || "");
  const [schoolName, setSchoolName] = useState("");
  const [teacherPhone, setTeacherPhone] = useState("");

  const {
    csvHeaders, mapping, setMapping, step, isSuccess, eta, progress,
    handleFileUpload, generatePDFs, generatePreview, jobStatus, zipUrl
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
  const isInfoValid = !isPublicMode || (
    teacherName.trim().length > 0 &&
    schoolName.trim().length > 0 &&
    isEmailValid &&
    isPhoneValid
  );

  const handleNumericKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowed = ["Backspace", "Delete", "Tab", "Escape", "Enter", "ArrowLeft", "ArrowRight", "Home", "End", "+", "-", " "];
    if (allowed.includes(e.key)) return;
    if (e.ctrlKey || e.metaKey) return;
    if (!/^\d$/.test(e.key)) e.preventDefault();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <WizardStepBar step={step} />

      <div className="p-8">
        {step === 1 && (
          <div className="max-w-xl mx-auto py-4 space-y-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mb-4">
                <FileUp className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Bulk Generate Certificates</h2>
              <p className="text-gray-500 text-sm">
                Upload a CSV or Excel file containing student details. Ensure the first row contains headers.
              </p>
            </div>

            {isPublicMode && (
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-4 mb-4">
                <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">Teacher Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-gray-700">Full Name</Label>
                    <Input
                      isRequired
                      placeholder="Enter your name"
                      value={teacherName}
                      onChange={(val: any) => setTeacherName(typeof val === 'string' ? val : val?.target?.value || '')}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-gray-700">School Name</Label>
                    <Input
                      isRequired
                      placeholder="Enter school name"
                      value={schoolName}
                      onChange={(val: any) => setSchoolName(typeof val === 'string' ? val : val?.target?.value || '')}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-gray-700">Email Address</Label>
                    <Input
                      isRequired
                      type="email"
                      placeholder="teacher@school.edu"
                      value={teacherEmail}
                      onChange={(val: any) => setTeacherEmail(typeof val === 'string' ? val : val?.target?.value || '')}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-gray-700">Phone Number</Label>
                    <input
                      required
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9+\-\s]*"
                      placeholder="Enter phone number"
                      value={teacherPhone}
                      onKeyDown={handleNumericKeyDown}
                      onChange={(e) => setTeacherPhone(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white text-gray-700"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Column Matching Guide */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-start gap-3 text-sm text-blue-800">
              <Info className="w-5 h-5 flex-shrink-0 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Column Matching Guide</p>
                <p className="text-xs text-blue-700 leading-relaxed">
                  To generate certificates, your CSV or Excel file needs columns matching the template fields. 
                  In the next step, you will match your file's headers (e.g. <code>Full Name</code> or <code>School</code>) to the template fields. You can download the sample CSV template below to see the exact structure.
                </p>
              </div>
            </div>

            {isInfoValid ? (
              <CertificateUploadArea templateConfig={templateConfig} onFileUpload={handleFileUpload} />
            ) : (
              <div className="p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg text-center text-gray-400">
                <FileUp className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm font-medium">Please fill in all your information above to unlock the file upload.</p>
              </div>
            )}
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
