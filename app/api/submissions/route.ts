import { NextResponse } from "next/server";
import { CertiGenAdminService } from "@/lib/certigen/admin-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      eventId,
      magicLinkId,
      teacherName,
      teacherEmail,
      teacherPhone,
      teacherState,
      schoolName,
      subject,
      category,
      customFields,
      studentData,
      certificateCount,
      status,
      hasDownloaded,
    } = body;

    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    const event = await CertiGenAdminService.getEventById(eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const submission = await CertiGenAdminService.createSubmission({
      eventId,
      magicLinkId: magicLinkId || undefined,
      teacherName: teacherName || "Anonymous Participant",
      teacherEmail: teacherEmail || "public-claim@certigen.local",
      teacherPhone,
      teacherState,
      schoolName,
      subject,
      category,
      customFields,
      studentData: Array.isArray(studentData) ? studentData : [],
      certificateCount: certificateCount || (Array.isArray(studentData) ? studentData.length : 1),
      status: status || "COMPLETED",
      hasDownloaded: hasDownloaded ?? true,
    });

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
    });
  } catch (error: any) {
    console.error("POST Submission API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create submission" }, { status: 500 });
  }
}
