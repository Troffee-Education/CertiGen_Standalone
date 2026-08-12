"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Type, Image as ImageIcon, Trash2, Loader2, Upload, GripHorizontal, AlignLeft, AlignCenter, AlignRight, Bold, Eye, RefreshCw, CheckCircle, MessageSquare, ImagePlus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Label } from "@/components/base/input/label";
import { CertiGenService } from "@/lib/services/certigen.service";
import { saveAs } from "file-saver";
import { generatePdf, fetchImageAsArrayBuffer } from "@/lib/certigen/certificate";

export type TextFieldConfig = {
  id: string;
  type: "text";
  label: string;
  x: number;
  y: number;
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  textAlign: "left" | "center" | "right";
  fontWeight: "normal" | "bold";
};

export type ImageFieldConfig = {
  id: string;
  type: "image";
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  imageUrl: string;
  opacity: number;
};

export type PopupFieldConfig = {
  id: string;
  type: "popup";
  label: string;       // Title shown in modal header
  message: string;     // Body text shown in the modal
  photoUrl?: string;   // Optional image URL shown in the modal
  triggerLabel: string; // Button label inside the modal ("Close", "Thank You!", etc.)
  timing: "before" | "after"; // Show popup before or after the certificate download
  requireCheckbox?: boolean; // Whether the user must check a box to proceed
  checkboxLabel?: string;    // Label for the checkbox
};

export type FieldConfig = TextFieldConfig | ImageFieldConfig | PopupFieldConfig;

type Props = {
  eventId: string;
  title: string;
  initialTemplateUrl: string;
  initialConfig: FieldConfig[] | null;
  onSave?: (updatedConfig: FieldConfig[], updatedTemplateUrl?: string) => void;
};

const FONT_FAMILIES = ["Great Vibes", "Helvetica", "Times-Roman", "Courier"];

function genId() {
  return Math.random().toString(36).substring(2, 11);
}

function normalizeField(f: Record<string, unknown>): FieldConfig {
  if (f.type === "image") return { ...f, type: "image" as const } as unknown as ImageFieldConfig;
  if (f.type === "popup") {
    return {
      ...f,
      type: "popup" as const,
      timing: (f.timing as string) || "after", // default for fields saved before timing was added
    } as unknown as PopupFieldConfig;
  }
  return { ...f, type: "text" as const } as unknown as TextFieldConfig;
}

