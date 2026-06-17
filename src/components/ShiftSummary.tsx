import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { LEVEL_CONFIGS } from '@/data/mockData';

interface ScoreCalculation {
  totalScore: number;
  bonusScore: number;
  penaltyScore: number;
  efficiencyBonus: number;
  cleanShiftBonus: number;
  finalScore: number;
  grade: string;
  handledCalls: number;
  interruptCount: number;
}

export function ShiftSummary() {
  const { player, actions, currentLevel, startShift, selectLevel } = useGameStore();
  const [scoreResult, setScoreResult] = useState<ScoreCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const lastShift = player.history[player.history.length - 1];
  const isVisible = !!lastShift && lastShift.status !== 'in-progress';

  useEffect(() => {
    if (isVisible && !scoreResult && actions.length > 0) {
      calculateScore();
    }
  }, [isVisible]);

  const calculateScore = async () => {
    setIsCalculating(true);
    try {
      const response = await fetch('/api/calculate-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          actions: lastShift?.actions || actions, 
          levelConfig: currentLevel 
        }),
      });
      const result = await response.json();
      setScoreResult(result);
    } catch {
      setScoreResult({
        totalScore: lastShift?.totalScore || 0,
        bonusScore: 0,
        penaltyScore: 0,
        efficiencyBonus: 0,
        cleanShiftBonus: 0,
        finalScore: lastShift?.totalScore || 0,
        grade: 'C',
        handledCalls: 0,
        interruptCount: 0,
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const getGradeColor = (grade: string) => {
    const colors: Record<string, string> = {
      S: 'text-yellow-500',
      A: 'text-green-500',
      B: 'text-blue-500',
      C: 'text-orange-500',
      D: 'text-red-500',
    };
    return colors[grade] || 'text-gray-500';
  };

  const getGradeBg = (grade: string) => {
    const colors: Record<string, string> = {
      S: 'bg-yellow-100 border-yellow-500',
      A: 'bg-green-100 border-green-500',
      B: 'bg-blue-100 border-blue-500',
      C: 'bg-orange-100 border-orange-500',
      D: 'bg-red-100 border-red-500',
    };
    return colors[grade] || 'bg-gray-100 border-gray-500';
  };

  if (!isVisible) return null;

  const levelConfig = LEVEL_CONFIGS.find(l => l.level === lastShift?.level);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className={`p-6 ${lastShift.status === 'completed' ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="text-center">
            <div className="text-6xl mb-4">
              {lastShift.status === 'completed' ? '🎉' : '😢'}
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              {lastShift.status === 'completed' ? '班次完成!' : '班次失败'}
            </h2>
            <p className="text-gray-600 mt-1">
              {levelConfig?.name} - 第 {player.shiftsCompleted} 次当班
            </p>
          </div>
        </div>

        <div className="p-6">
          {isCalculating ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">计算得分中...</p>
            </div>
          ) : scoreResult ? (
            <>
              <div className="flex items-center justify-center mb-6">
                <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center ${getGradeBg(scoreResult.grade)}`}>
                  <span className={`text-4xl font-bold ${getGradeColor(scoreResult.grade)}`}>
                    {scoreResult.grade}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{scoreResult.finalScore}</div>
                  <div className="text-xs text-gray-500">最终得分</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{scoreResult.handledCalls}</div>
                  <div className="text-xs text-gray-500">接通电话</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{scoreResult.interruptCount}</div>
                  <div className="text-xs text-gray-500">插话次数</div>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">基础得分</span>
                  <span className="font-medium">{scoreResult.totalScore}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">效率奖励</span>
                  <span className="font-medium text-green-600">+{scoreResult.efficiencyBonus}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">无插话奖励</span>
                  <span className="font-medium text-green-600">+{scoreResult.cleanShiftBonus}</span>
                </div>
                {scoreResult.penaltyScore !== 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">惩罚扣分</span>
                    <span className="font-medium text-red-600">{scoreResult.penaltyScore}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 flex justify-between font-bold">
                  <span className="text-gray-800">合计</span>
                  <span className="text-blue-600">{scoreResult.finalScore}</span>
                </div>
              </div>
            </>
          ) : null}

          <div className="flex gap-3">
            <button
              onClick={() => selectLevel(lastShift?.level || 1)}
              className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-700 transition-colors"
            >
              选择关卡
            </button>
            <button
              onClick={() => startShift()}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl font-medium text-white transition-colors shadow-lg"
            >
              继续当班
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
