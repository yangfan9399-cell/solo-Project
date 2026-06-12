import { CHANGE_TYPE_LABELS } from "~/lib/types";
import type { ChangeType } from "~/lib/types";

interface FieldChange {
  fieldName: string;
  fieldLabel: string;
  oldValue: string | null;
  newValue: string | null;
  changeType: string;
  changedBy: string;
  changedAt: string;
}

interface DiffViewerProps {
  changes: FieldChange[];
}

export default function DiffViewer({ changes }: DiffViewerProps) {
  return (
    <div className="space-y-3">
      {changes.map((change) => (
        <div
          key={change.fieldName}
          className="border border-gray-200 rounded-md p-4 bg-white"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {change.fieldLabel}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
              {CHANGE_TYPE_LABELS[change.changeType as ChangeType] ?? change.changeType}
            </span>
          </div>
          <div className="space-y-1">
            {change.oldValue !== null && (
              <div className="text-sm text-red-600 line-through">
                {change.oldValue}
              </div>
            )}
            {change.newValue !== null && (
              <div className="text-sm text-green-600">
                {change.newValue}
              </div>
            )}
          </div>
          <div className="mt-2 text-xs text-gray-400">
            {change.changedBy} · {new Date(change.changedAt).toLocaleString("zh-CN")}
          </div>
        </div>
      ))}
    </div>
  );
}
