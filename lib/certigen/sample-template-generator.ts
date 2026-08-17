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

export function getSampleFields(templateConfig?: FieldConfig[] | null): string[] {
  if (Array.isArray(templateConfig) && templateConfig.length > 0) {
    // Collect all text fields (or fields without image/popup type)
    const validFields = templateConfig
      .filter((f) => f && f.type !== "image" && f.type !== "popup" && typeof f.label === "string" && f.label.trim() !== "")
      .map((f) => f.label.trim());

    const uniqueFields = Array.from(new Set(validFields));
    if (uniqueFields.length > 0) {
      return uniqueFields;
    }
  }

  // Fallback standard fields if template config is empty or has no text fields
  return ["Student Name", "School Name", "IC / Student ID", "Class / Grade", "Category / Award", "State"];
}

function getDummyValueForField(label: string, rowIndex: number): string {
  const l = label.toLowerCase().trim();

  // Name patterns
  if (
    l.includes("name") ||
    l.includes("nama") ||
    l.includes("student") ||
    l.includes("pelajar") ||
    l.includes("murid") ||
    l.includes("peserta") ||
    l.includes("participant")
  ) {
    if (l.includes("school") || l.includes("sekolah")) {
      return DUMMY_SCHOOLS[rowIndex % DUMMY_SCHOOLS.length];
    }
    if (l.includes("teacher") || l.includes("guru")) {
      return `Cikgu ${["Azman", "Faridah", "Lee", "Kavita", "Zulkifli"][rowIndex % 5]}`;
    }
    return DUMMY_NAMES[rowIndex % DUMMY_NAMES.length];
  }

  // School patterns
  if (
    l.includes("school") ||
    l.includes("sekolah") ||
    l.includes("institusi") ||
    l.includes("institution") ||
    l.includes("college") ||
    l.includes("kolej") ||
    l.includes("universiti")
  ) {
    return DUMMY_SCHOOLS[rowIndex % DUMMY_SCHOOLS.length];
  }

  // IC / ID patterns
  if (
    l.includes("ic") ||
    l.includes("kp") ||
    l.includes("mykad") ||
    l.includes("kad pengenalan") ||
    l.includes("id") ||
    l.includes("no.") ||
    l.includes("nombor") ||
    l.includes("matrix") ||
    l.includes("matrik")
  ) {
    return DUMMY_ICS[rowIndex % DUMMY_ICS.length];
  }

  // Class / Grade patterns
  if (
    l.includes("class") ||
    l.includes("kelas") ||
    l.includes("grade") ||
    l.includes("tingkatan") ||
    l.includes("darjah") ||
    l.includes("form") ||
    l.includes("year") ||
    l.includes("tahun")
  ) {
    return DUMMY_CLASSES[rowIndex % DUMMY_CLASSES.length];
  }

  // Award / Category / Achievement patterns
  if (
    l.includes("award") ||
    l.includes("pencapaian") ||
    l.includes("category") ||
    l.includes("kategori") ||
    l.includes("ranking") ||
    l.includes("kedudukan") ||
    l.includes("status") ||
    l.includes("position") ||
    l.includes("pingat") ||
    l.includes("medal") ||
    l.includes("level") ||
    l.includes("peringkat")
  ) {
    return DUMMY_AWARDS[rowIndex % DUMMY_AWARDS.length];
  }

  // State / Region patterns
  if (
    l.includes("state") ||
    l.includes("negeri") ||
    l.includes("region") ||
    l.includes("zone") ||
    l.includes("zon") ||
    l.includes("daerah") ||
    l.includes("district")
  ) {
    return DUMMY_STATES[rowIndex % DUMMY_STATES.length];
  }

  // Date patterns
  if (l.includes("date") || l.includes("tarikh") || l.includes("day") || l.includes("hari")) {
    return "17 August 2026";
  }

  // Serial / Cert Number patterns
  if (l.includes("cert") || l.includes("sijil") || l.includes("serial") || l.includes("siri")) {
    return `CERT-2026-00${rowIndex + 1}`;
  }

  // Score / Points patterns
  if (l.includes("score") || l.includes("markah") || l.includes("points") || l.includes("gred")) {
    return `${95 - rowIndex * 3}%`;
  }

  // Teacher patterns
  if (l.includes("teacher") || l.includes("guru") || l.includes("cikgu")) {
    return `Cikgu ${["Azman", "Faridah", "Lee", "Kavita", "Zulkifli"][rowIndex % 5]}`;
  }

  // Gender patterns
  if (l.includes("gender") || l.includes("jantina") || l.includes("sex")) {
    return rowIndex % 2 === 0 ? "Lelaki" : "Perempuan";
  }

  // Fallback clean value
  return `Sample Value ${rowIndex + 1}`;
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
  const base = (title || "student_template")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `${base || "student_template"}.${ext}`;
}

/**
 * Downloads a 100% valid, formatted Microsoft Excel (.xlsx) file using SheetJS
 */
export function downloadSampleExcel(templateConfig?: FieldConfig[] | null, eventTitle?: string) {
  try {
    const headers = getSampleFields(templateConfig);
    const dummyRows = generateDummyStudentRows(templateConfig, 5);

    // Create Worksheet with headers in row 1
    const ws = XLSX.utils.json_to_sheet(dummyRows, { header: headers });

    // Calculate dynamic column widths with padding
    const colWidths = headers.map((header) => {
      let maxLen = header.length;
      for (const row of dummyRows) {
        const val = String(row[header] || "");
        if (val.length > maxLen) maxLen = val.length;
      }
      return { wch: Math.max(maxLen + 4, 18) };
    });
    ws["!cols"] = colWidths;

    // Create Workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Student List");

    const fileName = sanitizeFileName(eventTitle ? `${eventTitle}_sample_template` : "sample_student_submission", "xlsx");

    // Use XLSX.writeFile for native, robust client-side Excel downloads
    XLSX.writeFile(wb, fileName);
  } catch (err) {
    console.error("Error generating sample Excel file:", err);
    // Fallback to CSV if XLSX writing fails
    downloadSampleCsv(templateConfig, eventTitle);
  }
}

/**
 * Downloads a clean UTF-8 Comma-Separated Values (.csv) file with BOM for Excel compatibility
 */
export function downloadSampleCsv(templateConfig?: FieldConfig[] | null, eventTitle?: string) {
  try {
    const headers = getSampleFields(templateConfig);
    const dummyRows = generateDummyStudentRows(templateConfig, 5);

    const escapeCsv = (val: string) => {
      const stringVal = String(val ?? "");
      if (stringVal.includes(",") || stringVal.includes('"') || stringVal.includes("\n") || stringVal.includes("\r")) {
        return `"${stringVal.replace(/"/g, '""')}"`;
      }
      return stringVal;
    };

    const headerLine = headers.map(escapeCsv).join(",");
    const dataLines = dummyRows.map((row) =>
      headers.map((h) => escapeCsv(row[h] || "")).join(",")
    );

    // Add UTF-8 BOM (\uFEFF) so Excel opens CSV without character encoding or delimiter distortion
    const csvContent = "\uFEFF" + [headerLine, ...dataLines].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    const fileName = sanitizeFileName(eventTitle ? `${eventTitle}_sample_template` : "sample_student_submission", "csv");

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Error generating sample CSV file:", err);
  }
}
