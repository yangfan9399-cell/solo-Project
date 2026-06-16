"use client";

import type { FoldType } from "@/types/game";

interface ToolbarProps {
  foldType: FoldType;
  onFoldTypeChange: (type: FoldType) => void;
  mode: "add" | "select" | "move";
  onModeChange: (mode: "add" | "select" | "move") => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onReset: () => void;
  onTest: () => void;
  isSimulating: boolean;
  hasSelection: boolean;
  canTest: boolean;
}

const foldTypes: { type: FoldType; label: string; description: string; icon: string }[] = [
  { type: "flat", label: "平折", description: "单层平纸，基础结构", icon: "━" },
  { type: "valley", label: "谷折", description: "V字形凹陷，增强抗弯", icon: "⋁" },
  { type: "mountain", label: "山折", description: "倒V字形凸起", icon: "⋀" },
  { type: "tube", label: "筒状", description: "卷成圆筒，最强承重", icon: "◯" },
  { type: "triangle", label: "三角", description: "三角形截面，稳定", icon: "△" },
];

export function Toolbar({
  foldType,
  onFoldTypeChange,
  mode,
  onModeChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onDelete,
  onReset,
  onTest,
  isSimulating,
  hasSelection,
  canTest,
}: ToolbarProps) {
  return (
    <div className="bg-white/80 backdrop-blur rounded-lg border border-amber-200 p-3 shadow-sm space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-amber-900 mb-2">编辑模式</h3>
        <div className="flex gap-1">
          <button
            onClick={() => onModeChange("add")}
            className={`flex-1 px-2 py-1.5 text-sm rounded transition-colors ${
              mode === "add"
                ? "bg-amber-500 text-white"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100"
            }`}
          >
            ✏️ 绘制
          </button>
          <button
            onClick={() => onModeChange("select")}
            className={`flex-1 px-2 py-1.5 text-sm rounded transition-colors ${
              mode === "select"
                ? "bg-amber-500 text-white"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100"
            }`}
          >
            👆 选择
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-amber-900 mb-2">纸张折法</h3>
        <div className="grid grid-cols-2 gap-1">
          {foldTypes.map((ft) => (
            <button
              key={ft.type}
              onClick={() => onFoldTypeChange(ft.type)}
              className={`px-2 py-2 text-xs rounded transition-colors text-left ${
                foldType === ft.type
                  ? "bg-amber-600 text-white"
                  : "bg-paper-50 text-amber-800 hover:bg-paper-100 border border-paper-200"
              }`}
              title={ft.description}
            >
              <span className="text-lg mr-1">{ft.icon}</span>
              <span>{ft.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-amber-900 mb-2">操作</h3>
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={onUndo}
            disabled={!canUndo || isSimulating}
            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ↩ 撤销
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo || isSimulating}
            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ↪ 重做
          </button>
          <button
            onClick={onDelete}
            disabled={!hasSelection || isSimulating}
            className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            🗑 删除
          </button>
          <button
            onClick={onReset}
            disabled={isSimulating}
            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-40 transition-colors"
          >
            🔄 重置
          </button>
        </div>
      </div>

      <button
        onClick={onTest}
        disabled={!canTest || isSimulating}
        className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
          canTest && !isSimulating
            ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-md hover:shadow-lg"
            : "bg-gray-400 cursor-not-allowed"
        }`}
      >
        {isSimulating ? "⏳ 测试中..." : "🏗 开始承重测试"}
      </button>
    </div>
  );
}
