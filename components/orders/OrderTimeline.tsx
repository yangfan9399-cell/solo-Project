"use client";

import { OrderNode, NodeType } from "@prisma/client";
import { NODE_TYPE_LABELS } from "@/lib/types";
import { formatDate, cn } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  FileText,
  UserCheck,
  XCircle,
  AlertTriangle,
  Archive,
  RotateCcw,
  ArrowRight,
} from "lucide-react";

const nodeIcons: Record<NodeType, any> = {
  ACCEPT: Clock,
  ASSIGN: UserCheck,
  PROCESS: ArrowRight,
  SUPPLEMENT: FileText,
  SUBMIT_REVIEW: ArrowRight,
  REVIEW: UserCheck,
  REJECT: XCircle,
  APPROVE: CheckCircle2,
  ARCHIVE: Archive,
  REOPEN: RotateCcw,
};

const nodeColors: Record<NodeType, string> = {
  ACCEPT: "bg-amber-500",
  ASSIGN: "bg-blue-500",
  PROCESS: "bg-blue-500",
  SUPPLEMENT: "bg-purple-500",
  SUBMIT_REVIEW: "bg-purple-500",
  REVIEW: "bg-indigo-500",
  REJECT: "bg-red-500",
  APPROVE: "bg-green-500",
  ARCHIVE: "bg-gray-500",
  REOPEN: "bg-orange-500",
};

interface OrderTimelineProps {
  nodes: OrderNode[];
}

export function OrderTimeline({ nodes }: OrderTimelineProps) {
  return (
    <div className="space-y-1">
      {nodes.map((node, index) => {
        const Icon = nodeIcons[node.nodeType];
        return (
          <div key={node.id} className="timeline-item">
            <div className={cn("timeline-dot", nodeColors[node.nodeType])}>
              {Icon && <Icon className="w-3 h-3 text-white" />}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">
                  {NODE_TYPE_LABELS[node.nodeType]}
                </span>
                <span className="text-sm text-gray-500">
                  {node.operatorName}
                </span>
                <span className="text-xs text-gray-400">
                  {formatDate(node.createdAt)}
                </span>
              </div>
              {node.remark && (
                <p className="mt-1 text-sm text-gray-600">{node.remark}</p>
              )}
              {node.snapshotData && (
                <pre className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-500 overflow-x-auto">
                  {JSON.stringify(node.snapshotData, null, 2)}
                </pre>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
