import { formatRelativeTime } from "~/lib/utils";
import {
  ClipboardList,
  PlayCircle,
  Search,
  Archive,
  RotateCcw,
  AlertTriangle,
  Wrench,
  CheckCircle,
} from "lucide-react";

interface HistoryNode {
  id: string;
  type: string;
  title: string;
  description: string | null;
  operator: string;
  operatorRole: string;
  createdAt: Date | string;
}

interface HistoryTimelineProps {
  nodes: HistoryNode[];
}

const typeIcons: Record<string, typeof ClipboardList> = {
  "计划创建": ClipboardList,
  "执行": PlayCircle,
  "复查": Search,
  "归档": Archive,
  "退回": RotateCcw,
  "故障登记": AlertTriangle,
  "故障处理": Wrench,
  "处理": CheckCircle,
};

const typeColors: Record<string, string> = {
  "计划创建": "bg-blue-500",
  "执行": "bg-blue-500",
  "复查": "bg-amber-500",
  "归档": "bg-emerald-500",
  "退回": "bg-red-500",
  "故障登记": "bg-red-500",
  "故障处理": "bg-amber-500",
  "处理": "bg-emerald-500",
};

export function HistoryTimeline({ nodes }: HistoryTimelineProps) {
  if (nodes.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        暂无历史记录
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />

      <div className="space-y-6">
        {nodes.map((node, index) => {
          const Icon = typeIcons[node.type] || ClipboardList;
          const colorClass = typeColors[node.type] || "bg-slate-500";

          return (
            <div key={node.id} className="relative pl-10">
              <div
                className={`absolute left-2.5 top-1 w-3 h-3 rounded-full ${colorClass} ring-4 ring-white`}
              />

              <div className="bg-white rounded-lg border border-slate-200 p-4 card-hover">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10`}>
                    <Icon className={`w-4 h-4 ${colorClass.replace("bg-", "text-")}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-medium text-slate-900">{node.title}</h4>
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {formatRelativeTime(node.createdAt)}
                      </span>
                    </div>

                    {node.description && (
                      <p className="mt-1 text-sm text-slate-600">{node.description}</p>
                    )}

                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                      <span>{node.operator}</span>
                      <span>·</span>
                      <span>{node.operatorRole}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
