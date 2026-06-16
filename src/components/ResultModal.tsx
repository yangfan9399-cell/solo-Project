"use client";

import { useState, useEffect } from "react";

interface ResultModalProps {
  isOpen: boolean;
  success: boolean;
  maxWeight: number;
  targetWeight: number;
  score: number;
  paperUsed: number;
  onClose: () => void;
  onRetry: () => void;
  onShare: () => void;
  onBackToLevels: () => void;
  serverValidated: boolean;
}

export function ResultModal({
  isOpen,
  success,
  maxWeight,
  targetWeight,
  score,
  paperUsed,
  onClose,
  onRetry,
  onShare,
  onBackToLevels,
  serverValidated,
}: ResultModalProps) {
  const [displayWeight, setDisplayWeight] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setDisplayWeight(0);
      setDisplayScore(0);

      const duration = 1500;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(1, elapsed / duration);

        const eased = 1 - Math.pow(1 - progress, 3);

        setDisplayWeight(maxWeight * eased);
        setDisplayScore(score * eased);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [isOpen, maxWeight, score]);

  if (!isOpen) return null;

  const efficiency = (maxWeight / Math.max(paperUsed, 1)).toFixed(2);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-paper-50 rounded-2xl shadow-2xl max-w-md w-full p-6 border-4 ${
          success ? "border-green-400" : "border-red-400"
        }`}
      >
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">
            {success ? "🏆" : "💥"}
          </div>
          <h2 className={`text-2xl font-bold ${success ? "text-green-700" : "text-red-700"}`}>
            {success ? "挑战成功！" : "桥梁坍塌！"}
          </h2>
          <p className="text-amber-600 text-sm mt-1">
            {success ? "你的纸桥成功承受住了目标重量" : "再接再厉，换个折法试试！"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-lg p-3 text-center border border-paper-200">
            <div className="text-3xl font-bold text-amber-700">
              {displayWeight.toFixed(1)}
            </div>
            <div className="text-xs text-amber-500">最大承重 (克)</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center border border-paper-200">
            <div className="text-3xl font-bold text-amber-700">
              {Math.round(displayScore)}
            </div>
            <div className="text-xs text-amber-500">最终得分</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center border border-paper-200">
            <div className="text-xl font-bold text-amber-700">
              {targetWeight}g
            </div>
            <div className="text-xs text-amber-500">目标重量</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center border border-paper-200">
            <div className="text-xl font-bold text-amber-700">
              {efficiency}
            </div>
            <div className="text-xs text-amber-500">效率 (g/mm)</div>
          </div>
        </div>

        {serverValidated && (
          <div className="text-center text-xs text-green-600 mb-4 bg-green-50 py-2 rounded">
            ✓ 分数已由服务器验证
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={onShare}
            className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all"
          >
            📤 分享作品
          </button>
          <div className="flex gap-2">
            <button
              onClick={onRetry}
              className="flex-1 py-2.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
            >
              🔄 再来一次
            </button>
            <button
              onClick={onBackToLevels}
              className="flex-1 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              📋 返回关卡
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors"
          >
            继续查看
          </button>
        </div>
      </div>
    </div>
  );
}