export default function CanvasEditor({ eventId, title, initialTemplateUrl, initialConfig, onSave }: Props) {
  const router = useRouter();
  const [templateUrl, setTemplateUrl] = useState(initialTemplateUrl);
  const [fields, setFields] = useState<FieldConfig[]>(
    Array.isArray(initialConfig) && initialConfig.length > 0 ? initialConfig.map(normalizeField) : []
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingPopupPhoto, setIsUploadingPopupPhoto] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const reuploadRef = useRef<HTMLInputElement>(null);
  const popupPhotoRef = useRef<HTMLInputElement>(null);
  const [imgSize, setImgSize] = useState({ w: 800, h: 600 });
  const [scale, setScale] = useState(1);

  const selected = fields.find((f) => f.id === selectedId);

  // Measure container and scale
  useEffect(() => {
    if (!containerRef.current || imgSize.w === 0) return;
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      const cw = width - 64;
      const ch = height - 64;
      setScale(Math.min(1, cw / imgSize.w, ch / imgSize.h));
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [imgSize]);

  // Keyboard shortcut for deleting selected field
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        // Don't delete if user is typing in an input field
        if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA" || document.activeElement?.tagName === "SELECT") {
          return;
        }
        setFields(prev => prev.filter(f => f.id !== selectedId));
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId]);

  const handleImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImgSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await CertiGenService.uploadTemplateImage(eventId, file);
      setTemplateUrl(url);
      await CertiGenService.updateEvent(eventId, { templateUrl: url, templateConfig: fields });
      if (onSave) {
        onSave(fields, url);
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Upload error");
    } finally {
      setIsUploading(false);
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await CertiGenService.updateEvent(eventId, { templateConfig: fields });
      showToast('success', 'Configuration saved successfully!');
      if (onSave) {
        onSave(fields);
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to save configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReupload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await CertiGenService.uploadTemplateImage(eventId, file);
      setTemplateUrl(url);
      await CertiGenService.updateEvent(eventId, { templateUrl: url, templateConfig: fields });
      showToast('success', 'Template image updated!');
      if (onSave) {
        onSave(fields, url);
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to upload image.');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePreview = async () => {
    if (!templateUrl) return;
    try {
      const templateImageBytes = await fetchImageAsArrayBuffer(templateUrl);

      const sampleRecord: Record<string, string> = {};
      const mapping: Record<string, string> = {};
      fields.filter(f => f.type === 'text').forEach(f => {
        sampleRecord[f.label] = f.label;
        mapping[f.id] = f.label;
      });

      const greatVibesRef: { current: ArrayBuffer | null } = { current: null };

      const pdfBytes = await generatePdf(
        sampleRecord, fields, templateUrl, mapping,
        templateImageBytes, greatVibesRef
      );

      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      saveAs(blob, 'preview.pdf');
    } catch (err) {
      console.error(err);
      showToast('error', err instanceof Error ? err.message : 'Preview failed');
    }
  };

  const addTextField = () => {
    const f: TextFieldConfig = {
      id: genId(), type: "text", label: "New Field", x: 50, y: 50,
      fontFamily: "Helvetica", fontSize: 48, fontColor: "#000000",
      textAlign: "center", fontWeight: "bold",
    };
    setFields((prev) => [...prev, f]);
    setSelectedId(f.id);
  };

  const addPopupField = () => {
    const f: PopupFieldConfig = {
      id: genId(),
      type: "popup",
      label: "Congratulations! 🎉",
      message: "Thank you for your participation!\n\nYour certificate has been generated. We hope to see you again in our next event.",
      photoUrl: "",
      triggerLabel: "Close",
      timing: "after",
      requireCheckbox: false,
      checkboxLabel: "I agree and understand",
    };
    setFields((prev) => [...prev, f]);
    setSelectedId(f.id);
  };

  const updField = (id: string, u: Partial<TextFieldConfig> | Partial<ImageFieldConfig> | Partial<PopupFieldConfig>) =>
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...u } : f)) as FieldConfig[]);

  // Upload popup photo to Firebase Storage
  const handlePopupPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedId) return;
    setIsUploadingPopupPhoto(true);
    try {
      const url = await CertiGenService.uploadTemplateImage(eventId, file);
      updField(selectedId, { photoUrl: url } as Partial<PopupFieldConfig>);
      showToast('success', 'Photo uploaded!');
    } catch (err) {
      showToast('error', 'Failed to upload photo.');
    } finally {
      setIsUploadingPopupPhoto(false);
      if (popupPhotoRef.current) popupPhotoRef.current.value = '';
    }
  };

  // Dragging logic (only for text/image fields, not popup)
  const dragInfo = useRef<{ id: string; startX: number; startY: number; initX: number; initY: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    const f = fields.find(f => f.id === id);
    if (!f || f.type === 'popup') {
      setSelectedId(id);
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    setSelectedId(id);
    dragInfo.current = { id, startX: e.clientX, startY: e.clientY, initX: f.x, initY: f.y };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragInfo.current) return;
    const dx = e.clientX - dragInfo.current.startX;
    const dy = e.clientY - dragInfo.current.startY;
    
    // Convert dx/dy to percentages
    const pctX = (dx / (imgSize.w * scale)) * 100;
    const pctY = (dy / (imgSize.h * scale)) * 100;
    
    updField(dragInfo.current.id, {
      x: Math.max(0, Math.min(100, dragInfo.current.initX + pctX)),
      y: Math.max(0, Math.min(100, dragInfo.current.initY + pctY)),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    dragInfo.current = null;
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gray-50">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300 ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : null}
          {toast.message}
        </div>
      )}

      <header className="flex-shrink-0 h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center space-x-3">
          <h1 className="text-sm font-semibold text-gray-900">{title} <span className="text-gray-400 font-normal">| Template Editor</span></h1>
        </div>
        <div className="flex items-center space-x-2">
          {templateUrl && (
            <>
              <Button color="tertiary" size="sm" onClick={() => reuploadRef.current?.click()} isDisabled={isUploading} className="text-gray-500">
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span className="ml-1.5 hidden sm:inline">Replace Image</span>
              </Button>
              <input ref={reuploadRef} type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleReupload} />
            </>
          )}
          <Button color="tertiary" size="sm" onClick={handlePreview} isDisabled={!templateUrl || fields.length === 0} className="text-gray-500">
            <Eye className="w-4 h-4" />
            <span className="ml-1.5 hidden sm:inline">Preview PDF</span>
          </Button>
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <Button color="tertiary" size="sm" onClick={addPopupField} isDisabled={!templateUrl} className="text-violet-600 bg-violet-50 hover:bg-violet-100 border border-violet-200">
            <MessageSquare className="w-4 h-4 mr-1.5" /> Pop-Up
          </Button>
          <Button color="secondary" size="sm" onClick={addTextField} isDisabled={!templateUrl}>
            <Type className="w-4 h-4 mr-1.5" /> Add Text
          </Button>
          <Button color="primary" size="sm" onClick={handleSave} isDisabled={!templateUrl || isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />} Save
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Canvas Area */}
        <div className="flex-1 overflow-auto relative p-8 flex items-center justify-center bg-gray-100" ref={containerRef} onClick={() => setSelectedId(null)}>
          {!templateUrl ? (
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-200 text-center w-full max-w-lg">
              <Upload className="w-12 h-12 mx-auto mb-4 text-primary-500" />
              <h2 className="text-2xl font-semibold mb-2 text-gray-900">Upload Template</h2>
              <p className="text-gray-500 mb-6">Upload a high-resolution PNG or JPG image of your certificate template without any names on it.</p>
              <Label htmlFor="template-upload" className="cursor-pointer inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ImageIcon className="w-5 h-5 mr-2" />}
                {isUploading ? "Uploading..." : "Select Image"}
              </Label>
              <input id="template-upload" type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
            </div>
          ) : (
            <div 
              className="relative shadow-2xl bg-white select-none touch-none ring-1 ring-black/5" 
              style={{ width: imgSize.w * scale, height: imgSize.h * scale }}
            >
              <img src={templateUrl} alt="Template" className="w-full h-full object-fill pointer-events-none" onLoad={handleImgLoad} />
              
              {/* Render text/image fields on canvas */}
              {fields.filter(f => f.type !== 'popup').map(f => (
                <div
                  key={f.id}
                  onPointerDown={(e) => handlePointerDown(e, f.id)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className={`absolute flex items-center justify-center cursor-move whitespace-nowrap group
                    ${selectedId === f.id ? 'ring-2 ring-primary-500 ring-offset-1 bg-primary-50/10' : 'hover:ring-2 hover:ring-gray-300 hover:ring-offset-1 hover:bg-black/5'}`}
                  style={{
                    left: `${(f as any).x}%`,
                    top: `${(f as any).y}%`,
                    transform: f.type === 'text' && f.textAlign === 'center' ? 'translate(-50%, -50%)' 
                              : f.type === 'text' && f.textAlign === 'right' ? 'translate(-100%, -50%)'
                              : 'translate(0, -50%)',
                    fontFamily: f.type === 'text' ? f.fontFamily : 'inherit',
                    fontSize: f.type === 'text' ? f.fontSize * scale : 'inherit',
                    fontWeight: f.type === 'text' ? f.fontWeight : 'inherit',
                    color: f.type === 'text' ? f.fontColor : 'inherit',
                    zIndex: selectedId === f.id ? 10 : 1,
                  }}
                >
                  {selectedId === f.id && (
                    <div className="absolute w-2 h-2 bg-primary-500 rounded-full" 
                         style={{ 
                           left: f.type === 'text' && f.textAlign === 'left' ? '0' : f.type === 'text' && f.textAlign === 'right' ? '100%' : '50%', 
                           top: '50%', transform: 'translate(-50%, -50%)' 
                         }} 
                    />
                  )}
                  {f.type === 'text' ? (f.label || "Sample Text") : "Image"}
                </div>
              ))}

              {/* Popup fields shown as fixed badge in corner */}
              {fields.filter(f => f.type === 'popup').map((f, idx) => (
                <div
                  key={f.id}
                  onClick={(e) => { e.stopPropagation(); setSelectedId(f.id); }}
                  className={`absolute flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all
                    ${selectedId === f.id 
                      ? 'bg-violet-600 text-white ring-2 ring-violet-400 ring-offset-1' 
                      : 'bg-violet-100 text-violet-700 hover:bg-violet-200'}`}
                  style={{ zIndex: 10, bottom: `${12 + idx * 36}px`, right: '12px' }}
                >
                  <MessageSquare className="w-3 h-3" />
                  {(f as PopupFieldConfig).timing === 'before' ? '⏮ On Page Load' : '⏭ After Download'} · {(f as PopupFieldConfig).label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar settings */}
        <aside className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-y-auto shadow-sm z-10">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-semibold text-gray-800">Properties</h2>
              <p className="text-xs text-gray-500">Select an element to edit</p>
            </div>
            
            {!selected ? (
              <div className="flex-1 flex flex-col">
                <div className="px-6 py-4">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Template Fields</h3>
                  {fields.length === 0 ? (
                    <div className="text-center text-sm text-gray-400 mt-8">
                      <GripHorizontal className="w-8 h-8 mx-auto mb-3 text-gray-200" />
                      No fields added yet. Click "Add Text" or "Pop-Up" to start.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {fields.map(f => (
                        <button
                          key={f.id}
                          onClick={() => setSelectedId(f.id)}
                          className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-primary-500 hover:ring-1 hover:ring-primary-500 transition-all text-left group"
                        >
                          <div className="flex items-center">
                            {f.type === 'popup' 
                              ? <MessageSquare className="w-4 h-4 text-violet-500 mr-3" />
                              : <Type className="w-4 h-4 text-gray-400 mr-3 group-hover:text-primary-500" />
                            }
                            <span className="text-sm font-medium text-gray-700">{f.label || "Unnamed Field"}</span>
                          </div>
                          {f.type === 'popup' && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-600 font-medium">pop-up</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : selected.type === "popup" ? (
              /* ── Popup field properties ── */
              <div className="p-6 space-y-5">
                <div className="p-3 bg-violet-50 rounded-xl border border-violet-100 text-xs text-violet-700 leading-relaxed">
                  <strong>Pop-Up Message</strong> — configure when this modal appears relative to the certificate download.
                </div>

                {/* Timing toggle */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Show Pop-Up</Label>
                  <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                    <button
                      type="button"
                      onClick={() => updField(selected.id, { timing: 'before' } as Partial<PopupFieldConfig>)}
                      className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                        selected.timing === 'before'
                          ? 'bg-violet-600 text-white shadow-sm'
                          : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      ⏮ On Page Load
                    </button>
                    <button
                      type="button"
                      onClick={() => updField(selected.id, { timing: 'after' } as Partial<PopupFieldConfig>)}
                      className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                        selected.timing === 'after'
                          ? 'bg-violet-600 text-white shadow-sm'
                          : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      ⏭ After Download
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">
                    {selected.timing === 'before'
                      ? 'The modal appears immediately when the participant visits the claim link.'
                      : 'The certificate downloads immediately, then the modal appears.'}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Modal Title</Label>
                  <Input value={selected.label} onChange={(v: any) => updField(selected.id, { label: typeof v === 'string' ? v : v?.target?.value || '' })} className="bg-gray-50" placeholder="e.g. Congratulations! 🎉" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Message Body</Label>
                  <textarea
                    value={selected.message}
                    onChange={(e) => updField(selected.id, { message: e.target.value })}
                    rows={5}
                    placeholder="Enter the message you want participants to see..."
                    className="w-full border border-gray-300 bg-gray-50 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Button Label</Label>
                  <Input
                    value={selected.triggerLabel}
                    onChange={(v: any) => updField(selected.id, { triggerLabel: typeof v === 'string' ? v : v?.target?.value || '' } as Partial<PopupFieldConfig>)}
                    placeholder="e.g. Continue, Download, Close"
                    className="bg-white"
                  />
                </div>

                <div className="pt-4 border-t border-gray-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-gray-700">Require Checkbox</Label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selected.requireCheckbox || false}
                        onChange={(e) => updField(selected.id, { requireCheckbox: e.target.checked } as Partial<PopupFieldConfig>)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    If enabled, the participant must check a box to enable the button.
                  </p>

                  {selected.requireCheckbox && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Checkbox Text</Label>
                      <Input
                        value={selected.checkboxLabel || ""}
                        onChange={(v: any) => updField(selected.id, { checkboxLabel: typeof v === 'string' ? v : v?.target?.value || '' } as Partial<PopupFieldConfig>)}
                        placeholder="e.g. I agree to the terms and conditions"
                        className="bg-white"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Photo (optional)</Label>
                  {selected.photoUrl ? (
                    <div className="relative group">
                      <img
                        src={selected.photoUrl}
                        alt="Popup photo"
                        className="w-full h-28 object-cover rounded-xl border border-gray-200"
                      />
                      <button
                        onClick={() => updField(selected.id, { photoUrl: '' })}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => popupPhotoRef.current?.click()}
                      disabled={isUploadingPopupPhoto}
                      className="w-full border-2 border-dashed border-gray-200 rounded-xl py-5 flex flex-col items-center gap-2 text-gray-400 hover:border-violet-400 hover:text-violet-500 transition-all"
                    >
                      {isUploadingPopupPhoto 
                        ? <Loader2 className="w-6 h-6 animate-spin" />
                        : <ImagePlus className="w-6 h-6" />
                      }
                      <span className="text-xs font-medium">
                        {isUploadingPopupPhoto ? "Uploading..." : "Upload a small image"}
                      </span>
                    </button>
                  )}
                  <input
                    ref={popupPhotoRef}
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                    onChange={handlePopupPhotoUpload}
                  />
                </div>

                <hr className="border-gray-100" />

                <div>
                  <Button color="tertiary" className="w-full text-red-600 bg-red-50 hover:bg-red-100 border border-red-200" onClick={() => {
                    setFields(fields.filter(f => f.id !== selected.id));
                    setSelectedId(null);
                  }}>
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Pop-Up
                  </Button>
                </div>
              </div>
            ) : selected.type === "text" && (
              <div className="p-6 space-y-6">
                {/* Basic Settings */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">CSV Column / Label</Label>
                    <Input value={selected.label} onChange={(v) => updField(selected.id, { label: v })} className="bg-gray-50" />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Font Family</Label>
                    <select 
                      className="w-full border border-gray-300 bg-gray-50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" 
                      value={selected.fontFamily} 
                      onChange={(e) => updField(selected.id, { fontFamily: e.target.value })}
                    >
                      {FONT_FAMILIES.map((ff) => <option key={ff} value={ff}>{ff}</option>)}
                    </select>
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Typography Settings */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Size (px)</Label>
                      <Input type="number" value={String(selected.fontSize)} onChange={(v) => updField(selected.id, { fontSize: parseInt(v) || 16 })} className="bg-gray-50" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Color</Label>
                      <div className="flex items-center gap-2">
                        <Input type="color" className="h-10 w-12 p-0.5 border-gray-300 rounded-lg cursor-pointer" value={selected.fontColor} onChange={(v) => updField(selected.id, { fontColor: v })} />
                        <span className="text-xs text-gray-500 font-mono uppercase">{selected.fontColor}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Alignment &amp; Weight</Label>
                    <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                      <button onClick={() => updField(selected.id, { textAlign: 'left' })} className={`p-2 rounded flex-1 flex justify-center ${selected.textAlign === 'left' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:bg-gray-100'}`} title="Align Left">
                        <AlignLeft className="w-4 h-4" />
                      </button>
                      <button onClick={() => updField(selected.id, { textAlign: 'center' })} className={`p-2 rounded flex-1 flex justify-center ${selected.textAlign === 'center' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:bg-gray-100'}`} title="Align Center">
                        <AlignCenter className="w-4 h-4" />
                      </button>
                      <button onClick={() => updField(selected.id, { textAlign: 'right' })} className={`p-2 rounded flex-1 flex justify-center ${selected.textAlign === 'right' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:bg-gray-100'}`} title="Align Right">
                        <AlignRight className="w-4 h-4" />
                      </button>
                      <div className="w-px h-6 bg-gray-300 mx-1"></div>
                      <button onClick={() => updField(selected.id, { fontWeight: selected.fontWeight === 'bold' ? 'normal' : 'bold' })} className={`p-2 rounded flex-1 flex justify-center ${selected.fontWeight === 'bold' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:bg-gray-100'}`} title="Toggle Bold">
                        <Bold className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Position Settings */}
                <div className="space-y-4">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Position Fine-Tuning (%)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-500">X Coordinate</Label>
                      <Input type="number" value={String(selected.x.toFixed(2))} onChange={(v) => updField(selected.id, { x: parseFloat(v) || 0 })} className="bg-gray-50 font-mono text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-500">Y Coordinate</Label>
                      <Input type="number" value={String(selected.y.toFixed(2))} onChange={(v) => updField(selected.id, { y: parseFloat(v) || 0 })} className="bg-gray-50 font-mono text-sm" />
                    </div>
                  </div>
                </div>

                <div className="pt-8">
                  <Button color="tertiary" className="w-full text-red-600 bg-red-50 hover:bg-red-100 border border-red-200" onClick={() => {
                    setFields(fields.filter(f => f.id !== selected.id));
                    setSelectedId(null);
                  }}>
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Field
                  </Button>
                </div>
              </div>
            )}
        </aside>
      </div>
    </div>
  );
}
