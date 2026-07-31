"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useStandaloneAuth } from "@/lib/certigen/useStandaloneAuth";
import { CertiGenService, CertificateType } from "@/lib/services/certigen.service";
import Link from "next/link";
import { ArrowLeft, Loader2, Save, GraduationCap, Users } from "lucide-react";
import Button from "@/components/ui/Button";

// The project has its own Input and Label components, but they might need specific imports.
// To avoid build errors if the path is wrong, we will use basic HTML inputs styled with Tailwind
// unless we are sure about the path. Let's use standard Tailwind styled inputs for now, 
// as we don't have the exact path or props for the base components guaranteed.

export default function CreateEventPage() {
  const router = useRouter();
  const { profile } = useStandaloneAuth();
  
  const [title, setTitle] = useState("");
  const [certificateType, setCertificateType] = useState<CertificateType>("student");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentUserId = profile?.uid;
    if (!title.trim() || !currentUserId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Generate a simple slug
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

      const newEvent = await CertiGenService.createEvent({
        title: title.trim(),
        slug,
        adminId: currentUserId,
        certificateType,
        templateConfig: [],
      });

      // Redirect to the edit template page
      router.push(`/admin/${newEvent.id}`);
    } catch (err: any) {
      console.error("Failed to create event:", err);
      setError(err.message || "Failed to create event. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div className="flex items-center space-x-4">
        <Link href="/admin">
          <Button variant="outline" size="sm" className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Create New Event</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Set up a new certificate generation campaign.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Event Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Summer Coding Bootcamp 2024"
              required
              disabled={isSubmitting}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              This title will be used to identify your event internally.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Certificate Type
            </label>
            <p className="text-xs text-gray-500">
              Choose what this event will issue. This cannot be changed later.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                certificateType === "student"
                  ? "border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-500/40"
                  : "border-gray-300 dark:border-gray-600 hover:border-indigo-300"
              }`}>
                <input
                  type="radio"
                  name="certificateType"
                  value="student"
                  checked={certificateType === "student"}
                  onChange={() => setCertificateType("student")}
                  className="mt-1 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-sm font-bold block flex items-center gap-1.5 text-gray-900 dark:text-white">
                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                    Student Certificates
                  </span>
                  <span className="text-xs block mt-1 text-gray-500 dark:text-gray-400">
                    Teachers upload a student list and bulk-generate certificates for their class or school.
                  </span>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                certificateType === "teacher"
                  ? "border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-500/40"
                  : "border-gray-300 dark:border-gray-600 hover:border-indigo-300"
              }`}>
                <input
                  type="radio"
                  name="certificateType"
                  value="teacher"
                  checked={certificateType === "teacher"}
                  onChange={() => setCertificateType("teacher")}
                  className="mt-1 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-sm font-bold block flex items-center gap-1.5 text-gray-900 dark:text-white">
                    <Users className="w-4 h-4 text-indigo-600" />
                    Teacher Certificates
                  </span>
                  <span className="text-xs block mt-1 text-gray-500 dark:text-gray-400">
                    Teachers claim and download their own individual certificate via a form.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              variant="primary"
              disabled={!title.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Event
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
