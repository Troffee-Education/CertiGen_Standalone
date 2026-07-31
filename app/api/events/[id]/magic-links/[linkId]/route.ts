import { NextResponse } from "next/server";
import { CertiGenAdminService } from "@/lib/certigen/admin-service";
import { requireAdminAuth } from "@/lib/certigen/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  try {
    const adminAuth = await requireAdminAuth(request);
    if (!adminAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { linkId } = resolvedParams;

    if (!linkId) {
      return NextResponse.json({ error: "Magic link ID is required" }, { status: 400 });
    }

    await CertiGenAdminService.revokeMagicLink(linkId);

    return NextResponse.json({ success: true, message: "Magic link revoked successfully" });
  } catch (error: any) {
    console.error("PATCH Magic Link Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
