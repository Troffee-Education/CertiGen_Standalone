"use client";

import React from "react";
import { FileUp } from "lucide-react";
import type { FieldConfig } from "./CanvasEditor";
import { useCertificateGenerator } from "@/hooks/certigen/useCertificateGenerator";
import WizardStepBar from "./WizardStepBar";
import CertificateUploadArea from "./CertificateUploadArea";
import CertificateMapStep from "./CertificateMapStep";
import CertificateProgressStep from "./CertificateProgressStep";

type Props = {
  eventId: string;
  magicLinkId?: string;
  adminName: string;
  adminEmail: string;
  templateUrl: string;
  templateConfig: FieldConfig[] | null;
};

export default function AdminBulkEngine({
  eventId,
  magicLinkId,
  adminName,
  adminEmail,
  templateUrl,
  templateConfig,
}: Props) {
  const {
    csvHeaders, mapping, setMapping, step, isSuccess, eta, progress,
    handleFileUpload, generatePDFs, generatePreview, jobStatus, zipUrl
  } = useCertificateGenerator({
    templateUrl,
    templateConfig,
    eventId,
    magicLinkId,
    teacherName: adminName,
    teacherEmail: adminEmail,
  });

  const canGenerate = Object.values(mapping).length > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <WizardStepBar step={step} />

      <div className="p-8">
        {step === 1 && (
          <div className="max-w-xl mx-auto py-8">
            <div className="text-center mb-10">
              <div className="mx-auto w-16 h-16 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mb-4">
                <FileUp className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Bulk Generate Certificates</h2>
              <p className="text-gray-500">
                Upload a CSV or Excel file containing student details. Ensure the first row contains headers.
              </p>
            </div>

            <CertificateUploadArea templateConfig={templateConfig} onFileUpload={handleFileUpload} />
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
