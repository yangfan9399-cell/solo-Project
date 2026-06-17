import { useGameStore } from '@/store/gameStore';

export function ScoreBoard() {
  const { score, timeRemaining, currentLevel, isPlaying, calls } = useGameStore();

  const formattedTime = `${Math.floor(timeRemaining / 60)}:${String(timeRemaining % 60).padStart(2, '0')}`;
  const missedCalls = calls.filter(c => c.status === 'missed').length;
  const handledCalls = calls.filter(c => c.status === 'completed').length;
  const waitingCalls = calls.filter(c => c.status === 'waiting').length;

  return (
    <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-xl p-4 text-white shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span>📞</span>
          {currentLevel.name}
        </h2>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          isPlaying ? 'bg-green-500' : 'bg-gray-600'
        }`}>
          {isPlaying ? '当班中' : '休息中'}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white/10 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-yellow-400">{score}</div>
          <div className="text-xs text-gray-300">当前分数</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3 text-center">
          <div className={`text-2xl font-bold ${timeRemaining <= 10 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
            {formattedTime}
          </div>
          <div className="text-xs text-gray-300">剩余时间</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-400">{handledCalls}</div>
          <div className="text-xs text-gray-300">已接通</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3 text-center">
          <div className={`text-2xl font-bold ${missedCalls > 0 ? 'text-red-400' : 'text-gray-400'}`}>
            {missedCalls}
          </div>
          <div className="text-xs text-gray-300">已错过</div>
        </div>
      </div>

      {waitingCalls > 0 && (
        <div className="mt-3 flex items-center justify-center gap-2 text-orange-400 text-sm">
          <span className="animate-pulse">🔔</span>
          <span>{waitingCalls} 个来电等待中</span>
        </div>
      )}
    </div>
  );
}
