import { useGameStore } from '@/store/gameStore';

export function ActionHistory() {
  const { actions } = useGameStore();

  const recentActions = [...actions].reverse().slice(0, 8);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <span>📜</span>
        操作记录
      </h3>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {recentActions.length === 0 ? (
          <div className="text-gray-400 text-center py-4 text-sm">暂无操作记录</div>
        ) : (
          recentActions.map((action) => (
            <div 
              key={action.id}
              className="flex items-center justify-between text-sm py-1 border-b border-gray-100 last:border-0"
            >
              <span className="text-gray-600">{action.reason}</span>
              <span className={`font-medium ${
                action.scoreChange > 0 ? 'text-green-600' : action.scoreChange < 0 ? 'text-red-600' : 'text-gray-400'
              }`}>
                {action.scoreChange > 0 ? '+' : ''}{action.scoreChange}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
