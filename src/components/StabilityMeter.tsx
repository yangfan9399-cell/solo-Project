'use client';

interface StabilityMeterProps {
  value: number;
}

export default function StabilityMeter({ value }: StabilityMeterProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const colorClass =
    clamped < 40
      ? 'text-cinnabar-600'
      : clamped < 70
        ? 'text-ancient-500'
        : 'text-jade-600';

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold text-ancient-700 whitespace-nowrap">稳定度</span>
      <div className="relative w-24 h-3 rounded-full overflow-hidden bg-ancient-200 border border-ancient-300">
        <div
          className="stability-bar h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className={`text-sm font-bold tabular-nums ${colorClass}`}>
        {Math.round(clamped)}%
      </span>
    </div>
  );
}
