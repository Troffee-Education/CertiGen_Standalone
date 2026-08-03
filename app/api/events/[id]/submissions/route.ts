import { NextResponse } from "next/server";
import { CertiGenAdminService } from "@/lib/certigen/admin-service";
import { requireAdminAuth } from "@/lib/certigen/auth";

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

    const submissions = await CertiGenAdminService.getSubmissionsByEvent(id);

    // Format timestamps for JSON serialization
    const formattedSubmissions = submissions.map((s) => ({
      ...s,
      createdAt: s.createdAt?.toDate?.()?.toISOString() || s.createdAt || new Date().toISOString(),
      updatedAt: s.updatedAt?.toDate?.()?.toISOString() || s.updatedAt || new Date().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      submissions: formattedSubmissions,
    });
  } catch (error: any) {
    console.error("GET Submissions Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch submissions" }, { status: 500 });
  }
}
