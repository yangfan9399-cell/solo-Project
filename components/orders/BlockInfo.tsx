"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface BlockInfoProps {
  blockReason?: string | null;
  remedyPath?: string | null;
  hasBlock: boolean;
}

export function BlockInfo({ blockReason, remedyPath, hasBlock }: BlockInfoProps) {
  if (!hasBlock) {
    return (
      <div className="flex items-center space-x-2 p-4 bg-green-50 rounded-lg border border-green-200">
        <CheckCircle2 className="w-5 h-5 text-green-600" />
        <span className="text-green-800 font-medium">无异常阻断</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-800 mb-1">阻断原因</h4>
            <p className="text-red-700 text-sm">{blockReason}</p>
          </div>
        </div>
      </div>
      {remedyPath && (
        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800 mb-1">补救路径</h4>
              <div className="text-amber-700 text-sm whitespace-pre-line">
                {remedyPath}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
