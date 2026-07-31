"use client";

import React, { useEffect, useState } from "react";
import {
  Award, Send, Users, Download, ExternalLink, Copy, Eye, FileSpreadsheet,
  LinkIcon, Loader2, CheckCircle, Clock, XCircle, BarChart3, GraduationCap
} from "lucide-react";
import { Button } from "@/components/base/buttons/button";
import { CertiGenService, EventModel, isTeacherEvent } from "@/lib/services/certigen.service";

type Props = {
  event: EventModel;
  onNavigateTab: (tab: string) => void;
};

type Stats = {
  totalLinks: number;
  pendingLinks: number;
  usedLinks: number;
  expiredLinks: number;
  totalSubmissions: number;
  totalCertificates: number;
  loading: boolean;
};

export default function EventOverview({ event, onNavigateTab }: Props) {
  const teacherEvent = isTeacherEvent(event);
  const [stats, setStats] = useState<Stats>({
    totalLinks: 0, pendingLinks: 0, usedLinks: 0, expiredLinks: 0,
    totalSubmissions: 0, totalCertificates: 0, loading: true,
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadStats() {
      try {
        const [links, submissions] = await Promise.all([
          CertiGenService.getMagicLinksByEvent(event.id),
          CertiGenService.getSubmissionsByEvent(event.id),
        ]);

        const now = Date.now();
        setStats({
          totalLinks: links.length,
          pendingLinks: links.filter(l => !l.isRevoked && l.expiresAt > now && !submissions.find(s => s.magicLinkId === l.id)).length,
          usedLinks: links.filter(l => submissions.find(s => s.magicLinkId === l.id)).length,
          expiredLinks: links.filter(l => l.isRevoked || l.expiresAt < now).length,
          totalSubmissions: submissions.length,
          totalCertificates: submissions.reduce((sum, s) => sum + (s.certificateCount || 0), 0),
          loading: false,
        });
      } catch (err) {
        console.error("Failed to load stats:", err);
        setStats(prev => ({ ...prev, loading: false }));
      }
    }
    loadStats();
  }, [event.id]);

  const handleCopyClaimLink = () => {
    const url = `${window.location.origin}/certigen/claim?eventId=${event.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statCards = [
    {
      label: "Certificates Generated",
      value: stats.totalCertificates,
      icon: <Award className="w-5 h-5" />,
      color: "text-violet-600 bg-violet-50 border-violet-200",
      accent: "text-violet-700",
    },
    {
      label: "Submissions",
      value: stats.totalSubmissions,
      icon: <FileSpreadsheet className="w-5 h-5" />,
      color: "text-blue-600 bg-blue-50 border-blue-200",
      accent: "text-blue-700",
    },
    {
      label: "Links Generated",
      value: stats.totalLinks,
      icon: <Send className="w-5 h-5" />,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
      accent: "text-emerald-700",
    },
    {
      label: "Pending Links",
      value: stats.pendingLinks,
      icon: <Clock className="w-5 h-5" />,
      color: "text-amber-600 bg-amber-50 border-amber-200",
      accent: "text-amber-700",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Event Type Banner */}
      <div className={`rounded-xl border p-4 flex items-center gap-3 ${
        teacherEvent
          ? "bg-purple-50 border-purple-200 dark:bg-purple-500/10 dark:border-purple-500/30"
          : "bg-indigo-50 border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/30"
      }`}>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          teacherEvent ? "bg-purple-100 text-purple-700" : "bg-indigo-100 text-indigo-700"
        }`}>
          {teacherEvent ? <Users className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
        </div>
        <div className="min-w-0">
          <p className={`text-sm font-bold ${teacherEvent ? "text-purple-800" : "text-indigo-800"} dark:text-white`}>
            {teacherEvent ? "Teacher Certificate Event" : "Student Certificate Event"}
          </p>
          <p className={`text-xs mt-0.5 ${teacherEvent ? "text-purple-600" : "text-indigo-600"} dark:text-gray-300`}>
            {teacherEvent
              ? "Teachers claim and download their own individual certificate via a claim link."
              : "Teachers use a magic link to upload student lists and bulk-generate certificates."}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div
            key={i}
            className={`rounded-xl border p-5 ${card.color} transition-all hover:shadow-md`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium opacity-80">{card.label}</span>
              {card.icon}
            </div>
            <p className={`text-3xl font-bold ${card.accent}`}>
              {stats.loading ? (
                <Loader2 className="w-6 h-6 animate-spin opacity-50" />
              ) : (
                card.value.toLocaleString()
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Preview Card */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Eye className="w-4 h-4 text-gray-500" />
              Template Preview
            </h3>
          </div>
          <div className="p-4">
            {event.templateUrl ? (
              <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <img
                  src={event.templateUrl}
                  alt="Certificate Template"
                  className="w-full h-auto object-contain"
                />
              </div>
            ) : (
              <div className="h-48 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                <Award className="w-10 h-10 mb-2" />
                <p className="text-sm font-medium">No template uploaded</p>
                <button
                  onClick={() => onNavigateTab("template")}
                  className="mt-2 text-xs text-primary-600 hover:underline"
                >
                  Upload now →
                </button>
              </div>
            )}
          </div>
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium border ${
                event.templateUrl && event.templateConfig?.length
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}>
                {event.templateUrl && event.templateConfig?.length ? (
                  <><CheckCircle className="w-3 h-3" /> Ready</>
                ) : (
                  <><Clock className="w-3 h-3" /> Setup Needed</>
                )}
              </span>
              {event.templateConfig?.length > 0 && (
                <span>{event.templateConfig.filter((f: any) => f.type === 'text').length} text fields</span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-4">
          {teacherEvent ? (
            /* Public Claim Link (teacher events only) */
            <div className="bg-gradient-to-r from-primary-50 to-violet-50 rounded-xl border border-primary-200 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-primary-600" />
                    Public Claim Link
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Share this link with teachers so they can claim their own certificate instantly.
                  </p>
                  <code className="mt-2 block text-xs text-gray-500 bg-white/60 px-3 py-1.5 rounded-lg border border-primary-100 truncate max-w-md">
                    {typeof window !== 'undefined' ? `${window.location.origin}/certigen/claim?eventId=${event.id}` : `/certigen/claim?eventId=${event.id}`}
                  </code>
                </div>
                <Button
                  color={copied ? "primary" : "secondary"}
                  onClick={handleCopyClaimLink}
                  className="flex-shrink-0"
                >
                  {copied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? "Copied!" : "Copy Link"}
                </Button>
              </div>
            </div>
          ) : (
            /* Teacher Access guidance (student events only) */
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-200 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Send className="w-4 h-4 text-indigo-600" />
                    Teacher Access
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Links are generated in the Distribution tab. Copy each link and share it manually — no emails are sent.
                  </p>
                </div>
                <Button
                  color="secondary"
                  onClick={() => onNavigateTab("distribution")}
                  className="flex-shrink-0"
                >
                  <Send className="w-4 h-4 mr-2" />
                  View Links
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => onNavigateTab("analytics")}
              className="group bg-white rounded-xl border border-gray-200 p-5 text-left hover:border-indigo-300 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:bg-indigo-100 transition-colors">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-gray-900 text-sm">View Analytics</h4>
              <p className="text-xs text-gray-500 mt-1">Charts, states & stats</p>
            </button>

            <button
              onClick={() => onNavigateTab("template")}
              className="group bg-white rounded-xl border border-gray-200 p-5 text-left hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center mb-3 group-hover:bg-primary-100 transition-colors">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-gray-900 text-sm">Edit Template</h4>
              <p className="text-xs text-gray-500 mt-1">Customize fields and design</p>
            </button>

            <button
              onClick={() => onNavigateTab("distribution")}
              className="group bg-white rounded-xl border border-gray-200 p-5 text-left hover:border-emerald-300 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-100 transition-colors">
                <Send className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-gray-900 text-sm">View Links</h4>
              <p className="text-xs text-gray-500 mt-1">Generate links to share</p>
            </button>

            {!teacherEvent && (
              <button
                onClick={() => onNavigateTab("bulk")}
                className="group bg-white rounded-xl border border-gray-200 p-5 text-left hover:border-violet-300 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center mb-3 group-hover:bg-violet-100 transition-colors">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">Bulk Generate</h4>
                <p className="text-xs text-gray-500 mt-1">Upload CSV for mass certs</p>
              </button>
            )}
          </div>

          {/* Link Status Summary */}
          {!stats.loading && stats.totalLinks > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Link Activity</h3>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-1.5 text-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <span className="text-gray-600">{stats.pendingLinks} Pending</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="text-gray-600">{stats.usedLinks} Used</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                  <span className="text-gray-600">{stats.expiredLinks} Expired/Revoked</span>
                </div>
              </div>
              {/* Mini progress bar */}
              <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden flex">
                {stats.totalLinks > 0 && (
                  <>
                    <div className="bg-green-500 h-full transition-all" style={{ width: `${(stats.usedLinks / stats.totalLinks) * 100}%` }} />
                    <div className="bg-yellow-400 h-full transition-all" style={{ width: `${(stats.pendingLinks / stats.totalLinks) * 100}%` }} />
                    <div className="bg-gray-300 h-full transition-all" style={{ width: `${(stats.expiredLinks / stats.totalLinks) * 100}%` }} />
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
