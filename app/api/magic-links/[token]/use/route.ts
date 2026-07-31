import { NextResponse } from "next/server";
import { CertiGenAdminService } from "@/lib/certigen/admin-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const resolvedParams = await params;
    const { token } = resolvedParams;

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const magicLink = await CertiGenAdminService.getMagicLinkByToken(token);
    if (!magicLink) {
      return NextResponse.json({ error: "Magic link not found" }, { status: 404 });
    }

    if (magicLink.isOneTimeUse) {
      await CertiGenAdminService.updateMagicLink(magicLink.id, { isUsed: true });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("POST Use Magic Link Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
