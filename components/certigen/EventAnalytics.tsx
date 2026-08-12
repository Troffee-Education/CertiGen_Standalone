"use client";

import React, { useEffect, useState, useMemo } from "react";
import { CertiGenService, SubmissionModel, MagicLinkModel } from "@/lib/services/certigen.service";
import {
  Award, Users, MapPin, Download, Loader2, BarChart3, School, X, ChevronRight,
  UserCheck, Search, Star, Sparkles, Target, GraduationCap, MessageSquareQuote, Pencil, CheckCircle, Hash, FileText, Calendar
} from "lucide-react";
import { Button } from "@/components/base/buttons/button";
import { saveAs } from "file-saver";
import Papa from "papaparse";
import {
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area
} from "recharts";

type Props = { eventId: string; certificateType?: "student" | "teacher" };

// ═══════════════════════════════════════════════════════════════
// COLUMN AUTO-CLASSIFICATION ENGINE
// ═══════════════════════════════════════════════════════════════

type ColumnType = "geographic" | "school" | "district" | "gender" | "category" | "subject" | "rating5" | "rating10" | "count" | "date" | "feedback" | "identity" | "skip";

type ClassifiedColumn = {
  key: string;             // original column header
  type: ColumnType;        // classified type
  label: string;           // cleaned human-readable label
  avgValue?: number;       // average if numeric
  filledCount: number;     // how many rows have data
  sampleValues: string[];  // first few unique values
};

const MALAYSIA_STATES = [
  "Sabah", "Kedah", "Sarawak", "Selangor", "Johor", "Perak", "Penang",
  "Pahang", "Kelantan", "Terengganu", "Melaka", "Negeri Sembilan", "Perlis",
  "W.P. Kuala Lumpur", "W.P. Labuan", "W.P. Putrajaya"
];

const STATE_ALIASES: Record<string, string> = {
  "pulau pinang": "Penang", "kuala lumpur": "W.P. Kuala Lumpur",
  "wilayah persekutuan kuala lumpur": "W.P. Kuala Lumpur",
  "putrajaya": "W.P. Putrajaya", "wilayah persekutuan putrajaya": "W.P. Putrajaya",
  "labuan": "W.P. Labuan", "wilayah persekutuan labuan": "W.P. Labuan",
};

const CHART_COLORS = ["#6366f1", "#ec4899", "#10b981", "#f59e0b", "#8b5cf6", "#14b8a6", "#3b82f6", "#f97316", "#ef4444", "#06b6d4"];

const SKIP_PATTERNS = ["merged doc", "google drive", "pautan", "document merge", "upload excel", "muat naik", "link to merged"];
const GEO_PATTERNS = ["state", "negeri", "region"];
const SCHOOL_PATTERNS = ["school name", "nama sekolah", "sekolah", "institution", "school"];
const DISTRICT_PATTERNS = ["ppd", "district", "daerah"];
const GENDER_PATTERNS = ["gender", "jantina", "sex"];
const CATEGORY_PATTERNS = ["category", "kategori", "level", "peringkat"];
const SUBJECT_PATTERNS = ["subject", "mata pelajaran"];
const COUNT_PATTERNS = ["jumlah", "count", "quantity", "total", "bilangan"];
const DATE_PATTERNS = ["date", "tarikh", "timestamp"];
const IDENTITY_PATTERNS = ["name", "nama", "email", "phone", "telefon", "kad pengenalan", "ic number"];

function cleanLabel(key: string): string {
  // Strip long prefix patterns like "C3. Sila menilai setiap teknik... [Highlighting]"
  const bracketMatch = key.match(/\[([^\]]+)\]/);
  if (bracketMatch) return bracketMatch[1].trim();
  // Strip question number prefix like "B1. ", "C2. ", "D4. ", "E1. "
  const prefixMatch = key.match(/^[A-Z]\d+\.?\s*(.+)/);
  if (prefixMatch) {
    const cleaned = prefixMatch[1].trim();
    return cleaned.length > 60 ? cleaned.substring(0, 57) + "..." : cleaned;
  }
  return key.length > 60 ? key.substring(0, 57) + "..." : key;
}

function matchesAny(key: string, patterns: string[]): boolean {
  const lower = key.toLowerCase();
  return patterns.some((p) => lower.includes(p));
}

function parseRatingValue(val: any, maxScale: number): number | null {
  if (val === undefined || val === null || val === "") return null;
  const str = String(val);
  const num = parseFloat(str.replace(/[^0-9.]/g, ""));
  if (!isNaN(num) && num >= 1 && num <= maxScale) return num;
  const lower = str.toLowerCase();
  if (lower.includes("terbaik") || lower.includes("amat memuaskan")) return maxScale;
  if (lower.includes("memuaskan") && !lower.includes("tidak")) return maxScale - 1;
  if (lower.includes("tidak memuaskan")) return 1;
  return null;
}

function normalizeState(raw: string): string {
  const alias = STATE_ALIASES[raw.toLowerCase()];
  if (alias) return alias;
  const matched = MALAYSIA_STATES.find((s) => s.toLowerCase() === raw.toLowerCase());
  return matched || raw;
}

