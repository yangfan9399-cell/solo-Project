import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { CallCard } from './CallCard';
import { ExtensionCard } from './ExtensionCard';
import { ScoreBoard } from './ScoreBoard';
import { ActionHistory } from './ActionHistory';
import { LevelSelector } from './LevelSelector';
import { PlayerProfile } from './PlayerProfile';
import { ShiftSummary } from './ShiftSummary';

export function GameBoard() {
  const {
    isPlaying,
    startShift,
    generateCall,
    connectCall,
    interruptCall,
    selectCall,
    selectedCall,
    getWaitingCalls,
    getConnectedCalls,
    extensions,
    currentLevel,
    loadPlayerFromStorage,
  } = useGameStore();

  const timerRef = useRef<number | null>(null);
  const callTimerRef = useRef<number | null>(null);

  useEffect(() => {
    loadPlayerFromStorage();
  }, []);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        useGameStore.getState().updateTimers();
      }, 1000);

      callTimerRef.current = window.setInterval(() => {
        generateCall();
      }, currentLevel.callInterval);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (callTimerRef.current) clearInterval(callTimerRef.current);
      };
    }
  }, [isPlaying, currentLevel.callInterval]);

  const waitingCalls = getWaitingCalls();
  const connectedCalls = getConnectedCalls();
  const availableExtensions = extensions.filter(e => e.status === 'available');

  const handleExtensionClick = (extensionId: string) => {
    if (selectedCall && selectedCall.status === 'waiting') {
      connectCall(selectedCall.id, extensionId);
      selectCall(null);
    }
  };

  const handleInterruptClick = (callId: string) => {
    interruptCall(callId);
  };

  const hasEmergencyWaiting = waitingCalls.some(c => c.priority === 'emergency');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">📞 手摇电话交换台接线游戏</h1>
          <p className="text-gray-400">接听来电，连接分机，成为最优秀的接线员！</p>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-3 space-y-4">
            <PlayerProfile />
            <LevelSelector />
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-3">游戏说明</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• 点击来电选择呼叫</li>
                <li>• 点击可用分机接通</li>
                <li>• 紧急来电需优先处理</li>
                <li>• 超时未接会错过呼叫</li>
                <li>• 打断通话会扣分</li>
              </ul>
              {!isPlaying && (
                <button
                  onClick={startShift}
                  className="w-full mt-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  🎮 开始当班
                </button>
              )}
            </div>
          </div>

          <div className="col-span-6 space-y-4">
            <ScoreBoard />
            
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span>📡</span>
                等待中的来电 ({waitingCalls.length})
              </h3>
              {waitingCalls.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <span className="text-4xl">📭</span>
                  <p className="mt-2">暂无来电，请等待...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                  {waitingCalls.map((call) => (
                    <CallCard
                      key={call.id}
                      call={call}
                      isSelected={selectedCall?.id === call.id}
                      onClick={() => selectCall(call)}
                      maxWaitTime={currentLevel.maxWaitTime}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span>🔌</span>
                分机列表 ({availableExtensions.length}/{extensions.length})
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {extensions.map((extension) => (
                  <ExtensionCard
                    key={extension.id}
                    extension={extension}
                    onClick={() => handleExtensionClick(extension.id)}
                    isDisabled={!selectedCall}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-3 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span>🗣️</span>
                通话中 ({connectedCalls.length})
              </h3>
              {connectedCalls.length === 0 ? (
                <div className="text-center py-4 text-gray-400 text-sm">
                  暂无通话
                </div>
              ) : (
                <div className="space-y-2">
                  {connectedCalls.map((call) => {
                    const ext = extensions.find(e => e.currentCall?.id === call.id);
                    return (
                      <div 
                        key={call.id} 
                        className="p-3 bg-blue-50 rounded-lg border border-blue-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span>{call.caller.avatar}</span>
                            <div>
                              <div className="text-sm font-medium">{call.caller.name}</div>
                              <div className="text-xs text-gray-500">→ {ext?.name}</div>
                            </div>
                          </div>
                          {hasEmergencyWaiting && (
                            <button
                              onClick={() => handleInterruptClick(call.id)}
                              className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors"
                            >
                              打断
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <ActionHistory />
          </div>
        </div>
      </div>

      <ShiftSummary />
    </div>
  );
}
