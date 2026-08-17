"use client";

import React from "react";
import { Upload, ArrowRight, Sparkles, Check } from "lucide-react";

type Step = {
  label: string;
  description: string;
  icon: React.ReactNode;
};

const DEFAULT_STEPS: Step[] = [
  { label: "Upload List", description: "Select Excel or CSV file", icon: <Upload className="w-4 h-4" /> },
  { label: "Map Columns", description: "Match fields to template", icon: <ArrowRight className="w-4 h-4" /> },
  { label: "Generate & Download", description: "Batch PDF generation", icon: <Sparkles className="w-4 h-4" /> },
];

type Props = {
  step: number; // 1-indexed
  steps?: Step[];
};

export default function WizardStepBar({ step, steps = DEFAULT_STEPS }: Props) {
  return (
    <div className="w-full bg-slate-900/60 dark:bg-slate-950/60 backdrop-blur-md border-b border-slate-800 px-6 sm:px-8 py-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {steps.map((s, i) => {
          const stepNum = i + 1;
          const isCompleted = step > stepNum;
          const isActive = step === stepNum;

          return (
            <React.Fragment key={i}>
              <div className="flex items-center gap-3.5 group">
                <div
                  className={`
                    w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold
                    transition-all duration-300 ease-out shadow-sm
                    ${
                      isCompleted
                        ? "bg-emerald-500 text-white shadow-emerald-500/20"
                        : isActive
                        ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/30"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    }
                  `}
                >
                  {isCompleted ? <Check className="w-5 h-5 stroke-[2.5]" /> : s.icon}
                </div>
                <div className="hidden sm:block text-left">
                  <div
                    className={`text-xs font-bold uppercase tracking-wider ${
                      isCompleted
                        ? "text-emerald-400"
                        : isActive
                        ? "text-white"
                        : "text-slate-400"
                    }`}
                  >
                    Step {stepNum}: {s.label}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    {s.description}
                  </div>
                </div>
              </div>

              {i < steps.length - 1 && (
                <div className="flex-1 mx-4 sm:mx-6 h-0.5 rounded-full overflow-hidden bg-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-out"
                    style={{ width: isCompleted ? "100%" : isActive ? "50%" : "0%" }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
