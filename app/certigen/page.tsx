import React from "react";
import { isTeacherEvent } from "@/lib/services/certigen.service";
import { CertiGenAdminService } from "@/lib/certigen/admin-service";
import AdminBulkEngine from "@/components/certigen/AdminBulkEngine";

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
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 text-center max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Invalid Link</h1>
          <p className="text-gray-500 dark:text-gray-400">No token or event ID was provided in the access link.</p>
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
        <div className="min-h-[80vh] flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 text-center max-w-md w-full">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
            <p className="text-gray-500 dark:text-gray-400">This magic link is invalid or has been revoked.</p>
          </div>
        </div>
      );
    }

    if (magicLink.expiresAt < Date.now()) {
      return (
        <div className="min-h-[80vh] flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 text-center max-w-md w-full">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Link Expired</h1>
            <p className="text-gray-500 dark:text-gray-400">This magic link has expired. Please request a new one.</p>
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
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 text-center max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Event Inactive</h1>
          <p className="text-gray-500 dark:text-gray-400">The associated event is no longer active.</p>
        </div>
      </div>
    );
  }

  if (isTeacherEvent(eventData)) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 text-center max-w-md w-full">
          <h1 className="text-2xl font-bold text-purple-700 mb-2">Teacher Certificate Event</h1>
          <p className="text-gray-500 dark:text-gray-400">
            This event issues <span className="font-medium text-gray-900 dark:text-white">teacher certificates</span>. Teachers claim their certificate via the claim link sent to them — there is no student upload for this event.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Generate Certificates</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Event: <span className="font-medium text-gray-900 dark:text-gray-200">{eventData.title}</span>
        </p>
      </div>

      <AdminBulkEngine
        eventId={eventData.id}
        magicLinkId={magicLink?.id}
        adminName={magicLink?.teacherEmail ? magicLink.teacherEmail.split('@')[0] : ""}
        adminEmail={magicLink?.teacherEmail || ""}
        templateUrl={eventData.templateUrl}
        templateConfig={eventData.templateConfig}
      />
    </div>
  );
}
