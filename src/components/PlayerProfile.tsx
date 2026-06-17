import { useGameStore } from '@/store/gameStore';

export function PlayerProfile() {
  const { player } = useGameStore();

  return (
    <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 text-white shadow-lg">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl">
          👤
        </div>
        <div>
          <div className="text-xl font-bold">{player.name}</div>
          <div className="text-sm opacity-80">等级 {player.level} 接线员</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="bg-white/10 rounded-lg p-3 text-center">
          <div className="text-xl font-bold">{player.totalScore}</div>
          <div className="text-xs opacity-80">累计分数</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3 text-center">
          <div className="text-xl font-bold">{player.highestScore}</div>
          <div className="text-xs opacity-80">最高分数</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3 text-center">
          <div className="text-xl font-bold">{player.shiftsCompleted}</div>
          <div className="text-xs opacity-80">完成班次</div>
        </div>
      </div>
    </div>
  );
}
