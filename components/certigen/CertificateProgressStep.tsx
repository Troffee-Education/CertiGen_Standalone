import React from "react";
import { CheckCircle, Loader2, RefreshCw, XCircle } from "lucide-react";
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
    <div className="max-w-xl mx-auto py-12 text-center space-y-6">
      {isSuccess ? (
        <div className="space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="mx-auto w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center border-4 border-green-100 shadow-sm">
            <CheckCircle className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Certificates Generated!</h2>
            <p className="text-gray-500 text-base mt-2">
              Your certificates have been generated and automatically downloaded as a ZIP archive.
            </p>
          </div>
          <div className="flex justify-center gap-4 pt-4">
            <Button
              color="primary"
              onClick={onRestart}
              className="flex items-center gap-2 px-8 py-3 shadow-md"
            >
              <RefreshCw className="w-5 h-5" />
              Generate More Certificates
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="mx-auto w-20 h-20 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center border-4 border-primary-100 shadow-sm">
            {jobStatus === "FAILED" ? (
              <XCircle className="w-10 h-10 text-red-500" />
            ) : (
              <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {jobStatus === "FAILED" ? "Generation Failed" : "Generating Certificates..."}
            </h2>
            <p className="text-gray-500 text-sm mt-1">{eta || "Processing certificates, please wait..."}</p>
          </div>

          {jobStatus !== "FAILED" && (
            <div className="space-y-2 max-w-md mx-auto pt-2">
              {/* Progress Line */}
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden border border-gray-200 shadow-inner">
                <div
                  className="bg-primary-600 h-full rounded-full transition-all duration-300 ease-out flex items-center justify-end pr-1"
                  style={{ width: `${Math.max(5, progress)}%` }}
                >
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 font-medium px-1">
                <span>Status: Processing</span>
                <span className="text-primary-600 font-bold">{progress}% Complete</span>
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
