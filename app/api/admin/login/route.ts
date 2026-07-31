import { NextResponse } from "next/server";
import { mintAdminCustomToken } from "@/lib/certigen/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    try {
        const { password } = await request.json();
        const expected = process.env.ADMIN_PASSWORD;

        if (!expected) {
            return NextResponse.json({ error: "ADMIN_PASSWORD is not configured on the server" }, { status: 500 });
        }

        if (typeof password !== "string" || password.length === 0 || password !== expected) {
            return NextResponse.json({ error: "Invalid password" }, { status: 401 });
        }

        const { customToken } = await mintAdminCustomToken();

        return NextResponse.json({ success: true, customToken });
    } catch (error: any) {
        console.error("Login error:", error);
        return NextResponse.json({ error: error.message || "Login failed" }, { status: 500 });
    }
}
