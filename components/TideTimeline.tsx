"use client";

import { TOTAL_STEPS, getTidePhaseAtStep, getStepLabel } from "@/lib/gameData";
import type { TidePhase } from "@/lib/types";

interface TideTimelineProps {
  currentStep: number;
  totalSteps?: number;
  route?: string[];
}

const phaseColors: Record<TidePhase, string> = {
  falling: "from-indigo-500 to-blue-500",
  low: "from-cyan-500 to-teal-500",
  rising: "from-emerald-500 to-green-500",
  high: "from-violet-500 to-purple-500",
};

const phaseLabels: Record<TidePhase, string> = {
  falling: "退潮",
  low: "低潮",
  rising: "涨潮",
  high: "高潮",
};

export default function TideTimeline({
  currentStep,
  totalSteps = TOTAL_STEPS,
  route = [],
}: TideTimelineProps) {
  const steps = Array.from({ length: totalSteps + 1 }, (_, i) => i);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-slate-700">🌊 潮汐时间轴</h3>
        <span className="text-sm font-bold text-sky-700">
          第 {Math.min(currentStep, totalSteps)} / {totalSteps} 步
        </span>
      </div>

      <div className="relative">
        <div className="h-3 rounded-full tide-gradient mb-3" />

        <div className="flex justify-between relative">
          {steps.map((step) => {
            const phase = getTidePhaseAtStep(step, totalSteps);
            const isPast = step < currentStep;
            const isCurrent = step === currentStep;
            const routeStep = route[step];

            return (
              <div key={step} className="flex flex-col items-center relative" style={{ width: `${100 / (totalSteps + 1)}%` }}>
                <div
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                    isCurrent
                      ? "bg-white border-yellow-400 scale-150 shadow-lg ring-4 ring-yellow-200"
                      : isPast
                      ? "bg-sky-600 border-sky-700"
                      : "bg-white border-slate-300"
                  }`}
                />
                <div className="mt-1 text-[10px] text-slate-500 font-medium">
                  {getStepLabel(step, totalSteps)}
                </div>
                {routeStep && (
                  <div className="mt-0.5 text-[9px] text-emerald-600 font-bold">
                    ✓
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between mt-3 text-xs">
        {(["falling", "low", "rising", "high"] as TidePhase[]).map((phase) => (
          <div key={phase} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${phaseColors[phase]}`} />
            <span className="text-slate-600">{phaseLabels[phase]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
