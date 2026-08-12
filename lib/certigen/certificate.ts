import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

import type { FieldConfig } from "@/components/certigen/CanvasEditor";

export const NAME_PATTERNS = [
  "full name", "student name", "nama murid", "nama pelajar", "nama guru", "nama peserta", "participant name", "teacher name", "nama", "name"
];
export const SCHOOL_PATTERNS = [
  "school name", "nama sekolah", "sekolah", "school", "kod sekolah", "school code", "ppd", "nama institusi", "institution"
];
export const EMAIL_PATTERNS = [
  "email address", "alamat emel", "email", "e-mel", "e-mail"
];
export const STATE_PATTERNS = [
  "state", "negeri", "region", "provinsi"
];
export const MAX_STUDENTS = 6000;

// Map font families that have no embedded TTF/standard-PDF equivalent to the
// closest standard PDF font, so output is deterministic instead of silently
// falling through to Helvetica. Only families listed here are renderable.
export const FONT_MAP: Record<string, string> = {
  "Great Vibes": "Great Vibes",
  Helvetica: "Helvetica",
  Arial: "Helvetica",
  Inter: "Helvetica",
  "Times-Roman": "Times-Roman",
  Georgia: "Times-Roman",
  Courier: "Courier",
};

export function resolveFontFamily(fontFamily: string): string {
  return FONT_MAP[fontFamily] || "Helvetica";
}

export function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return rgb(r, g, b);
}

export function detectColumn(headers: string[], patterns: string[], excludePatterns: string[] = []): string | null {
  const lower = headers.map((h) => h.trim().toLowerCase());

  // Pass 1: Exact string match
  for (const pattern of patterns) {
    const exactIdx = lower.findIndex((h) => h === pattern);
    if (exactIdx !== -1) {
      const hLower = lower[exactIdx];
      if (!excludePatterns.some((ex) => hLower.includes(ex))) {
        return headers[exactIdx];
      }
    }
  }

  // Pass 2: Substring match
  for (const pattern of patterns) {
    const idx = lower.findIndex((h) => {
      if (!h.includes(pattern)) return false;
      if (excludePatterns.some((ex) => h.includes(ex))) return false;
      return true;
    });
    if (idx !== -1) return headers[idx];
  }
  return null;
}

export function autoMapColumns(parsedHeaders: string[], templateConfig: FieldConfig[]) {
  const autoMap: Record<string, string> = {};

  const schoolCol = detectColumn(parsedHeaders, SCHOOL_PATTERNS);
  const nameCol = detectColumn(parsedHeaders, NAME_PATTERNS, ["school", "sekolah", "code", "kod", "email", "emel"]);
  const emailCol = detectColumn(parsedHeaders, EMAIL_PATTERNS);
  const stateCol = detectColumn(parsedHeaders, STATE_PATTERNS);

  templateConfig.forEach((box) => {
    if (box.type === "image") return;
    const label = box.label.trim().toLowerCase();
    let match: string | null = null;

    // Check School first (to prevent "School Name" from being captured as "Name")
    if (label.includes("school") || label.includes("sekolah") || label.includes("institusi")) {
      match = schoolCol || detectColumn(parsedHeaders, SCHOOL_PATTERNS);
    }
    // Check Name second
    else if (label.includes("name") || label.includes("nama") || label.includes("student") || label.includes("murid") || label.includes("pelajar") || label.includes("peserta") || label.includes("participant")) {
      match = nameCol || detectColumn(parsedHeaders, NAME_PATTERNS, ["school", "sekolah"]);
    }
    // Check Email
    else if (label.includes("email") || label.includes("e-mel") || label.includes("mail")) {
      match = emailCol || detectColumn(parsedHeaders, EMAIL_PATTERNS);
    }
    // Check State / Region
    else if (label.includes("state") || label.includes("negeri") || label.includes("region")) {
      match = stateCol || detectColumn(parsedHeaders, STATE_PATTERNS);
    }

    // Fallback 1: Exact match in headers
    if (!match) {
      match = parsedHeaders.find((h) => h.toLowerCase() === label) || null;
    }

    // Fallback 2: Substring match in headers
    if (!match) {
      match = parsedHeaders.find((h) => h.toLowerCase().includes(label) || label.includes(h.toLowerCase())) || null;
    }

    if (match) autoMap[box.id] = match;
  });

  return autoMap;
}

