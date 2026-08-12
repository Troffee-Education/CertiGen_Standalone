import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import type { App } from 'firebase-admin/app';

function getServiceAccount(): any {
    let serviceAccountEnv = process.env.APP_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountEnv) return undefined;

    serviceAccountEnv = serviceAccountEnv.trim();
    if (
        (serviceAccountEnv.startsWith('"') && serviceAccountEnv.endsWith('"')) ||
        (serviceAccountEnv.startsWith("'") && serviceAccountEnv.endsWith("'"))
    ) {
        serviceAccountEnv = serviceAccountEnv.slice(1, -1);
    }

    try {
        return JSON.parse(serviceAccountEnv);
    } catch (e: any) {
        console.error('[AdminSDK] Failed to parse APP_SERVICE_ACCOUNT_KEY JSON:', e);
        throw new Error(`Invalid APP_SERVICE_ACCOUNT_KEY format: ${e.message}`);
    }
}

let adminAppPromise: Promise<App> | undefined;

export async function getAdminApp(): Promise<App> {
    if (adminAppPromise) return adminAppPromise;

    adminAppPromise = (async () => {
        try {
            console.log('[AdminSDK] Initializing Admin App...');
            const serviceAccount = getServiceAccount();

            if (!getApps().length) {
                const options: any = {};

                if (serviceAccount) {
                    console.log('[AdminSDK] Using explicit service account credential.');
                    options.credential = cert(serviceAccount);
                    options.projectId = serviceAccount.project_id;
                    if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && serviceAccount.project_id !== process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
                        console.warn(`[AdminSDK] Service account project_id (${serviceAccount.project_id}) does not match NEXT_PUBLIC_FIREBASE_PROJECT_ID (${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}). Overriding options.projectId to match service account.`);
                    }
                } else {
                    console.log('[AdminSDK] Using Application Default Credentials (ADC).');
                    if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
                        options.projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
                    }
                }

                const adminApp = initializeApp(options);
                console.log('[AdminSDK] App initialized successfully.');
                return adminApp;
            } else {
                console.log('[AdminSDK] Using existing app.');
                return getApp();
            }
        } catch (error) {
            console.error('[AdminSDK] App Initialization Error:', error);
            adminAppPromise = undefined;
            throw error;
        }
    })();

    return adminAppPromise;
}

export async function getAdminDb(): Promise<Firestore> {
    const adminApp = await getAdminApp();
    return getFirestore(adminApp) as Firestore;
}

// ─── Storage via Google Cloud Storage JSON REST API ───────────────────────────
// We avoid firebase-admin/storage entirely because the SDK has persistent
// module-registry issues under Turbopack (app/no-app errors, hashed module
// paths). The REST API is stable, has no bundling dependencies, and uses the
// same service account JWT auth already used for Firestore REST calls.

let storageAccessTokenCache: { token: string; expiresAt: number } | null = null;

async function getStorageAccessToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);

    // Reuse cached token if still valid (with 60s buffer)
    if (storageAccessTokenCache && storageAccessTokenCache.expiresAt > now + 60) {
        return storageAccessTokenCache.token;
    }

    const parsed = getServiceAccount();

    if (!parsed) {
        // Cloud Run: use GCP metadata server token
        const res = await fetch(
            'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
            { headers: { 'Metadata-Flavor': 'Google' } }
        );
        if (!res.ok) throw new Error(`GCP metadata server error: ${res.status}`);
        const { access_token, expires_in } = await res.json();
        storageAccessTokenCache = { token: access_token, expiresAt: now + (expires_in ?? 3600) };
        return access_token;
    }

    const clientEmail: string = parsed.client_email;
    const privateKey: string = parsed.private_key;

    const crypto = await import('crypto');
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
        iss: clientEmail,
        sub: clientEmail,
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
        scope: 'https://www.googleapis.com/auth/devstorage.read_write',
    })).toString('base64url');

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(`${header}.${payload}`);
    const jwt = `${header}.${payload}.${sign.sign(privateKey, 'base64url')}`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt,
        }),
    });

    if (!tokenRes.ok) {
        const err = await tokenRes.text();
        throw new Error(`Failed to get storage access token: ${err}`);
    }

    const { access_token, expires_in } = await tokenRes.json();
    storageAccessTokenCache = { token: access_token, expiresAt: now + (expires_in ?? 3600) };
    return access_token;
}

