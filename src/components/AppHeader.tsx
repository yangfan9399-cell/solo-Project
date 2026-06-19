import { useAppStore } from '@/store';
import { Wind, RefreshCw, Plus, FileDown, RotateCcw, User, AlertTriangle } from 'lucide-react';

export function AppHeader() {
  const {
    conflicts, currentUser, openWorkOrderModal, openExportModal,
    recalculateConflicts, resetAllData,
  } = useAppStore();
  const criticalCount = conflicts.filter((c) => c.severity === 'critical').length;

  return (
    <header className="panel border-b border-industrial-copper-600/30">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-industrial-copper-600 text-deep-sea-950">
              <Wind className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display text-2xl text-industrial-copper-400 glow-copper tracking-wider">
                桅骨风车检修排程系统
              </h1>
              <p className="font-mono text-[10px] uppercase tracking-widest text-deep-sea-400">
                MAST-BONE WIND TURBINE · SCHEDULING & PARTS OCCUPANCY
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {criticalCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-alert-red-700/60 border border-alert-red-500 conflict-pulse">
              <AlertTriangle className="w-4 h-4 text-alert-red-200" />
              <span className="font-mono text-xs font-bold text-white">
                {criticalCount} 项严重冲突
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 bg-deep-sea-800 border border-deep-sea-600">
            <User className="w-4 h-4 text-industrial-copper-400" />
            <span className="font-mono text-xs text-deep-sea-100">{currentUser.name}</span>
            <span className="font-mono text-[10px] text-deep-sea-400">· {currentUser.role}</span>
          </div>

          <button className="btn btn-ghost" onClick={() => recalculateConflicts()} title="重新计算冲突">
            <RefreshCw className="w-4 h-4" />
            <span>刷新冲突</span>
          </button>
          <button className="btn btn-secondary" onClick={() => openWorkOrderModal()}>
            <Plus className="w-4 h-4" />
            <span>新建工单</span>
          </button>
          <button className="btn btn-secondary" onClick={() => openExportModal()}>
            <FileDown className="w-4 h-4" />
            <span>导出</span>
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => {
              if (confirm('确定要重置所有数据为初始预置状态吗？')) resetAllData();
            }}
            title="重置数据"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
