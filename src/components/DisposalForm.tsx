"use client";

import { useState } from "react";
import { Gavel, X, AlertTriangle } from "lucide-react";
import { createDisposal } from "@/lib/actions/lab-disposal-actions";
import type { Sample, TestItem, TestResult, DisposalType } from "@prisma/client";

interface DisposalFormProps {
  sample: Sample & {
    testItems: TestItem[];
    testResults: (TestResult & { testItem: TestItem })[];
  };
}

export default function DisposalForm({ sample }: DisposalFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [disposalType, setDisposalType] = useState<DisposalType>("RELEASE");
  const [disposalBasis, setDisposalBasis] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);

  const hasFailedTests = sample.testResults.some(
    (r) => r.resultStatus === "FAILED"
  );
  const hasMissingTests = sample.testItems.filter(
    (item) => item.isRequired
  ).length !==
    sample.testResults.filter(
      (r) =>
        r.resultStatus !== "PENDING" && r.resultStatus !== "NOT_TESTED"
    ).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disposalBasis.trim()) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("disposalType", disposalType);
      formData.append("disposalBasis", disposalBasis);
      formData.append("remarks", remarks);
      await createDisposal(sample.id, formData);
      setIsOpen(false);
      window.location.reload();
    } catch (error: any) {
      console.error("提交失败:", error);
      alert(error.message || "提交失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const disposalOptions = [
    { value: "RELEASE", label: "合格放行", color: "text-green-600", bg: "bg-green-50 border-green-200" },
    { value: "DETAIN", label: "扣留", color: "text-red-600", bg: "bg-red-50 border-red-200" },
    { value: "RE_TEST", label: "补检", color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200" },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-4 py-2 bg-customs-600 hover:bg-customs-700 text-white font-medium rounded-lg transition-colors"
      >
        <Gavel className="w-4 h-4 mr-2" />
        做出处置结论
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
              <h3 className="font-semibold text-slate-800 flex items-center">
                <Gavel className="w-5 h-5 text-customs-600 mr-2" />
                处置结论复核
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-auto">
              <div className="p-5 space-y-4">
                {(hasFailedTests || hasMissingTests) && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start">
                    <AlertTriangle className="w-5 h-5 text-orange-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-orange-700">
                      <p className="font-medium">异常提示</p>
                      {hasFailedTests && (
                        <p className="mt-1">存在检测不合格项目</p>
                      )}
                      {hasMissingTests && (
                        <p className="mt-1">存在未检测的必检项目</p>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    处置类型 <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {disposalOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setDisposalType(opt.value as DisposalType)
                        }
                        className={`p-3 rounded-lg border-2 transition-all text-center ${
                          disposalType === opt.value
                            ? opt.bg + " border-current " + opt.color
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        <span className="font-medium text-sm">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    样品编号
                  </label>
                  <p className="text-sm text-slate-600 p-2 bg-slate-50 rounded-lg">
                    {sample.sampleNo}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    处置依据 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={disposalBasis}
                    onChange={(e) => setDisposalBasis(e.target.value)}
                    rows={4}
                    placeholder="请输入处置依据（如法律法规、标准条款等）..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-customs-500 focus:border-customs-500 outline-none text-sm resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    备注说明
                  </label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={2}
                    placeholder="其他补充说明..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-customs-500 focus:border-customs-500 outline-none text-sm resize-none"
                  />
                </div>
              </div>
            </form>

            <div className="p-5 border-t border-slate-200 flex justify-end gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !disposalBasis.trim()}
                className="px-4 py-2 bg-customs-600 hover:bg-customs-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "提交中..." : "确认提交"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
