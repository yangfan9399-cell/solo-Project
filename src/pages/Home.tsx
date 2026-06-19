import { useAppStore } from '@/store';
import { AppHeader } from '@/components/AppHeader';
import { RepairCalendar } from '@/components/RepairCalendar';
import { WorkOrderQueue } from '@/components/WorkOrderQueue';
import { PartsMatrix } from '@/components/PartsMatrix';
import { ConflictPanel } from '@/components/ConflictPanel';
import { ApprovalTimeline } from '@/components/ApprovalTimeline';
import { AuditLogPanel } from '@/components/AuditLogPanel';
import { WorkOrderDetail } from '@/components/WorkOrderDetail';
import { WorkOrderForm } from '@/components/WorkOrderForm';
import { ExportModal } from '@/components/ExportModal';
import { Calendar, ListFilter, Grid3x3, ScrollText, FileText } from 'lucide-react';

export default function Home() {
  const { ui, setActiveTab, setRightPanelTab } = useAppStore();
  const rightTab = ui.rightPanelTab ?? 'approvals';

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <AppHeader />

      <div className="flex items-center gap-1 px-4 pt-3 border-b border-deep-sea-800 bg-deep-sea-900/40">
        {([
          ['calendar', '检修日历', Calendar],
          ['queue', '工单队列', ListFilter],
          ['matrix', '备件矩阵', Grid3x3],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 font-mono text-xs border-b-2 transition-all -mb-px
              ${ui.activeTab === key
                ? 'border-industrial-copper-500 text-industrial-copper-300 glow-copper bg-deep-sea-800/60'
                : 'border-transparent text-deep-sea-400 hover:text-deep-sea-200 hover:bg-deep-sea-800/30'}`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1 pr-2">
          {([
            ['approvals', '审批记录', ScrollText],
            ['audit', '审计日志', FileText],
          ] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setRightPanelTab(key)}
              className={`flex items-center gap-1.5 px-3 py-2 font-mono text-[11px] border-b-2 transition-all -mb-px
                ${rightTab === key
                  ? 'border-industrial-copper-500 text-industrial-copper-300'
                  : 'border-transparent text-deep-sea-400 hover:text-deep-sea-200'}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden grid grid-cols-12 gap-3 p-3">
        <div className="col-span-7 overflow-hidden flex flex-col min-h-0">
          {ui.activeTab === 'calendar' && <RepairCalendar />}
          {ui.activeTab === 'queue' && <WorkOrderQueue />}
          {ui.activeTab === 'matrix' && <PartsMatrix />}
        </div>

        <div className="col-span-5 grid grid-rows-2 gap-3 overflow-hidden min-h-0">
          <div className="overflow-hidden min-h-0">
            <ConflictPanel />
          </div>
          <div className="overflow-hidden min-h-0">
            {rightTab === 'approvals' ? <ApprovalTimeline /> : <AuditLogPanel />}
          </div>
        </div>
      </div>

      <WorkOrderDetail />
      <WorkOrderForm />
      <ExportModal />
    </div>
  );
}
