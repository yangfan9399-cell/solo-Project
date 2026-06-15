"use client";

import type { RecoveryTask } from "@/lib/types";

interface RecoveryPanelProps {
  tasks: RecoveryTask[];
  onComplete: (taskId: string) => Promise<void>;
}

const typeStyles: Record<string, { icon: string; bg: string; border: string }> = {
  trampling: {
    icon: "🌱",
    bg: "bg-emerald-50",
    border: "border-emerald-300",
  },
  missed_tide: {
    icon: "⏰",
    bg: "bg-amber-50",
    border: "border-amber-300",
  },
  low_eco: {
    icon: "🌍",
    bg: "bg-teal-50",
    border: "border-teal-300",
  },
};

export default function RecoveryPanel({ tasks, onComplete }: RecoveryPanelProps) {
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalReward = tasks.filter((t) => t.completed).reduce((sum, t) => sum + t.pointsReward, 0);
  const pendingReward = tasks.filter((t) => !t.completed).reduce((sum, t) => sum + t.pointsReward, 0);

  if (tasks.length === 0) {
    return (
      <div className="pool-card">
        <div className="text-center py-6">
          <div className="text-4xl mb-2">✨</div>
          <h3 className="font-bold text-lg text-slate-800 mb-1">生态状况优良</h3>
          <p className="text-sm text-slate-500">没有需要恢复的任务，做得很好！</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pool-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-lg text-slate-800">🌿 恢复任务</h3>
        <div className="text-xs text-slate-500">
          <span className="text-emerald-600 font-semibold">{completedCount}</span>/{tasks.length} 完成
        </div>
      </div>

      {completedCount > 0 && (
        <div className="mb-3 p-2 bg-emerald-50 rounded-lg border border-emerald-200">
          <p className="text-xs text-emerald-700">
            🎉 已获得 <span className="font-bold">+{totalReward}</span> 研究积分奖励
          </p>
        </div>
      )}

      {pendingReward > 0 && (
        <div className="mb-3 p-2 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-xs text-slate-600">
            💡 完成剩余任务可再获得 <span className="font-bold">+{pendingReward}</span> 研究积分
          </p>
        </div>
      )}

      <div className="space-y-2">
        {tasks.map((task) => {
          const style = typeStyles[task.type] || typeStyles.trampling;
          return (
            <div
              key={task.id}
              className={`p-3 rounded-lg border ${style.bg} ${style.border} ${
                task.completed ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{style.icon}</span>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${task.completed ? "line-through text-slate-500" : "text-slate-800"}`}>
                    {task.description}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">奖励: +{task.pointsReward} 研究积分</p>
                </div>
                {!task.completed && (
                  <button
                    onClick={() => onComplete(task.id)}
                    className="btn-secondary text-xs whitespace-nowrap"
                  >
                    完成
                  </button>
                )}
                {task.completed && <span className="text-emerald-600 text-xl">✓</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
