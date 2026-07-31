"use client";

import React from "react";
import { Upload, ArrowRight, Sparkles, Check } from "lucide-react";

type Step = {
  label: string;
  icon: React.ReactNode;
};

const DEFAULT_STEPS: Step[] = [
  { label: "Upload", icon: <Upload className="w-4 h-4" /> },
  { label: "Map Columns", icon: <ArrowRight className="w-4 h-4" /> },
  { label: "Generate", icon: <Sparkles className="w-4 h-4" /> },
];

type Props = {
  step: number; // 1-indexed
  steps?: Step[];
};

export default function WizardStepBar({ step, steps = DEFAULT_STEPS }: Props) {
  return (
    <div className="bg-gray-50 border-b border-gray-200 px-8 py-5">
      <div className="flex items-center justify-center max-w-2xl mx-auto">
        {steps.map((s, i) => {
          const stepNum = i + 1;
          const isCompleted = step > stepNum;
          const isActive = step === stepNum;
          const isUpcoming = step < stepNum;

          return (
            <React.Fragment key={i}>
              {/* Step circle + label */}
              <div className="flex items-center gap-3">
                <div
                  className={`
                    w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold
                    transition-all duration-300 ease-out
                    ${isCompleted
                      ? "bg-green-500 text-white shadow-sm shadow-green-200"
                      : isActive
                        ? "bg-primary-600 text-white shadow-md shadow-primary-200 ring-4 ring-primary-100"
                        : "bg-gray-200 text-gray-500"
                    }
                  `}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : s.icon}
                </div>
                <span
                  className={`
                    text-sm font-medium transition-colors duration-200 whitespace-nowrap
                    ${isCompleted ? "text-green-600" : isActive ? "text-primary-700" : "text-gray-400"}
                  `}
                >
                  {s.label}
                </span>
              </div>

              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="flex-1 mx-4 h-0.5 rounded-full overflow-hidden bg-gray-200 min-w-[40px]">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: isCompleted ? "100%" : "0%" }}
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
