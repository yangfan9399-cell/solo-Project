import type { Call } from '@/types/game';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '@/types/game';

interface CallCardProps {
  call: Call;
  isSelected: boolean;
  onClick: () => void;
  maxWaitTime: number;
}

export function CallCard({ call, isSelected, onClick, maxWaitTime }: CallCardProps) {
  const waitProgress = (call.waitTime / maxWaitTime) * 100;
  const isUrgent = call.priority === 'emergency';
  const isImportant = call.priority === 'important';

  return (
    <div
      onClick={onClick}
      className={`relative p-3 rounded-lg cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'ring-2 ring-blue-500 bg-blue-50' 
          : 'bg-white hover:bg-gray-50'
      } ${isUrgent ? 'animate-pulse border-l-4 border-red-500' : 'border border-gray-200'}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{call.caller.avatar}</span>
          <div>
            <div className="font-semibold text-sm">{call.caller.name}</div>
            <div className="text-xs text-gray-500">{call.caller.department}</div>
          </div>
        </div>
        <span 
          className="px-2 py-0.5 rounded text-xs font-medium text-white"
          style={{ backgroundColor: PRIORITY_COLORS[call.priority] }}
        >
          {PRIORITY_LABELS[call.priority]}
        </span>
      </div>
      
      <div className="mt-2">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>等待时间</span>
          <span>{call.waitTime}s / {maxWaitTime}s</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${
              waitProgress > 70 ? 'bg-red-500' : waitProgress > 40 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${waitProgress}%` }}
          />
        </div>
      </div>

      {isUrgent && (
        <div className="absolute top-1 right-1">
          <span className="text-red-500 text-lg animate-bounce">🚨</span>
        </div>
      )}
      {isImportant && !isUrgent && (
        <div className="absolute top-1 right-1">
          <span className="text-orange-500 text-lg">⚠️</span>
        </div>
      )}
    </div>
  );
}
