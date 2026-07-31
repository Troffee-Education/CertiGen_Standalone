"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";

export type StandaloneProfile = {
    uid: string;
    displayName: string;
    email: string;
};

/**
 * Client-side admin session hook for the standalone tool.
 * Relies on Firebase Auth: after password login the client signs in with a
 * custom token minted for the fixed admin uid, which lets the browser
 * Firestore calls pass the shared `isAdmin()` rules.
 */
export function useStandaloneAuth() {
    const [profile, setProfile] = useState<StandaloneProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            if (user) {
                setProfile({
                    uid: user.uid,
                    displayName: "Admin",
                    email: user.email || "admin@localhost",
                });
            } else {
                setProfile(null);
            }
            setLoading(false);
        });
        return () => unsub();
    }, []);

    return { profile, loading };
}
