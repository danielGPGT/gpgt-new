import React from "react";

interface StepperProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
  vertical?: boolean;
}

export function Stepper({ currentStep, totalSteps, labels, vertical = false }: StepperProps) {
  if (vertical) {
    return (
      <div className="flex flex-col items-start w-48 min-w-[10rem] pr-8">
        {Array.from({ length: totalSteps }).map((_, idx) => {
          const isActive = idx + 1 === currentStep;
          const isCompleted = idx + 1 < currentStep;
          return (
            <div key={idx} className="flex items-center mb-8 last:mb-0">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300
                  ${isActive ? "bg-white border-[var(--primary)] shadow-lg text-[var(--primary)]" :
                    isCompleted ? "bg-[var(--primary)] border-[var(--primary)] text-white" :
                    "bg-gray-100 border-gray-200 text-gray-400"}
                `}
              >
                <span className="text-lg font-bold font-sans">{idx + 1}</span>
              </div>
              {labels && labels[idx] && (
                <span className={`ml-4 text-base font-medium ${isActive ? "text-[var(--primary)]" : "text-gray-400"}`}>{labels[idx]}</span>
              )}
            </div>
          );
        })}
      </div>
    );
  }
  // Horizontal (default)
  return (
    <div className="w-full flex flex-col items-center mb-6">
      <div className="flex items-center w-full justify-between">
        {Array.from({ length: totalSteps }).map((_, idx) => {
          const isActive = idx + 1 === currentStep;
          const isCompleted = idx + 1 < currentStep;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center">
              <div
                className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300
                  ${isActive ? "bg-white border-[var(--primary)] shadow-lg text-[var(--primary)]" :
                    isCompleted ? "bg-[var(--primary)] border-[var(--primary)] text-white" :
                    "bg-gray-100 border-gray-200 text-gray-400"}
                `}
              >
                <span className="text-xl font-bold font-sans">{idx + 1}</span>
              </div>
              {labels && labels[idx] && (
                <span className={`mt-2 text-xs font-medium ${isActive ? "text-[var(--primary)]" : "text-gray-400"}`}>{labels[idx]}</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="relative w-full h-2 mt-4 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-[var(--primary)] rounded-full transition-all duration-300"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
} 