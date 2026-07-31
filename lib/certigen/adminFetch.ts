"use client";

import { auth } from "@/lib/firebase/config";

/**
 * Get a fresh Firebase ID token for the signed-in admin user, or null if
 * no one is signed in / the session could not produce a token.
 */
export async function getAdminIdToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;
    try {
        return await user.getIdToken();
    } catch {
        return null;
    }
}

/**
 * fetch() wrapper for admin-only API routes. Attaches the signed-in user's
 * Firebase ID token as `Authorization: Bearer <token>` so the server can
 * verify the caller is the admin.
 */
export async function adminFetch(input: string, init: RequestInit = {}): Promise<Response> {
    const token = await getAdminIdToken();
    const headers = new Headers(init.headers);
    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }
    return fetch(input, { ...init, headers });
}
