import { NextResponse } from "next/server";
import { CertiGenAdminService } from "@/lib/certigen/admin-service";
import { requireAdminAuth } from "@/lib/certigen/auth";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(
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
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);

    const [links, submissions] = await Promise.all([
      CertiGenAdminService.getMagicLinksByEvent(id),
      CertiGenAdminService.getSubmissionsByEvent(id)
    ]);

    // Sort links by creation date (newest first)
    const sortedLinks = links.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });

    const total = sortedLinks.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginatedLinks = sortedLinks.slice(start, start + limit);

    // Enrich with submission data and calculate status
    const enrichedLinks = paginatedLinks.map((link) => {
      const submission = submissions.find(s => s.magicLinkId === link.id);

      let status = "pending";
      if (link.isRevoked) {
        status = "revoked";
      } else if (Date.now() > link.expiresAt) {
        status = "expired";
      } else if (submission) {
        status = "submitted";
      }

      return {
        ...link,
        createdAt: link.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        expiresAt: new Date(link.expiresAt).toISOString(),
        status,
        submission: submission ? {
          id: submission.id,
          teacherName: submission.teacherName,
          certificateCount: submission.certificateCount,
          hasDownloaded: submission.hasDownloaded,
          createdAt: submission.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        } : null
      };
    });

    return NextResponse.json({
      magicLinks: enrichedLinks,
      total,
      totalPages,
      page
    });
  } catch (error: any) {
    console.error("GET Magic Links Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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
    const { teacherEmail } = body;

    if (!teacherEmail) {
      return NextResponse.json({ error: "Teacher email is required" }, { status: 400 });
    }

    const event = await CertiGenAdminService.getEventById(id);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const inviteType = event.certificateType === 'teacher' ? 'self_serve_claim' : 'teacher_bulk';

    // Generate unique token
    const token = crypto.randomUUID();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    // Create the magic link
    const newLink = await CertiGenAdminService.createMagicLink({
      eventId: id,
      teacherEmail,
      token,
      expiresAt,
      type: inviteType,
    });

    // Construct the URL
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const magicUrl = inviteType === 'teacher_bulk'
      ? `${protocol}://${host}/certigen?token=${token}`
      : `${protocol}://${host}/certigen/claim?token=${token}`;

    return NextResponse.json({
      success: true,
      message: "Magic link created successfully. No email was sent — copy the link and share it manually.",
      magicUrl,
    });

  } catch (error: any) {
    console.error("POST Magic Link Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
