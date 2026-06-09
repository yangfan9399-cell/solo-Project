"use client";

import { useState } from "react";
import { Save, CheckCircle, X } from "lucide-react";
import { saveTestResult, completeTesting } from "@/lib/actions/lab-disposal-actions";
import { StatusBadge } from "./StatusBadge";
import type {
  Sample,
  TestItem,
  TestResult,
  TestResultStatus,
} from "@prisma/client";

interface TestResultFormProps {
  sample: Sample & {
    testItems: TestItem[];
    testResults: (TestResult & { testItem: TestItem })[];
  };
}

export default function TestResultForm({ sample }: TestResultFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<
    Record<
      string,
      {
        resultValue: string;
        resultStatus: TestResultStatus;
        notes: string;
      }
    >
  >(() => {
    const initial: Record<string, any> = {};
    sample.testItems.forEach((item) => {
      const existing = sample.testResults.find((r) => r.testItemId === item.id);
      initial[item.id] = {
        resultValue: existing?.resultValue || "",
        resultStatus: existing?.resultStatus || "PENDING",
        notes: existing?.notes || "",
      };
    });
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);

  const updateResult = (
    itemId: string,
    field: string,
    value: string | TestResultStatus
  ) => {
    setResults((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const resultsArray = Object.entries(results).map(([testItemId, data]) => ({
        testItemId,
        resultValue: data.resultValue,
        resultStatus: data.resultStatus,
        notes: data.notes,
      }));
      await saveTestResult(sample.id, resultsArray);
      alert("保存成功");
    } catch (error) {
      console.error("保存失败:", error);
      alert("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!confirm("确认完成所有检测并提交至处置环节？")) return;
    setCompleting(true);
    try {
      const resultsArray = Object.entries(results).map(([testItemId, data]) => ({
        testItemId,
        resultValue: data.resultValue,
        resultStatus: data.resultStatus,
        notes: data.notes,
      }));
      await saveTestResult(sample.id, resultsArray);
      await completeTesting(sample.id);
      setIsOpen(false);
      window.location.reload();
    } catch (error: any) {
      console.error("提交失败:", error);
      alert(error.message || "提交失败，请重试");
    } finally {
      setCompleting(false);
    }
  };

  const hasUnsavedChanges = () => {
    return sample.testItems.some((item) => {
      const existing = sample.testResults.find((r) => r.testItemId === item.id);
      const current = results[item.id];
      return (
        current.resultValue !== (existing?.resultValue || "") ||
        current.resultStatus !== (existing?.resultStatus || "PENDING") ||
        current.notes !== (existing?.notes || "")
      );
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
      >
        <Save className="w-4 h-4 mr-2" />
        录入检测结果
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
              <h3 className="font-semibold text-slate-800">
                录入检测结果 - {sample.sampleNo}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-5">
              <div className="space-y-4">
                {sample.testItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-slate-800">{item.name}</h4>
                      {results[item.id]?.resultStatus !== "PENDING" &&
                        results[item.id]?.resultStatus !== "NOT_TESTED" && (
                          <StatusBadge
                            status={results[item.id].resultStatus}
                            type="test"
                          />
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">
                          检测结果值
                        </label>
                        <input
                          type="text"
                          value={results[item.id]?.resultValue || ""}
                          onChange={(e) =>
                            updateResult(item.id, "resultValue", e.target.value)
                          }
                          placeholder="请输入检测结果"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-customs-500 focus:border-customs-500 outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">
                          检测状态
                        </label>
                        <select
                          value={results[item.id]?.resultStatus || "PENDING"}
                          onChange={(e) =>
                            updateResult(
                              item.id,
                              "resultStatus",
                              e.target.value as TestResultStatus
                            )
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-customs-500 focus:border-customs-500 outline-none text-sm"
                        >
                          <option value="PENDING">待检测</option>
                          <option value="PASSED">合格</option>
                          <option value="FAILED">不合格</option>
                          <option value="NOT_TESTED">未检测</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs text-slate-500 mb-1">
                          备注
                        </label>
                        <input
                          type="text"
                          value={results[item.id]?.notes || ""}
                          onChange={(e) =>
                            updateResult(item.id, "notes", e.target.value)
                          }
                          placeholder="检测备注说明"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-customs-500 focus:border-customs-500 outline-none text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 border-t border-slate-200 flex justify-between items-center flex-shrink-0">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
              >
                取消
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-medium flex items-center disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-1.5" />
                  {saving ? "保存中..." : "保存草稿"}
                </button>
                <button
                  onClick={handleComplete}
                  disabled={completing}
                  className="px-4 py-2 bg-customs-600 hover:bg-customs-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  {completing ? "提交中..." : "完成检测并提交"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
