"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CertiGenService, EventModel, isTeacherEvent } from "@/lib/services/certigen.service";
import MagicLinksManager from "@/components/certigen/MagicLinksManager";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";

export default function MagicLinksPage() {
  const { id } = useParams() as { id: string };
  const [event, setEvent] = useState<EventModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      CertiGenService.getEvent(id)
        .then((data) => {
          setEvent(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load event:", err);
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-gray-500">Loading magic links...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-8 text-center max-w-lg mx-auto mt-12 bg-white rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Event Not Found</h2>
        <p className="text-gray-500">
          The event you are looking for does not exist or has been deleted.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/admin">
          <Button variant="outline" size="sm" className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Magic Links & Access: {event.title}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {isTeacherEvent(event)
              ? "Generate single-claim magic links so teachers can claim and download their own certificate."
              : "Generate magic links so teachers can upload student lists and bulk-generate certificates."}
          </p>
        </div>
        <div>
          {isTeacherEvent(event) && (
            <Button
              onClick={() => {
                const url = `${window.location.origin}/certigen/claim?eventId=${event.id}`;
                navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              variant="outline"
              className="whitespace-nowrap"
            >
              {copied ? "Copied!" : "Copy Public Claim Link"}
            </Button>
          )}
        </div>
      </div>

      <MagicLinksManager eventId={event.id} certificateType={event.certificateType} />
    </div>
  );
}
