import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Proxy route: fetches an image from an external URL (e.g. Firebase Storage)
 * on the server-side and returns it to the browser without CORS restrictions.
 *
 * Usage: /api/image-proxy?url=<encoded-image-url>
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
        return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    // Only allow Firebase Storage URLs for security
    const allowedHosts = [
        "firebasestorage.googleapis.com",
        "storage.googleapis.com",
    ];
    let parsedUrl: URL;
    try {
        parsedUrl = new URL(url);
    } catch {
        return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const isAllowed = allowedHosts.some(h => parsedUrl.hostname.endsWith(h));
    if (!isAllowed) {
        return NextResponse.json({ error: "URL not allowed" }, { status: 403 });
    }

    try {
        const upstream = await fetch(url, {
            headers: { "User-Agent": "CertiGen-Proxy/1.0" },
        });

        if (!upstream.ok) {
            return NextResponse.json(
                { error: `Upstream returned ${upstream.status}` },
                { status: upstream.status }
            );
        }

        const contentType = upstream.headers.get("content-type") || "application/octet-stream";
        const buffer = await upstream.arrayBuffer();

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=86400, immutable",
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Failed to fetch image" }, { status: 500 });
    }
}
