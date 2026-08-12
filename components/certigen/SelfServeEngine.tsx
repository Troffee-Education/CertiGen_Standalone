"use client";

import React, { useState, useEffect, useRef } from "react";
import { Download, Loader2, CheckCircle, Award, Sparkles, X, MessageSquare } from "lucide-react";
import { saveAs } from "file-saver";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Label } from "@/components/base/input/label";
import { CertiGenService, EventModel, MagicLinkModel } from "@/lib/services/certigen.service";
import { generatePdf, fetchImageAsArrayBuffer } from "@/lib/certigen/certificate";
import type { FieldConfig, PopupFieldConfig } from "@/components/certigen/CanvasEditor";

// All 16 Malaysian states + federal territories
const MALAYSIA_STATES = [
  "Johor",
  "Kedah",
  "Kelantan",
  "Melaka",
  "Negeri Sembilan",
  "Pahang",
  "Perak",
  "Perlis",
  "Pulau Pinang",
  "Sabah",
  "Sarawak",
  "Selangor",
  "Terengganu",
  "W.P. Kuala Lumpur",
  "W.P. Labuan",
  "W.P. Putrajaya",
];

/** Returns true if a field label looks like a numeric/phone field */
function isNumericField(label: string) {
  const l = label.toLowerCase();
  return (
    l.includes("phone") ||
    l.includes("tel") ||
    l.includes("mobile") ||
    l.includes("number") ||
    l.includes("nombor") ||
    l.includes("no.") ||
    l.includes("ic ") ||
    l.includes("id ")
  );
}

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

  // Popup modal state
  const [activePopup, setActivePopup] = useState<PopupFieldConfig | null>(null);
  const [popupQueue, setPopupQueue] = useState<PopupFieldConfig[]>([]);
  const [popupChecked, setPopupChecked] = useState(false);

  // Reset checkbox when popup changes
  useEffect(() => {
    setPopupChecked(false);
  }, [activePopup]);

  // Filter for text fields to render inputs
  const textFields = eventData.templateConfig?.filter((f: FieldConfig) => f.type === "text") || [];
  // Get popup fields from config
  const popupFields = (eventData.templateConfig || []).filter(
    (f: FieldConfig) => f.type === "popup"
  ) as PopupFieldConfig[];

  // Trigger "before" popups on page load
  const hasMounted = useRef(false);
  useEffect(() => {
    if (hasMounted.current) return;
    hasMounted.current = true;
    
    const beforePopups = popupFields.filter(p => p.timing === 'before');
    if (beforePopups.length > 0) {
      setActivePopup(beforePopups[0]);
      setPopupQueue(beforePopups.slice(1));
    }
  }, [popupFields]);

  // Sync inputs with magic link prefill data
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
      if (stateKey && prefill[stateKey]) {
        const prefillState = prefill[stateKey];
        // Match to closest official state name (case-insensitive)
        const matched = MALAYSIA_STATES.find(
          s => s.toLowerCase() === prefillState.toLowerCase()
        );
        setStateName(matched || prefillState);
      }
    }
  }, [magicLink, eventData.templateConfig]);

  const handleInputChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleNumericKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter, arrows, home, end
    const allowed = ["Backspace", "Delete", "Tab", "Escape", "Enter", "ArrowLeft", "ArrowRight", "Home", "End", "+", "-", " "];
    if (allowed.includes(e.key)) return;
    // Allow ctrl/cmd combinations (copy, paste, etc.)
    if (e.ctrlKey || e.metaKey) return;
    // Block anything that's not a digit
    if (!/^\d$/.test(e.key)) e.preventDefault();
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      const templateImageBytes = await fetchImageAsArrayBuffer(eventData.templateUrl);

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
        await fetch("/api/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId: eventData.id,
            magicLinkId: magicLink?.id || null,
            teacherName: mainName,
            teacherEmail: email || magicLink?.teacherEmail || "self-serve@claimed.local",
            teacherPhone: phoneNumber,
            teacherState: stateName,
            studentData: [studentRecord],
            certificateCount: 1,
            status: "COMPLETED",
            hasDownloaded: true,
          }),
        });
      } catch (analyticsErr) {
        console.warn("Analytics dataset save warning:", analyticsErr);
      }

      if (magicLink?.token && magicLink.isOneTimeUse) {
        await fetch(`/api/magic-links/${magicLink.token}/use`, { method: "POST" });
      }

      // Show popup or finish
      // Treat any popup missing a timing property as 'after' (legacy support)
      const afterPopups = popupFields.filter(p => p.timing === 'after' || !p.timing);

      // Download immediately
      saveAs(blob, `${mainName.replace(/[^a-z0-9]/gi, "_")}_certificate.pdf`);
      
      // Show 'after' popups or finish
      if (afterPopups.length > 0) {
        setActivePopup(afterPopups[0]);
        setPopupQueue(afterPopups.slice(1));
      } else {
        setIsSuccess(true);
      }
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to generate certificate.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClosePopup = () => {
    const popup = activePopup;
    setActivePopup(null);

    // 1. If there are more popups in the current queue, show the next one
    if (popupQueue.length > 0) {
      setTimeout(() => {
        setActivePopup(popupQueue[0]);
        setPopupQueue(popupQueue.slice(1));
      }, 400); // Wait for modal exit animation
      return;
    }

    // 2. Current queue is empty.
    if (popup?.timing === 'before') {
      // Finished showing "before" popups on page load, let user see the form
      return;
    }

    // 3. Finished showing "after" popups, show success screen
    setIsSuccess(true);
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
    <>
      {/* ── Pop-Out Modal ── */}
      {activePopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300"
            style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.25)" }}
          >
            {/* Gradient header strip */}
            <div className="h-2 bg-gradient-to-r from-primary-500 via-violet-500 to-pink-500" />

            {!activePopup.requireCheckbox && (
              <button
                onClick={handleClosePopup}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors z-10"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <div className="p-8 text-center">
              {/* Optional photo */}
              {activePopup.photoUrl && (
                <div className="mb-5">
                  <img
                    src={activePopup.photoUrl}
                    alt="Message visual"
                    className="w-28 h-28 object-cover rounded-2xl mx-auto shadow-lg border-4 border-white ring-2 ring-primary-100"
                  />
                </div>
              )}

              {/* Icon fallback if no photo */}
              {!activePopup.photoUrl && (
                <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <MessageSquare className="w-8 h-8 text-primary-600" />
                </div>
              )}

              <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
                {activePopup.label || "A Message For You"}
              </h3>

              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-sm mb-6">
                {activePopup.message}
              </p>

              {activePopup.requireCheckbox && (
                <div className="mb-6 flex items-start text-left bg-gray-50 p-3.5 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer" onClick={() => setPopupChecked(!popupChecked)}>
                  <div className="flex items-center h-5 mt-0.5">
                    <input
                      id="popup-checkbox"
                      type="checkbox"
                      className="w-4 h-4 text-primary-600 bg-white border-gray-300 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer"
                      checked={popupChecked}
                      onChange={(e) => setPopupChecked(e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="ml-3 text-sm flex-1">
                    <label htmlFor="popup-checkbox" className="font-semibold text-gray-700 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                      {activePopup.checkboxLabel || "I agree"}
                    </label>
                  </div>
                </div>
              )}

              <Button
                color="primary"
                className="w-full py-3 font-semibold"
                onClick={handleClosePopup}
                isDisabled={activePopup.requireCheckbox && !popupChecked}
              >
                {activePopup.triggerLabel || "Close"}
              </Button>
            </div>
          </div>
        </div>
      )}

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
            {textFields.map((field: FieldConfig, i: number) => {
              const numeric = isNumericField(field.label);
              return (
                <div key={field.id} className="space-y-1.5">
                  <Label className="text-sm font-semibold text-gray-700">{field.label}</Label>
                  {numeric ? (
                    <input
                      required
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9+\-\s]*"
                      placeholder={`Enter your ${field.label.toLowerCase()}`}
                      value={formData[field.id] || ""}
                      onKeyDown={handleNumericKeyDown}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      className="max-w-lg w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                    />
                  ) : (
                    <Input 
                      isRequired
                      placeholder={`Enter your ${field.label.toLowerCase()}`}
                      value={formData[field.id] || ""}
                      onChange={(val: any) => handleInputChange(field.id, typeof val === 'string' ? val : val?.target?.value || '')}
                      className="max-w-lg"
                    />
                  )}
                </div>
              );
            })}

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
              <input
                required
                type="tel"
                inputMode="numeric"
                pattern="[0-9+\-\s]*"
                placeholder="Enter your phone number (digits only)"
                value={phoneNumber}
                onKeyDown={handleNumericKeyDown}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="max-w-lg w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              />
            </div>

            {/* Malaysian States Dropdown */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700">State / Region</Label>
              <select
                required
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                className="max-w-lg w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white text-gray-700"
              >
                <option value="" disabled>Select your state</option>
                {MALAYSIA_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
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
    </>
  );
}
