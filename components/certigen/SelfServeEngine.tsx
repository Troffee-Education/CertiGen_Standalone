"use client";

import React, { useState, useEffect } from "react";
import { Download, Loader2, CheckCircle, Award, Sparkles } from "lucide-react";
import { saveAs } from "file-saver";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Label } from "@/components/base/input/label";
import { CertiGenService, EventModel, MagicLinkModel } from "@/lib/services/certigen.service";
import { generatePdf } from "@/lib/certigen/certificate";
import type { FieldConfig } from "@/components/certigen/CanvasEditor";

type Props = {
  eventData: EventModel;
  magicLink?: MagicLinkModel | null;
};

export default function SelfServeEngine({ eventData, magicLink }: Props) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [email, setEmail] = useState(magicLink?.teacherEmail || "");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [stateName, setStateName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Filter for text fields to render inputs
  const textFields = eventData.templateConfig?.filter((f: FieldConfig) => f.type === "text") || [];

  // Prefill data from magic link if available
  useEffect(() => {
    if (magicLink?.prefillData) {
      const initialData: Record<string, string> = {};
      const prefill = magicLink.prefillData;
      const prefillKeys = Object.keys(prefill);

      const findKey = (patterns: string[], exclude: string[] = []) => {
        return prefillKeys.find(k => {
          const l = k.toLowerCase();
          return patterns.some(p => l.includes(p)) && !exclude.some(ex => l.includes(ex));
        });
      };

      const nameKey = findKey(["name", "nama", "full name"], ["school", "sekolah"]);
      const schoolKey = findKey(["school", "sekolah"]);
      const emailKey = findKey(["email", "e-mel", "mail"]);
      const phoneKey = findKey(["phone", "telefon", "mobile", "contact", "no. tel"]);
      const stateKey = findKey(["state", "negeri", "region"]);

      textFields.forEach((field: FieldConfig) => {
        const fLabel = field.label.toLowerCase();
        let val: string | undefined;

        if (fLabel.includes("school") || fLabel.includes("sekolah")) {
          val = schoolKey ? prefill[schoolKey] : undefined;
        } else if (fLabel.includes("name") || fLabel.includes("nama") || fLabel.includes("student") || fLabel.includes("murid") || fLabel.includes("pelajar") || fLabel.includes("peserta")) {
          val = nameKey ? prefill[nameKey] : undefined;
        } else if (fLabel.includes("email") || fLabel.includes("e-mel")) {
          val = emailKey ? prefill[emailKey] : undefined;
        } else if (fLabel.includes("state") || fLabel.includes("negeri")) {
          val = stateKey ? prefill[stateKey] : undefined;
        }

        if (!val) {
          const exact = prefill[field.label];
          const lower = prefillKeys.find(k => k.toLowerCase() === fLabel);
          val = exact || (lower ? prefill[lower] : undefined);
        }

        if (val) initialData[field.id] = val;
      });

      setFormData(initialData);

      if (phoneKey && prefill[phoneKey]) setPhoneNumber(prefill[phoneKey]);
      if (emailKey && prefill[emailKey]) setEmail(prefill[emailKey]);
      if (stateKey && prefill[stateKey]) setStateName(prefill[stateKey]);
    }
  }, [magicLink, eventData.templateConfig]);

  const handleInputChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      const res = await fetch(eventData.templateUrl);
      if (!res.ok) throw new Error("Failed to load template image");
      const templateImageBytes = await res.arrayBuffer();

      const studentRecord: Record<string, string> = {};
      const mapping: Record<string, string> = {};
      
      textFields.forEach((field: FieldConfig) => {
        const fieldLabelLower = field.label.toLowerCase();
        let val = formData[field.id] || "";
        if (!val) {
          if (phoneNumber && (fieldLabelLower.includes("phone") || fieldLabelLower.includes("mobile") || fieldLabelLower.includes("number"))) {
            val = phoneNumber;
          } else if (email && (fieldLabelLower.includes("email") || fieldLabelLower.includes("mail"))) {
            val = email;
          } else if (stateName && (fieldLabelLower.includes("state") || fieldLabelLower.includes("region") || fieldLabelLower.includes("province"))) {
            val = stateName;
          }
        }
        studentRecord[field.label] = val;
        mapping[field.id] = field.label;
      });

      studentRecord["Phone Number"] = phoneNumber;
      studentRecord["Email"] = email;
      studentRecord["State"] = stateName;

      const greatVibesRef: { current: ArrayBuffer | null } = { current: null };

      const pdfBytes = await generatePdf(
        studentRecord,
        eventData.templateConfig || [],
        eventData.templateUrl,
        mapping,
        templateImageBytes,
        greatVibesRef
      );

      const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
      const mainName = Object.values(formData)[0] || "certificate";
      saveAs(blob, `${mainName.replace(/[^a-z0-9]/gi, "_")}_certificate.pdf`);

      try {
        await CertiGenService.createSubmission({
          eventId: eventData.id,
          magicLinkId: magicLink?.id,
          teacherName: mainName,
          teacherEmail: email || magicLink?.teacherEmail || "self-serve@claimed.local",
          teacherPhone: phoneNumber,
          teacherState: stateName,
          studentData: [studentRecord],
          certificateCount: 1,
          status: "COMPLETED",
          hasDownloaded: true,
        });
      } catch (analyticsErr) {
        console.warn("Analytics dataset save warning:", analyticsErr);
      }

      if (magicLink?.token && magicLink.isOneTimeUse) {
        await fetch(`/api/magic-links/${magicLink.token}/use`, { method: "POST" });
      }

      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to generate certificate.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
        <div className="relative mx-auto w-24 h-24 mb-8">
          <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-25" />
          <div className="relative w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-green-200">
            <CheckCircle className="w-12 h-12" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Certificate Generated!</h2>
        <p className="text-gray-500 text-lg mb-10 max-w-md mx-auto">
          Your personalized certificate has been downloaded successfully.
        </p>
        {(!magicLink || !magicLink.isOneTimeUse) && (
          <Button onClick={() => setIsSuccess(false)} color="secondary" className="px-8">
            Generate Another
          </Button>
        )}
        <p className="mt-12 text-xs text-gray-400">Powered by Troffee CertiGen</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Event Header Card */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-violet-700 rounded-2xl p-8 text-white shadow-xl shadow-primary-200/30 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative flex items-start gap-5">
          <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
            <Award className="w-7 h-7" />
          </div>
          <div>
            <p className="text-primary-200 text-sm font-medium mb-1">Certificate for</p>
            <h1 className="text-2xl font-bold leading-tight">{eventData.title}</h1>
          </div>
        </div>
      </div>

      {/* Template Preview */}
      {eventData.templateUrl && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-gray-600">Certificate Preview</span>
          </div>
          <div className="p-4">
            <img
              src={eventData.templateUrl}
              alt="Certificate Template"
              className="w-full h-auto rounded-lg border border-gray-200"
            />
          </div>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Download className="w-5 h-5 text-primary-600" />
            Claim Your Certificate
          </h2>
          <p className="text-gray-500 mt-1.5 text-sm">
            {magicLink?.prefillData 
              ? "We've pre-filled some details for you. Verify the information and generate your certificate." 
              : "Fill in the details below to generate your personalized certificate."}
          </p>
        </div>
        
        <form onSubmit={handleGenerate} className="p-8 space-y-5">
          {textFields.map((field: FieldConfig, i: number) => (
            <div key={field.id} className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700">{field.label}</Label>
              <Input 
                isRequired
                placeholder={`Enter your ${field.label.toLowerCase()}`}
                value={formData[field.id] || ""}
                onChange={(val: any) => handleInputChange(field.id, typeof val === 'string' ? val : val?.target?.value || '')}
                className="max-w-lg"
              />
            </div>
          ))}

          {/* Constant Fields: Email, Phone, State */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-gray-700">Email Address</Label>
            <Input 
              isRequired
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(val: any) => setEmail(typeof val === 'string' ? val : val?.target?.value || '')}
              className="max-w-lg"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-gray-700">Phone Number</Label>
            <Input 
              isRequired
              type="tel"
              placeholder="Enter your phone number"
              value={phoneNumber}
              onChange={(val: any) => setPhoneNumber(typeof val === 'string' ? val : val?.target?.value || '')}
              className="max-w-lg"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-gray-700">State / Region</Label>
            <Input 
              isRequired
              type="text"
              placeholder="Enter your state or region"
              value={stateName}
              onChange={(val: any) => setStateName(typeof val === 'string' ? val : val?.target?.value || '')}
              className="max-w-lg"
            />
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              isDisabled={isGenerating || textFields.length === 0}
              className="flex items-center gap-2 px-10 py-3 shadow-md shadow-primary-200/50"
              color="primary"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Download className="w-5 h-5 mr-2" />}
              {isGenerating ? "Generating..." : "Download Certificate"}
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">Powered by <span className="font-medium text-gray-500">Troffee CertiGen</span></p>
        </div>
      </div>
    </div>
  );
}
