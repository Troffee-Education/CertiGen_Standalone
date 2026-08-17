import React from 'react';
import { Award } from 'lucide-react';

export default function CertiGenPublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex flex-col justify-between w-full m-0 p-0">
      {/* Edge-to-Edge Standalone Header */}
      <header className="w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-50">
        <div className="w-full px-6 sm:px-10 lg:px-16 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 text-base font-extrabold text-white tracking-tight">
              <Award className="w-5 h-5 text-blue-500" />
              CertiGen
            </span>
            <div className="h-5 w-px bg-slate-700" />
            <span className="text-xs sm:text-sm font-semibold text-slate-300 tracking-wider uppercase">
              Certificate Portal
            </span>
          </div>
          <div className="text-xs text-slate-400 font-medium">
            Secure Submission & Claim
          </div>
        </div>
      </header>

      {/* Edge-to-Edge Main Content Area */}
      <main className="w-full flex-1 flex flex-col m-0 p-0">{children}</main>

      {/* Edge-to-Edge Minimal Footer */}
      <footer className="w-full py-6 border-t border-slate-800/80 text-center text-xs text-slate-500 bg-slate-950/80">
        Powered by Troffee CertiGen &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
