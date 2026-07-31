"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CertiGenService, EventModel, isTeacherEvent } from "@/lib/services/certigen.service";
import { useStandaloneAuth } from "@/lib/certigen/useStandaloneAuth";
import CanvasEditor from "@/components/certigen/CanvasEditor";
import EventOverview from "@/components/certigen/EventOverview";
import MagicLinksManager from "@/components/certigen/MagicLinksManager";
import AdminBulkEngine from "@/components/certigen/AdminBulkEngine";
import EventAnalytics from "@/components/certigen/EventAnalytics";
import Link from "next/link";
import {
  Loader2, ArrowLeft, LayoutDashboard, Paintbrush, Send, FileSpreadsheet, BarChart2, GraduationCap, Users
} from "lucide-react";
import { Button } from "@/components/base/buttons/button";

const TABS = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: "analytics", label: "Analytics", icon: <BarChart2 className="w-4 h-4" /> },
  { id: "template", label: "Template", icon: <Paintbrush className="w-4 h-4" /> },
  { id: "distribution", label: "Distribution", icon: <Send className="w-4 h-4" /> },
  { id: "bulk", label: "Bulk Generate", icon: <FileSpreadsheet className="w-4 h-4" /> },
];

export default function EventHubPage() {
  const { id } = useParams() as { id: string };
  const { profile } = useStandaloneAuth();
  const [event, setEvent] = useState<EventModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

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
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        <p className="text-gray-500">Loading event...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-8 text-center max-w-lg mx-auto mt-12 bg-white rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Event Not Found</h2>
        <p className="text-gray-500 mb-6">
          The event you are looking for does not exist or has been deleted.
        </p>
        <Link href="/admin">
          <Button color="primary">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const teacherEvent = isTeacherEvent(event);
  const tabs = teacherEvent ? TABS.filter((t) => t.id !== "bulk") : TABS;

  // Template tab renders full-screen editor
  if (activeTab === "template") {
    return (
      <div className="h-[calc(100vh-64px)] w-full flex flex-col">
        {/* Mini tab bar that lets you switch back */}
        <div className="bg-white border-b border-gray-200 px-4 py-0 flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setActiveTab("overview")}
            className="px-3 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2.5 text-sm font-medium flex items-center gap-1.5 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary-600 text-primary-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex-1">
          <CanvasEditor
            eventId={event.id}
            title={event.title}
            initialTemplateUrl={event.templateUrl || ""}
            initialConfig={event.templateConfig || []}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button color="tertiary" size="sm" className="p-2 text-gray-400 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-gray-900 truncate">{event.title}</h1>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border flex-shrink-0 ${
                  teacherEvent
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : "bg-indigo-50 text-indigo-700 border-indigo-200"
                }`}>
                  {teacherEvent ? <Users className="w-3 h-3" /> : <GraduationCap className="w-3 h-3" />}
                  {teacherEvent ? "Teacher Certificates" : "Student Certificates"}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                Created {new Date(event.createdAt?.toDate?.() || Date.now()).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-8">
          <nav className="flex gap-1 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-primary-600 text-primary-700"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {activeTab === "overview" && (
          <EventOverview event={event} onNavigateTab={setActiveTab} />
        )}

        {activeTab === "analytics" && (
          <EventAnalytics eventId={event.id} certificateType={event.certificateType} />
        )}

        {activeTab === "distribution" && (
          <MagicLinksManager eventId={event.id} certificateType={event.certificateType} />
        )}

        {!teacherEvent && activeTab === "bulk" && (
          <AdminBulkEngine
            eventId={event.id}
            adminName={profile?.displayName || "Admin"}
            adminEmail={profile?.email || "admin@example.com"}
            templateUrl={event.templateUrl || ""}
            templateConfig={event.templateConfig || []}
          />
        )}
      </div>
    </div>
  );
}
