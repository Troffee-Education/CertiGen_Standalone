"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { useStandaloneAuth } from "@/lib/certigen/useStandaloneAuth";
import LoginForm from "@/components/auth/LoginForm";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { profile, loading } = useStandaloneAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    if (!profile) {
        return <LoginForm />;
    }

    return <>{children}</>;
}
