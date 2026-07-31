"use client";

import React, { useEffect, useState } from "react";
import { useStandaloneAuth } from "@/lib/certigen/useStandaloneAuth";
import { CertiGenService, EventModel } from "@/lib/services/certigen.service";
import Link from "next/link";
import {
  Plus, Award, Edit, Search, CheckCircle, Clock,
  Loader2, LayoutGrid, GraduationCap, Users
} from "lucide-react";
import Button from "@/components/ui/Button";

export default function CertiGenDashboard() {
  const { profile } = useStandaloneAuth();
  const [events, setEvents] = useState<EventModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const currentUserId = profile?.uid;
    if (currentUserId) {
      CertiGenService.getAllEvents().then((data) => {
        setEvents(data);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [profile]);

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-4" />
        <p className="text-gray-500 text-sm">Loading your events...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center shadow-md shadow-primary-200">
              <Award className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CertiGen</h1>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 ml-[52px]">
            Create, customize, and distribute certificates at scale.
          </p>
        </div>
        <Link href="/admin/new">
          <Button variant="primary" className="shadow-md shadow-primary-200/50">
            <Plus className="w-5 h-5 mr-2" />
            New Event
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      {events.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all shadow-sm"
          />
        </div>
      )}

      {/* Events Grid */}
      {filteredEvents.length === 0 && events.length === 0 ? (
        <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-16 text-center bg-white dark:bg-gray-800">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary-50 to-violet-50 text-primary-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <Award className="w-9 h-9" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No events yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Create your first event to start generating beautiful certificates for students and teachers.
          </p>
          <Link href="/admin/new">
            <Button variant="primary" className="px-8 shadow-md">
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Event
            </Button>
          </Link>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No events match &ldquo;{search}&rdquo;</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((event) => {
            const hasTemplate = !!event.templateUrl;
            const fieldCount = event.templateConfig?.filter((f: any) => f.type === 'text')?.length || 0;

            return (
              <Link
                key={event.id}
                href={`/admin/${event.id}`}
                className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:border-primary-300 transition-all duration-200"
              >
                {/* Template Thumbnail */}
                <div className="h-40 bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                  {hasTemplate ? (
                    <img
                      src={event.templateUrl}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                      <Award className="w-10 h-10 mb-2 opacity-30" />
                      <span className="text-xs">No template</span>
                    </div>
                  )}
                  {/* Status badge overlay */}
                  <div className="absolute top-3 right-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                      hasTemplate && fieldCount > 0
                        ? "bg-green-500/90 text-white"
                        : "bg-amber-500/90 text-white"
                    }`}>
                      {hasTemplate && fieldCount > 0 ? (
                        <><CheckCircle className="w-3 h-3" /> Ready</>
                      ) : (
                        <><Clock className="w-3 h-3" /> Setup</>
                      )}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                      event.certificateType === "teacher"
                        ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/30"
                        : "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/30"
                    }`}>
                      {event.certificateType === "teacher" ? <Users className="w-3 h-3" /> : <GraduationCap className="w-3 h-3" />}
                      {event.certificateType === "teacher" ? "Teachers" : "Students"}
                    </span>
                    {fieldCount > 0 && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full dark:bg-gray-700 dark:text-gray-400">
                        {fieldCount} field{fieldCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors truncate">
                    {event.title}
                  </h3>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-500">
                      Created {new Date(event.createdAt?.toDate?.() || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
