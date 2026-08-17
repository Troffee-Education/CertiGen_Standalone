"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useStandaloneAuth } from "@/lib/certigen/useStandaloneAuth";
import { CertiGenService, EventModel } from "@/lib/services/certigen.service";
import AdminBulkEngine from "@/components/certigen/AdminBulkEngine";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";

export default function BulkGeneratePage() {
  const { id } = useParams() as { id: string };
  const { profile } = useStandaloneAuth();
  const [event, setEvent] = useState<EventModel | null>(null);
  const [loading, setLoading] = useState(true);

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
        <p className="text-gray-500">Loading bulk generator...</p>
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
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Bulk Generate: {event.title}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Upload student lists to generate certificates in bulk for this event.
          </p>
        </div>
      </div>

      <AdminBulkEngine
        eventId={event.id}
        adminName={profile?.displayName || "Admin"}
        adminEmail={profile?.email || "admin@example.com"}
        templateUrl={event.templateUrl || ""}
        templateConfig={event.templateConfig || []}
        eventTitle={event.title}
      />
    </div>
  );
}
