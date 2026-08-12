import { getAdminDb, getAdminApp } from "@/lib/firebase/admin";
import { getAuth } from "firebase-admin/auth";

export const ADMIN_UID = "certigen-standalone-admin";

/**
 * Mint a Firebase custom token for the fixed standalone admin uid so the
 * browser client can sign in and pass the shared Firestore `isAdmin()` rules.
 * The users doc is written server-side so rules see the admin flag.
 */
export async function mintAdminCustomToken(): Promise<{ customToken: string }> {
    try {
        const db = await getAdminDb();
        await db.collection("users").doc(ADMIN_UID).set(
            {
                displayName: "CertiGen Admin",
                email: "certigen-admin@localhost",
                isSuperAdmin: true,
                isSubAdmin: false,
                isOrganisation: false,
            },
            { merge: true }
        );
    } catch (error) {
        console.warn("[mintAdminCustomToken] Non-critical warning: Unable to sync user doc to Firestore:", error);
    }

    const adminApp = await getAdminApp();
    const customToken = await getAuth(adminApp).createCustomToken(ADMIN_UID);

    return { customToken };
}

/**
 * Verify that the incoming request carries a valid Firebase ID token minted
 * for the standalone admin uid. Returns the verified uid, or null when the
 * token is missing, invalid, expired, or belongs to a different user.
 */
export async function requireAdminAuth(request: Request): Promise<{ uid: string } | null> {
    const header = request.headers.get("authorization") || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
        return null;
    }

    try {
        const adminApp = await getAdminApp();
        const decoded = await getAuth(adminApp).verifyIdToken(token);
        if (decoded.uid !== ADMIN_UID) {
            return null;
        }
        return { uid: decoded.uid };
    } catch (error) {
        console.error("Admin auth verification failed:", error);
        return null;
    }
}
