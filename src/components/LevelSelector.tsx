import { useGameStore } from '@/store/gameStore';
import { LEVEL_CONFIGS } from '@/data/mockData';

export function LevelSelector() {
  const { currentLevel, player, selectLevel } = useGameStore();

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <span>🎯</span>
        选择关卡
      </h3>
      <div className="grid grid-cols-5 gap-2">
        {LEVEL_CONFIGS.map((level) => {
          const isUnlocked = level.level <= player.level;
          const isSelected = currentLevel.level === level.level;

          return (
            <button
              key={level.level}
              onClick={() => isUnlocked && selectLevel(level.level)}
              disabled={!isUnlocked}
              className={`relative p-3 rounded-lg transition-all duration-200 ${
                isSelected
                  ? 'bg-blue-500 text-white border-2 border-blue-600'
                  : isUnlocked
                    ? 'bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 text-gray-800'
                    : 'bg-gray-100 border-2 border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <div className="font-bold text-lg">{level.level}</div>
              <div className="text-xs opacity-80">{level.name.split('员')[0]}</div>
              {!isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-gray-400">🔒</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
        <div className="text-sm text-blue-800">
          <div className="font-medium">{currentLevel.name}</div>
          <div className="text-xs mt-1">
            时长: {currentLevel.duration}秒 | 分机: {currentLevel.maxExtensions}个 | 
            紧急率: {(currentLevel.emergencyChance * 100).toFixed(0)}% | 
            倍率: x{currentLevel.scoreMultiplier}
          </div>
        </div>
      </div>
    </div>
  );
}
