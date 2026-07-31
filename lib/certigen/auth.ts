import { getAdminDb } from "@/lib/firebase/admin";

export const ADMIN_UID = "certigen-standalone-admin";

function safeRequire(modulePath: string): any {
    // eslint-disable-next-line no-eval
    return eval('require')(modulePath);
}

/**
 * Mint a Firebase custom token for the fixed standalone admin uid so the
 * browser client can sign in and pass the shared Firestore `isAdmin()` rules.
 * The users doc is written server-side so rules see the admin flag.
 */
export async function mintAdminCustomToken(): Promise<{ customToken: string }> {
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

    const { getAuth } = safeRequire("firebase-admin/auth");
    const customToken = await getAuth().createCustomToken(ADMIN_UID);

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
        const { getAuth } = safeRequire("firebase-admin/auth");
        const decoded = await getAuth().verifyIdToken(token);
        if (decoded.uid !== ADMIN_UID) {
            return null;
        }
        return { uid: decoded.uid };
    } catch (error) {
        console.error("Admin auth verification failed:", error);
        return null;
    }
}
