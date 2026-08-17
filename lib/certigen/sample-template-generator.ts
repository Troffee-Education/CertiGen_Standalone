import * as XLSX from "xlsx";
import type { FieldConfig } from "@/components/certigen/CanvasEditor";

// Realistic dummy data pool for sample certificate generation
const DUMMY_NAMES = [
  "Ahmad Danish bin Razak",
  "Siti Nur Aisyah binti Osman",
  "Tan Wei Lun",
  "Priya a/p Muthusamy",
  "Muhammad Harith bin Fauzi",
];

const DUMMY_SCHOOLS = [
  "SMK Bandar Utama Damansara (4)",
  "SK Taman Melawati",
  "SMJK Chung Hwa",
  "SMK Seri Bintang Utara",
  "SK Convent Bukit Nanas",
];

const DUMMY_ICS = [
  "080512-10-1234",
  "090223-14-5678",
  "081105-08-9012",
  "090718-10-3456",
  "080329-14-7890",
];

const DUMMY_CLASSES = [
  "5 Amanah",
  "4 Cemerlang",
  "5 Bestari",
  "4 Dinamik",
  "5 Efisien",
];

const DUMMY_AWARDS = [
  "Gold Medalist - Top 5%",
  "Silver Medalist - Top 10%",
  "Bronze Medalist - Top 15%",
  "High Distinction",
  "Certificate of Participation",
];

const DUMMY_STATES = [
  "Selangor",
  "W.P. Kuala Lumpur",
  "Pulau Pinang",
  "Johor",
  "Perak",
];

export interface SampleField {
  label: string;
  key: string;
}

export function getSampleFields(templateConfig?: FieldConfig[] | null): string[] {
  const textFields = (templateConfig ?? []).filter((f) => f.type === "text" && f.label && f.label.trim() !== "");
  
  if (textFields.length > 0) {
    return textFields.map((f) => f.label.trim());
  }

  // Fallback standard fields if template config is empty
  return ["Student Name", "School Name", "IC / Student ID", "Class / Grade", "Category / Award", "State"];
}

function getDummyValueForField(label: string, rowIndex: number): string {
  const l = label.toLowerCase();

  if (l.includes("name") || l.includes("nama") || l.includes("student") || l.includes("murid") || l.includes("peserta")) {
    if (l.includes("school") || l.includes("sekolah")) {
      return DUMMY_SCHOOLS[rowIndex % DUMMY_SCHOOLS.length];
    }
    if (l.includes("teacher") || l.includes("guru")) {
      return `Cikgu ${["Azman", "Faridah", "Lee", "Kavita", "Zulkifli"][rowIndex % 5]}`;
    }
    return DUMMY_NAMES[rowIndex % DUMMY_NAMES.length];
  }

  if (l.includes("school") || l.includes("sekolah") || l.includes("institusi") || l.includes("institution")) {
    return DUMMY_SCHOOLS[rowIndex % DUMMY_SCHOOLS.length];
  }

  if (l.includes("ic") || l.includes("kp") || l.includes("id") || l.includes("no.") || l.includes("nombor") || l.includes("matrix")) {
    return DUMMY_ICS[rowIndex % DUMMY_ICS.length];
  }

  if (l.includes("class") || l.includes("kelas") || l.includes("grade") || l.includes("tingkatan") || l.includes("darjah") || l.includes("form")) {
    return DUMMY_CLASSES[rowIndex % DUMMY_CLASSES.length];
  }

  if (l.includes("award") || l.includes("pencapaian") || l.includes("category") || l.includes("kategori") || l.includes("ranking") || l.includes("kedudukan") || l.includes("status")) {
    return DUMMY_AWARDS[rowIndex % DUMMY_AWARDS.length];
  }

  if (l.includes("state") || l.includes("negeri") || l.includes("region")) {
    return DUMMY_STATES[rowIndex % DUMMY_STATES.length];
  }

  if (l.includes("date") || l.includes("tarikh")) {
    return "17 August 2026";
  }

  if (l.includes("score") || l.includes("markah") || l.includes("points")) {
    return `${95 - rowIndex * 3}%`;
  }

  return `Sample ${label} ${rowIndex + 1}`;
}

export function generateDummyStudentRows(templateConfig?: FieldConfig[] | null, rowCount: number = 5): Record<string, string>[] {
  const headers = getSampleFields(templateConfig);
  const rows: Record<string, string>[] = [];

  for (let i = 0; i < rowCount; i++) {
    const row: Record<string, string> = {};
    for (const header of headers) {
      row[header] = getDummyValueForField(header, i);
    }
    rows.push(row);
  }

  return rows;
}

export function getSampleTableData(templateConfig?: FieldConfig[] | null) {
  const headers = getSampleFields(templateConfig);
  const rows = generateDummyStudentRows(templateConfig, 5);
  return { headers, rows };
}

function sanitizeFileName(title?: string, ext: string = "xlsx"): string {
  const base = (title || "sample_student_submission")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `${base || "sample_student_template"}.${ext}`;
}

export function downloadSampleExcel(templateConfig?: FieldConfig[] | null, eventTitle?: string) {
  const headers = getSampleFields(templateConfig);
  const dummyRows = generateDummyStudentRows(templateConfig, 5);

  // Convert to SheetJS format
  const ws = XLSX.utils.json_to_sheet(dummyRows, { header: headers });

  // Calculate readable column widths based on content
  const colWidths = headers.map((header) => {
    let maxLen = header.length;
    for (const row of dummyRows) {
      const val = String(row[header] || "");
      if (val.length > maxLen) maxLen = val.length;
    }
    return { wch: Math.max(maxLen + 4, 18) };
  });
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Student List");

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = sanitizeFileName(eventTitle ? `${eventTitle}_sample_template` : "sample_student_submission", "xlsx");
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadSampleCsv(templateConfig?: FieldConfig[] | null, eventTitle?: string) {
  const headers = getSampleFields(templateConfig);
  const dummyRows = generateDummyStudentRows(templateConfig, 5);

  const escapeCsv = (val: string) => {
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const headerLine = headers.map(escapeCsv).join(",");
  const dataLines = dummyRows.map((row) =>
    headers.map((h) => escapeCsv(row[h] || "")).join(",")
  );

  const csvContent = "\uFEFF" + [headerLine, ...dataLines].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = sanitizeFileName(eventTitle ? `${eventTitle}_sample_template` : "sample_student_submission", "csv");
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
