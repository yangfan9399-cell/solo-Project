"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, X, CheckCircle2, Loader2 } from "lucide-react";
import { reportSealDamaged } from "@/lib/actions/sample-actions";

interface SealDamagedModalProps {
  sampleId: string;
}

export default function SealDamagedModal({ sampleId }: SealDamagedModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || loading) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await reportSealDamaged(sampleId, description.trim());
      setSuccess(true);
      setDescription("");
      router.refresh();
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
      }, 1500);
    } catch (err) {
      console.error("报告失败:", err);
      setError(err instanceof Error ? err.message : "报告失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && loading) return;
    setIsOpen(open);
    setError(null);
    setSuccess(false);
    if (!open) {
      setDescription("");
    }
  };

  return (
    <>
      <button
        onClick={() => handleOpenChange(true)}
        className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
      >
        <AlertTriangle className="w-4 h-4 mr-2" />
        报告封签破损
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                报告封签破损
              </h3>
              <button
                onClick={() => handleOpenChange(false)}
                disabled={loading}
                className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {success ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h4 className="text-lg font-semibold text-slate-800 mb-2">
                  报告成功
                </h4>
                <p className="text-slate-500 text-sm">
                  封签破损已记录，样品已进入重新取样流程
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="p-5">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-red-700">
                      <strong>重要提示：</strong>
                      封签破损将触发流程阻断，必须重新取样后才能继续后续检测和处置流程。
                    </p>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700 font-medium">
                        ❌ {error}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      破损情况说明 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      placeholder="请详细描述封签破损情况..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm resize-none"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="p-5 border-t border-slate-200 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => handleOpenChange(false)}
                    disabled={loading}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !description.trim()}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        提交中...
                      </>
                    ) : (
                      "确认报告"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
