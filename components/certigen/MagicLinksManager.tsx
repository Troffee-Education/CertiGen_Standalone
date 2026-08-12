"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Loader2, Ban, CheckCircle, Clock, XCircle, Copy, ExternalLink, RefreshCw, Upload, Users, GraduationCap, FileSpreadsheet, Download
} from "lucide-react";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Label } from "@/components/base/input/label";
import { parseFile } from "@/lib/certigen/file-parser";
import { adminFetch } from "@/lib/certigen/adminFetch";
import { saveAs } from "file-saver";

type MagicLinkItem = {
  id: string;
  teacherEmail: string;
  expiresAt: string;
  isRevoked: boolean;
  createdAt: string;
  type?: "self_serve_claim" | "teacher_bulk";
  status: "pending" | "submitted" | "expired" | "revoked";
  submission: {
    id: string;
    teacherName: string;
    certificateCount: number;
    hasDownloaded: boolean;
    createdAt: string;
  } | null;
};

type Props = {
  eventId: string;
  certificateType?: "student" | "teacher";
};

type Notification = {
  type: "success" | "error";
  message: string;
  magicUrl?: string;
};

type PublicSubmissionItem = {
  id: string;
  teacherName: string;
  teacherEmail: string;
  teacherPhone?: string;
  teacherState?: string;
  certificateCount: number;
  hasDownloaded: boolean;
  createdAt: string;
  magicLinkId?: string;
};

const formatDate = (d: string) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-MY", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch {
    return String(d);
  }
};

const PAGE_SIZE = 20;

