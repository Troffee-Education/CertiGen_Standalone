import { NextResponse } from "next/server";
import { CertiGenAdminService } from "@/lib/certigen/admin-service";
import { requireAdminAuth } from "@/lib/certigen/auth";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminAuth = await requireAdminAuth(request);
    if (!adminAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { teachers, config } = body;

    if (!Array.isArray(teachers) || teachers.length === 0) {
      return NextResponse.json({ error: "Teachers array is required and cannot be empty." }, { status: 400 });
    }

    const event = await CertiGenAdminService.getEventById(id);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const isTeacherBulk = event.certificateType !== 'teacher';
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";

    // Normalize + deduplicate emails (case-insensitive)
    const seen = new Set<string>();
    const results: { teacherEmail: string; magicUrl: string }[] = [];
    let invalidCount = 0;

    for (const teacher of teachers) {
      const rawEmail = teacher?.email || teacher?.Email;
      if (!rawEmail) {
        invalidCount++;
        continue;
      }
      const email = String(rawEmail).trim().toLowerCase();
      if (!EMAIL_REGEX.test(email)) {
        invalidCount++;
        continue;
      }
      if (seen.has(email)) {
        continue;
      }
      seen.add(email);

      let magicUrl = isTeacherBulk
        ? `${protocol}://${host}/certigen`
        : `${protocol}://${host}/certigen/claim?eventId=${id}`;

      if (config?.isUnique) {
        const token = crypto.randomUUID();
        const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

        const prefillData = { ...teacher };
        delete prefillData.email;
        delete prefillData.Email;

        await CertiGenAdminService.createMagicLink({
          eventId: id,
          teacherEmail: email,
          token,
          expiresAt,
          type: isTeacherBulk ? 'teacher_bulk' : 'self_serve_claim',
          isOneTimeUse: !!config?.isOneTimeUse,
          isUsed: false,
          prefillData,
        });

        magicUrl = isTeacherBulk
          ? `${protocol}://${host}/certigen?token=${token}`
          : `${protocol}://${host}/certigen/claim?token=${token}`;
      }

      results.push({ teacherEmail: email, magicUrl });
    }

    const message = [
      `Generated ${results.length} link${results.length !== 1 ? "s" : ""}.`,
      invalidCount > 0 ? `${invalidCount} row(s) skipped (missing/invalid email).` : "",
      "No emails were sent — copy each link and share it manually.",
    ].filter(Boolean).join(" ");

    return NextResponse.json({
      success: true,
      message: message.trim(),
      total: results.length,
      results,
    });
  } catch (error: any) {
    console.error("POST Bulk Magic Link Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