/**
 * Upload a buffer to Firebase Storage via the GCS JSON API and return a
 * long-lived signed URL.
 *
 * Drop-in replacement for the firebase-admin bucket.file().save() +
 * file.getSignedUrl() pattern, with zero SDK dependencies.
 */
export async function uploadToStorage(
    buffer: Buffer,
    filename: string,
    contentType: string
): Promise<string> {
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucketName) throw new Error('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET not configured');

    const accessToken = await getStorageAccessToken();

    // Upload via GCS JSON API (multipart upload)
    const encodedFilename = encodeURIComponent(filename);
    const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${bucketName}/o?uploadType=media&name=${encodedFilename}`;

    const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': contentType,
            'Content-Length': String(buffer.length),
        },
        body: new Uint8Array(buffer),
    });

    if (!uploadRes.ok) {
        const err = await uploadRes.text();
        throw new Error(`GCS upload failed (${uploadRes.status}): ${err}`);
    }

    const uploadedObject = await uploadRes.json();
    console.log('[Storage] Uploaded:', uploadedObject.name);

    // Make the object publicly readable so we can use a simple public URL
    // (avoids signed URL complexity and expiry issues)
    const makePublicUrl = `https://storage.googleapis.com/storage/v1/b/${bucketName}/o/${encodedFilename}`;
    const patchRes = await fetch(makePublicUrl, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            acl: [{ entity: 'allUsers', role: 'READER' }],
            cacheControl: 'public, max-age=31536000, immutable',
            contentDisposition: 'inline',
        }),
    });

    if (!patchRes.ok) {
        // Non-fatal: fall back to a signed URL approach if ACL patch fails
        console.warn('[Storage] Could not make object public, falling back to signed URL');
        return await getSignedUrl(bucketName, filename, accessToken);
    }

    // Return the permanent public URL
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${encodedFilename}`;
    console.log('[Storage] Public URL:', publicUrl);
    return publicUrl;
}

async function getSignedUrl(bucketName: string, filename: string, accessToken: string): Promise<string> {
    const parsed = getServiceAccount();
    if (!parsed) throw new Error('APP_SERVICE_ACCOUNT_KEY not set');
    const clientEmail: string = parsed.client_email;
    const privateKey: string = parsed.private_key;

    const now = Math.floor(Date.now() / 1000);
    const expiry = now + 60 * 60 * 24 * 365 * 10; // ~10 years

    const resource = `/${bucketName}/${filename}`;
    const stringToSign = ['GET', '', '', String(expiry), resource].join('\n');

    const crypto = await import('crypto');
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(stringToSign);
    const signature = sign.sign(privateKey, 'base64');

    const params = new URLSearchParams({
        GoogleAccessId: clientEmail,
        Expires: String(expiry),
        Signature: signature,
    });

    return `https://storage.googleapis.com${resource}?${params.toString()}`;
}

// Keep getAdminStorageBucket as a thin compatibility shim so existing callers
// don't need to change — but it now returns a minimal bucket-like object backed
// by the REST implementation above.
export async function getAdminStorageBucket() {
    return {
        file: (filename: string) => ({
            save: async (buffer: Buffer, opts: { resumable?: boolean; metadata?: { contentType?: string } }) => {
                const contentType = opts?.metadata?.contentType ?? 'application/octet-stream';
                await uploadToStorage(buffer, filename, contentType);
            },
            getSignedUrl: async (_opts: any): Promise<[string]> => {
                const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!;
                const accessToken = await getStorageAccessToken();
                const url = await getSignedUrl(bucketName, filename, accessToken);
                return [url];
            },
        }),
    };
}
