import { useAppStore } from '@/store';
import { FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function AuditLogPanel() {
  const { auditLogs } = useAppStore();
  return (
    <div className="panel flex flex-col h-full overflow-hidden">
      <div className="panel-header px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-industrial-copper-400" />
          <h2 className="font-display text-lg tracking-wider text-industrial-copper-300">审计日志</h2>
        </div>
        <span className="font-mono text-[11px] text-deep-sea-400">{auditLogs.length} 条</span>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-deep-sea-900 z-10">
            <tr>
              <th className="text-left font-mono text-[10px] uppercase tracking-wider text-industrial-copper-400 px-3 py-2 border-b border-deep-sea-700">时间</th>
              <th className="text-left font-mono text-[10px] uppercase tracking-wider text-industrial-copper-400 px-3 py-2 border-b border-deep-sea-700">操作人</th>
              <th className="text-left font-mono text-[10px] uppercase tracking-wider text-industrial-copper-400 px-3 py-2 border-b border-deep-sea-700">类型</th>
              <th className="text-left font-mono text-[10px] uppercase tracking-wider text-industrial-copper-400 px-3 py-2 border-b border-deep-sea-700">动作</th>
              <th className="text-left font-mono text-[10px] uppercase tracking-wider text-industrial-copper-400 px-3 py-2 border-b border-deep-sea-700">详情</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((log) => (
              <tr key={log.id} className="hover:bg-deep-sea-800/50">
                <td className="px-3 py-1.5 border-b border-deep-sea-800 font-mono text-[10px] text-deep-sea-300 whitespace-nowrap">
                  {format(parseISO(log.timestamp), 'MM-dd HH:mm:ss', { locale: zhCN })}
                </td>
                <td className="px-3 py-1.5 border-b border-deep-sea-800 text-xs text-industrial-copper-300">{log.operator}</td>
                <td className="px-3 py-1.5 border-b border-deep-sea-800 text-xs text-deep-sea-200">{log.entityType}</td>
                <td className="px-3 py-1.5 border-b border-deep-sea-800 text-xs text-deep-sea-100">{log.action}</td>
                <td className="px-3 py-1.5 border-b border-deep-sea-800 text-[10px] text-deep-sea-400 font-mono">
                  {JSON.stringify(log.details)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