export async function loadFont(
  pdfDoc: PDFDocument,
  fontFamily: string,
  fontWeight: string,
  fontCache: Record<string, PDFFont>,
  greatVibesRef: { current: ArrayBuffer | null }
): Promise<PDFFont> {
  const family = resolveFontFamily(fontFamily);
  const key = `${family}:${fontWeight}`;
  if (fontCache[key]) return fontCache[key];

  let font: PDFFont;
  if (family === "Great Vibes") {
    if (!greatVibesRef.current) {
      const res = await fetch("/fonts/GreatVibes-Regular.ttf");
      if (!res.ok) throw new Error("Failed to load Great Vibes font");
      const buffer = await res.arrayBuffer();
      if (new Uint8Array(buffer)[0] === 0x3c) {
        throw new Error("Failed to load font: Server returned HTML instead of a TTF file.");
      }
      greatVibesRef.current = buffer;
    }
    font = await pdfDoc.embedFont(new Uint8Array(greatVibesRef.current));
  } else if (family === "Helvetica") {
    font = fontWeight === "bold"
      ? await pdfDoc.embedStandardFont(StandardFonts.HelveticaBold)
      : await pdfDoc.embedStandardFont(StandardFonts.Helvetica);
  } else if (family === "Times-Roman") {
    font = fontWeight === "bold"
      ? await pdfDoc.embedStandardFont(StandardFonts.TimesRomanBold)
      : await pdfDoc.embedStandardFont(StandardFonts.TimesRoman);
  } else if (family === "Courier") {
    font = fontWeight === "bold"
      ? await pdfDoc.embedStandardFont(StandardFonts.CourierBold)
      : await pdfDoc.embedStandardFont(StandardFonts.Courier);
  } else {
    font = fontWeight === "bold"
      ? await pdfDoc.embedStandardFont(StandardFonts.HelveticaBold)
      : await pdfDoc.embedStandardFont(StandardFonts.Helvetica);
  }
  fontCache[key] = font;
  return font;
}

export async function embedImage(pdfDoc: PDFDocument, bytes: ArrayBuffer, url: string) {
  const arr = new Uint8Array(bytes);

  // Check for PNG magic bytes (89 50 4E 47)
  if (arr.length > 3 && arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4e && arr[3] === 0x47) {
    return pdfDoc.embedPng(bytes);
  }

  // Check for JPG magic bytes (FF D8 FF)
  if (arr.length > 2 && arr[0] === 0xff && arr[1] === 0xd8 && arr[2] === 0xff) {
    return pdfDoc.embedJpg(bytes);
  }

  // If neither, we probably got an HTML or XML error page instead of an image
  const textPreview = new TextDecoder().decode(arr.slice(0, 50)).replace(/\n/g, "");
  throw new Error(`Invalid image format downloaded. Magic bytes: [${arr[0]}, ${arr[1]}, ${arr[2]}]. Preview: ${textPreview}...`);
}