export default function MagicLinksManager({ eventId, certificateType = "student" }: Props) {
  const teacherEvent = certificateType === "teacher";
  const inviteType = teacherEvent ? "self_serve_claim" : "teacher_bulk";
  const [activeTab, setActiveTab] = useState<"magic_links" | "public_claims">("magic_links");
  const [links, setLinks] = useState<MagicLinkItem[]>([]);
  const [publicSubmissions, setPublicSubmissions] = useState<PublicSubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [notif, setNotif] = useState<Notification | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Bulk Invite State
  const [bulkTeachers, setBulkTeachers] = useState<any[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResults, setBulkResults] = useState<{ teacherEmail: string; magicUrl: string }[]>([]);
  const [isUnique, setIsUnique] = useState(true);
  const [isOneTimeUse, setIsOneTimeUse] = useState(true);
  const [bulkSummary, setBulkSummary] = useState<{
    total: number;
    valid: number;
    invalid: number;
    duplicates: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotif = (n: Notification) => {
    setNotif(n);
    setTimeout(() => setNotif(null), 8000);
  };

  const fetchLinks = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await adminFetch(`/api/events/${eventId}/magic-links?page=${p}&limit=${PAGE_SIZE}`);
      if (res.ok) {
        const data = await res.json();
        setLinks(data.magicLinks);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setPage(data.page);
      }
    } catch {
      console.error("Failed to fetch magic links");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const fetchPublicSubmissions = useCallback(async () => {
    setLoadingSubmissions(true);
    try {
      const res = await adminFetch(`/api/events/${eventId}/submissions`);
      if (res.ok) {
        const data = await res.json();
        const all: PublicSubmissionItem[] = data.submissions || [];
        const publicOnly = all.filter((s) => !s.magicLinkId);
        setPublicSubmissions(publicOnly);
      }
    } catch {
      console.error("Failed to fetch public submissions");
    } finally {
      setLoadingSubmissions(false);
    }
  }, [eventId]);

  useEffect(() => {
    const initFetch = async () => {
      await Promise.all([fetchLinks(1), fetchPublicSubmissions()]);
    };
    initFetch();
  }, [fetchLinks, fetchPublicSubmissions]);

  const handleSend = async (targetEmail?: string) => {
    const addr = (targetEmail || email).trim();
    if (!addr) return;
    setSending(true);
    setNotif(null);
    try {
      const res = await adminFetch(`/api/events/${eventId}/magic-links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherEmail: addr, inviteType }),
      });
      const data = await res.json();
      if (res.ok) {
        showNotif({
          type: "success",
          message: data.message || "Magic link created!",
          magicUrl: data.magicUrl,
        });
        setEmail("");
        fetchLinks(1);
      } else {
        showNotif({ type: "error", message: data.error || "Failed to generate magic link" });
      }
    } catch {
      showNotif({ type: "error", message: "Error generating magic link" });
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        if (!buffer) return;
        
        const { data } = parseFile(buffer, file.name);
        if (!data || data.length === 0) {
          showNotif({ type: "error", message: "File is empty or invalid." });
          return;
        }
        
        // Find email column case-insensitively using common patterns
        const firstRow = data[0] as any;
        const emailPatterns = ["email", "email address", "e-mel", "e-mail", "alamat emel", "teacher email"];
        const emailKey = Object.keys(firstRow).find(k => {
          const lk = k.toLowerCase().trim();
          return emailPatterns.some(p => lk === p);
        });

        if (!emailKey) {
          showNotif({ type: "error", message: "File must contain an email column (e.g., 'Email', 'e-mel', 'Email Address')." });
          return;
        }

        const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/;
        const seenEmails = new Set<string>();
        const validTeachers: any[] = [];
        let invalidCount = 0;
        let duplicateCount = 0;

        for (const row of data) {
          const rawEmail = row[emailKey];
          if (!rawEmail) {
            invalidCount++;
            continue;
          }
          const emailTrimmed = String(rawEmail).trim().toLowerCase();
          if (!EMAIL_REGEX.test(emailTrimmed)) {
            invalidCount++;
            continue;
          }
          if (seenEmails.has(emailTrimmed)) {
            duplicateCount++;
            continue;
          }
          seenEmails.add(emailTrimmed);

          // Standardize and normalize key to 'email'
          const normalizedRow = { ...row };
          // Remove all variation of email headers from the normalized row
          Object.keys(normalizedRow).forEach(k => {
            const lk = k.toLowerCase().trim();
            if (emailPatterns.some(p => lk === p)) {
              delete normalizedRow[k];
            }
          });
          normalizedRow.email = emailTrimmed;
          validTeachers.push(normalizedRow);
        }

        setBulkTeachers(validTeachers);
        setBulkSummary({
          total: data.length,
          valid: validTeachers.length,
          invalid: invalidCount,
          duplicates: duplicateCount,
        });

        if (validTeachers.length === 0) {
          showNotif({ type: "error", message: "No valid email addresses found in the file." });
        } else {
          showNotif({
            type: "success",
            message: `Loaded ${data.length} rows: ${validTeachers.length} valid, ${invalidCount} invalid skipped, ${duplicateCount} duplicates skipped.`,
          });
        }
      } catch (err: any) {
        showNotif({ type: "error", message: `Failed to parse file: ${err.message}` });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleBulkSend = async () => {
    if (bulkTeachers.length === 0) return;
    setBulkLoading(true);
    setNotif(null);

    try {
      const res = await adminFetch(`/api/events/${eventId}/magic-links/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teachers: bulkTeachers,
          config: {
            isUnique,
            isOneTimeUse: isUnique ? isOneTimeUse : false,
            inviteType,
          }
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setBulkResults(data.results || []);
        showNotif({ type: "success", message: data.message || "Links generated successfully!" });
        setBulkTeachers([]);
        setBulkSummary(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        fetchLinks(1);
      } else {
        showNotif({ type: "error", message: data.error || "Failed to generate bulk links" });
      }
    } catch (err) {
      showNotif({ type: "error", message: "Network error sending bulk invites." });
    } finally {
      setBulkLoading(false);
    }
  };

  const handleRevoke = async (linkId: string) => {
    setNotif(null);
    try {
      const res = await adminFetch(`/api/events/${eventId}/magic-links/${linkId}`, {
        method: "PATCH",
      });
      if (res.ok) {
        showNotif({ type: "success", message: "Magic link revoked." });
        fetchLinks(page);
      } else {
        const data = await res.json();
        showNotif({ type: "error", message: data.error || "Failed to revoke" });
      }
    } catch {
      showNotif({ type: "error", message: "Error revoking magic link" });
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      showNotif({ type: "success", message: "Link copied to clipboard!" });
    }).catch(() => {
      showNotif({ type: "error", message: "Failed to copy link" });
    });
  };

  const copyAllLinks = () => {
    const text = bulkResults.map(r => r.magicUrl).join("\n");
    navigator.clipboard.writeText(text).then(() => {
      showNotif({ type: "success", message: `${bulkResults.length} links copied to clipboard!` });
    }).catch(() => {
      showNotif({ type: "error", message: "Failed to copy links" });
    });
  };

  const exportCsv = () => {
    const csv = "Email,Link\n" + bulkResults.map(r => `${r.teacherEmail},${r.magicUrl}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `certigen-links-${Date.now()}.csv`);
    showNotif({ type: "success", message: "Links exported to CSV." });
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { class: string; icon: React.ReactNode; label: string }> = {
      pending: {
        class: "bg-yellow-100 text-yellow-700 border-yellow-200",
        icon: <Clock className="w-3.5 h-3.5" />,
        label: "Pending",
      },
      submitted: {
        class: "bg-green-100 text-green-700 border-green-200",
        icon: <CheckCircle className="w-3.5 h-3.5" />,
        label: "Submitted",
      },
      expired: {
        class: "bg-gray-100 text-gray-500 border-gray-200",
        icon: <XCircle className="w-3.5 h-3.5" />,
        label: "Expired",
      },
      revoked: {
        class: "bg-red-100 text-red-600 border-red-200",
        icon: <Ban className="w-3.5 h-3.5" />,
        label: "Revoked",
      },
    };
    const s = map[status] || map.pending;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${s.class}`}>
        {s.icon}
        {s.label}
      </span>
    );
  };

  const exportPublicSubmissionsCsv = () => {
    if (publicSubmissions.length === 0) return;
    const headers = "Name,Email,Phone,State,Certificate Count,Downloaded,Created At\n";
    const rows = publicSubmissions.map((s) =>
      `"${(s.teacherName || "").replace(/"/g, '""')}","${s.teacherEmail || ""}","${s.teacherPhone || ""}","${s.teacherState || ""}",${s.certificateCount || 1},${s.hasDownloaded ? "Yes" : "No"},"${formatDate(s.createdAt)}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `public-claims-${eventId}-${Date.now()}.csv`);
    showNotif({ type: "success", message: "Public submissions exported to CSV." });
  };

  return (
    <div className="space-y-8">
      {/* Notification banner */}
      {notif && (
        <div className={`p-4 rounded-lg border text-sm flex items-center justify-between gap-3 ${
          notif.type === "success"
            ? "bg-green-50 text-green-700 border-green-200"
            : "bg-red-50 text-red-700 border-red-200"
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="truncate">{notif.message}</span>
            {notif.magicUrl && (
              <span className="flex items-center gap-2 flex-shrink-0 ml-2">
                <code className="text-xs bg-white/60 px-2 py-1 rounded border truncate max-w-[300px]">
                  {notif.magicUrl}
                </code>
                <button
                  type="button"
                  onClick={() => copyUrl(notif.magicUrl!)}
                  className="p-1 hover:bg-white/60 rounded transition-colors"
                  title="Copy link"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setNotif(null)}
            className="p-1 hover:bg-white/60 rounded transition-colors flex-shrink-0"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Invite Mode Banner */}
      <div className={`bg-gradient-to-r ${teacherEvent ? "from-purple-900 to-purple-800" : "from-indigo-900 to-indigo-800"} text-white p-6 rounded-xl shadow-sm border ${teacherEvent ? "border-purple-700" : "border-indigo-700"} space-y-4`}>
        <div className="space-y-2">
          <h2 className="text-lg font-bold flex items-center gap-2 text-white">
            {teacherEvent ? <Users className="w-5 h-5 text-purple-300" /> : <GraduationCap className="w-5 h-5 text-indigo-300" />}
            {teacherEvent ? "Teacher Certificate Access" : "Teacher Student-Bulk Access"}
          </h2>
          <p className="text-xs text-indigo-200 mt-1">
            {teacherEvent
              ? "This event issues teacher certificates. Every invite below is a single-claim link — teachers open it, fill the form, and download their own certificate."
              : "This event issues student certificates. Every invite below is a bulk-upload link — teachers open it and upload a CSV/XLSX of their students."}
          </p>
        </div>

        {/* Public Direct Link Section */}
        <div className="pt-3 border-t border-white/10 space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-indigo-200 block">
            Public Direct Share Link (Share with all teachers)
          </Label>
          <div className="flex items-center gap-2 max-w-2xl">
            <code className="flex-1 bg-white/10 border border-white/10 rounded px-3 py-2 text-xs font-mono text-white select-all truncate">
              {typeof window !== "undefined"
                ? `${window.location.origin}/certigen${teacherEvent ? "/claim" : ""}?eventId=${eventId}`
                : `/certigen${teacherEvent ? "/claim" : ""}?eventId=${eventId}`}
            </code>
            <Button
              color="secondary"
              size="sm"
              onClick={() => {
                const origin = typeof window !== "undefined" ? window.location.origin : "";
                const url = `${origin}/certigen${teacherEvent ? "/claim" : ""}?eventId=${eventId}`;
                navigator.clipboard.writeText(url).then(() => {
                  showNotif({ type: "success", message: "Public share link copied!" });
                });
              }}
              className="bg-white/10 hover:bg-white/20 border-white/15 text-white whitespace-nowrap"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Public Link
            </Button>
          </div>
          <p className="text-[10px] text-indigo-200/85 leading-relaxed">
            {teacherEvent
              ? "Any teacher who visits this link can directly claim their individual certificate by entering their details."
              : "Any teacher who visits this link can directly fill their details and upload their student list in bulk."}
          </p>
        </div>
      </div>

      {/* Bulk Invite Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-600" />
              Generate Teacher Links (XLSX / CSV)
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Upload an Excel (.xlsx) or CSV file to generate an access link per teacher. No emails are sent — copy the links and share them manually.
            </p>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex items-start gap-6">
            <div className="flex-1">
              <Label className="mb-2 block">Upload Teacher List (XLSX or CSV)</Label>
              <div className="flex items-center gap-4">
                <Button color="secondary" onClick={() => fileInputRef.current?.click()}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Select XLSX / CSV File
                </Button>
                <input 
                  type="file" 
                  accept=".csv, .xlsx, .xls" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                />
                {bulkTeachers.length > 0 && (
                  <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                    {bulkTeachers.length} teachers loaded
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                File must include an <code className="bg-gray-100 px-1 py-0.5 rounded">email</code> column. Other columns will be used to pre-fill details!
              </p>
              {bulkSummary && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">File Integrity Report</h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm pt-1">
                    <div className="flex justify-between border-b border-gray-100 pb-1">
                      <span className="text-gray-500">Total Rows:</span>
                      <span className="font-semibold text-gray-800">{bulkSummary.total}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-1">
                      <span className="text-gray-500">Valid & Clean:</span>
                      <span className="font-semibold text-green-600">{bulkSummary.valid}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-1">
                      <span className="text-gray-500">Duplicates Skipped:</span>
                      <span className={`font-semibold ${bulkSummary.duplicates > 0 ? "text-amber-600" : "text-gray-800"}`}>
                        {bulkSummary.duplicates}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-1">
                      <span className="text-gray-500">Invalid Emails:</span>
                      <span className={`font-semibold ${bulkSummary.invalid > 0 ? "text-red-600" : "text-gray-800"}`}>
                        {bulkSummary.invalid}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {bulkTeachers.length > 0 && (
              <div className="flex-1 bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                <div>
                  <Label className="flex items-center gap-2 cursor-pointer mb-1">
                    <input 
                      type="checkbox" 
                      checked={isUnique} 
                      onChange={(e) => setIsUnique(e.target.checked)} 
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    Generate Unique Links
                  </Label>
                  <p className="text-xs text-gray-500 ml-6">
                    If checked, each teacher receives a unique Magic Link. If unchecked, they all receive the generic public claim link.
                  </p>
                </div>

                {isUnique && (
                  <div>
                    <Label className="flex items-center gap-2 cursor-pointer mb-1">
                      <input 
                        type="checkbox" 
                        checked={isOneTimeUse} 
                        onChange={(e) => setIsOneTimeUse(e.target.checked)} 
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      Enforce One-Time Use
                    </Label>
                    <p className="text-xs text-gray-500 ml-6">
                      If checked, the link will permanently expire immediately after use.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* File Preview Table */}
          {bulkTeachers.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Preview — showing {Math.min(5, bulkTeachers.length)} of {bulkTeachers.length} rows
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setBulkTeachers([]);
                    setBulkSummary(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-xs text-red-600 hover:text-red-700 font-medium hover:underline"
                >
                  Clear File
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-left border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 font-medium text-xs w-8">#</th>
                      {Object.keys(bulkTeachers[0] || {}).map((key) => (
                        <th key={key} className="px-4 py-2 font-medium text-xs">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {bulkTeachers.slice(0, 5).map((teacher: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-400 text-xs">{i + 1}</td>
                        {Object.values(teacher).map((val: any, j: number) => (
                          <td key={j} className="px-4 py-2 text-gray-700 truncate max-w-[200px]">{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {bulkTeachers.length > 5 && (
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 text-center">
                  + {bulkTeachers.length - 5} more rows
                </div>
              )}
            </div>
          )}

          {bulkTeachers.length > 0 && (
            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <Button color="primary" onClick={handleBulkSend} isDisabled={bulkLoading}>
                {bulkLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />}
                Generate {bulkTeachers.length} Links
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Generated links results */}
      {bulkResults.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Generated Links</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Copy each link below and send it to the teacher manually.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button color="secondary" size="sm" onClick={copyAllLinks}>
                <Copy className="w-4 h-4 mr-2" />
                Copy All
              </Button>
              <Button color="secondary" size="sm" onClick={exportCsv}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
          <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {bulkResults.map((r, i) => (
              <li key={i} className="px-6 py-3 flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700 w-56 truncate flex-shrink-0">{r.teacherEmail}</span>
                <code className="flex-1 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded px-2 py-1 truncate">{r.magicUrl}</code>
                <Button color="tertiary" size="xs" onClick={() => copyUrl(r.magicUrl)}>
                  <Copy className="w-3.5 h-3.5 mr-1" />
                  Copy
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Send single magic link */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate Single Teacher Link</h2>
        <div className="flex items-end gap-4">
          <div className="flex-1 space-y-2">
            <Label>Teacher Email</Label>
            <Input
              type="email"
              placeholder="teacher@school.edu"
              value={email}
              onChange={(v) => setEmail(v)}
              onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter") handleSend(); }}
            />
            <p className="text-xs text-gray-500">
              No email is sent — the generated link is shown here to copy manually.
            </p>
          </div>
          <Button color="secondary" onClick={() => handleSend()} isDisabled={!email.trim() || sending}>
            {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Copy className="w-4 h-4 mr-2" />}
            Generate Link ({inviteType === "teacher_bulk" ? "Student Bulk" : "Claim"})
          </Button>
        </div>
      </div>

      {/* Submissions & Links Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Tab Headers */}
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("magic_links")}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === "magic_links"
                  ? "bg-white text-primary-600 shadow-sm border border-gray-200"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Unique Magic Links ({links.length})
            </button>
            <button
              onClick={() => setActiveTab("public_claims")}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === "public_claims"
                  ? "bg-white text-primary-600 shadow-sm border border-gray-200"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Public Claim Submissions ({publicSubmissions.length})
            </button>
          </div>

          {activeTab === "public_claims" && publicSubmissions.length > 0 && (
            <Button color="secondary" size="sm" onClick={exportPublicSubmissionsCsv}>
              <Download className="w-4 h-4 mr-2" />
              Export Public Claims CSV
            </Button>
          )}
        </div>

        {/* Tab Content: Unique Magic Links */}
        {activeTab === "magic_links" && (
          <>
            {loading ? (
              <ul className="divide-y divide-gray-200">
                {[1, 2, 3].map((i) => (
                  <li key={i} className="px-6 py-4 animate-pulse">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-48" />
                        <div className="h-3 bg-gray-100 rounded w-64" />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-5 bg-gray-200 rounded-full w-16" />
                        <div className="h-8 bg-gray-200 rounded-md w-20" />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : links.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <ExternalLink className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No unique links generated yet.</p>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-gray-200">
                  {links.map((link) => (
                    <li key={link.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 min-w-0">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate flex items-center gap-2">
                              {link.teacherEmail}
                              {link.type === "teacher_bulk" ? (
                                <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                  Student Bulk
                                </span>
                              ) : (
                                <span className="text-[10px] uppercase font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                  Single Claim
                                </span>
                              )}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                              <span>Created {formatDate(link.createdAt)}</span>
                              <span>Expires {formatDate(link.expiresAt)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 flex-shrink-0">
                          {statusBadge(link.status)}
                          {link.status === "submitted" && link.submission && (
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {link.submission.certificateCount} certs
                            </span>
                          )}
                          {link.submission?.hasDownloaded && (
                            <span title="Downloaded"><CheckCircle className="w-4 h-4 text-green-500" /></span>
                          )}
                          {link.status === "pending" && (
                            <Button
                              color="tertiary-destructive"
                              size="xs"
                              onClick={() => handleRevoke(link.id)}
                            >
                              <Ban className="w-3.5 h-3.5 mr-1" />
                              Revoke
                            </Button>
                          )}
                          {(link.status === "revoked" || link.status === "expired") && (
                            <Button
                              color="secondary"
                              size="xs"
                              isDisabled={sending}
                              onClick={() => handleSend(link.teacherEmail)}
                            >
                              <RefreshCw className="w-3.5 h-3.5 mr-1" />
                              New Link
                            </Button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Showing {(page - 1) * PAGE_SIZE + 1}&ndash;{Math.min(page * PAGE_SIZE, total)} of {total}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => fetchLinks(page - 1)}
                        className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => fetchLinks(p)}
                          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                            p === page
                              ? "bg-primary-600 text-white"
                              : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => fetchLinks(page + 1)}
                        className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Tab Content: Public Claim Submissions */}
        {activeTab === "public_claims" && (
          <div>
            {loadingSubmissions ? (
              <div className="p-8 text-center text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-600" />
                <p className="text-sm">Loading public claim submissions...</p>
              </div>
            ) : publicSubmissions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-medium">No public claim submissions recorded yet.</p>
                <p className="text-xs text-gray-400 mt-1">Submissions created via the public claim link will appear here in real-time.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 font-semibold text-xs">Name</th>
                      <th className="px-6 py-3 font-semibold text-xs">Email</th>
                      <th className="px-6 py-3 font-semibold text-xs">Phone</th>
                      <th className="px-6 py-3 font-semibold text-xs">State / Region</th>
                      <th className="px-6 py-3 font-semibold text-xs">Certificates</th>
                      <th className="px-6 py-3 font-semibold text-xs">Downloaded</th>
                      <th className="px-6 py-3 font-semibold text-xs">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {publicSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{sub.teacherName}</td>
                        <td className="px-6 py-4 text-gray-600">{sub.teacherEmail}</td>
                        <td className="px-6 py-4 text-gray-500">{sub.teacherPhone || "-"}</td>
                        <td className="px-6 py-4 text-gray-500">{sub.teacherState || "-"}</td>
                        <td className="px-6 py-4 font-semibold text-gray-800">{sub.certificateCount || 1}</td>
                        <td className="px-6 py-4">
                          {sub.hasDownloaded ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                              <CheckCircle className="w-3 h-3" /> Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-400">{formatDate(sub.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
