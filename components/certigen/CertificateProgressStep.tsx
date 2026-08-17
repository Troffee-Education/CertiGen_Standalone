"use client";

import React from "react";
import { CheckCircle2, Loader2, RefreshCw, XCircle, Sparkles, DownloadCloud } from "lucide-react";
import { Button } from "@/components/base/buttons/button";

type Props = {
  isSuccess: boolean;
  jobStatus: string;
  progress?: number;
  zipUrl?: string | null;
  eta: string;
  onRestart: () => void;
};

export default function CertificateProgressStep({
  isSuccess,
  jobStatus,
  progress = 0,
  eta,
  onRestart,
}: Props) {
  return (
    <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
      {isSuccess ? (
        <div className="space-y-6 animate-in fade-in zoom-in duration-500 bg-slate-900/60 p-8 rounded-3xl border border-emerald-500/30 shadow-2xl">
          <div className="mx-auto w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/40 shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-white">
              Certificates Generated Successfully!
            </h2>
            <p className="text-slate-300 text-sm max-w-md mx-auto leading-relaxed">
              Your certificates have been compiled and automatically saved to your downloads as a ZIP archive.
            </p>
          </div>
          <div className="flex justify-center gap-4 pt-4">
            <Button
              color="primary"
              onClick={onRestart}
              className="flex items-center gap-2 px-8 py-3.5 shadow-lg shadow-blue-500/30 text-sm font-bold"
            >
              <RefreshCw className="w-4 h-4" />
              Generate More Certificates
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 bg-slate-900/60 p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <div className="mx-auto w-20 h-20 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center border border-blue-500/30 shadow-lg shadow-blue-500/20">
            {jobStatus === "FAILED" ? (
              <XCircle className="w-10 h-10 text-red-400" />
            ) : (
              <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
            )}
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-white">
              {jobStatus === "FAILED"
                ? "Generation Encountered an Error"
                : "Generating High-Resolution Certificates..."}
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              {eta || "Processing student records, please wait..."}
            </p>
          </div>

          {jobStatus !== "FAILED" && (
            <div className="space-y-2 max-w-md mx-auto pt-4">
              {/* Progress Line */}
              <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800 shadow-inner">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300 ease-out flex items-center justify-end pr-1"
                  style={{ width: `${Math.max(5, progress)}%` }}
                >
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
                <span>Status: Processing</span>
                <span className="text-blue-400 font-bold">{progress}% Complete</span>
              </div>
            </div>
          )}

          {jobStatus === "FAILED" && (
            <div className="pt-4">
              <Button onClick={onRestart} color="secondary">
                Try Again
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
