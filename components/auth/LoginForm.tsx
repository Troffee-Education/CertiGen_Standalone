"use client";

import React, { useState } from "react";
import { signInWithEmailAndPassword, signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Label } from "@/components/base/input/label";
import { LogIn, Loader2 } from "lucide-react";

export default function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");
        try {
            // 1. Try Firebase Email & Password authentication directly if email is provided
            if (email.trim()) {
                try {
                    await signInWithEmailAndPassword(auth, email.trim(), password);
                    router.replace("/admin");
                    return;
                } catch (emailErr: any) {
                    console.warn("Direct email/password auth failed, attempting fallback...", emailErr);
                }
            }

            // 2. Server custom-token fallback (for master admin password)
            const res = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });
            let data: any = {};
            try {
                data = await res.json();
            } catch {
                throw new Error(`Server returned status ${res.status}`);
            }
            if (!res.ok) {
                setError(data.error || "Login failed");
                return;
            }
            await signInWithCustomToken(auth, data.customToken);
            router.replace("/admin");
        } catch (err: any) {
            setError(err.message || "Login failed");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">CertiGen Admin</h1>
                    <p className="text-sm text-gray-500 mt-1">Sign in with your Email & Password or Admin Password.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Email (Optional for master password)</Label>
                        <Input
                            type="email"
                            placeholder="admin@troffee.com"
                            value={email}
                            onChange={(v) => setEmail(v)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Password</Label>
                        <Input
                            type="password"
                            placeholder="Admin password"
                            value={password}
                            onChange={(v) => setPassword(v)}
                        />
                    </div>
                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            {error}
                        </p>
                    )}
                    <Button color="primary" type="submit" isLoading={submitting} isDisabled={!password.trim()}>
                        {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogIn className="w-4 h-4 mr-2" />}
                        Sign In
                    </Button>
                </form>
            </div>
        </div>
    );
}
