import { NODE_TYPE_LABELS } from "~/lib/types";
import type { NodeType } from "~/lib/types";

interface TimelineNode {
  nodeType: string;
  operatorName: string | null;
  operatorRole: string | null;
  actionTaken: string | null;
  blockingReason: string | null;
  remedyPath: string | null;
  createdAt: string;
  notes: string | null;
}

interface TimelineProps {
  nodes: TimelineNode[];
}

const DOT_COLORS: Record<string, string> = {
  received: "bg-blue-500",
  processing: "bg-yellow-500",
  review: "bg-purple-500",
  archived: "bg-green-500",
  reprocessing: "bg-orange-500",
  returned: "bg-red-500",
};

export default function Timeline({ nodes }: TimelineProps) {
  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {nodes.map((node, idx) => (
          <li key={idx}>
            <div className="relative pb-8">
              {idx !== nodes.length - 1 && (
                <span
                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              )}
              <div className="relative flex space-x-3">
                <div>
                  <span
                    className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${DOT_COLORS[node.nodeType] ?? "bg-gray-500"}`}
                  >
                    <span className="h-2 w-2 rounded-full bg-white" />
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div className="flex-1">
                    <div className="text-sm text-gray-900">
                      <span className="font-medium">
                        {NODE_TYPE_LABELS[node.nodeType as NodeType] ?? node.nodeType}
                      </span>
                      {node.operatorName && (
                        <span className="ml-1 text-gray-500">
                          {node.operatorName}
                          {node.operatorRole && `(${node.operatorRole})`}
                        </span>
                      )}
                    </div>
                    {node.actionTaken && (
                      <p className="mt-0.5 text-sm text-gray-600">
                        {node.actionTaken}
                      </p>
                    )}
                    {node.blockingReason && (
                      <div className="mt-2 rounded-md bg-red-50 border border-red-200 p-2 text-sm text-red-700">
                        {node.blockingReason}
                      </div>
                    )}
                    {node.remedyPath && (
                      <div className="mt-2 rounded-md bg-orange-50 border border-orange-200 p-2 text-sm text-orange-700">
                        {node.remedyPath}
                      </div>
                    )}
                    {node.notes && (
                      <p className="mt-1 text-xs text-gray-400">
                        {node.notes}
                      </p>
                    )}
                  </div>
                  <div className="whitespace-nowrap text-right text-xs text-gray-400">
                    {new Date(node.createdAt).toLocaleString("zh-CN")}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
