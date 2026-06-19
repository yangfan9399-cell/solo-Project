import { useMemo, useState } from 'react';
import { useAppStore } from '@/store';
import { generateWorkOrderCSV, generatePartsMatrixCSV, generateConflictsCSV, downloadFile, toJSONPretty } from '@/utils/export';
import { FileJson, FileSpreadsheet, Download, X } from 'lucide-react';

type ExportKind = 'workorders' | 'parts' | 'conflicts';
type ExportFormat = 'json' | 'csv';

export function ExportModal() {
  const { ui, closeExportModal, workOrders, partBatches, teams, conflicts, addAuditLog } = useAppStore();
  const [kind, setKind] = useState<ExportKind>('workorders');
  const [fmt, setFmt] = useState<ExportFormat>('json');

  const preview = useMemo(() => {
    if (!ui.showExportModal) return '';
    try {
      if (kind === 'workorders') {
        return fmt === 'json'
          ? toJSONPretty(workOrders)
          : generateWorkOrderCSV(workOrders, teams);
      }
      if (kind === 'parts') {
        return fmt === 'json'
          ? toJSONPretty(partBatches)
          : generatePartsMatrixCSV(workOrders, partBatches);
      }
      return fmt === 'json'
        ? toJSONPretty(conflicts)
        : generateConflictsCSV(conflicts);
    } catch {
      return '';
    }
  }, [kind, fmt, workOrders, partBatches, teams, conflicts, ui.showExportModal]);

  const doDownload = () => {
    const mime = fmt === 'json' ? 'application/json' : 'text/csv;charset=utf-8';
    const ext = fmt === 'json' ? 'json' : 'csv';
    const filename = `桅骨风车_${kind}_${new Date().toISOString().slice(0, 10)}.${ext}`;
    downloadFile(filename, preview, mime);
    addAuditLog('export', 'export', { kind, format: fmt, filename });
  };

  if (!ui.showExportModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-deep-sea-950/85 flex items-center justify-center p-4" onClick={closeExportModal}>
      <div className="panel w-full max-w-4xl max-h-[90vh] flex flex-col animate-slide-in" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header px-5 py-3 flex items-center justify-between">
          <h2 className="font-display text-xl tracking-wider text-industrial-copper-300">数据导出预览</h2>
          <button className="btn btn-ghost !p-1" onClick={closeExportModal}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-deep-sea-700 flex flex-wrap gap-3 items-center">
          <div className="flex gap-1">
            {([
              ['workorders', '检修工单'],
              ['parts', '备件占用'],
              ['conflicts', '冲突记录'],
            ] as [ExportKind, string][]).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={`px-3 py-1.5 text-xs font-mono border transition-all
                  ${kind === k ? 'bg-industrial-copper-600 border-industrial-copper-400 text-deep-sea-950' : 'bg-deep-sea-800 border-deep-sea-600 text-deep-sea-100 hover:bg-deep-sea-700'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex gap-1">
            <button
              onClick={() => setFmt('json')}
              className={`btn ${fmt === 'json' ? 'btn-primary' : 'btn-secondary'} !py-1 !px-3 text-[11px]`}
            >
              <FileJson className="w-3.5 h-3.5" /> JSON
            </button>
            <button
              onClick={() => setFmt('csv')}
              className={`btn ${fmt === 'csv' ? 'btn-primary' : 'btn-secondary'} !py-1 !px-3 text-[11px]`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> CSV
            </button>
          </div>

          <button className="btn btn-success !py-1 !px-3 text-[11px]" onClick={doDownload}>
            <Download className="w-3.5 h-3.5" /> 下载文件
          </button>
        </div>

        <div className="flex-1 overflow-auto p-3">
          <pre className="text-[11px] font-mono text-deep-sea-200 bg-deep-sea-950 border border-deep-sea-800 p-3 overflow-auto max-h-[60vh] whitespace-pre-wrap">
{preview}
          </pre>
        </div>
      </div>
    </div>
  );
}
