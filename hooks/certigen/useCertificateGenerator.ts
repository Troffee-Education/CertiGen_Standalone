"use client";

import { useState, useRef } from "react";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import type { FieldConfig } from "@/components/certigen/CanvasEditor";
import { CertiGenService } from "@/lib/services/certigen.service";
import { parseFile } from "@/lib/certigen/file-parser";
import {
  MAX_STUDENTS,
  NAME_PATTERNS,
  autoMapColumns,
  detectColumn,
  generatePdf,
} from "@/lib/certigen/certificate";

type Props = {
  templateUrl: string;
  templateConfig: FieldConfig[] | null;
  eventId: string;
  magicLinkId?: string;
  teacherName: string;
  teacherEmail: string;
};

export function useCertificateGenerator({
  templateUrl,
  templateConfig,
  eventId,
  magicLinkId,
  teacherName,
  teacherEmail,
}: Props) {
  const [csvData, setCsvData] = useState<Record<string, unknown>[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [nameColumn, setNameColumn] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [progress, setProgress] = useState(0); // Kept for API compatibility, though less precise now
  const [isSuccess, setIsSuccess] = useState(false);
  const [eta, setEta] = useState("");
  
  const [jobStatus, setJobStatus] = useState<string>("IDLE");
  const [zipUrl, setZipUrl] = useState<string | null>(null);

  const cancelRef = useRef(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseFile(buffer, file.name);

      if (parsed.headers.length === 0 || parsed.data.length === 0) {
        alert("The file is empty or has no data rows.");
        return;
      }

      setCsvData(parsed.data);
      setCsvHeaders(parsed.headers);
      setMapping(autoMapColumns(parsed.headers, templateConfig ?? []));
      setNameColumn(detectColumn(parsed.headers, NAME_PATTERNS) || parsed.headers[0] || "");
      setStep(2);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to parse file");
    }
  };

  const generatePDFs = async () => {
    if (csvData.length === 0) {
      alert("No student data to generate certificates for.");
      return;
    }

    if (csvData.length > MAX_STUDENTS) {
      alert(`Maximum ${MAX_STUDENTS} students allowed per batch. Your file has ${csvData.length}.`);
      return;
    }

    setStep(3);
    cancelRef.current = false;
    setIsCancelling(false);
    setEta("Initializing background job...");
    setJobStatus("STARTING");

    try {
      setJobStatus("PROCESSING");
      setEta("Downloading template...");
      
      const res = await fetch(templateUrl);
      if (!res.ok) throw new Error("Failed to load template image");
      const templateImageBytes = await res.arrayBuffer();
      
      const greatVibesRef: { current: ArrayBuffer | null } = { current: null };
      const zip = new JSZip();
      const usedFileNames = new Map<string, number>();

      for (let i = 0; i < csvData.length; i++) {
        if (cancelRef.current) {
          throw new Error("Cancelled by user");
        }
        
        const percent = Math.round(((i + 1) / csvData.length) * 100);
        setProgress(percent);
        setEta(`Generating certificate ${i + 1} of ${csvData.length} (${percent}%)...`);
        
        // Yield to browser event loop so React can repaint the progress line bar live
        await new Promise((resolve) => setTimeout(resolve, 0));
        
        const student = csvData[i];
        const pdfBytes = await generatePdf(
          student,
          templateConfig ?? [],
          templateUrl,
          mapping,
          templateImageBytes,
          greatVibesRef
        );
        
        const rawName = String(student[nameColumn] || `student_${i + 1}`);
        const base = (rawName.replace(/[^a-z0-9]/gi, '_').replace(/^_+|_+$/g, '') || `student_${i + 1}`).slice(0, 80);
        const dupCount = usedFileNames.get(base) || 0;
        usedFileNames.set(base, dupCount + 1);
        const fileName = (dupCount > 0 ? `${base}_${dupCount + 1}` : base) + '.pdf';
        zip.file(fileName, pdfBytes);
      }

      setEta("Zipping certificates...");
      const zipBlob = await zip.generateAsync({ type: "blob" });
      
      setEta("Downloading ZIP file...");
      const downloadName = (teacherName || "certificates").replace(/[^a-z0-9]/gi, '_');
      saveAs(zipBlob, `${downloadName}_certificates.zip`);

      setEta("Saving dataset for analytics...");
      try {
        await fetch("/api/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId,
            magicLinkId: magicLinkId || null,
            teacherName: teacherName || "Teacher",
            teacherEmail: teacherEmail || "teacher@example.com",
            studentData: csvData,
            certificateCount: csvData.length,
            status: "COMPLETED",
            hasDownloaded: true,
          }),
        });
      } catch (analyticsErr) {
        console.warn("Analytics dataset save warning:", analyticsErr);
      }

      setJobStatus("COMPLETED");
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "An unexpected error occurred.");
      setJobStatus("FAILED");
      setStep(2);
    }
  };

  const generatePreview = async () => {
    if (csvData.length === 0 || Object.values(mapping).length === 0) return;

    try {
      const res = await fetch(templateUrl);
      if (!res.ok) throw new Error("Failed to load template image");
      const templateImageBytes = await res.arrayBuffer();
      const student = csvData[0];
      const greatVibesRef: { current: ArrayBuffer | null } = { current: null };

      const pdfBytes = await generatePdf(
        student,
        templateConfig ?? [],
        templateUrl,
        mapping,
        templateImageBytes,
        greatVibesRef
      );

      const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
      saveAs(blob, "preview.pdf");
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Preview generation failed");
    }
  };

  return {
    csvData,
    csvHeaders,
    mapping,
    setMapping,
    step,
    setStep,
    progress,
    isSuccess,
    eta,
    isCancelling,
    setIsCancelling,
    cancelRef,
    handleFileUpload,
    generatePDFs,
    generatePreview,
    jobStatus,
    zipUrl,
  };
}