function classifyColumns(allRows: Record<string, any>[]): ClassifiedColumn[] {
  if (allRows.length === 0) return [];

  // Collect all unique keys
  const keySet = new Set<string>();
  allRows.forEach((row) => Object.keys(row).forEach((k) => keySet.add(k)));

  const columns: ClassifiedColumn[] = [];

  keySet.forEach((key) => {
    const lower = key.toLowerCase();

    // Skip patterns
    if (matchesAny(key, SKIP_PATTERNS)) return;

    // Sample values
    const values = allRows.map((r) => r[key]).filter((v) => v !== undefined && v !== null && String(v).trim() !== "");
    const filledCount = values.length;
    if (filledCount === 0) return;

    const sampleValues = [...new Set(values.slice(0, 20).map(String))].slice(0, 5);

    // Classify by keyword first
    if (matchesAny(key, GEO_PATTERNS)) {
      columns.push({ key, type: "geographic", label: cleanLabel(key), filledCount, sampleValues });
      return;
    }
    if (matchesAny(key, SCHOOL_PATTERNS) && !lower.includes("code")) {
      columns.push({ key, type: "school", label: cleanLabel(key), filledCount, sampleValues });
      return;
    }
    if (matchesAny(key, DISTRICT_PATTERNS)) {
      columns.push({ key, type: "district", label: cleanLabel(key), filledCount, sampleValues });
      return;
    }
    if (matchesAny(key, GENDER_PATTERNS)) {
      columns.push({ key, type: "gender", label: cleanLabel(key), filledCount, sampleValues });
      return;
    }
    if (matchesAny(key, CATEGORY_PATTERNS)) {
      columns.push({ key, type: "category", label: cleanLabel(key), filledCount, sampleValues });
      return;
    }
    if (matchesAny(key, SUBJECT_PATTERNS)) {
      columns.push({ key, type: "subject", label: cleanLabel(key), filledCount, sampleValues });
      return;
    }
    if (matchesAny(key, COUNT_PATTERNS)) {
      columns.push({ key, type: "count", label: cleanLabel(key), filledCount, sampleValues });
      return;
    }
    if (matchesAny(key, DATE_PATTERNS)) {
      columns.push({ key, type: "date", label: cleanLabel(key), filledCount, sampleValues });
      return;
    }
    if (matchesAny(key, IDENTITY_PATTERNS)) {
      columns.push({ key, type: "identity", label: cleanLabel(key), filledCount, sampleValues });
      return;
    }

    // Data-driven classification: sample 50 values to determine type
    const sample50 = values.slice(0, Math.min(50, values.length));
    const numericVals = sample50.map((v) => parseFloat(String(v).replace(/[^0-9.]/g, ""))).filter((n) => !isNaN(n) && n >= 1);
    const numericRatio = numericVals.length / sample50.length;

    // Check for text rating patterns like "5 - terbaik" or "Amat Memuaskan"
    const textRatingCount = sample50.filter((v) => {
      const s = String(v).toLowerCase();
      return s.includes("terbaik") || s.includes("memuaskan") || s.includes("baik") || /^\d\s*-\s*.+/.test(String(v));
    }).length;
    const hasTextRatings = textRatingCount / sample50.length > 0.3;

    if (numericRatio > 0.4 || hasTextRatings) {
      const max = Math.max(...numericVals);
      if (max <= 5) {
        const avg = numericVals.length > 0 ? Number((numericVals.reduce((a, b) => a + b, 0) / numericVals.length).toFixed(2)) : 0;
        columns.push({ key, type: "rating5", label: cleanLabel(key), avgValue: avg, filledCount, sampleValues });
      } else if (max <= 10) {
        const avg = numericVals.length > 0 ? Number((numericVals.reduce((a, b) => a + b, 0) / numericVals.length).toFixed(2)) : 0;
        columns.push({ key, type: "rating10", label: cleanLabel(key), avgValue: avg, filledCount, sampleValues });
      }
      return;
    }

    // Text feedback: average string length > 15
    const avgLen = sample50.reduce((a, v) => a + String(v).length, 0) / sample50.length;
    if (avgLen > 15 && numericRatio < 0.2) {
      columns.push({ key, type: "feedback", label: cleanLabel(key), filledCount, sampleValues });
      return;
    }

    // Fallback: skip unclassified short text columns (like school codes, ICs, etc.)
  });

  return columns;
}

// ═══════════════════════════════════════════════════════════════
// SCHOOL & STATE TYPES
// ═══════════════════════════════════════════════════════════════

export type SchoolAnalytics = {
  schoolName: string; state: string; ppd: string;
  totalStudents: number; maleCount: number; femaleCount: number;
  categories: Record<string, number>; subjects: Record<string, number>;
  teacherCount: number; teachers: { name: string; email: string; notesCount: number }[];
};

