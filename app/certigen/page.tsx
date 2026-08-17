import React from "react";
import { isTeacherEvent } from "@/lib/services/certigen.service";
import { CertiGenAdminService } from "@/lib/certigen/admin-service";
import AdminBulkEngine from "@/components/certigen/AdminBulkEngine";
import { Award, Sparkles, Shield, FileCheck } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PublicCertiGenPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; eventId?: string }>;
}) {
  const resolvedParams = await searchParams;
  const token = resolvedParams.token;
  const eventId = resolvedParams.eventId;

  if (!token && !eventId) {
    return (
      <div className="w-full min-h-[80vh] flex items-center justify-center p-6">
        <div className="bg-slate-900/90 border border-slate-800 p-8 rounded-2xl shadow-2xl text-center max-w-md w-full text-white">
          <h1 className="text-2xl font-bold text-red-400 mb-2">Invalid Link</h1>
          <p className="text-slate-400 text-sm">No token or event ID was provided in the access link.</p>
        </div>
      </div>
    );
  }

  let eventData = null;
  let magicLink = null;

  if (token) {
    magicLink = await CertiGenAdminService.getMagicLinkByToken(token);
    if (!magicLink || magicLink.isRevoked) {
      return (
        <div className="w-full min-h-[80vh] flex items-center justify-center p-6">
          <div className="bg-slate-900/90 border border-slate-800 p-8 rounded-2xl shadow-2xl text-center max-w-md w-full text-white">
            <h1 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h1>
            <p className="text-slate-400 text-sm">This magic link is invalid or has been revoked.</p>
          </div>
        </div>
      );
    }

    if (magicLink.expiresAt < Date.now()) {
      return (
        <div className="w-full min-h-[80vh] flex items-center justify-center p-6">
          <div className="bg-slate-900/90 border border-slate-800 p-8 rounded-2xl shadow-2xl text-center max-w-md w-full text-white">
            <h1 className="text-2xl font-bold text-red-400 mb-2">Link Expired</h1>
            <p className="text-slate-400 text-sm">This magic link has expired. Please request a new one.</p>
          </div>
        </div>
      );
    }

    eventData = await CertiGenAdminService.getEventById(magicLink.eventId);
  } else if (eventId) {
    eventData = await CertiGenAdminService.getEventById(eventId);
  }

  if (!eventData || eventData.isArchived) {
    return (
      <div className="w-full min-h-[80vh] flex items-center justify-center p-6">
        <div className="bg-slate-900/90 border border-slate-800 p-8 rounded-2xl shadow-2xl text-center max-w-md w-full text-white">
          <h1 className="text-2xl font-bold text-amber-400 mb-2">Event Inactive</h1>
          <p className="text-slate-400 text-sm">The associated event is no longer active.</p>
        </div>
      </div>
    );
  }

  if (isTeacherEvent(eventData)) {
    return (
      <div className="w-full min-h-[80vh] flex items-center justify-center p-6">
        <div className="bg-slate-900/90 border border-slate-800 p-8 rounded-2xl shadow-2xl text-center max-w-md w-full text-white">
          <h1 className="text-2xl font-bold text-purple-400 mb-2">Teacher Certificate Event</h1>
          <p className="text-slate-400 text-sm">
            This event issues <span className="font-medium text-white">teacher certificates</span>. Teachers claim their certificate via the claim link sent to them.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-8 space-y-8 m-0">
      {/* Full-Width Modern Hero Header */}
      <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-slate-900/70 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-slate-800/80 shadow-2xl">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              CertiGen Event
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5" />
              Verified Event Portal
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            {eventData.title}
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-3xl">
            Upload student rosters, automatically map template columns, and batch download high-resolution certificates.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-center">
          <div className="px-5 py-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 text-left md:text-right shadow-inner">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">
              Output Package
            </span>
            <span className="text-sm font-bold text-white flex items-center gap-2 md:justify-end mt-0.5">
              <FileCheck className="w-4 h-4 text-emerald-400" /> High-Speed ZIP Archive
            </span>
          </div>
        </div>
      </div>

      {/* Main Full-Width Engine Component */}
      <div className="w-full min-w-full">
        <AdminBulkEngine
          eventId={eventData.id}
          magicLinkId={magicLink?.id}
          adminName={magicLink?.teacherEmail ? magicLink.teacherEmail.split("@")[0] : ""}
          adminEmail={magicLink?.teacherEmail || ""}
          templateUrl={eventData.templateUrl}
          templateConfig={eventData.templateConfig}
          eventTitle={eventData.title}
        />
      </div>
    </div>
  );
}