export function sanitizeTextForFont(text: string, fontFamily: string): string {
  if (!text) return "";

  // Convert tabs, newlines, and control characters to spaces
  let cleaned = text
    .replace(/[\t\r\n\v\f]/g, " ")
    .replace(/İ/g, "I")
    .replace(/ı/g, "i")
    .replace(/Ş/g, "S")
    .replace(/ş/g, "s")
    .replace(/Ğ/g, "G")
    .replace(/ğ/g, "g")
    .replace(/Ç/g, "C")
    .replace(/ç/g, "c")
    .replace(/Ö/g, "O")
    .replace(/ö/g, "o")
    .replace(/Ü/g, "U")
    .replace(/ü/g, "u")
    .replace(/[’‘`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\u00A0/g, " ")
    .replace(/[•·]/g, ".");

  // If using standard built-in PDF fonts (Helvetica, Times, etc.), WinAnsi only encodes printable ASCII & Latin-1
  if (resolveFontFamily(fontFamily) !== "Great Vibes") {
    cleaned = Array.from(cleaned)
      .map((char) => {
        const code = char.charCodeAt(0);
        // Printable ASCII (32-126) and Latin-1 supplement (160-255), exclude control chars (0-31)
        if ((code >= 32 && code <= 126) || (code >= 160 && code <= 255)) {
          return char;
        }
        return "";
      })
      .join("");
  }

  // Collapse multiple whitespace characters
  return cleaned.replace(/\s+/g, " ").trim();
}

export async function fetchImageAsArrayBuffer(url: string): Promise<ArrayBuffer> {
  if (!url) throw new Error("Image URL is empty");

  // Handle data: URIs directly without fetch
  if (url.startsWith("data:")) {
    const base64Data = url.split(",")[1];
    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // For Firebase Storage URLs, route through our server-side proxy to bypass CORS restrictions
  const isFirebaseStorageUrl = url.includes("firebasestorage.googleapis.com") || url.includes("storage.googleapis.com");
  const fetchUrl = isFirebaseStorageUrl
    ? `/api/image-proxy?url=${encodeURIComponent(url)}`
    : url;

  // Attempt fetch (through proxy for Firebase Storage URLs)
  try {
    const res = await fetch(fetchUrl, { mode: "cors" });
    if (res.ok) {
      return await res.arrayBuffer();
    }
  } catch (err) {
    console.warn("[fetchImageAsArrayBuffer] Direct fetch failed, trying Image fallback:", err);
  }


  // Fallback: Load via HTML Image element & Canvas to bypass fetch CORS / NetworkError restrictions
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context 2D not available"));
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");
        const base64 = dataUrl.split(",")[1];
        const binaryStr = atob(base64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        resolve(bytes.buffer);
      } catch (canvasErr) {
        reject(new Error(`Failed to convert image: ${canvasErr instanceof Error ? canvasErr.message : String(canvasErr)}`));
      }
    };
    img.onerror = () => reject(new Error("NetworkError: Unable to load template image resource from URL."));
    img.src = url;
  });
}

export async function drawField(
  page: PDFPage,
  box: FieldConfig,
  student: Record<string, unknown>,
  mapping: Record<string, string>,
  image: { width: number; height: number },
  pdfDoc: PDFDocument,
  fontCache: Record<string, PDFFont>,
  greatVibesRef: { current: ArrayBuffer | null },
  templateUrl: string
) {
  // Popup fields are web-only (modal dialog after download); skip PDF rendering
  if (box.type === "popup") return;

  if (box.type === "image") {
    try {
      const bytes = await fetchImageAsArrayBuffer(box.imageUrl);
      const img = await embedImage(pdfDoc, bytes, templateUrl);
      const px = (box.x / 100) * image.width;
      const py = (box.y / 100) * image.height;
      const pw = (box.width / 100) * image.width;
      const ph = (box.height / 100) * image.height;
      page.drawImage(img, { x: px, y: image.height - py - ph, width: pw, height: ph, opacity: box.opacity / 100 });
    } catch { /* skip */ }
    return;
  }

  const col = mapping[box.id];
  if (!col) return;

  const rawText = String(student[col] || "");
  if (!rawText) return;

  const text = sanitizeTextForFont(rawText, box.fontFamily);
  if (!text) return;

  const font = await loadFont(pdfDoc, box.fontFamily, box.fontWeight, fontCache, greatVibesRef);
  const px = (box.x / 100) * image.width;
  const py = (box.y / 100) * image.height;

  // Determine the maximum available width based on alignment and a 25% margin
  let maxWidth = image.width;
  if (box.textAlign === "center") {
    const distToLeft = px;
    const distToRight = image.width - px;
    maxWidth = Math.min(distToLeft, distToRight) * 2 * 0.75;
  } else if (box.textAlign === "left") {
    maxWidth = (image.width - px) * 0.75;
  } else if (box.textAlign === "right") {
    maxWidth = px * 0.75;
  }

  let finalFontSize = box.fontSize;
  let tw = font.widthOfTextAtSize(text, finalFontSize);

  // Scale down if the text is too wide
  if (tw > maxWidth && maxWidth > 0) {
    const scaleFactor = maxWidth / tw;
    finalFontSize = Math.max(10, Math.floor(finalFontSize * scaleFactor)); // Prevent it from getting too microscopic
    tw = font.widthOfTextAtSize(text, finalFontSize);
  }

  let x = px;
  if (box.textAlign === "center") x = px - tw / 2;
  else if (box.textAlign === "right") x = px - tw;

  const th = font.heightAtSize(finalFontSize, { descender: false });
  page.drawText(text, { x, y: image.height - py - th / 2, size: finalFontSize, font, color: hexToRgb(box.fontColor) });
}

export async function generatePdf(
  student: Record<string, unknown>,
  templateConfig: FieldConfig[],
  templateUrl: string,
  mapping: Record<string, string>,
  templateImageBytes: ArrayBuffer,
  greatVibesRef: { current: ArrayBuffer | null }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // Fonts are embedded per-document. A shared cache must NOT be reused across
  // documents, otherwise PDFFont objects from a previous PDF leak in and produce
  // broken/missing text.
  const fontCache: Record<string, PDFFont> = {};

  const image = await embedImage(pdfDoc, templateImageBytes, templateUrl);
  const page = pdfDoc.addPage([image.width, image.height]);
  page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });

  for (const box of templateConfig) {
    await drawField(page, box, student, mapping, image, pdfDoc, fontCache, greatVibesRef, templateUrl);
  }

  return pdfDoc.save();
}

