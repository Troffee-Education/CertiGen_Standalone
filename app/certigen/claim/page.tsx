import React from "react";
import { isTeacherEvent } from "@/lib/services/certigen.service";
import { CertiGenAdminService } from "@/lib/certigen/admin-service";
import SelfServeEngine from "@/components/certigen/SelfServeEngine";

export default async function PublicClaimCertificatePage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string; token?: string }>;
}) {
  const resolvedParams = await searchParams;
  const eventId = resolvedParams.eventId;
  const token = resolvedParams.token;

  if (!eventId && !token) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 dark:bg-[#0f172a] p-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 text-center max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Invalid Link</h1>
          <p className="text-gray-500 dark:text-gray-400">This certificate claim link is missing an event ID or token.</p>
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
        <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 dark:bg-[#0f172a] p-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 text-center max-w-md w-full">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Link Expired or Revoked</h1>
            <p className="text-gray-500 dark:text-gray-400">This magic link has expired or been revoked.</p>
          </div>
        </div>
      );
    }

    if (magicLink.expiresAt < Date.now()) {
      return (
        <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 dark:bg-[#0f172a] p-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 text-center max-w-md w-full">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Link Expired</h1>
            <p className="text-gray-500 dark:text-gray-400">This magic link has expired. Please request a new link.</p>
          </div>
        </div>
      );
    }
    
    if (magicLink.isOneTimeUse && magicLink.isUsed) {
      return (
        <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 dark:bg-[#0f172a] p-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 text-center max-w-md w-full">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Certificate Already Claimed</h1>
            <p className="text-gray-500 dark:text-gray-400">This was a one-time use link, and the certificate has already been downloaded.</p>
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
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 dark:bg-[#0f172a] p-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 text-center max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Event Not Found</h1>
          <p className="text-gray-500 dark:text-gray-400">This event does not exist or has been archived.</p>
        </div>
      </div>
    );
  }

  if (!isTeacherEvent(eventData)) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 dark:bg-[#0f172a] p-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 text-center max-w-md w-full">
          <h1 className="text-2xl font-bold text-indigo-700 mb-2">Student Certificate Event</h1>
          <p className="text-gray-500 dark:text-gray-400">
            This event issues <span className="font-medium text-gray-900 dark:text-white">student certificates</span>. Teachers use the magic link they received to upload their student list — this claim form is not used for this event.
          </p>
        </div>
      </div>
    );
  }

  if (!eventData.templateUrl || !eventData.templateConfig?.length) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 dark:bg-[#0f172a] p-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 text-center max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Template Not Ready</h1>
          <p className="text-gray-500 dark:text-gray-400">The certificate template for this event has not been configured yet.</p>
        </div>
      </div>
    );
  }

  const safeEventData = {
    id: eventData.id,
    title: eventData.title,
    templateUrl: eventData.templateUrl,
    templateConfig: eventData.templateConfig || [],
  };

  const safeMagicLink = magicLink ? {
    id: magicLink.id,
    prefillData: magicLink.prefillData || null,
    teacherEmail: magicLink.teacherEmail || "",
    token: magicLink.token,
    isOneTimeUse: magicLink.isOneTimeUse || false,
  } : null;

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* @ts-ignore - we only pass required fields to avoid serialization errors */}
        <SelfServeEngine eventData={safeEventData} magicLink={safeMagicLink} />
      </div>
    </div>
  );
}
