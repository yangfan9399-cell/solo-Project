"use client";

import { useState, useMemo } from "react";
import { Gavel, X, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import { createDisposal } from "@/lib/actions/lab-disposal-actions";
import { StatusBadge } from "./StatusBadge";
import type { Sample, TestItem, TestResult, DisposalType } from "@prisma/client";

interface DisposalFormProps {
  sample: Sample & {
    testItems: TestItem[];
    testResults: (TestResult & { testItem: TestItem })[];
  };
}

export default function DisposalForm({ sample }: DisposalFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [disposalType, setDisposalType] = useState<DisposalType>("RE_TEST");
  const [disposalBasis, setDisposalBasis] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);

  const missingRequiredItems = useMemo(() => {
    return sample.testItems.filter((item) => {
      if (!item.isRequired) return false;
      const result = sample.testResults.find((r) => r.testItemId === item.id);
      return !result || result.resultStatus === "PENDING" || result.resultStatus === "NOT_TESTED";
    });
  }, [sample.testItems, sample.testResults]);

  const failedItems = useMemo(() => {
    return sample.testResults.filter((r) => r.resultStatus === "FAILED");
  }, [sample.testResults]);

  const hasMissingTests = missingRequiredItems.length > 0;
  const hasFailedTests = failedItems.length > 0;
  const canRelease = !hasMissingTests && !hasFailedTests;

  const disposalOptions = [
    {
      value: "RELEASE",
      label: "合格放行",
      color: "text-green-600",
      bg: "bg-green-50 border-green-200",
      disabled: !canRelease,
      disabledReason: hasMissingTests
        ? "存在未检测必检项目，禁止放行"
        : hasFailedTests
        ? "存在不合格项目，禁止放行"
        : "",
    },
    {
      value: "DETAIN",
      label: "扣留",
      color: "text-red-600",
      bg: "bg-red-50 border-red-200",
      disabled: false,
    },
    {
      value: "RE_TEST",
      label: "补检",
      color: "text-yellow-600",
      bg: "bg-yellow-50 border-yellow-200",
      disabled: false,
      highlight: hasMissingTests,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disposalBasis.trim()) return;

    if (disposalType === "RELEASE" && !canRelease) {
      alert("存在未检测必检项目或不合格项目，禁止合格放行！");
      return;
    }

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
          <div className="bg-white rounded-xl max-w-xl w-full max-h-[90vh] flex flex-col">
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
                {hasMissingTests && (
                  <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-yellow-800 flex items-center">
                          ⚠️ 检测项目漏选
                          <span className="ml-2 text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">
                            禁止放行
                          </span>
                        </h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          存在 {missingRequiredItems.length} 项必检项目未检测，
                          <strong>不得做出合格放行结论</strong>，仅允许补检或扣留。
                        </p>
                        <div className="mt-3 space-y-1.5">
                          <p className="text-xs font-medium text-yellow-800">需补检项目：</p>
                          <div className="flex flex-wrap gap-2">
                            {missingRequiredItems.map((item) => (
                              <span
                                key={item.id}
                                className="inline-flex items-center px-2.5 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-md border border-yellow-300"
                              >
                                <AlertCircle className="w-3.5 h-3.5 mr-1" />
                                {item.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {hasFailedTests && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-red-800">
                          检测不合格
                        </h4>
                        <p className="text-sm text-red-700 mt-1">
                          存在 {failedItems.length} 项检测不合格，
                          <strong>禁止合格放行</strong>。
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {canRelease && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <div className="text-sm text-green-700">
                      <p className="font-medium">所有必检项目均合格</p>
                      <p className="text-xs text-green-600 mt-0.5">
                        可做出合格放行结论
                      </p>
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
                        onClick={() => !opt.disabled && setDisposalType(opt.value as DisposalType)}
                        disabled={opt.disabled}
                        title={opt.disabledReason}
                        className={`relative p-3 rounded-lg border-2 transition-all text-center ${
                          disposalType === opt.value
                            ? opt.bg + " border-current " + opt.color
                            : opt.disabled
                            ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        } ${opt.highlight && disposalType !== opt.value ? "ring-2 ring-yellow-300 ring-offset-1" : ""}`}
                      >
                        <span className="font-medium text-sm">{opt.label}</span>
                        {opt.disabled && (
                          <div className="text-[10px] mt-1 text-slate-400">
                            {opt.disabledReason}
                          </div>
                        )}
                        {opt.highlight && !opt.disabled && disposalType !== opt.value && (
                          <span className="absolute -top-2 -right-2 bg-yellow-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                            推荐
                          </span>
                        )}
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

                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-slate-500 mb-2">检测项目概览</p>
                  <div className="flex flex-wrap gap-1.5">
                    {sample.testItems.map((item) => {
                      const result = sample.testResults.find(
                        (r) => r.testItemId === item.id
                      );
                      const isMissing =
                        item.isRequired &&
                        (!result ||
                          result.resultStatus === "PENDING" ||
                          result.resultStatus === "NOT_TESTED");
                      return (
                        <span
                          key={item.id}
                          className={`inline-flex items-center px-2 py-0.5 text-xs rounded ${
                            isMissing
                              ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                              : result?.resultStatus === "PASSED"
                              ? "bg-green-100 text-green-800"
                              : result?.resultStatus === "FAILED"
                              ? "bg-red-100 text-red-800"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {item.name}
                          {item.isRequired && (
                            <span className="ml-1 text-[10px] opacity-70">
                              [必检]
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </div>
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
                disabled={loading || !disposalBasis.trim() || (disposalType === "RELEASE" && !canRelease)}
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
