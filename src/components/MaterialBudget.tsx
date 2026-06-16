"use client";

interface MaterialBudgetProps {
  used: number;
  total: number;
  segmentCount: number;
}

export function MaterialBudget({ used, total, segmentCount }: MaterialBudgetProps) {
  const percentage = Math.min(100, (used / total) * 100);
  const isOverBudget = used > total;
  const isNearLimit = percentage > 80;

  return (
    <div className="bg-white/80 backdrop-blur rounded-lg border border-amber-200 p-3 shadow-sm">
      <h3 className="text-sm font-semibold text-amber-900 mb-3">📏 材料预算</h3>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-amber-700">纸张长度</span>
          <span className={`font-medium ${isOverBudget ? "text-red-600" : "text-amber-900"}`}>
            {used.toFixed(1)} / {total} mm
          </span>
        </div>

        <div className="h-3 bg-paper-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              isOverBudget
                ? "bg-red-500"
                : isNearLimit
                ? "bg-amber-500"
                : "bg-green-500"
            }`}
            style={{ width: `${Math.min(100, percentage)}%` }}
          />
        </div>

        {isOverBudget && (
          <p className="text-xs text-red-600">⚠️ 超出材料预算！</p>
        )}

        <div className="flex justify-between text-sm pt-2 border-t border-paper-200">
          <span className="text-amber-700">构件数量</span>
          <span className="font-medium text-amber-900">{segmentCount} 段</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-amber-700">剩余</span>
          <span className={`font-medium ${isOverBudget ? "text-red-600" : "text-green-600"}`}>
            {(total - used).toFixed(1)} mm
          </span>
        </div>
      </div>
    </div>
  );
}
