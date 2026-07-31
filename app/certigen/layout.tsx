import React from 'react';
import { Award } from 'lucide-react';

export default function CertiGenPublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] flex flex-col justify-between">
      {/* Standalone Minimal Header - No navigation links */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
              <Award className="w-5 h-5 text-primary-600" />
              CertiGen
            </span>
            <div className="h-5 w-px bg-gray-300 dark:bg-slate-700" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 tracking-wide uppercase">
              Certificate Portal
            </span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Secure Submission & Claim
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">{children}</main>

      {/* Minimal Footer */}
      <footer className="py-6 border-t border-gray-200 dark:border-slate-800 text-center text-xs text-gray-400">
        Powered by Troffee CertiGen &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