export type StateAnalytics = {
  stateName: string; totalStudents: number; totalTeachers: number; totalSchools: number;
  maleCount: number; femaleCount: number; schools: SchoolAnalytics[];
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function EventAnalytics({ eventId, certificateType = "student" }: Props) {
  const teacherEvent = certificateType === "teacher";
  const [submissions, setSubmissions] = useState<SubmissionModel[]>([]);
  const [magicLinks, setMagicLinks] = useState<MagicLinkModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("geographic");
  const [selectedState, setSelectedState] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [inspectingSchool, setInspectingSchool] = useState<SchoolAnalytics | null>(null);

  useEffect(() => {
    if (eventId) {
      Promise.all([CertiGenService.getSubmissionsByEvent(eventId), CertiGenService.getMagicLinksByEvent(eventId)])
        .then(([s, l]) => { setSubmissions(s); setMagicLinks(l); })
        .catch((err) => console.error("Failed to load analytics:", err))
        .finally(() => setLoading(false));
    }
  }, [eventId]);

  const linkMap = useMemo(() => {
    const m = new Map<string, MagicLinkModel>();
    magicLinks.forEach((l) => m.set(l.id, l));
    return m;
  }, [magicLinks]);

  // ─── Flatten all studentData rows ────────────────────────────
  const allFlatRows = useMemo<Record<string, any>[]>(() => {
    const rows: Record<string, any>[] = [];
    submissions.forEach((sub) => {
      const dataRows = Array.isArray(sub.studentData) && sub.studentData.length > 0 ? sub.studentData : null;
      if (dataRows) {
        dataRows.forEach((r: any) => {
          if (typeof r === "object" && r !== null) {
            rows.push({
              ...r,
              "Teacher Name": sub.teacherName || "Teacher",
              "Teacher Email": sub.teacherEmail || "",
              "Teacher Phone": sub.teacherPhone || "",
              "School Name": sub.schoolName || "",
              _teacherName: sub.teacherName || "Teacher",
              _teacherEmail: sub.teacherEmail || "",
              _teacherPhone: sub.teacherPhone || "",
              _schoolName: sub.schoolName || "",
            });
          }
        });
      } else {
        // Fallback: use submission-level metadata
        const fallback: Record<string, any> = {};
        if (sub.teacherName) fallback["Name"] = sub.teacherName;
        if (sub.teacherEmail) fallback["Email"] = sub.teacherEmail;
        if (sub.teacherState) fallback["State"] = sub.teacherState;
        if (sub.teacherPhone) fallback["Phone"] = sub.teacherPhone;
        if (sub.schoolName) fallback["School Name"] = sub.schoolName;
        fallback._teacherName = sub.teacherName || "Teacher";
        fallback._teacherEmail = sub.teacherEmail || "";
        fallback._teacherPhone = sub.teacherPhone || "";
        fallback._schoolName = sub.schoolName || "";
        if (Object.keys(fallback).length > 4) rows.push(fallback);
      }
    });
    return rows;
  }, [submissions]);

  // ─── Auto-Classify Columns ───────────────────────────────────
  const classifiedCols = useMemo(() => classifyColumns(allFlatRows), [allFlatRows]);

  // Column lookup helpers
  const colsOfType = (type: ColumnType) => classifiedCols.filter((c) => c.type === type);
  const firstColKey = (type: ColumnType) => colsOfType(type)[0]?.key;

  // ─── Determine available tabs ────────────────────────────────
  const availableTabs = useMemo(() => {
    const tabs: { id: string; label: string; icon: React.ReactNode }[] = [];
    tabs.push({ id: "geographic", label: "Geographic & Schools", icon: <MapPin className="w-4 h-4" /> });
    const rating5 = colsOfType("rating5");
    const rating10 = colsOfType("rating10");
    if (rating5.length > 0 || rating10.length > 0) {
      tabs.push({ id: "ratings", label: `Ratings & Scores (${rating5.length + rating10.length})`, icon: <Star className="w-4 h-4" /> });
    }
    const feedbackCols = colsOfType("feedback");
    if (feedbackCols.length > 0) {
      tabs.push({ id: "feedback", label: `Feedback (${feedbackCols.length})`, icon: <MessageSquareQuote className="w-4 h-4" /> });
    }
    tabs.push({ id: "summary", label: "Summary & Export", icon: <Target className="w-4 h-4" /> });
    return tabs;
  }, [classifiedCols]);

  // ─── Geographic Aggregations ─────────────────────────────────
  const geoKey = firstColKey("geographic");
  const schoolKey = firstColKey("school");
  const districtKey = firstColKey("district");
  const genderKey = firstColKey("gender");
  const categoryKey = firstColKey("category");
  const subjectKey = firstColKey("subject");
  const countKey = firstColKey("count");
  const dateKey = firstColKey("date");
  const nameKey = classifiedCols.find((c) => c.type === "identity" && c.key.toLowerCase().includes("name"))?.key;
  const emailKey = classifiedCols.find((c) => c.type === "identity" && c.key.toLowerCase().includes("email"))?.key;
  const phoneKey = classifiedCols.find((c) => c.type === "identity" && c.key.toLowerCase().includes("phone") || c.key.toLowerCase().includes("telefon"))?.key;

  const { stateMap, allSchools, nationStats } = useMemo(() => {
    const stateAnalytics: Record<string, StateAnalytics> = {};
    const schoolsMap: Record<string, SchoolAnalytics> = {};
    const uniqueTeachers = new Set<string>();
    let grandMale = 0, grandFemale = 0, grandStudents = 0;

    const getOrCreate = (sn: string): StateAnalytics => {
      if (!stateAnalytics[sn]) stateAnalytics[sn] = { stateName: sn, totalStudents: 0, totalTeachers: 0, totalSchools: 0, maleCount: 0, femaleCount: 0, schools: [] };
      return stateAnalytics[sn];
    };

    allFlatRows.forEach((r) => {
      const rawState = (geoKey ? String(r[geoKey] || "") : "").trim() || "Unspecified";
      const state = normalizeState(rawState);
      
      const school = teacherEvent
        ? ((schoolKey ? String(r[schoolKey] || "") : "").trim() || "Unspecified School")
        : (r._schoolName || (schoolKey ? String(r[schoolKey] || "") : "").trim() || "Unspecified School");
        
      const ppd = (districtKey ? String(r[districtKey] || "") : "").trim() || "";
      const gender = (genderKey ? String(r[genderKey] || "") : "").toLowerCase();
      const category = (categoryKey ? String(r[categoryKey] || "") : "").trim() || "Standard";
      const subject = (subjectKey ? String(r[subjectKey] || "") : "").trim() || "General";
      const cnt = countKey ? (parseInt(String(r[countKey] || "0").replace(/[^0-9]/g, ""), 10) || 1) : 1;
      
      const tName = teacherEvent
        ? ((nameKey ? String(r[nameKey] || "") : "").trim() || "Teacher")
        : (r._teacherName || "Teacher");
      const tEmail = teacherEvent
        ? ((emailKey ? String(r[emailKey] || "") : "").trim() || "")
        : (r._teacherEmail || "");

      if (tEmail) uniqueTeachers.add(tEmail.toLowerCase());
      else uniqueTeachers.add(tName.toLowerCase());

      const sk = `${state.toUpperCase()}__${school.toUpperCase()}`;
      if (!schoolsMap[sk]) schoolsMap[sk] = { schoolName: school, state, ppd, totalStudents: 0, maleCount: 0, femaleCount: 0, categories: {}, subjects: {}, teacherCount: 0, teachers: [] };

      const sch = schoolsMap[sk];
      sch.totalStudents += cnt;
      sch.categories[category] = (sch.categories[category] || 0) + cnt;
      sch.subjects[subject] = (sch.subjects[subject] || 0) + cnt;

      if (gender.includes("lelak") || gender.includes("male") || gender === "m" || gender === "l") { sch.maleCount += cnt; grandMale += cnt; }
      else if (gender.includes("perempu") || gender.includes("femal") || gender === "f" || gender === "p") { sch.femaleCount += cnt; grandFemale += cnt; }

      const ex = sch.teachers.find((t) => t.email.toLowerCase() === tEmail.toLowerCase() || t.name.toLowerCase() === tName.toLowerCase());
      if (!ex) { sch.teacherCount++; sch.teachers.push({ name: tName, email: tEmail, notesCount: cnt }); }
      else { ex.notesCount += cnt; }

      grandStudents += cnt;
    });

    Object.values(schoolsMap).forEach((sch) => {
      const st = getOrCreate(sch.state);
      st.schools.push(sch); st.totalStudents += sch.totalStudents; st.totalTeachers += sch.teacherCount; st.totalSchools++; st.maleCount += sch.maleCount; st.femaleCount += sch.femaleCount;
    });

    return { 
      stateMap: stateAnalytics, 
      allSchools: Object.values(schoolsMap), 
      nationStats: { 
        totalStudents: grandStudents, 
        totalTeachers: teacherEvent ? allFlatRows.length : uniqueTeachers.size, 
        totalSchools: Object.values(schoolsMap).length, 
        maleCount: grandMale, 
        femaleCount: grandFemale 
      } 
    };
  }, [allFlatRows, geoKey, schoolKey, districtKey, genderKey, categoryKey, subjectKey, countKey, nameKey, emailKey, teacherEvent]);

  const activeStateData = useMemo(() => selectedState === "ALL" ? null : stateMap[selectedState] || null, [stateMap, selectedState]);

  const displaySchools = useMemo(() => {
    let list = selectedState === "ALL" ? allSchools : activeStateData?.schools || [];
    if (searchTerm.trim()) { const t = searchTerm.toLowerCase(); list = list.filter((s) => s.schoolName.toLowerCase().includes(t) || s.state.toLowerCase().includes(t)); }
    return list.sort((a, b) => b.totalStudents - a.totalStudents);
  }, [allSchools, activeStateData, selectedState, searchTerm]);

  // ─── Dynamic Rating Computation (filtered by state) ──────────
  const computeRatings = useMemo(() => {
    const rows = selectedState === "ALL" ? allFlatRows : allFlatRows.filter((r) => { const raw = geoKey ? String(r[geoKey] || "") : ""; return normalizeState(raw.trim()) === selectedState; });

    const rating5Cols = colsOfType("rating5");
    const rating10Cols = colsOfType("rating10");

    const compute = (cols: ClassifiedColumn[], maxScale: number) => cols.map((col) => {
      const vals = rows.map((r) => parseRatingValue(r[col.key], maxScale)).filter((v): v is number => v !== null);
      const avg = vals.length > 0 ? Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : 0;
      return { key: col.key, label: col.label, rating: avg, maxScale, responseCount: vals.length };
    }).filter((r) => r.responseCount > 0);

    return { rating5: compute(rating5Cols, 5), rating10: compute(rating10Cols, 10) };
  }, [allFlatRows, classifiedCols, selectedState, geoKey]);

  // ─── PPD / District Data ─────────────────────────────────────
  const ppdData = useMemo(() => {
    if (!districtKey) return [];
    const rows = selectedState === "ALL" ? allFlatRows : allFlatRows.filter((r) => geoKey && normalizeState(String(r[geoKey] || "").trim()) === selectedState);
    const counts: Record<string, number> = {};
    rows.forEach((r) => { const p = String(r[districtKey] || "").trim(); if (p) counts[p] = (counts[p] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 15);
  }, [allFlatRows, districtKey, selectedState, geoKey]);

  // ─── Subject Distribution ────────────────────────────────────
  const subjectDist = useMemo(() => {
    if (!subjectKey) return [];
    const rows = selectedState === "ALL" ? allFlatRows : allFlatRows.filter((r) => geoKey && normalizeState(String(r[geoKey] || "").trim()) === selectedState);
    const counts: Record<string, number> = {};
    rows.forEach((r) => { const s = String(r[subjectKey] || "").toUpperCase().replace(/\s+/g, " ").trim(); if (s) counts[s] = (counts[s] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [allFlatRows, subjectKey, selectedState, geoKey]);

  // ─── Timeline Data ───────────────────────────────────────────
  const timelineData = useMemo(() => {
    if (!dateKey) return [];
    const rows = selectedState === "ALL" ? allFlatRows : allFlatRows.filter((r) => geoKey && normalizeState(String(r[geoKey] || "").trim()) === selectedState);
    const counts: Record<string, number> = {};
    rows.forEach((r) => { const d = String(r[dateKey] || "").trim(); if (d) counts[d] = (counts[d] || 0) + 1; });
    return Object.entries(counts).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 20);
  }, [allFlatRows, dateKey, selectedState, geoKey]);

  // ─── Student Reach ───────────────────────────────────────────
  const studentReach = useMemo(() => {
    if (!countKey) return { teachersWithNotes: 0, totalStudents: 0, avgPerTeacher: 0 };
    const rows = selectedState === "ALL" ? allFlatRows : allFlatRows.filter((r) => geoKey && normalizeState(String(r[geoKey] || "").trim()) === selectedState);
    const withNotes = rows.filter((r) => parseInt(String(r[countKey] || "0").replace(/[^0-9]/g, ""), 10) > 0);
    const total = withNotes.reduce((a, r) => a + (parseInt(String(r[countKey] || "0").replace(/[^0-9]/g, ""), 10) || 0), 0);
    return { teachersWithNotes: withNotes.length, totalStudents: total, avgPerTeacher: withNotes.length > 0 ? Number((total / withNotes.length).toFixed(1)) : 0 };
  }, [allFlatRows, countKey, selectedState, geoKey]);

  // ─── Teacher-Event KPIs ──────────────────────────────────────
  const uniqueStates = useMemo(() => Object.keys(stateMap).length, [stateMap]);
  const avgRating = useMemo(() => {
    const ratingCols = [...colsOfType("rating5"), ...colsOfType("rating10")];
    const vals: number[] = [];
    ratingCols.forEach((col) => {
      const max = col.type === "rating5" ? 5 : 10;
      allFlatRows.forEach((r) => { const v = parseRatingValue(r[col.key], max); if (v !== null) vals.push(v); });
    });
    if (vals.length === 0) return null;
    return Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2));
  }, [allFlatRows, classifiedCols]);

  // ─── Export CSV ──────────────────────────────────────────────
  const handleExportCSV = () => {
    const csv = Papa.unparse(allFlatRows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `certigen_analytics_${eventId}.csv`);
  };

  if (loading) return (
    <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      <p className="text-gray-500 text-sm">Auto-detecting columns & building analytics...</p>
    </div>
  );

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary-600" /> CertiGen Smart Analytics</h2>
          <p className="text-sm text-gray-500 mt-1">{allFlatRows.length} {teacherEvent ? "claims" : "records"} • {classifiedCols.length} columns auto-detected • {nationStats.totalSchools} schools</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold border border-emerald-200/60 flex items-center gap-1"><Sparkles className="w-3 h-3" /> {colsOfType("rating5").length + colsOfType("rating10").length} Rating Cols Detected</span>
          <Button color="secondary" onClick={handleExportCSV} isDisabled={allFlatRows.length === 0} className="flex items-center gap-2 shadow-sm whitespace-nowrap"><Download className="w-4 h-4" /> Export</Button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(teacherEvent
          ? [
              { label: "Total Claims", value: allFlatRows.length, icon: <Award className="w-5 h-5" />, color: "bg-primary-50 text-primary-600" },
              { label: "States", value: uniqueStates, icon: <MapPin className="w-5 h-5" />, color: "bg-blue-50 text-blue-600" },
              { label: "Schools", value: nationStats.totalSchools, icon: <School className="w-5 h-5" />, color: "bg-emerald-50 text-emerald-600" },
              { label: "Avg Rating", value: avgRating ?? "—", icon: <Star className="w-5 h-5" />, color: "bg-amber-50 text-amber-600" },
            ]
          : [
              { label: "Total Records", value: allFlatRows.length, icon: <Award className="w-5 h-5" />, color: "bg-primary-50 text-primary-600" },
              { label: "Schools", value: nationStats.totalSchools, icon: <School className="w-5 h-5" />, color: "bg-emerald-50 text-emerald-600" },
              { label: "Student Reach", value: studentReach.totalStudents || allFlatRows.length, icon: <GraduationCap className="w-5 h-5" />, color: "bg-violet-50 text-violet-600" },
              { label: "Gender (M/F)", value: `${nationStats.maleCount}/${nationStats.femaleCount}`, icon: <UserCheck className="w-5 h-5" />, color: "bg-amber-50 text-amber-600" },
            ])
        .map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2"><span className="text-xs font-medium text-gray-500">{kpi.label}</span><div className={`w-9 h-9 rounded-xl ${kpi.color} flex items-center justify-center`}>{kpi.icon}</div></div>
            <p className="text-2xl font-extrabold text-gray-900">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Auto-Detected Columns Badge Strip */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Auto-Detected Column Types</p>
        <div className="flex flex-wrap gap-1.5">
          {classifiedCols.map((col) => {
            const typeColors: Record<ColumnType, string> = {
              geographic: "bg-blue-50 text-blue-700 border-blue-200", school: "bg-emerald-50 text-emerald-700 border-emerald-200",
              district: "bg-cyan-50 text-cyan-700 border-cyan-200", gender: "bg-pink-50 text-pink-700 border-pink-200",
              category: "bg-orange-50 text-orange-700 border-orange-200", subject: "bg-purple-50 text-purple-700 border-purple-200",
              rating5: "bg-amber-50 text-amber-700 border-amber-200", rating10: "bg-indigo-50 text-indigo-700 border-indigo-200",
              count: "bg-green-50 text-green-700 border-green-200", date: "bg-slate-50 text-slate-700 border-slate-200",
              feedback: "bg-violet-50 text-violet-700 border-violet-200", identity: "bg-gray-50 text-gray-600 border-gray-200",
              skip: "bg-red-50 text-red-600 border-red-200",
            };
            return (
              <span key={col.key} className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${typeColors[col.type]}`} title={col.key}>
                {col.type === "rating5" && "⭐"}{col.type === "rating10" && "📊"} {col.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {availableTabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${activeTab === tab.id ? "border-indigo-600 text-indigo-700 bg-indigo-50/50" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* ═══ TAB: GEOGRAPHIC ═══ */}
          {activeTab === "geographic" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2"><MapPin className="w-4 h-4 text-indigo-600" /> State Selector</h3>
                {selectedState !== "ALL" && <button onClick={() => setSelectedState("ALL")} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1"><X className="w-3.5 h-3.5" /> Reset</button>}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                <button onClick={() => setSelectedState("ALL")} className={`p-2.5 rounded-xl border text-left text-xs transition-all ${selectedState === "ALL" ? "bg-indigo-600 border-indigo-600 text-white shadow-md" : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"}`}>
                  <div className="font-bold">🇲🇾 All</div><div className="opacity-80 mt-0.5">{nationStats.totalSchools} sch</div>
                </button>
                {MALAYSIA_STATES.map((st) => {
                  const d = stateMap[st]; const isSel = selectedState === st;
                  return (<button key={st} onClick={() => setSelectedState(st)} className={`p-2.5 rounded-xl border text-left text-xs transition-all ${isSel ? "bg-indigo-600 border-indigo-600 text-white shadow-md" : d ? "bg-white border-gray-200 hover:border-indigo-300" : "bg-gray-50 border-gray-100 opacity-50"}`}><div className="font-bold truncate">{st}</div><div className="opacity-80 mt-0.5">{d?.totalSchools || 0} sch</div></button>);
                })}
              </div>

              {activeStateData && (
                <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white p-5 rounded-2xl shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div><span className="text-[10px] uppercase font-bold tracking-widest text-indigo-300">Selected</span><h3 className="text-xl font-black flex items-center gap-2"><MapPin className="w-5 h-5 text-amber-400" />{activeStateData.stateName}</h3></div>
                    <div className="flex items-center gap-3 bg-white/10 px-4 py-2.5 rounded-xl text-sm"><span><strong>{activeStateData.totalSchools}</strong> Schools</span><span className="w-px h-5 bg-white/20" /><span className="text-amber-300"><strong>{activeStateData.totalStudents}</strong> Students</span><span className="w-px h-5 bg-white/20" /><span>♂{activeStateData.maleCount} ♀{activeStateData.femaleCount}</span></div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {ppdData.length > 0 && (
                  <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 space-y-3"><h4 className="text-sm font-bold text-gray-900">📍 District (PPD) Distribution</h4><div className="h-[260px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={ppdData.slice(0, 10)} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" /><XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6b7280" }} interval={0} angle={-30} textAnchor="end" height={60} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="value" name="Count" fill="#6366f1" radius={[4, 4, 0, 0]}>{ppdData.slice(0, 10).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Bar></BarChart></ResponsiveContainer></div></div>
                )}
                {subjectDist.length > 0 && (
                  <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 space-y-3"><h4 className="text-sm font-bold text-gray-900">📚 Subject Distribution</h4><div className="h-[260px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={subjectDist} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">{subjectDist.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Pie><Tooltip /><Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "11px" }} /></PieChart></ResponsiveContainer></div></div>
                )}
              </div>

              {timelineData.length > 1 && (
                <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 space-y-3"><h4 className="text-sm font-bold text-gray-900">📅 Session Timeline</h4><div className="h-[180px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={timelineData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" /><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Area type="monotone" dataKey="count" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} /></AreaChart></ResponsiveContainer></div></div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between"><h4 className="text-sm font-bold text-gray-900 flex items-center gap-2"><School className="w-4 h-4 text-indigo-600" />{selectedState === "ALL" ? "All Schools" : `Schools in ${selectedState}`} ({displaySchools.length})</h4><div className="relative max-w-xs w-full"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" /><input type="text" placeholder="Search school..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div></div>
                {displaySchools.length === 0 ? <p className="text-center text-sm text-gray-400 py-10">No schools found.</p> : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displaySchools.slice(0, 12).map((sch) => {
                      const tot = sch.maleCount + sch.femaleCount; const mp = tot > 0 ? Math.round((sch.maleCount / tot) * 100) : 50;
                      return (
                        <div key={`${sch.state}_${sch.schoolName}`} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all group space-y-3">
                          <div className="flex justify-between items-start gap-2"><div><span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">{sch.state}</span><h5 className="text-sm font-bold text-gray-900 mt-1 line-clamp-2 group-hover:text-indigo-600">{sch.schoolName}</h5></div><span className="text-[11px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full border border-amber-200/60 whitespace-nowrap">🎓 {sch.totalStudents}</span></div>
                          {(sch.maleCount > 0 || sch.femaleCount > 0) && <div className="space-y-1"><div className="flex justify-between text-[10px] font-medium"><span className="text-blue-600">♂ {sch.maleCount} ({mp}%)</span><span className="text-pink-600">♀ {sch.femaleCount} ({100 - mp}%)</span></div><div className="flex w-full h-1.5 rounded-full overflow-hidden bg-gray-200"><div className="bg-blue-500 h-full" style={{ width: `${mp}%` }} /><div className="bg-pink-500 h-full" style={{ width: `${100 - mp}%` }} /></div></div>}
                          <div className="flex justify-between items-center pt-1 border-t border-gray-100"><span className="text-[11px] text-gray-500">👩‍🏫 {sch.teacherCount} Teachers</span><button onClick={() => setInspectingSchool(sch)} className="text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors">Inspect <ChevronRight className="w-3 h-3" /></button></div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ TAB: RATINGS ═══ */}
          {activeTab === "ratings" && (
            <div className="space-y-6">
              {computeRatings.rating5.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2"><Star className="w-5 h-5 text-amber-500 fill-amber-500" /> Star Ratings (1–5 Scale) — {computeRatings.rating5.length} columns detected</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {computeRatings.rating5.sort((a, b) => b.rating - a.rating).map((item) => (
                      <div key={item.key} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3 hover:shadow-md transition-all">
                        <h5 className="text-xs font-bold text-gray-900 leading-tight" title={item.key}>{item.label}</h5>
                        <div className="flex items-end gap-2"><span className="text-3xl font-black text-amber-600">{item.rating}</span><span className="text-sm text-gray-400 pb-0.5">/ 5.0</span></div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5"><div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all" style={{ width: `${(item.rating / 5) * 100}%` }} /></div>
                        <p className="text-[10px] text-gray-400">{item.responseCount} responses</p>
                      </div>
                    ))}
                  </div>

                  {/* Radar chart if enough columns */}
                  {computeRatings.rating5.length >= 3 && (
                    <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 space-y-3">
                      <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-600" /> Ratings Radar Overview</h4>
                      <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={computeRatings.rating5.slice(0, 10).map((r) => ({ name: r.label.length > 18 ? r.label.substring(0, 15) + "..." : r.label, score: r.rating, fullMark: 5 }))} cx="50%" cy="50%" outerRadius="70%">
                            <PolarGrid stroke="#e5e7eb" />
                            <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: "#374151", fontWeight: 600 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 9 }} />
                            <Radar name="Avg Rating" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2} />
                            <Tooltip />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {computeRatings.rating10.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2"><Hash className="w-5 h-5 text-indigo-600" /> Score Ratings (1–10 Scale) — {computeRatings.rating10.length} columns detected</h3>
                  <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 space-y-3">
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={computeRatings.rating10} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                          <XAxis type="number" domain={[0, 10]} tick={{ fill: "#6b7280", fontSize: 11 }} />
                          <YAxis type="category" dataKey="label" tick={{ fill: "#374151", fontSize: 10, fontWeight: 500 }} width={150} />
                          <Tooltip />
                          <Bar dataKey="rating" name="Score" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ TAB: FEEDBACK ═══ */}
          {activeTab === "feedback" && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2"><MessageSquareQuote className="w-5 h-5 text-violet-600" /> Open-Text Feedback Responses</h3>
              {colsOfType("feedback").map((col) => {
                const rows = selectedState === "ALL" ? allFlatRows : allFlatRows.filter((r) => geoKey && normalizeState(String(r[geoKey] || "").trim()) === selectedState);
                const responses = rows.map((r) => String(r[col.key] || "").trim()).filter((v) => v.length > 2).slice(0, 20);
                if (responses.length === 0) return null;
                return (
                  <div key={col.key} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-gray-900" title={col.key}>{col.label}</h4>
                      <span className="text-[10px] bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full font-bold">{responses.length} responses shown</span>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {responses.map((resp, i) => (
                        <div key={i} className="text-xs text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-100 leading-relaxed">
                          &ldquo;{resp}&rdquo;
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ═══ TAB: SUMMARY ═══ */}
          {activeTab === "summary" && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2"><Target className="w-5 h-5 text-emerald-600" /> Analytics Summary & Data Schema</h3>

              {/* Student Reach */}
              {!teacherEvent && studentReach.totalStudents > 0 && (
                <div className="bg-gradient-to-r from-emerald-900 to-emerald-700 text-white p-6 rounded-2xl shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div><span className="text-[10px] uppercase font-bold tracking-widest text-emerald-300">Student Reach Multiplier</span><h3 className="text-2xl font-black flex items-center gap-2 mt-1"><GraduationCap className="w-6 h-6 text-amber-400" />{studentReach.teachersWithNotes} Teachers → {studentReach.totalStudents} Students</h3><p className="text-xs text-emerald-200 mt-1">Avg <strong className="text-white">{studentReach.avgPerTeacher}</strong> students per teacher</p></div>
                    <div className="bg-white/10 px-5 py-3 rounded-xl border border-white/10 text-center"><div className="text-[10px] text-emerald-200 uppercase font-semibold">Avg / Teacher</div><div className="text-3xl font-black text-amber-300">{studentReach.avgPerTeacher}</div></div>
                  </div>
                </div>
              )}

              {/* Gender Pie */}
              {!teacherEvent && (nationStats.maleCount > 0 || nationStats.femaleCount > 0) && (
                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2"><UserCheck className="w-4 h-4 text-indigo-600" /> Gender Distribution</h4>
                  <div className="h-[200px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={[{ name: "Male", value: nationStats.maleCount || 1 }, { name: "Female", value: nationStats.femaleCount || 1 }]} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={4} dataKey="value"><Cell fill="#3b82f6" /><Cell fill="#ec4899" /></Pie><Tooltip /><Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "11px" }} /></PieChart></ResponsiveContainer></div>
                </div>
              )}

              {/* Schema Table */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
                <h4 className="text-sm font-bold text-gray-900">📋 Detected Data Schema ({classifiedCols.length} columns)</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 text-[10px] font-semibold uppercase border-b"><tr><th className="px-3 py-2">Column</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Filled Rows</th><th className="px-3 py-2">Sample Values</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {classifiedCols.map((col) => (
                        <tr key={col.key} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium text-gray-900 max-w-[200px] truncate" title={col.key}>{col.label}</td>
                          <td className="px-3 py-2"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${col.type === "rating5" ? "bg-amber-50 text-amber-700" : col.type === "rating10" ? "bg-indigo-50 text-indigo-700" : col.type === "geographic" ? "bg-blue-50 text-blue-700" : col.type === "feedback" ? "bg-violet-50 text-violet-700" : "bg-gray-100 text-gray-600"}`}>{col.type}{col.avgValue !== undefined ? ` (${col.avgValue})` : ""}</span></td>
                          <td className="px-3 py-2 text-gray-500">{col.filledCount}</td>
                          <td className="px-3 py-2 text-gray-400 max-w-[250px] truncate">{col.sampleValues.join(", ")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* School Inspection Modal */}
      {inspectingSchool && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4"><div><span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full uppercase">{inspectingSchool.state}</span><h3 className="text-xl font-black text-gray-900 mt-1">{inspectingSchool.schoolName}</h3></div><button onClick={() => setInspectingSchool(null)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center"><X className="w-5 h-5" /></button></div>
            <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-2xl border text-center"><div><div className="text-xs text-gray-500 font-semibold">Students</div><div className="text-2xl font-black text-indigo-600">{inspectingSchool.totalStudents}</div></div><div><div className="text-xs text-gray-500 font-semibold">Male</div><div className="text-2xl font-black text-blue-600">♂ {inspectingSchool.maleCount}</div></div><div><div className="text-xs text-gray-500 font-semibold">Female</div><div className="text-2xl font-black text-pink-600">♀ {inspectingSchool.femaleCount}</div></div></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-2xl border space-y-2"><h5 className="text-xs font-bold text-gray-900 uppercase">Categories</h5>{Object.entries(inspectingSchool.categories).map(([c, v]) => <div key={c} className="flex justify-between text-xs"><span className="text-gray-600 truncate">{c}</span><strong className="text-indigo-600">{v}</strong></div>)}</div>
              <div className="bg-gray-50 p-4 rounded-2xl border space-y-2"><h5 className="text-xs font-bold text-gray-900 uppercase">Subjects</h5>{Object.entries(inspectingSchool.subjects).map(([s, v]) => <div key={s} className="flex justify-between text-xs"><span className="text-gray-600 truncate">{s}</span><strong className="text-purple-600">{v}</strong></div>)}</div>
            </div>
            <div className="space-y-2"><h5 className="text-xs font-bold text-gray-900 flex items-center gap-2"><Users className="w-3.5 h-3.5 text-emerald-600" /> Teachers ({inspectingSchool.teachers.length})</h5><div className="divide-y divide-gray-100 max-h-32 overflow-y-auto border rounded-xl bg-gray-50 p-2.5">{inspectingSchool.teachers.map((t, i) => <div key={i} className="py-1.5 flex items-center justify-between text-xs"><div><div className="font-bold text-gray-900">{t.name}</div><div className="text-gray-500">{t.email}</div></div><span className="bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded text-[10px]">{t.notesCount}</span></div>)}</div></div>
            <div className="flex justify-end"><Button color="primary" onClick={() => setInspectingSchool(null)} className="px-6">Close</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}
